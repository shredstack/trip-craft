import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateDestinations } from "@/lib/inngest/generate-destinations";
import { generateCatalog } from "@/lib/inngest/generate-catalog";
import { NextResponse } from "next/server";

const handler = serve({
  client: inngest,
  functions: [generateDestinations, generateCatalog],
});

// Only serve Inngest on production deployments.
// Preview deployments have Deployment Protection enabled and use ephemeral
// URLs that Inngest cannot reach, causing "unattached sync" errors.
const isPreview = process.env.VERCEL_ENV === "preview";

const noOp = () => NextResponse.json({ message: "Inngest disabled on preview" }, { status: 404 });

export const GET = isPreview ? noOp : handler.GET;
export const POST = isPreview ? noOp : handler.POST;
export const PUT = isPreview ? noOp : handler.PUT;
