import { put } from "@vercel/blob";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const PLACES_API_BASE = "https://places.googleapis.com/v1";

/**
 * Downloads a photo from Google Places (New) and uploads it to Vercel Blob storage.
 * Returns the public Blob URL. Falls back to a Google Places URL if Blob is not configured.
 * photoName is a resource name like "places/ChIJ.../photos/abc123".
 */
export async function uploadPhotoToBlob(
  photoName: string,
  prefix: string,
  maxWidth: number = 800
): Promise<string> {
  const googleUrl = `${PLACES_API_BASE}/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;

  // Fallback: if Blob storage is not configured, return Google URL directly
  if (!BLOB_TOKEN) {
    return googleUrl;
  }

  try {
    // Fetch the image from Google Places (follows redirect to actual image)
    const imageRes = await fetch(googleUrl);
    if (!imageRes.ok) {
      throw new Error(`Failed to fetch image: ${imageRes.status}`);
    }

    const imageBlob = await imageRes.blob();
    const photoId = photoName.split("/").pop() ?? photoName;
    const filename = `${prefix}/${photoId.slice(0, 32)}.jpg`;

    const { url } = await put(filename, imageBlob, {
      access: "public",
      token: BLOB_TOKEN,
      contentType: imageBlob.type || "image/jpeg",
    });

    return url;
  } catch (error) {
    console.error("Blob upload failed, falling back to Google URL:", error);
    return googleUrl;
  }
}

/**
 * Batch upload multiple photos to Vercel Blob.
 * Skips failures gracefully and returns only successful URLs.
 */
export async function uploadPhotosToBlob(
  photoRefs: string[],
  prefix: string,
  maxWidth: number = 800
): Promise<string[]> {
  if (photoRefs.length === 0) return [];

  const results = await Promise.allSettled(
    photoRefs.map((ref) => uploadPhotoToBlob(ref, prefix, maxWidth))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled"
    )
    .map((r) => r.value);
}
