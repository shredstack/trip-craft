import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateDestinations } from "@/lib/inngest/generate-destinations";
import { generateCatalog } from "@/lib/inngest/generate-catalog";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateDestinations, generateCatalog],
});
