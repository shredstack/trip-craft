import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    await requireAdmin();

    const [byStatus, byContinent, byCostTier, total] = await Promise.all([
      prisma.catalogDestination.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.catalogDestination.groupBy({
        by: ["continent"],
        _count: { _all: true },
      }),
      prisma.catalogDestination.groupBy({
        by: ["costTier"],
        _count: { _all: true },
      }),
      prisma.catalogDestination.count(),
    ]);

    return NextResponse.json({
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
      byContinent: Object.fromEntries(byContinent.map((r) => [r.continent, r._count._all])),
      byCostTier: Object.fromEntries(byCostTier.map((r) => [r.costTier, r._count._all])),
      total,
    });
  } catch (error) {
    console.error("Admin stats failed:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    const status = message.includes("Not auth") ? 401 : message.includes("admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
