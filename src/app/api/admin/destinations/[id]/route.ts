import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// GET: Single destination by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const destination = await prisma.catalogDestination.findUnique({
      where: { id },
    });

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }

    return NextResponse.json(destination);
  } catch (error) {
    console.error("Admin destination get failed:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch destination";
    const status = message.includes("Not auth") ? 401 : message.includes("admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT: Update destination
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = body;

    const destination = await prisma.catalogDestination.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(destination);
  } catch (error) {
    console.error("Admin destination update failed:", error);
    const message = error instanceof Error ? error.message : "Failed to update destination";
    if (message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }
    const status = message.includes("Not auth") ? 401 : message.includes("admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE: Delete destination
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.catalogDestination.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin destination delete failed:", error);
    const message = error instanceof Error ? error.message : "Failed to delete destination";
    if (message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }
    const status = message.includes("Not auth") ? 401 : message.includes("admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
