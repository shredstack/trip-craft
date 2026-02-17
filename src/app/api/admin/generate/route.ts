import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { generateCatalogDestinations } from "@/lib/generate-destinations";
import { z } from "zod";

const GenerateSchema = z.object({
  prompt: z.string().min(1),
  count: z.number().int().min(1).max(50),
  excludeExisting: z.boolean(),
  testMode: z.boolean().optional(),
  testCap: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { prompt, count, excludeExisting, testMode, testCap } = GenerateSchema.parse(body);

    // Test mode caps the generation count
    const actualCount = testMode && testCap ? Math.min(count, testCap) : count;

    // Get existing destination names for exclusion
    let existingNames: string[] = [];
    if (excludeExisting) {
      const existing = await prisma.catalogDestination.findMany({
        where: { status: { in: ["draft", "published"] } },
        select: { name: true, country: true },
      });
      existingNames = existing.map((d) => `${d.name}, ${d.country}`);
    }

    const destinations = await generateCatalogDestinations(prompt, actualCount, existingNames);

    return NextResponse.json({ destinations });
  } catch (error) {
    console.error("Admin generate failed:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    const status = message.includes("Not auth") ? 401 : message.includes("admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
