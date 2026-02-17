import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: {
        destinations: {
          include: { excursions: true },
          orderBy: { sortOrder: "asc" },
        },
        tripItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Failed to get trip:", error);
    return NextResponse.json({ error: "Failed to get trip" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;
    const body = await request.json();

    const existing = await prisma.trip.findFirst({
      where: { id: tripId, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: body,
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Failed to update trip:", error);
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;

    const existing = await prisma.trip.findFirst({
      where: { id: tripId, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    await prisma.trip.delete({ where: { id: tripId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete trip:", error);
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
  }
}
