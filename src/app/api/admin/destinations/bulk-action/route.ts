import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const BulkActionSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["publish", "archive", "delete"]),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { ids, action } = BulkActionSchema.parse(body);

    let count = 0;

    switch (action) {
      case "publish": {
        const result = await prisma.catalogDestination.updateMany({
          where: { id: { in: ids } },
          data: { status: "published" },
        });
        count = result.count;
        break;
      }
      case "archive": {
        const result = await prisma.catalogDestination.updateMany({
          where: { id: { in: ids } },
          data: { status: "archived" },
        });
        count = result.count;
        break;
      }
      case "delete": {
        const result = await prisma.catalogDestination.deleteMany({
          where: { id: { in: ids } },
        });
        count = result.count;
        break;
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Admin bulk action failed:", error);
    const message = error instanceof Error ? error.message : "Bulk action failed";
    const status = message.includes("Not auth") ? 401 : message.includes("admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
