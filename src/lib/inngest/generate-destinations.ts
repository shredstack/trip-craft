import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { generateDestinationsLegacy } from "@/lib/claude";
import { enrichDestination, enrichExcursion } from "@/lib/google-places";
import { filterCatalogDestinations } from "@/lib/recommendation/step1-filter";
import { rankCandidates } from "@/lib/recommendation/step2-rank";
import { personalizeDestinations } from "@/lib/recommendation/step3-personalize";
import {
  updateJobStatus,
  addJobEvent,
  completeJob,
  failJob,
} from "./job-tracker";
import type { TripCriteria, LlmUsage } from "@/lib/types";
import type { Prisma } from "@prisma/client";
import { ExcursionType } from "@prisma/client";

const VALID_EXCURSION_TYPES = new Set(Object.values(ExcursionType));
const MIN_CANDIDATES_FOR_PIPELINE = 5;
const MAX_CANDIDATES_FOR_RANKING = 20;
const TOP_N_FOR_PERSONALIZATION = 6;

function toExcursionType(type: string): ExcursionType {
  const upper = type.toUpperCase();
  if (VALID_EXCURSION_TYPES.has(upper as ExcursionType)) {
    return upper as ExcursionType;
  }
  return ExcursionType.OTHER;
}

interface DestinationWithExcursions {
  name: string;
  region: string;
  country: string;
  description: string;
  matchScore: number;
  flightTimeHours: number;
  avgCostPerPerson: number;
  bestMonths: string;
  reasoning: string;
  catalogId?: string;
  excursions: Array<{
    name: string;
    type: string;
    description: string;
    priceEstimate: string;
    duration: string;
    kidFriendly: boolean;
    minAge: number | null;
    kidNotes?: string;
  }>;
}

// Serializable subset of catalog data needed for the save step
interface CatalogPlaceData {
  catalogId: string;
  placeId: string | null;
  avgRating: number | null;
  reviewCount: number | null;
  latitude: number | null;
  longitude: number | null;
  photoUrls: unknown;
}

export const generateDestinations = inngest.createFunction(
  {
    id: "generate-destinations",
    retries: 1,
    onFailure: async ({ event }) => {
      const { tripId, jobId } = event.data.event.data;
      console.error(
        `[Inngest] generate-destinations failed for trip ${tripId}:`,
        event.data.error.message
      );
      if (jobId) {
        await failJob(jobId, event.data.error.message ?? "Generation failed");
      }
    },
  },
  { event: "trip/generate.requested" },
  async ({ event, step }) => {
    const { tripId, userId, jobId } = event.data;

    // ── Mark job as running ───────────────────────────────────
    if (jobId) {
      await step.run("mark-running", async () => {
        await updateJobStatus(jobId, "RUNNING", {
          message: "Starting destination generation pipeline",
        });
      });
    }

    // ── Load trip ──────────────────────────────────────────────
    const criteria = await step.run("load-trip", async () => {
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId },
      });
      if (!trip || !trip.criteria) {
        throw new Error("Trip not found or missing criteria");
      }
      return trip.criteria as unknown as TripCriteria;
    });

    // ── Run pipeline (filter → rank → personalize) ────────────
    // Kept as one step to avoid serializing Prisma types between steps.
    // Each Claude API call is independently retried by the SDK.
    const pipelineResult = await step.run("run-pipeline", async () => {
      const llmUsages: LlmUsage[] = [];

      // Step 1: Deterministic filtering
      const step1Start = Date.now();
      const step1Result = await filterCatalogDestinations(criteria);
      const step1Duration = Date.now() - step1Start;
      console.log(
        `[Pipeline] Step 1: ${step1Result.candidates.length} candidates after filtering` +
          (step1Result.relaxations.length > 0
            ? ` (relaxations: ${step1Result.relaxations.join(", ")})`
            : "")
      );

      if (jobId) {
        await addJobEvent(jobId, "step1-filter", {
          message: `Filtered to ${step1Result.candidates.length} candidates`,
          durationMs: step1Duration,
          metadata: {
            candidateCount: step1Result.candidates.length,
            relaxations: step1Result.relaxations,
          },
        });
      }

      let destinations: DestinationWithExcursions[];
      let catalogPlaceDataMap: CatalogPlaceData[] = [];

      if (step1Result.candidates.length < MIN_CANDIDATES_FOR_PIPELINE) {
        // Fallback: Legacy single-shot
        console.log(
          `[Pipeline] Insufficient catalog coverage (${step1Result.candidates.length} < ${MIN_CANDIDATES_FOR_PIPELINE}), falling back to legacy generation`
        );
        const step2Start = Date.now();
        const { result: aiResponse, usage: legacyUsage } =
          await generateDestinationsLegacy(criteria);
        const step2Duration = Date.now() - step2Start;
        llmUsages.push(legacyUsage);

        if (jobId) {
          await addJobEvent(jobId, "legacy-generation", {
            message: `Legacy generation: ${aiResponse.destinations.length} destinations`,
            inputTokens: legacyUsage.inputTokens,
            outputTokens: legacyUsage.outputTokens,
            durationMs: step2Duration,
            metadata: { model: legacyUsage.model, fallback: true },
          });
        }

        destinations = aiResponse.destinations;
      } else {
        // Step 2: AI Semantic Ranking
        const step2Start = Date.now();
        const candidatesForRanking = step1Result.candidates.slice(
          0,
          MAX_CANDIDATES_FOR_RANKING
        );
        const { ranked, usage: rankUsage } = await rankCandidates(
          criteria,
          candidatesForRanking
        );
        const step2Duration = Date.now() - step2Start;
        llmUsages.push(rankUsage);
        console.log(
          `[Pipeline] Step 2: ${ranked.length} destinations ranked`
        );

        if (jobId) {
          await addJobEvent(jobId, "step2-rank", {
            message: `Ranked ${ranked.length} destinations`,
            inputTokens: rankUsage.inputTokens,
            outputTokens: rankUsage.outputTokens,
            durationMs: step2Duration,
            metadata: {
              model: rankUsage.model,
              rankedCount: ranked.length,
              candidatesEvaluated: candidatesForRanking.length,
            },
          });
        }

        // Step 3: AI Personalization & Excursion Generation
        const step3Start = Date.now();
        const topRanked = ranked.slice(0, TOP_N_FOR_PERSONALIZATION);
        const { result: personalized, usage: personalizeUsage } =
          await personalizeDestinations(
            criteria,
            topRanked,
            step1Result.candidates,
            userId
          );
        const step3Duration = Date.now() - step3Start;
        llmUsages.push(personalizeUsage);
        console.log(
          `[Pipeline] Step 3: ${personalized.destinations.length} final recommendations`
        );

        if (jobId) {
          await addJobEvent(jobId, "step3-personalize", {
            message: `Personalized ${personalized.destinations.length} destinations with excursions`,
            inputTokens: personalizeUsage.inputTokens,
            outputTokens: personalizeUsage.outputTokens,
            durationMs: step3Duration,
            metadata: {
              model: personalizeUsage.model,
              destinationCount: personalized.destinations.length,
            },
          });
        }

        destinations = personalized.destinations;

        // Extract only the serializable fields needed for the save step
        catalogPlaceDataMap = step1Result.candidates.map((c) => ({
          catalogId: c.catalog.id,
          placeId: c.catalog.placeId,
          avgRating: c.catalog.avgRating
            ? Number(c.catalog.avgRating)
            : null,
          reviewCount: c.catalog.reviewCount,
          latitude: c.catalog.latitude
            ? Number(c.catalog.latitude)
            : null,
          longitude: c.catalog.longitude
            ? Number(c.catalog.longitude)
            : null,
          photoUrls: c.catalog.photoUrls,
        }));
      }

      // Set LLM model on the job (use the first model encountered)
      if (jobId && llmUsages.length > 0) {
        await prisma.inngestJob.update({
          where: { id: jobId },
          data: { llmModel: llmUsages[0].model },
        });
      }

      return { destinations, catalogPlaceDataMap };
    });

    // ── Save to database ──────────────────────────────────────
    await step.run("save-destinations", async () => {
      const { destinations, catalogPlaceDataMap } = pipelineResult;

      for (let i = 0; i < destinations.length; i++) {
        const dest = destinations[i];

        // For pipeline destinations, use catalog's cached Google Places data
        const catalogData = catalogPlaceDataMap.find(
          (c) => c.catalogId === dest.catalogId
        );

        let placeData = null;
        if (catalogData?.placeId) {
          placeData = {
            placeId: catalogData.placeId,
            avgRating: catalogData.avgRating,
            reviewCount: catalogData.reviewCount,
            latitude: catalogData.latitude,
            longitude: catalogData.longitude,
            photoUrls: catalogData.photoUrls,
          };
        } else {
          // Legacy path or catalog missing Places data — enrich live
          try {
            placeData = await enrichDestination(dest.name, dest.country);
          } catch {
            // Continue without Places data
          }
        }

        const destData: Prisma.DestinationUncheckedCreateInput = {
          tripId,
          name: dest.name,
          region: dest.region,
          country: dest.country,
          description: dest.description,
          matchScore: dest.matchScore,
          aiReasoning: dest.reasoning,
          flightTime: `${dest.flightTimeHours}h`,
          avgCostPp: dest.avgCostPerPerson,
          bestMonths: dest.bestMonths,
          sortOrder: i,
          isSelected: false,
        };

        if (placeData) {
          destData.placeId = placeData.placeId;
          destData.avgRating = placeData.avgRating;
          destData.reviewCount = placeData.reviewCount;
          destData.latitude = placeData.latitude;
          destData.longitude = placeData.longitude;
          if (placeData.photoUrls) {
            destData.photoUrls =
              placeData.photoUrls as Prisma.InputJsonValue;
          }
        }

        const destination = await prisma.destination.create({
          data: destData,
        });

        // Save excursions — enrich in parallel per destination
        const enrichmentPromises = dest.excursions.map((exc) =>
          enrichExcursion(exc.name, dest.name).catch(() => null)
        );
        const enrichmentResults =
          await Promise.allSettled(enrichmentPromises);

        for (let j = 0; j < dest.excursions.length; j++) {
          const exc = dest.excursions[j];

          const enrichResult = enrichmentResults[j];
          const excPlaceData =
            enrichResult.status === "fulfilled"
              ? enrichResult.value
              : null;

          const excData: Prisma.ExcursionUncheckedCreateInput = {
            destinationId: destination.id,
            name: exc.name,
            type: toExcursionType(exc.type),
            description: exc.description,
            priceEstimate: exc.priceEstimate,
            duration: exc.duration,
            kidFriendly: exc.kidFriendly,
            minAge: exc.minAge,
            kidNotes: exc.kidNotes,
            sortOrder: j,
          };

          if (excPlaceData) {
            excData.placeId = excPlaceData.placeId;
            excData.avgRating = excPlaceData.avgRating;
            excData.reviewCount = excPlaceData.reviewCount;
            excData.bookingUrl = excPlaceData.bookingUrl;
            excData.photoUrls = excPlaceData.photoUrls;
            excData.reviews =
              excPlaceData.reviews as unknown as Prisma.InputJsonValue;
          }

          await prisma.excursion.create({ data: excData });
        }
      }
    });

    // ── Mark job completed ──────────────────────────────────
    if (jobId) {
      await step.run("complete-job", async () => {
        await completeJob(jobId, {
          message: `Generated ${pipelineResult.destinations.length} destinations`,
          metadata: {
            destinationCount: pipelineResult.destinations.length,
          },
        });
      });
    }

    return { tripId, destinationCount: pipelineResult.destinations.length };
  }
);
