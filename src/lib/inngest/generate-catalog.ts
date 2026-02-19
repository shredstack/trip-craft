import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { generateCatalogDestinations } from "@/lib/generate-destinations";
import { enrichDestination } from "@/lib/google-places";
import {
  sendCatalogGenerationEmail,
  sendCatalogGenerationFailedEmail,
} from "@/lib/email";
import {
  updateJobStatus,
  addJobEvent,
  completeJob,
  failJob,
} from "./job-tracker";

export const generateCatalog = inngest.createFunction(
  {
    id: "generate-catalog-destinations",
    retries: 1,
    onFailure: async ({ event }) => {
      const { jobId, inngestJobId, adminEmail } = event.data.event.data;
      await prisma.catalogGenerationJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          error: event.data.error.message ?? "Generation failed",
        },
      });
      if (inngestJobId) {
        await failJob(
          inngestJobId,
          event.data.error.message ?? "Generation failed"
        );
      }
      // Best-effort failure notification
      try {
        if (adminEmail) {
          await sendCatalogGenerationFailedEmail(
            adminEmail,
            event.data.error.message ?? "Generation failed"
          );
        }
      } catch {
        // Don't let email failure mask the original error
      }
    },
  },
  { event: "admin/catalog-generate.requested" },
  async ({ event, step }) => {
    const {
      jobId,
      inngestJobId,
      adminEmail,
      prompt,
      count,
      existingNames = [],
    } = event.data;

    // ── Mark jobs as running ───────────────────────────────────
    await step.run("mark-running", async () => {
      await prisma.catalogGenerationJob.update({
        where: { id: jobId },
        data: { status: "running" },
      });
      if (inngestJobId) {
        await updateJobStatus(inngestJobId, "RUNNING", {
          message: "Starting catalog destination generation",
        });
      }
    });

    // ── Generate destinations via Claude ──────────────────────
    const result = await step.run("generate-destinations", async () => {
      const genStart = Date.now();
      const { destinations, usage } = await generateCatalogDestinations(
        prompt,
        count,
        existingNames
      );
      const genDuration = Date.now() - genStart;

      if (inngestJobId) {
        await addJobEvent(inngestJobId, "generate-catalog-destinations", {
          message: `Generated ${destinations.length} catalog destinations`,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          durationMs: genDuration,
          metadata: {
            model: usage.model,
            destinationCount: destinations.length,
            requestedCount: count,
          },
        });

        await prisma.inngestJob.update({
          where: { id: inngestJobId },
          data: { llmModel: usage.model },
        });
      }

      return destinations;
    });

    // ── Enrich destinations with Google Places ────────────────
    const enrichedResult = await step.run("enrich-destinations", async () => {
      const enrichStart = Date.now();
      let enrichedCount = 0;

      const enriched = await Promise.all(
        result.map(async (dest) => {
          try {
            const data = await enrichDestination(dest.name, dest.country);
            if (data) {
              enrichedCount++;
              return {
                ...dest,
                placeId: data.placeId,
                latitude: data.latitude,
                longitude: data.longitude,
                avgRating: data.avgRating,
                reviewCount: data.reviewCount,
                photoUrls: data.photoUrls,
              };
            }
          } catch (err) {
            console.error(`Failed to enrich ${dest.name}:`, err);
          }
          return dest;
        })
      );

      const enrichDuration = Date.now() - enrichStart;

      if (inngestJobId) {
        await addJobEvent(inngestJobId, "enrich-destinations", {
          message: `Enriched ${enrichedCount}/${result.length} destinations with Google Places`,
          durationMs: enrichDuration,
          metadata: { enrichedCount, totalCount: result.length },
        });
      }

      return enriched;
    });

    // ── Auto-save as draft CatalogDestination records ─────────
    const saveResult = await step.run("save-as-draft", async () => {
      const dataForCreate = enrichedResult.map((dest) => ({
        name: dest.name,
        region: dest.region,
        country: dest.country,
        continent: dest.continent,
        description: dest.description,
        scoreBeach: dest.scoreBeach,
        scoreAdventure: dest.scoreAdventure,
        scoreCulture: dest.scoreCulture,
        scoreNature: dest.scoreNature,
        scoreCity: dest.scoreCity,
        scoreResort: dest.scoreResort,
        scoreThemePark: dest.scoreThemePark,
        scoreCruise: dest.scoreCruise,
        scoreKidFriendly: dest.scoreKidFriendly,
        scoreRelaxation: dest.scoreRelaxation,
        scoreFood: dest.scoreFood,
        scoreSafety: dest.scoreSafety,
        scoreScenic: dest.scoreScenic,
        scoreNightlife: dest.scoreNightlife,
        costTier: dest.costTier,
        avgDailyCostUsd: dest.avgDailyCostUsd,
        bestMonths: dest.bestMonths,
        avoidMonths: dest.avoidMonths || null,
        minRecommendedAge: dest.minRecommendedAge ?? null,
        flightTimeNYC: dest.flightTimeNYC ?? null,
        flightTimeLAX: dest.flightTimeLAX ?? null,
        flightTimeSLC: dest.flightTimeSLC ?? null,
        flightTimeORD: dest.flightTimeORD ?? null,
        flightTimeDFW: dest.flightTimeDFW ?? null,
        flightTimeMIA: dest.flightTimeMIA ?? null,
        flightTimeATL: dest.flightTimeATL ?? null,
        flightTimeSEA: dest.flightTimeSEA ?? null,
        visaRequired: dest.visaRequired,
        visaNotes: dest.visaNotes || null,
        languageNotes: dest.languageNotes || null,
        healthNotes: dest.healthNotes || null,
        tags: dest.tags,
        placeId: ("placeId" in dest ? dest.placeId : null) as string | null,
        latitude: ("latitude" in dest ? dest.latitude : null) as number | null,
        longitude: ("longitude" in dest ? dest.longitude : null) as
          | number
          | null,
        avgRating: ("avgRating" in dest ? dest.avgRating : null) as
          | number
          | null,
        reviewCount: ("reviewCount" in dest ? dest.reviewCount : null) as
          | number
          | null,
        photoUrls: ("photoUrls" in dest
          ? (dest.photoUrls as string[])
          : undefined) as string[] | undefined,
        status: "draft",
        generatedFrom: prompt,
      }));

      const { count: savedCount } = await prisma.catalogDestination.createMany({
        data: dataForCreate,
        skipDuplicates: true,
      });

      const skippedCount = enrichedResult.length - savedCount;

      // Save results JSON to job for audit trail
      await prisma.catalogGenerationJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          results: JSON.parse(JSON.stringify(enrichedResult)),
        },
      });

      if (inngestJobId) {
        await addJobEvent(inngestJobId, "save-as-draft", {
          message: `Saved ${savedCount} destinations as draft (${skippedCount} duplicates skipped)`,
          metadata: {
            savedCount,
            skippedCount,
            totalGenerated: enrichedResult.length,
          },
        });
      }

      return { savedCount, skippedCount, totalGenerated: enrichedResult.length };
    });

    // ── Send email notification ──────────────────────────────
    await step.run("send-notification", async () => {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.AUTH_URL ||
        "https://trip-craft.shredstack.net";

      try {
        if (adminEmail) {
          await sendCatalogGenerationEmail({
            to: adminEmail,
            prompt,
            totalGenerated: saveResult.totalGenerated,
            savedCount: saveResult.savedCount,
            skippedCount: saveResult.skippedCount,
            adminUrl: `${baseUrl}/admin/destinations`,
          });
        }
      } catch (err) {
        // Don't fail the job over email — destinations are already saved
        console.error("Failed to send notification email:", err);
      }

      if (inngestJobId) {
        await completeJob(inngestJobId, {
          message: `Catalog generation completed: ${saveResult.savedCount} saved, ${saveResult.skippedCount} skipped`,
          metadata: { ...saveResult },
        });
      }
    });

    return { jobId, ...saveResult };
  }
);
