import { NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const type = searchParams.get("type") || "tourist_attraction";

    if (!query) {
      return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ results: [] });
    }

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=${type}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    const results = (data.results || []).slice(0, 5).map(
      (place: {
        place_id: string;
        name: string;
        rating?: number;
        user_ratings_total?: number;
        photos?: Array<{ photo_reference: string }>;
        geometry?: { location?: { lat: number; lng: number } };
      }) => ({
        placeId: place.place_id,
        name: place.name,
        rating: place.rating || null,
        reviewCount: place.user_ratings_total || null,
        photos: place.photos?.slice(0, 3).map(
          (p: { photo_reference: string }) =>
            `https://maps.googleapis.com/maps/api/place/photo?photo_reference=${p.photo_reference}&maxwidth=600&key=${API_KEY}`
        ) || [],
        location: place.geometry?.location || null,
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Places API error:", error);
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}
