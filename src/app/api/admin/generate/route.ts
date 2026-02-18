import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { inngest } from "@/lib/inngest/client";
import { createJob } from "@/lib/inngest/job-tracker";
import { z } from "zod";

const GenerateSchema = z.object({
  prompt: z.string().min(1),
  count: z.number().int().min(1).max(50),
  excludeExisting: z.boolean(),
  testMode: z.boolean().optional(),
  testCap: z.number().int().min(1).max(10).optional(),
});

// POST — create a generation job and queue it via Inngest
export async function POST(request: Request) {
  try {
    const adminUserId = await requireAdmin();
    const body = await request.json();
    const { prompt, count, excludeExisting, testMode, testCap } = GenerateSchema.parse(body);

    // Test mode caps the generation count
    const actualCount = testMode && testCap ? Math.min(count, testCap) : count;

    // Get existing destination names for exclusion
    let existingNames: string[] = [];
    if (excludeExisting) {
      const existing = await prisma.catalogDestination.findMany({
        where: { status: { in: ["draft", "published"] } },
        select: { name: true, country: true },
      });
      existingNames = existing.map((d) => `${d.name}, ${d.country}`);
    }

    // Create a job record to track progress
    const catalogJob = await prisma.catalogGenerationJob.create({
      data: { prompt: `${prompt} (count: ${actualCount})`, count: actualCount },
    });

    // Create unified Inngest job tracking record
    const inngestJob = await createJob("CATALOG_GENERATION", {
      userId: adminUserId,
      llmPrompt: prompt,
      metadata: { catalogJobId: catalogJob.id, count: actualCount },
    });

    // Send event to Inngest for durable background processing
    const { ids } = await inngest.send({
      name: "admin/catalog-generate.requested",
      data: {
        jobId: catalogJob.id,
        inngestJobId: inngestJob.id,
        prompt,
        count: actualCount,
        existingNames,
      },
    });

    // Store the Inngest event ID on the job
    if (ids?.[0]) {
      await prisma.inngestJob.update({
        where: { id: inngestJob.id },
        data: { inngestEventId: ids[0] },
      });
    }

    return NextResponse.json({ jobId: catalogJob.id });
  } catch (error) {
    console.error("Admin generate failed:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    const status = message.includes("Not auth") ? 401 : message.includes("admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// GET — poll job status
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const jobId = request.nextUrl.searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await prisma.catalogGenerationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: job.status,
      destinations: job.status === "completed" ? job.results : null,
      error: job.error,
    });
  } catch (error) {
    console.error("Admin generate poll failed:", error);
    const message = error instanceof Error ? error.message : "Poll failed";
    const status = message.includes("Not auth") ? 401 : message.includes("admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
