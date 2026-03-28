import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { put } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// POST — Upload photos to an itinerary event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string; eventId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId, eventId } = await params;

    // Verify ownership
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: { itinerary: { select: { id: true } } },
    });
    if (!trip?.itinerary) {
      return NextResponse.json({ error: "Trip or itinerary not found" }, { status: 404 });
    }

    const event = await prisma.itineraryEvent.findFirst({
      where: { id: eventId, itineraryId: trip.itinerary.id },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("photos");

    if (files.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    const newUrls: string[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      // Validate file type
      if (!file.type.startsWith("image/")) continue;

      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) continue;

      const ext = file.name.split(".").pop() || "jpg";
      const filename = `itinerary/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      if (BLOB_TOKEN) {
        const { url } = await put(filename, file, {
          access: "public",
          token: BLOB_TOKEN,
          contentType: file.type,
        });
        newUrls.push(url);
      }
    }

    if (newUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid photos uploaded. Ensure Blob storage is configured." },
        { status: 400 }
      );
    }

    // Append new URLs to existing array
    const existingUrls = (event.userPhotoUrls as string[]) || [];
    const updatedUrls = [...existingUrls, ...newUrls];

    const updated = await prisma.itineraryEvent.update({
      where: { id: eventId },
      data: { userPhotoUrls: updatedUrls },
    });

    return NextResponse.json({
      photoUrls: updated.userPhotoUrls,
      newUrls,
    });
  } catch (error) {
    console.error("Failed to upload photos:", error);
    return NextResponse.json({ error: "Failed to upload photos" }, { status: 500 });
  }
}

// DELETE — Remove a photo by URL
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tripId: string; eventId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    const { tripId, eventId } = await params;
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: { itinerary: { select: { id: true } } },
    });
    if (!trip?.itinerary) {
      return NextResponse.json({ error: "Trip or itinerary not found" }, { status: 404 });
    }

    const event = await prisma.itineraryEvent.findFirst({
      where: { id: eventId, itineraryId: trip.itinerary.id },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existingUrls = (event.userPhotoUrls as string[]) || [];
    const updatedUrls = existingUrls.filter((u) => u !== url);

    const updated = await prisma.itineraryEvent.update({
      where: { id: eventId },
      data: { userPhotoUrls: updatedUrls },
    });

    return NextResponse.json({ photoUrls: updated.userPhotoUrls });
  } catch (error) {
    console.error("Failed to delete photo:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
