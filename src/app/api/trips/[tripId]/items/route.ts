import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();

    const item = await prisma.tripItem.create({
      data: {
        tripId,
        type: body.type || "OTHER",
        name: body.name,
        description: body.description,
        provider: body.provider,
        metadata: body.metadata,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to add item:", error);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
