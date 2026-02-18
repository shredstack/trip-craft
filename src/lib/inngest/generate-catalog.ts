import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { generateCatalogDestinations } from "@/lib/generate-destinations";
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
      const { jobId, inngestJobId } = event.data.event.data;
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
    },
  },
  { event: "admin/catalog-generate.requested" },
  async ({ event, step }) => {
    const { jobId, inngestJobId, prompt, count, existingNames } = event.data;

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

    // ── Save results to job ──────────────────────────────────
    await step.run("save-results", async () => {
      await prisma.catalogGenerationJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          results: JSON.parse(JSON.stringify(result)),
        },
      });

      if (inngestJobId) {
        await completeJob(inngestJobId, {
          message: `Catalog generation completed: ${result.length} destinations`,
          metadata: { destinationCount: result.length },
        });
      }
    });

    return { jobId, count: result.length };
  }
);
