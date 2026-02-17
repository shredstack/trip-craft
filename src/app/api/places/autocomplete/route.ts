import { NextRequest, NextResponse } from "next/server";
import { airports } from "@/lib/airports";

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input");

  if (!input || input.trim().length < 2) {
    return NextResponse.json([]);
  }

  const query = input.toLowerCase();

  const matches = airports
    .filter((a) => {
      const searchable = `${a.city} ${a.state ?? ""} ${a.country} ${a.iata} ${a.name}`.toLowerCase();
      return searchable.includes(query) || a.iata.toLowerCase() === query;
    })
    .slice(0, 6)
    .map((a) => ({
      placeId: a.iata,
      description: a.state
        ? `${a.city}, ${a.state} (${a.iata})`
        : `${a.city}, ${a.country} (${a.iata})`,
    }));

  return NextResponse.json(matches);
}
