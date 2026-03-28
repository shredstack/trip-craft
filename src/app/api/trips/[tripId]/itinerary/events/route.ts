import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { ItineraryEventCategory } from "@prisma/client";

const VALID_CATEGORIES = new Set(Object.values(ItineraryEventCategory));

// POST — Create a custom event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;
    const body = await request.json();

    // Verify trip ownership and itinerary existence
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: { itinerary: { select: { id: true } } },
    });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    if (!trip.itinerary) {
      return NextResponse.json({ error: "No itinerary exists" }, { status: 404 });
    }

    const category = body.category?.toUpperCase();
    if (!category || !VALID_CATEGORIES.has(category as ItineraryEventCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Calculate next sort order
    const maxSort = await prisma.itineraryEvent.aggregate({
      where: {
        itineraryId: trip.itinerary.id,
        dayId: body.dayId || null,
      },
      _max: { sortOrder: true },
    });

    const event = await prisma.itineraryEvent.create({
      data: {
        itineraryId: trip.itinerary.id,
        dayId: body.dayId || null,
        excursionId: body.excursionId || null,
        category: category as ItineraryEventCategory,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        tips: body.tips?.trim() || null,
        location: body.location?.trim() || null,
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        timeLabel: body.timeLabel || null,
        backupCategory: body.backupCategory || null,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to create itinerary event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// PATCH — Bulk update events (for drag-and-drop reordering)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;
    const { events } = await request.json();

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "Events array required" }, { status: 400 });
    }

    // Verify trip ownership and itinerary existence
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: { itinerary: { select: { id: true } } },
    });
    if (!trip?.itinerary) {
      return NextResponse.json({ error: "Trip or itinerary not found" }, { status: 404 });
    }

    // Validate all event IDs belong to this itinerary
    const eventIds = events.map((e: { id: string }) => e.id);
    const existing = await prisma.itineraryEvent.findMany({
      where: {
        id: { in: eventIds },
        itineraryId: trip.itinerary.id,
      },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((e) => e.id));
    const invalid = eventIds.filter((id: string) => !existingIds.has(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Events not found: ${invalid.join(", ")}` },
        { status: 400 }
      );
    }

    // Update all events in a transaction
    await prisma.$transaction(
      events.map(
        (evt: {
          id: string;
          dayId?: string | null;
          sortOrder?: number;
          startTime?: string | null;
          endTime?: string | null;
          timeLabel?: string | null;
        }) =>
          prisma.itineraryEvent.update({
            where: { id: evt.id },
            data: {
              ...(evt.dayId !== undefined ? { dayId: evt.dayId } : {}),
              ...(evt.sortOrder !== undefined ? { sortOrder: evt.sortOrder } : {}),
              ...(evt.startTime !== undefined ? { startTime: evt.startTime } : {}),
              ...(evt.endTime !== undefined ? { endTime: evt.endTime } : {}),
              ...(evt.timeLabel !== undefined ? { timeLabel: evt.timeLabel } : {}),
            },
          })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to bulk update events:", error);
    return NextResponse.json({ error: "Failed to update events" }, { status: 500 });
  }
}
