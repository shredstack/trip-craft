import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { inngest } from "@/lib/inngest/client";
import { createJob } from "@/lib/inngest/job-tracker";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await request.json();

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
    });
    if (!trip || !trip.criteria) {
      return NextResponse.json(
        { error: "Trip not found or missing criteria" },
        { status: 404 }
      );
    }

    const job = await createJob("TRIP_GENERATION", {
      userId,
      tripId,
      llmPrompt: JSON.stringify(trip.criteria),
    });

    const { ids } = await inngest.send({
      name: "trip/generate.requested",
      data: { tripId, userId, jobId: job.id },
    });

    // Store the Inngest event ID on the job
    if (ids?.[0]) {
      await prisma.inngestJob.update({
        where: { id: job.id },
        data: { inngestEventId: ids[0] },
      });
    }

    return NextResponse.json({ queued: true, jobId: job.id });
  } catch (error) {
    console.error("Failed to queue generation:", error);
    return NextResponse.json(
      { error: "Failed to start generation. Please try again." },
      { status: 500 }
    );
  }
}
