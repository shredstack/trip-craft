import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { generateItinerary } from "@/lib/itinerary/generate-itinerary";
import {
  updateJobStatus,
  addJobEvent,
  completeJob,
  failJob,
} from "./job-tracker";
import type { TripCriteria } from "@/lib/types";
import { ItineraryEventCategory } from "@prisma/client";

const VALID_CATEGORIES = new Set(Object.values(ItineraryEventCategory));

function toEventCategory(category: string): ItineraryEventCategory {
  const upper = category.toUpperCase();
  if (VALID_CATEGORIES.has(upper as ItineraryEventCategory)) {
    return upper as ItineraryEventCategory;
  }
  return ItineraryEventCategory.OTHER;
}

export const generateItineraryFn = inngest.createFunction(
  {
    id: "generate-itinerary",
    retries: 1,
    onFailure: async ({ event }) => {
      const { jobId } = event.data.event.data;
      console.error(
        `[Inngest] generate-itinerary failed:`,
        event.data.error.message
      );
      if (jobId) {
        await failJob(jobId, event.data.error.message ?? "Itinerary generation failed");
      }
    },
  },
  { event: "itinerary/generate.requested" },
  async ({ event, step }) => {
    const { tripId, userId, jobId } = event.data;

    // ── Mark job as running ───────────────────────────────────
    if (jobId) {
      await step.run("mark-running", async () => {
        await updateJobStatus(jobId, "RUNNING", {
          message: "Starting itinerary generation",
        });
      });
    }

    // ── Load trip data ──────────────────────────────────────────
    const tripData = await step.run("load-trip-data", async () => {
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId },
        include: {
          destinations: {
            include: {
              excursions: {
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!trip || !trip.criteria) {
        throw new Error("Trip not found or missing criteria");
      }

      if (trip.destinations.length === 0) {
        throw new Error("Trip has no destinations — generate destinations first");
      }

      // Use selected destinations if any are selected, otherwise use all
      const hasSelected = trip.destinations.some((d) => d.isSelected);
      const destinations = hasSelected
        ? trip.destinations.filter((d) => d.isSelected)
        : trip.destinations;

      return {
        criteria: trip.criteria as unknown as TripCriteria,
        startDate: trip.startDate?.toISOString().split("T")[0] ?? null,
        endDate: trip.endDate?.toISOString().split("T")[0] ?? null,
        tripNotes: trip.notes,
        destinations: destinations.map((d) => ({
          id: d.id,
          name: d.name,
          region: d.region,
          country: d.country,
          description: d.description,
          excursions: d.excursions.map((e) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            description: e.description,
            priceEstimate: e.priceEstimate,
            duration: e.duration,
            kidFriendly: e.kidFriendly,
            minAge: e.minAge,
            kidNotes: e.kidNotes,
          })),
        })),
      };
    });

    // ── Generate itinerary via Claude ────────────────────────────
    const aiResult = await step.run("generate-itinerary", async () => {
      const genStart = Date.now();
      const { result, usage } = await generateItinerary(
        tripData.criteria,
        tripData.destinations,
        tripData.startDate,
        tripData.endDate,
        tripData.tripNotes
      );
      const duration = Date.now() - genStart;

      if (jobId) {
        await addJobEvent(jobId, "generate-itinerary", {
          message: `Generated ${result.days.length} days with ${result.backupEvents.length} backup events`,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          durationMs: duration,
          metadata: { model: usage.model },
        });

        await prisma.inngestJob.update({
          where: { id: jobId },
          data: { llmModel: usage.model },
        });
      }

      return result;
    });

    // ── Collect valid excursion IDs for validation ───────────────
    const validExcursionIds = new Set(
      tripData.destinations.flatMap((d) => d.excursions.map((e) => e.id))
    );

    // ── Save to database ──────────────────────────────────────
    await step.run("save-itinerary", async () => {
      await prisma.$transaction(async (tx) => {
        // Delete existing itinerary for this trip (regeneration case)
        await tx.itinerary.deleteMany({ where: { tripId } });

        // Create itinerary
        const itinerary = await tx.itinerary.create({
          data: {
            tripId,
            overview: aiResult.overview,
          },
        });

        // Create days and events
        for (const dayData of aiResult.days) {
          const day = await tx.itineraryDay.create({
            data: {
              itineraryId: itinerary.id,
              dayNumber: dayData.dayNumber,
              title: dayData.title,
              theme: dayData.theme || null,
              date: tripData.startDate
                ? new Date(
                    new Date(tripData.startDate).getTime() +
                      (dayData.dayNumber - 1) * 86400000
                  )
                : null,
            },
          });

          for (let i = 0; i < dayData.events.length; i++) {
            const evt = dayData.events[i];
            const excursionId =
              evt.excursionId && validExcursionIds.has(evt.excursionId)
                ? evt.excursionId
                : null;

            await tx.itineraryEvent.create({
              data: {
                itineraryId: itinerary.id,
                dayId: day.id,
                excursionId,
                category: toEventCategory(evt.category),
                name: evt.name,
                description: evt.description || null,
                tips: evt.tips || null,
                location: evt.location || null,
                startTime: evt.startTime || null,
                endTime: evt.endTime || null,
                timeLabel: evt.timeLabel || null,
                sortOrder: i,
              },
            });
          }
        }

        // Create backup events (dayId = null)
        for (let i = 0; i < aiResult.backupEvents.length; i++) {
          const backup = aiResult.backupEvents[i];
          await tx.itineraryEvent.create({
            data: {
              itineraryId: itinerary.id,
              dayId: null,
              category: toEventCategory(backup.category),
              name: backup.name,
              description: backup.description || null,
              tips: backup.tips || null,
              location: backup.location || null,
              backupCategory: backup.backupCategory,
              sortOrder: i,
            },
          });
        }
      });
    });

    // ── Mark job completed ──────────────────────────────────
    if (jobId) {
      await step.run("complete-job", async () => {
        await completeJob(jobId, {
          message: `Generated itinerary with ${aiResult.days.length} days and ${aiResult.backupEvents.length} backup events`,
          metadata: {
            dayCount: aiResult.days.length,
            backupEventCount: aiResult.backupEvents.length,
          },
        });
      });
    }

    return {
      tripId,
      dayCount: aiResult.days.length,
      backupEventCount: aiResult.backupEvents.length,
    };
  }
);
