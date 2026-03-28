import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";

// PATCH — Update a single event's fields
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string; eventId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId, eventId } = await params;
    const body = await request.json();

    // Verify ownership
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: { itinerary: { select: { id: true } } },
    });
    if (!trip?.itinerary) {
      return NextResponse.json({ error: "Trip or itinerary not found" }, { status: 404 });
    }

    const event = await prisma.itineraryEvent.findFirst({
      where: { id: eventId, itineraryId: trip.itinerary.id },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "description",
      "tips",
      "location",
      "startTime",
      "endTime",
      "timeLabel",
      "category",
      "dayId",
      "sortOrder",
      "backupCategory",
      "userRating",
      "userReview",
      "completed",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    const updated = await prisma.itineraryEvent.update({
      where: { id: eventId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE — Remove a single event
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tripId: string; eventId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId, eventId } = await params;

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: { itinerary: { select: { id: true } } },
    });
    if (!trip?.itinerary) {
      return NextResponse.json({ error: "Trip or itinerary not found" }, { status: 404 });
    }

    const event = await prisma.itineraryEvent.findFirst({
      where: { id: eventId, itineraryId: trip.itinerary.id },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.itineraryEvent.delete({ where: { id: eventId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
