import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";
import type { TripCriteria } from "@/lib/types";

function generateTripName(criteria: TripCriteria): string {
  if (criteria.tripTypes.length > 0) {
    const types = criteria.tripTypes.slice(0, 2).join(" & ");
    return `${types} Getaway`;
  }
  return `Dream Vacation ${new Date().getFullYear()}`;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    const body = await request.json();
    const criteria = body.criteria as TripCriteria;

    const trip = await prisma.trip.create({
      data: {
        userId,
        name: generateTripName(criteria),
        status: "DREAMING",
        criteria: JSON.parse(JSON.stringify(criteria)),
        departCity: criteria.departCity,
        budgetType: criteria.budget,
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Failed to create trip:", error);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const trips = await prisma.trip.findMany({
      where: {
        userId,
        ...(status ? { status: status as "DREAMING" | "PLANNING" | "BOOKED" | "COMPLETED" | "ARCHIVED" } : {}),
      },
      include: {
        destinations: {
          select: { id: true, name: true, matchScore: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error("Failed to list trips:", error);
    return NextResponse.json({ error: "Failed to list trips" }, { status: 500 });
  }
}
