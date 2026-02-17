import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { enrichDestination } from "@/lib/google-places";
import { z } from "zod";

const EnrichSchema = z.object({
  destinations: z.array(
    z.object({
      name: z.string(),
      country: z.string(),
      tempId: z.string().optional(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { destinations } = EnrichSchema.parse(body);

    const enriched: Array<{
      tempId?: string;
      placeId: string;
      latitude: number | null;
      longitude: number | null;
      avgRating: number | null;
      reviewCount: number | null;
      photoUrls: string[];
    }> = [];

    for (const dest of destinations) {
      try {
        const data = await enrichDestination(dest.name, dest.country);
        if (data) {
          enriched.push({
            tempId: dest.tempId,
            placeId: data.placeId,
            latitude: data.latitude,
            longitude: data.longitude,
            avgRating: data.avgRating,
            reviewCount: data.reviewCount,
            photoUrls: data.photoUrls,
          });
        }
      } catch (err) {
        console.error(`Failed to enrich ${dest.name}:`, err);
      }
    }

    return NextResponse.json({ results: enriched });
  } catch (error) {
    console.error("Admin enrich failed:", error);
    const message = error instanceof Error ? error.message : "Enrichment failed";
    const status = message.includes("Not auth") ? 401 : message.includes("admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
