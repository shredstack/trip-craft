import { uploadPhotosToBlob } from "@/lib/blob-storage";
import type { PlaceReview } from "@/lib/types";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = "https://places.googleapis.com/v1";

interface PlaceResult {
  placeId: string;
  name: string;
  rating: number | null;
  reviewCount: number | null;
  photoRefs: string[];
  lat: number | null;
  lng: number | null;
}

interface PlaceDetails {
  reviews: PlaceReview[];
  photoRefs: string[];
  formattedAddress: string | null;
  websiteUrl: string | null;
}

function parsePriceLevel(priceLevel?: string): number | null {
  switch (priceLevel) {
    case "PRICE_LEVEL_FREE": return 0;
    case "PRICE_LEVEL_INEXPENSIVE": return 1;
    case "PRICE_LEVEL_MODERATE": return 2;
    case "PRICE_LEVEL_EXPENSIVE": return 3;
    case "PRICE_LEVEL_VERY_EXPENSIVE": return 4;
    default: return null;
  }
}

export async function searchPlace(query: string): Promise<PlaceResult | null> {
  if (!API_KEY) return null;

  const res = await fetch(`${BASE_URL}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.rating,places.userRatingCount,places.photos,places.location",
    },
    body: JSON.stringify({ textQuery: query }),
  });
  const data = await res.json();

  if (!data.places || data.places.length === 0) return null;

  const place = data.places[0];
  return {
    placeId: place.id,
    name: place.displayName?.text ?? query,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    photoRefs:
      place.photos?.map((p: { name: string }) => p.name) ?? [],
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
  };
}

export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetails | null> {
  if (!API_KEY) return null;

  const res = await fetch(`${BASE_URL}/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "reviews,photos,formattedAddress,websiteUri",
    },
  });
  const data = await res.json();

  if (data.error) return null;

  return {
    reviews: (data.reviews ?? []).slice(0, 5).map(
      (r: {
        authorAttribution?: { displayName: string };
        rating: number;
        text?: { text: string };
        publishTime?: string;
      }) => ({
        author: r.authorAttribution?.displayName ?? "Anonymous",
        rating: r.rating,
        text: r.text?.text ?? "",
        time: r.publishTime
          ? Math.floor(new Date(r.publishTime).getTime() / 1000)
          : 0,
      })
    ),
    photoRefs:
      data.photos?.slice(0, 10).map((p: { name: string }) => p.name) ?? [],
    formattedAddress: data.formattedAddress ?? null,
    websiteUrl: data.websiteUri ?? null,
  };
}

export function getPhotoUrl(
  photoName: string,
  maxWidth: number = 600
): string {
  return `${BASE_URL}/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}

export async function enrichDestination(
  destinationName: string,
  country: string
) {
  const place = await searchPlace(
    `${destinationName} ${country} tourist destination`
  );
  if (!place) return null;

  // Fetch additional details (reviews, more photos)
  let details: PlaceDetails | null = null;
  try {
    details = await getPlaceDetails(place.placeId);
  } catch {
    // Continue without details
  }

  // Merge photo refs from search and details (details often has more)
  const allPhotoRefs = details?.photoRefs?.length
    ? details.photoRefs
    : place.photoRefs;
  // Limit to 6 photos per destination
  const photoRefs = allPhotoRefs.slice(0, 6);

  // Upload photos to blob storage
  const photoUrls = await uploadPhotosToBlob(photoRefs, "destinations");

  return {
    placeId: place.placeId,
    avgRating: place.rating,
    reviewCount: place.reviewCount,
    latitude: place.lat,
    longitude: place.lng,
    photoUrls,
    reviews: details?.reviews ?? [],
  };
}

export async function enrichExcursion(
  excursionName: string,
  destinationName: string
) {
  const place = await searchPlace(`${excursionName} ${destinationName}`);
  if (!place) return null;

  // Fetch details for reviews and photos
  let details: PlaceDetails | null = null;
  try {
    details = await getPlaceDetails(place.placeId);
  } catch {
    // Continue without details
  }

  const photoRefs = (details?.photoRefs ?? place.photoRefs).slice(0, 4);
  const photoUrls = await uploadPhotosToBlob(photoRefs, "excursions");

  return {
    placeId: place.placeId,
    avgRating: place.rating,
    reviewCount: place.reviewCount,
    bookingUrl: null,
    photoUrls,
    reviews: details?.reviews ?? [],
  };
}

export async function searchLodging(
  destinationName: string,
  country: string
): Promise<
  Array<{
    placeId: string;
    name: string;
    rating: number | null;
    reviewCount: number | null;
    photoRefs: string[];
    lat: number | null;
    lng: number | null;
    priceLevel: number | null;
    formattedAddress: string | null;
  }>
> {
  if (!API_KEY) return [];

  const query = `hotels in ${destinationName} ${country}`;
  const res = await fetch(`${BASE_URL}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.rating,places.userRatingCount,places.photos,places.location,places.priceLevel,places.formattedAddress",
    },
    body: JSON.stringify({
      textQuery: query,
      includedType: "lodging",
    }),
  });
  const data = await res.json();

  if (data.error) {
    console.error(
      "Google Places searchLodging error:",
      data.error.status,
      data.error.message
    );
  }

  if (!data.places || data.places.length === 0) return [];

  return data.places.slice(0, 8).map(
    (place: {
      id: string;
      displayName?: { text: string };
      rating?: number;
      userRatingCount?: number;
      photos?: Array<{ name: string }>;
      location?: { latitude: number; longitude: number };
      priceLevel?: string;
      formattedAddress?: string;
    }) => ({
      placeId: place.id,
      name: place.displayName?.text ?? "",
      rating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? null,
      photoRefs: place.photos?.map((p) => p.name) ?? [],
      lat: place.location?.latitude ?? null,
      lng: place.location?.longitude ?? null,
      priceLevel: parsePriceLevel(place.priceLevel),
      formattedAddress: place.formattedAddress ?? null,
    })
  );
}
