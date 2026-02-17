import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { searchLodging, getPlaceDetails } from "@/lib/google-places";
import { uploadPhotosToBlob } from "@/lib/blob-storage";

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const destinationId = searchParams.get("destinationId");

    if (!destinationId) {
      return NextResponse.json(
        { error: "Missing destinationId" },
        { status: 400 }
      );
    }

    // Verify destination belongs to this trip
    const destination = await prisma.destination.findFirst({
      where: { id: destinationId, tripId },
    });

    if (!destination) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      );
    }

    // Check if accommodations already cached in DB
    const existing = await prisma.accommodation.findMany({
      where: { destinationId },
      orderBy: { sortOrder: "asc" },
    });

    if (existing.length > 0) {
      return NextResponse.json({ accommodations: existing });
    }

    // Fetch from Google Places
    const lodgingResults = await searchLodging(
      destination.name,
      destination.country || ""
    );

    if (lodgingResults.length === 0) {
      console.warn(`No lodging results from Google Places for "${destination.name}" (${destination.country})`);
      return NextResponse.json({ accommodations: [] });
    }

    // Enrich top results with details (reviews, photos) and save to DB
    const accommodations = [];

    for (let i = 0; i < lodgingResults.length; i++) {
      const lodge = lodgingResults[i];

      // Get details for top 3 results (reviews + more photos)
      let details = null;
      if (i < 3) {
        try {
          details = await getPlaceDetails(lodge.placeId);
        } catch {
          // Continue without details
        }
      }

      // Upload photos to blob
      const photoRefs = (details?.photoRefs ?? lodge.photoRefs).slice(0, 3);
      const photoUrls = await uploadPhotosToBlob(
        photoRefs,
        "accommodations"
      );

      const accommodation = await prisma.accommodation.create({
        data: {
          destinationId,
          name: lodge.name,
          placeId: lodge.placeId,
          avgRating: lodge.rating,
          reviewCount: lodge.reviewCount,
          photoUrls,
          priceLevel: lodge.priceLevel,
          formattedAddress:
            details?.formattedAddress ?? lodge.formattedAddress,
          websiteUrl: details?.websiteUrl ?? null,
          reviews: (details?.reviews ?? []) as unknown as Prisma.InputJsonValue,
          latitude: lodge.lat,
          longitude: lodge.lng,
          sortOrder: i,
        },
      });

      accommodations.push(accommodation);
    }

    return NextResponse.json({ accommodations });
  } catch (error) {
    console.error("Failed to fetch accommodations:", error);
    return NextResponse.json(
      { error: "Failed to fetch accommodations" },
      { status: 500 }
    );
  }
}
