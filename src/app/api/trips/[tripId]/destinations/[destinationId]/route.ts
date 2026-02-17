import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string; destinationId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId, destinationId } = await params;

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const destination = await prisma.destination.findFirst({
      where: { id: destinationId, tripId },
      include: {
        excursions: { orderBy: { sortOrder: "asc" } },
        accommodations: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }

    return NextResponse.json(destination);
  } catch (error) {
    console.error("Failed to load destination:", error);
    return NextResponse.json({ error: "Failed to load destination" }, { status: 500 });
  }
}
