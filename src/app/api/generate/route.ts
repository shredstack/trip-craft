import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { generateDestinations } from "@/lib/claude";
import { enrichDestination, enrichExcursion } from "@/lib/google-places";
import type { TripCriteria } from "@/lib/types";
import type { Prisma } from "@prisma/client";
import { ExcursionType } from "@prisma/client";

const VALID_EXCURSION_TYPES = new Set(Object.values(ExcursionType));

function toExcursionType(type: string): ExcursionType {
  const upper = type.toUpperCase();
  if (VALID_EXCURSION_TYPES.has(upper as ExcursionType)) {
    return upper as ExcursionType;
  }
  return ExcursionType.OTHER;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId } = await request.json();

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
    if (!trip || !trip.criteria) {
      return NextResponse.json({ error: "Trip not found or missing criteria" }, { status: 404 });
    }

    const criteria = trip.criteria as unknown as TripCriteria;

    // Generate AI recommendations
    const aiResponse = await generateDestinations(criteria);

    // Save destinations and excursions
    const savedDestinations = [];

    for (let i = 0; i < aiResponse.destinations.length; i++) {
      const dest = aiResponse.destinations[i];

      // Try to enrich with Google Places data
      let placeData = null;
      try {
        placeData = await enrichDestination(dest.name, dest.country);
      } catch {
        // Continue without Places data
      }

      const destData: Prisma.DestinationUncheckedCreateInput = {
        tripId,
        name: dest.name,
        region: dest.region,
        country: dest.country,
        description: dest.description,
        matchScore: dest.matchScore,
        aiReasoning: dest.reasoning,
        flightTime: `${dest.flightTimeHours}h`,
        avgCostPp: dest.avgCostPerPerson,
        bestMonths: dest.bestMonths,
        sortOrder: i,
        isSelected: false,
      };

      if (placeData) {
        destData.placeId = placeData.placeId;
        destData.avgRating = placeData.avgRating;
        destData.reviewCount = placeData.reviewCount;
        destData.latitude = placeData.latitude;
        destData.longitude = placeData.longitude;
        destData.photoUrls = placeData.photoUrls;
        destData.reviews = placeData.reviews as unknown as Prisma.InputJsonValue;
      }

      const destination = await prisma.destination.create({ data: destData });

      // Save excursions
      const excursions = [];
      for (let j = 0; j < dest.excursions.length; j++) {
        const exc = dest.excursions[j];

        let excPlaceData = null;
        try {
          excPlaceData = await enrichExcursion(exc.name, dest.name);
        } catch {
          // Continue without Places data
        }

        const excData: Prisma.ExcursionUncheckedCreateInput = {
          destinationId: destination.id,
          name: exc.name,
          type: toExcursionType(exc.type),
          description: exc.description,
          priceEstimate: exc.priceEstimate,
          duration: exc.duration,
          kidFriendly: exc.kidFriendly,
          minAge: exc.minAge,
          kidNotes: exc.kidNotes,
          sortOrder: j,
        };

        if (excPlaceData) {
          excData.placeId = excPlaceData.placeId;
          excData.avgRating = excPlaceData.avgRating;
          excData.reviewCount = excPlaceData.reviewCount;
          excData.bookingUrl = excPlaceData.bookingUrl;
          excData.photoUrls = excPlaceData.photoUrls;
          excData.reviews = excPlaceData.reviews as unknown as Prisma.InputJsonValue;
        }

        const excursion = await prisma.excursion.create({ data: excData });
        excursions.push(excursion);
      }

      savedDestinations.push({ ...destination, excursions });
    }

    return NextResponse.json({ destinations: savedDestinations });
  } catch (error) {
    console.error("Failed to generate destinations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations. Please try again." },
      { status: 500 }
    );
  }
}
