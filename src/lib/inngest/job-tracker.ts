import { prisma } from "@/lib/db";
import type { InngestJobType, InngestJobStatus, Prisma } from "@prisma/client";

// ── Create a new job ────────────────────────────────────────────
export async function createJob(
  type: InngestJobType,
  opts: {
    userId?: string;
    tripId?: string;
    inngestEventId?: string;
    llmPrompt?: string;
    llmModel?: string;
    metadata?: Prisma.InputJsonValue;
  } = {}
) {
  const job = await prisma.inngestJob.create({
    data: {
      type,
      status: "PENDING",
      userId: opts.userId,
      tripId: opts.tripId,
      inngestEventId: opts.inngestEventId,
      llmPrompt: opts.llmPrompt,
      llmModel: opts.llmModel,
      metadata: opts.metadata,
      events: {
        create: { status: "PENDING", message: `Job created (${type})` },
      },
    },
  });
  return job;
}

// ── Update job status + create history event ────────────────────
export async function updateJobStatus(
  jobId: string,
  status: InngestJobStatus,
  opts: {
    stepName?: string;
    message?: string;
    error?: string;
    inputTokens?: number;
    outputTokens?: number;
    durationMs?: number;
    metadata?: Prisma.InputJsonValue;
  } = {}
) {
  const [job] = await prisma.$transaction([
    prisma.inngestJob.update({
      where: { id: jobId },
      data: {
        status,
        ...(opts.error ? { error: opts.error } : {}),
      },
    }),
    prisma.inngestJobEvent.create({
      data: {
        jobId,
        status,
        stepName: opts.stepName,
        message: opts.message,
        inputTokens: opts.inputTokens,
        outputTokens: opts.outputTokens,
        durationMs: opts.durationMs,
        metadata: opts.metadata,
      },
    }),
  ]);
  return job;
}

// ── Record a step event without changing the job status ─────────
export async function addJobEvent(
  jobId: string,
  stepName: string,
  opts: {
    message?: string;
    inputTokens?: number;
    outputTokens?: number;
    durationMs?: number;
    metadata?: Prisma.InputJsonValue;
  } = {}
) {
  return prisma.inngestJobEvent.create({
    data: {
      jobId,
      status: "STEP_COMPLETED",
      stepName,
      message: opts.message,
      inputTokens: opts.inputTokens,
      outputTokens: opts.outputTokens,
      durationMs: opts.durationMs,
      metadata: opts.metadata,
    },
  });
}

// ── Mark job completed, aggregate token totals and duration ─────
export async function completeJob(
  jobId: string,
  opts: {
    message?: string;
    metadata?: Prisma.InputJsonValue;
  } = {}
) {
  // Sum up tokens across all events for this job
  const tokenAgg = await prisma.inngestJobEvent.aggregate({
    where: { jobId },
    _sum: { inputTokens: true, outputTokens: true },
  });

  // Calculate wall-clock duration from job creation
  const job = await prisma.inngestJob.findUniqueOrThrow({
    where: { id: jobId },
    select: { createdAt: true },
  });
  const durationMs = Date.now() - job.createdAt.getTime();

  const [updated] = await prisma.$transaction([
    prisma.inngestJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        totalInputTokens: tokenAgg._sum.inputTokens,
        totalOutputTokens: tokenAgg._sum.outputTokens,
        durationMs,
        metadata: opts.metadata,
      },
    }),
    prisma.inngestJobEvent.create({
      data: {
        jobId,
        status: "COMPLETED",
        message: opts.message ?? "Job completed successfully",
        durationMs,
      },
    }),
  ]);
  return updated;
}

// ── Mark job failed ─────────────────────────────────────────────
export async function failJob(jobId: string, error: string) {
  // Calculate wall-clock duration from job creation
  const job = await prisma.inngestJob.findUniqueOrThrow({
    where: { id: jobId },
    select: { createdAt: true },
  });
  const durationMs = Date.now() - job.createdAt.getTime();

  const [updated] = await prisma.$transaction([
    prisma.inngestJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error,
        durationMs,
      },
    }),
    prisma.inngestJobEvent.create({
      data: {
        jobId,
        status: "FAILED",
        message: error,
        durationMs,
      },
    }),
  ]);
  return updated;
}

// ── Find a job by tripId (for Inngest functions that receive tripId) ──
export async function findJobByTripId(tripId: string) {
  return prisma.inngestJob.findFirst({
    where: { tripId, type: "TRIP_GENERATION" },
    orderBy: { createdAt: "desc" },
  });
}
