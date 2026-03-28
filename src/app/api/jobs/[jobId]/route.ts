import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { jobId } = await params;

    const job = await prisma.inngestJob.findFirst({
      where: { id: jobId, userId },
      select: {
        id: true,
        status: true,
        error: true,
        durationMs: true,
        createdAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Failed to get job:", error);
    return NextResponse.json({ error: "Failed to get job" }, { status: 500 });
  }
}
