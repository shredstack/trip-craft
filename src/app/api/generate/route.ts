import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateDestinations } from "@/lib/claude";
import { enrichDestination, enrichExcursion } from "@/lib/google-places";
import type { TripCriteria, ExcursionTypeValue } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { tripId } = await request.json();

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
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

      const destination = await prisma.destination.create({
        data: {
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
          ...(placeData
            ? {
                placeId: placeData.placeId,
                avgRating: placeData.avgRating,
                reviewCount: placeData.reviewCount,
                latitude: placeData.latitude,
                longitude: placeData.longitude,
                photoUrls: placeData.photoUrls,
              }
            : {}),
        },
      });

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

        const excursion = await prisma.excursion.create({
          data: {
            destinationId: destination.id,
            name: exc.name,
            type: (exc.type.toUpperCase() as ExcursionTypeValue) || "OTHER",
            description: exc.description,
            priceEstimate: exc.priceEstimate,
            duration: exc.duration,
            kidFriendly: exc.kidFriendly,
            minAge: exc.minAge,
            kidNotes: exc.kidNotes,
            sortOrder: j,
            ...(excPlaceData
              ? {
                  placeId: excPlaceData.placeId,
                  avgRating: excPlaceData.avgRating,
                  reviewCount: excPlaceData.reviewCount,
                  bookingUrl: excPlaceData.bookingUrl,
                }
              : {}),
          },
        });
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
