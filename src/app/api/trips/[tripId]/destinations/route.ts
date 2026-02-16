import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();

    const destination = await prisma.destination.create({
      data: {
        tripId,
        name: body.name,
        region: body.region,
        country: body.country,
        description: body.description,
        isSelected: true,
      },
    });

    return NextResponse.json(destination);
  } catch (error) {
    console.error("Failed to add destination:", error);
    return NextResponse.json({ error: "Failed to add destination" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await params;
    const body = await request.json();
    const { destinationId, ...data } = body;

    const destination = await prisma.destination.update({
      where: { id: destinationId },
      data,
    });

    return NextResponse.json(destination);
  } catch (error) {
    console.error("Failed to update destination:", error);
    return NextResponse.json({ error: "Failed to update destination" }, { status: 500 });
  }
}
