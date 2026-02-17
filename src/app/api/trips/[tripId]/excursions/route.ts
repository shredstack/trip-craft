import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await params;

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const body = await request.json();

    const excursion = await prisma.excursion.create({
      data: {
        destinationId: body.destinationId,
        name: body.name,
        type: body.type || "OTHER",
        description: body.description,
        priceEstimate: body.priceEstimate,
        duration: body.duration,
        kidFriendly: body.kidFriendly ?? true,
        minAge: body.minAge,
      },
    });

    return NextResponse.json(excursion);
  } catch (error) {
    console.error("Failed to add excursion:", error);
    return NextResponse.json({ error: "Failed to add excursion" }, { status: 500 });
  }
}
