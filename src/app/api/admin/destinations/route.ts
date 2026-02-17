import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// GET: List/search/filter catalog destinations
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const continent = searchParams.get("continent");
    const costTier = searchParams.get("costTier");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    const where: Prisma.CatalogDestinationWhereInput = {};

    if (status && status !== "all") {
      where.status = status;
    }
    if (continent) {
      where.continent = continent;
    }
    if (costTier) {
      where.costTier = costTier;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
      ];
    }

    const [destinations, total] = await Promise.all([
      prisma.catalogDestination.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.catalogDestination.count({ where }),
    ]);

    return NextResponse.json({
      destinations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin destinations list failed:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch destinations";
    const status = message.includes("Not auth") ? 401 : message.includes("admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// POST: Batch create catalog destinations
const CreateDestinationSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  country: z.string().min(1),
  continent: z.string().min(1),
  description: z.string().min(1),
  scoreBeach: z.number().int().min(0).max(10),
  scoreAdventure: z.number().int().min(0).max(10),
  scoreCulture: z.number().int().min(0).max(10),
  scoreNature: z.number().int().min(0).max(10),
  scoreCity: z.number().int().min(0).max(10),
  scoreResort: z.number().int().min(0).max(10),
  scoreThemePark: z.number().int().min(0).max(10),
  scoreCruise: z.number().int().min(0).max(10),
  scoreKidFriendly: z.number().int().min(0).max(10),
  scoreRelaxation: z.number().int().min(0).max(10),
  scoreFood: z.number().int().min(0).max(10),
  scoreSafety: z.number().int().min(0).max(10),
  scoreScenic: z.number().int().min(0).max(10),
  scoreNightlife: z.number().int().min(0).max(10),
  costTier: z.string(),
  avgDailyCostUsd: z.number().int(),
  bestMonths: z.string(),
  avoidMonths: z.string().nullable().optional(),
  minRecommendedAge: z.number().int().nullable().optional(),
  flightTimeNYC: z.number().nullable().optional(),
  flightTimeLAX: z.number().nullable().optional(),
  flightTimeSLC: z.number().nullable().optional(),
  flightTimeORD: z.number().nullable().optional(),
  flightTimeDFW: z.number().nullable().optional(),
  flightTimeMIA: z.number().nullable().optional(),
  flightTimeATL: z.number().nullable().optional(),
  flightTimeSEA: z.number().nullable().optional(),
  visaRequired: z.boolean(),
  visaNotes: z.string().nullable().optional(),
  languageNotes: z.string().nullable().optional(),
  healthNotes: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  // Google Places data (optional, from enrichment)
  placeId: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  avgRating: z.number().nullable().optional(),
  reviewCount: z.number().int().nullable().optional(),
  photoUrls: z.array(z.string()).nullable().optional(),
});

const BatchCreateSchema = z.object({
  destinations: z.array(CreateDestinationSchema),
  status: z.enum(["draft", "published"]).default("draft"),
  generatedFrom: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { destinations, status, generatedFrom } = BatchCreateSchema.parse(body);

    const created = await prisma.$transaction(
      destinations.map((dest) =>
        prisma.catalogDestination.create({
          data: {
            ...dest,
            avoidMonths: dest.avoidMonths || null,
            minRecommendedAge: dest.minRecommendedAge ?? null,
            flightTimeNYC: dest.flightTimeNYC ?? null,
            flightTimeLAX: dest.flightTimeLAX ?? null,
            flightTimeSLC: dest.flightTimeSLC ?? null,
            flightTimeORD: dest.flightTimeORD ?? null,
            flightTimeDFW: dest.flightTimeDFW ?? null,
            flightTimeMIA: dest.flightTimeMIA ?? null,
            flightTimeATL: dest.flightTimeATL ?? null,
            flightTimeSEA: dest.flightTimeSEA ?? null,
            visaNotes: dest.visaNotes || null,
            languageNotes: dest.languageNotes || null,
            healthNotes: dest.healthNotes || null,
            placeId: dest.placeId ?? null,
            latitude: dest.latitude ?? null,
            longitude: dest.longitude ?? null,
            avgRating: dest.avgRating ?? null,
            reviewCount: dest.reviewCount ?? null,
            photoUrls: dest.photoUrls ?? undefined,
            tags: dest.tags,
            status,
            generatedFrom: generatedFrom || null,
          },
        })
      )
    );

    return NextResponse.json({ created: created.length, destinations: created });
  } catch (error) {
    console.error("Admin destinations create failed:", error);
    const message = error instanceof Error ? error.message : "Failed to create destinations";
    // Check for unique constraint violation
    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "One or more destinations already exist (duplicate name + country)" },
        { status: 409 }
      );
    }
    const status = message.includes("Not auth") ? 401 : message.includes("admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
