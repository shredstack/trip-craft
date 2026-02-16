const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = "https://maps.googleapis.com/maps/api/place";

interface PlaceResult {
  placeId: string;
  name: string;
  rating: number | null;
  reviewCount: number | null;
  photoRef: string | null;
  lat: number | null;
  lng: number | null;
}

export async function searchPlace(query: string): Promise<PlaceResult | null> {
  if (!API_KEY) return null;

  const url = `${BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.results || data.results.length === 0) return null;

  const place = data.results[0];
  return {
    placeId: place.place_id,
    name: place.name,
    rating: place.rating ?? null,
    reviewCount: place.user_ratings_total ?? null,
    photoRef: place.photos?.[0]?.photo_reference ?? null,
    lat: place.geometry?.location?.lat ?? null,
    lng: place.geometry?.location?.lng ?? null,
  };
}

export function getPhotoUrl(photoRef: string, maxWidth: number = 600): string {
  return `${BASE_URL}/photo?photo_reference=${photoRef}&maxwidth=${maxWidth}&key=${API_KEY}`;
}

export async function enrichDestination(destinationName: string, country: string) {
  const place = await searchPlace(`${destinationName} ${country} tourist destination`);
  if (!place) return null;

  const photoUrls: string[] = [];
  if (place.photoRef) {
    photoUrls.push(getPhotoUrl(place.photoRef));
  }

  return {
    placeId: place.placeId,
    avgRating: place.rating,
    reviewCount: place.reviewCount,
    latitude: place.lat,
    longitude: place.lng,
    photoUrls,
  };
}

export async function enrichExcursion(excursionName: string, destinationName: string) {
  const place = await searchPlace(`${excursionName} ${destinationName}`);
  if (!place) return null;

  return {
    placeId: place.placeId,
    avgRating: place.rating,
    reviewCount: place.reviewCount,
    bookingUrl: null,
  };
}
