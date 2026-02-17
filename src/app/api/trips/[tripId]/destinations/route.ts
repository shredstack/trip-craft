import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";

async function verifyTripOwnership(tripId: string, userId: string) {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  return !!trip;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;

    if (!(await verifyTripOwnership(tripId, userId))) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const body = await request.json();

    const destination = await prisma.destination.create({
      data: {
        tripId,
        name: body.name,
        region: body.region,
        country: body.country,
        description: body.description,
        isSelected: true,
      },
    });

    return NextResponse.json(destination);
  } catch (error) {
    console.error("Failed to add destination:", error);
    return NextResponse.json({ error: "Failed to add destination" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;

    if (!(await verifyTripOwnership(tripId, userId))) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const body = await request.json();
    const { destinationId, ...data } = body;

    const destination = await prisma.destination.update({
      where: { id: destinationId },
      data,
    });

    return NextResponse.json(destination);
  } catch (error) {
    console.error("Failed to update destination:", error);
    return NextResponse.json({ error: "Failed to update destination" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;

    if (!(await verifyTripOwnership(tripId, userId))) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const destinationId = searchParams.get("destinationId");

    if (!destinationId) {
      return NextResponse.json({ error: "Missing destinationId" }, { status: 400 });
    }

    // Verify destination belongs to this trip
    const destination = await prisma.destination.findFirst({
      where: { id: destinationId, tripId },
    });

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }

    // Prisma cascade will also delete associated excursions and accommodations
    await prisma.destination.delete({ where: { id: destinationId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete destination:", error);
    return NextResponse.json({ error: "Failed to delete destination" }, { status: 500 });
  }
}
