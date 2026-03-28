import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { inngest } from "@/lib/inngest/client";
import { createJob, completeJob, updateJobStatus, addJobEvent, failJob } from "@/lib/inngest/job-tracker";
import { generateItinerary } from "@/lib/itinerary/generate-itinerary";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      select: { id: true },
    });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const itinerary = await prisma.itinerary.findUnique({
      where: { tripId },
      include: {
        days: {
          include: {
            events: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { dayNumber: "asc" },
        },
        events: {
          where: { dayId: null },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!itinerary) {
      return NextResponse.json({ error: "No itinerary found" }, { status: 404 });
    }

    // Separate backup events from the itinerary-level events (those with dayId = null)
    const { events: backupEvents, ...rest } = itinerary;
    return NextResponse.json({ ...rest, backupEvents });
  } catch (error) {
    console.error("Failed to get itinerary:", error);
    return NextResponse.json({ error: "Failed to get itinerary" }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: {
        destinations: {
          include: {
            excursions: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.destinations.length === 0) {
      return NextResponse.json(
        { error: "Trip has no destinations. Generate destinations first." },
        { status: 400 }
      );
    }

    const job = await createJob("ITINERARY_GENERATION", {
      userId,
      tripId,
    });

    // In production, use Inngest for background execution.
    // In development, run directly to avoid Inngest dev server dependency.
    const useInngest = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";

    if (useInngest) {
      try {
        const { ids } = await inngest.send({
          name: "itinerary/generate.requested",
          data: { tripId, userId, jobId: job.id },
        });

        if (ids?.[0]) {
          await prisma.inngestJob.update({
            where: { id: job.id },
            data: { inngestEventId: ids[0] },
          });
        }

        return NextResponse.json({ queued: true, jobId: job.id });
      } catch (inngestError) {
        console.warn("Inngest failed, falling back to direct execution:", inngestError);
      }
    }

    // Direct execution (local dev or Inngest fallback)
    console.log("[Itinerary] Running generation directly...");
    await runItineraryGenerationDirect(tripId, trip, job.id);
    return NextResponse.json({ queued: false, jobId: job.id, done: true });
  } catch (error) {
    console.error("Failed to generate itinerary:", error);
    return NextResponse.json(
      { error: "Failed to start itinerary generation" },
      { status: 500 }
    );
  }
}

/** Direct execution path — runs generation inline without Inngest */
async function runItineraryGenerationDirect(
  tripId: string,
  trip: {
    criteria: unknown;
    startDate: Date | null;
    endDate: Date | null;
    notes: string | null;
    destinations: Array<{
      id: string;
      name: string;
      region: string | null;
      country: string | null;
      description: string | null;
      isSelected: boolean;
      excursions: Array<{
        id: string;
        name: string;
        type: string;
        description: string | null;
        priceEstimate: string | null;
        duration: string | null;
        kidFriendly: boolean;
        minAge: number | null;
        kidNotes: string | null;
      }>;
    }>;
  },
  jobId: string
) {
  try {
    await updateJobStatus(jobId, "RUNNING", {
      message: "Starting itinerary generation (direct)",
    });

    const criteria = trip.criteria as TripCriteria;
    const hasSelected = trip.destinations.some((d) => d.isSelected);
    const destinations = hasSelected
      ? trip.destinations.filter((d) => d.isSelected)
      : trip.destinations;

    const genStart = Date.now();
    const { result: aiResult, usage } = await generateItinerary(
      criteria,
      destinations,
      trip.startDate?.toISOString().split("T")[0] ?? null,
      trip.endDate?.toISOString().split("T")[0] ?? null,
      trip.notes
    );
    const duration = Date.now() - genStart;

    await addJobEvent(jobId, "generate-itinerary", {
      message: `Generated ${aiResult.days.length} days with ${aiResult.backupEvents.length} backup events`,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      durationMs: duration,
      metadata: { model: usage.model },
    });

    // Collect valid excursion IDs
    const validExcursionIds = new Set(
      destinations.flatMap((d) => d.excursions.map((e) => e.id))
    );

    // Save to database
    await prisma.$transaction(async (tx) => {
      await tx.itinerary.deleteMany({ where: { tripId } });

      const itinerary = await tx.itinerary.create({
        data: { tripId, overview: aiResult.overview },
      });

      for (const dayData of aiResult.days) {
        const day = await tx.itineraryDay.create({
          data: {
            itineraryId: itinerary.id,
            dayNumber: dayData.dayNumber,
            title: dayData.title,
            theme: dayData.theme || null,
            date: trip.startDate
              ? new Date(
                  trip.startDate.getTime() + (dayData.dayNumber - 1) * 86400000
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

    await completeJob(jobId, {
      message: `Generated itinerary with ${aiResult.days.length} days`,
      metadata: {
        dayCount: aiResult.days.length,
        backupEventCount: aiResult.backupEvents.length,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Generation failed";
    await failJob(jobId, errMsg);
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      select: { id: true },
    });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    await prisma.itinerary.deleteMany({ where: { tripId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete itinerary:", error);
    return NextResponse.json({ error: "Failed to delete itinerary" }, { status: 500 });
  }
}
