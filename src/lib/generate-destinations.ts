import Anthropic from "@anthropic-ai/sdk";
import type { LlmUsage } from "./recommendation/types";

const anthropic = new Anthropic();

const ADMIN_GENERATION_SYSTEM_PROMPT = `You are a travel destination database curator for TripCraft, a family travel planning app.

Your job is to generate structured destination data for our curated database. Each destination needs:
- Rich metadata with numerical scores (1-10) for trip types and priority categories
- Realistic cost and logistics estimates
- Seasonal travel intelligence
- Family-friendliness assessment

SCORING GUIDELINES:
- Score 1-3: Destination is weak/irrelevant for this category
- Score 4-6: Destination has moderate appeal for this category
- Score 7-8: Destination is strong for this category
- Score 9-10: Destination is exceptional/world-class for this category (use sparingly)

Be honest and differentiated with scores. Not every beach destination is a 10 for Beach.
A cultural city might score: Beach 2, Adventure 4, Culture 9, Nature 5, City 8, Resort 3.

COST TIERS:
- "budget": Under $100/day per person (hostels, street food, budget destinations)
- "moderate": $100-250/day per person (mid-range hotels, mix of restaurants)
- "premium": $250-500/day per person (nice hotels, good restaurants, guided tours)
- "luxury": $500+/day per person (luxury resorts, fine dining, premium experiences)

FLIGHT TIMES: Estimate direct or 1-stop flight times in hours from these US airports:
NYC (JFK/EWR), LAX, SLC, ORD (Chicago), DFW (Dallas), MIA, ATL, SEA
Use null if the destination is impractical to reach from that airport (30+ hours).

BEST/AVOID MONTHS: Use 3-letter month abbreviations comma-separated: "Jan,Feb,Mar"
Consider weather, peak/off-peak seasons, festivals, and hurricane/monsoon seasons.

TAGS: Include 3-8 lowercase hyphenated tags that describe unique features.
Examples: "beach", "mountains", "historical-sites", "great-snorkeling", "wine-region",
"family-resort", "backpacker-friendly", "honeymoon", "spring-break", "safari",
"island", "tropical", "desert", "arctic", "rainforest"`;

const GENERATE_CATALOG_DESTINATIONS_TOOL: Anthropic.Tool = {
  name: "save_catalog_destinations",
  description: "Save a batch of curated destination data to the TripCraft catalog database.",
  input_schema: {
    type: "object" as const,
    properties: {
      destinations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name:        { type: "string", description: "Destination name (e.g. 'Bali')" },
            region:      { type: "string", description: "Specific region (e.g. 'Ubud & Seminyak, Indonesia')" },
            country:     { type: "string", description: "Country name" },
            continent:   { type: "string", enum: ["North America", "Central America", "South America", "Caribbean", "Europe", "Africa", "Middle East", "Asia", "Oceania"] },
            description: { type: "string", description: "2-3 sentence compelling description highlighting what makes this destination unique" },

            // Trip type scores (1-10)
            scoreBeach:     { type: "integer", minimum: 1, maximum: 10 },
            scoreAdventure: { type: "integer", minimum: 1, maximum: 10 },
            scoreCulture:   { type: "integer", minimum: 1, maximum: 10 },
            scoreNature:    { type: "integer", minimum: 1, maximum: 10 },
            scoreCity:      { type: "integer", minimum: 1, maximum: 10 },
            scoreResort:    { type: "integer", minimum: 1, maximum: 10 },
            scoreThemePark: { type: "integer", minimum: 1, maximum: 10 },
            scoreCruise:    { type: "integer", minimum: 1, maximum: 10 },

            // Priority scores (1-10)
            scoreKidFriendly: { type: "integer", minimum: 1, maximum: 10 },
            scoreRelaxation:  { type: "integer", minimum: 1, maximum: 10 },
            scoreFood:        { type: "integer", minimum: 1, maximum: 10 },
            scoreSafety:      { type: "integer", minimum: 1, maximum: 10 },
            scoreScenic:      { type: "integer", minimum: 1, maximum: 10 },
            scoreNightlife:   { type: "integer", minimum: 1, maximum: 10 },

            // Constraints
            costTier:          { type: "string", enum: ["budget", "moderate", "premium", "luxury"] },
            avgDailyCostUsd:   { type: "integer", description: "Average daily cost per person in USD" },
            bestMonths:        { type: "string", description: "Comma-separated 3-letter months (e.g. 'Nov,Dec,Jan,Feb')" },
            avoidMonths:       { type: "string", description: "Comma-separated 3-letter months to avoid, or empty string" },
            minRecommendedAge: { type: "integer", description: "Minimum recommended age, or null for all ages", nullable: true },

            // Logistics
            flightTimeNYC: { type: "number", nullable: true },
            flightTimeLAX: { type: "number", nullable: true },
            flightTimeSLC: { type: "number", nullable: true },
            flightTimeORD: { type: "number", nullable: true },
            flightTimeDFW: { type: "number", nullable: true },
            flightTimeMIA: { type: "number", nullable: true },
            flightTimeATL: { type: "number", nullable: true },
            flightTimeSEA: { type: "number", nullable: true },

            visaRequired:  { type: "boolean" },
            visaNotes:     { type: "string" },
            languageNotes: { type: "string" },
            healthNotes:   { type: "string" },

            tags: { type: "array", items: { type: "string" }, description: "3-8 descriptive tags" },
          },
          required: [
            "name", "region", "country", "continent", "description",
            "scoreBeach", "scoreAdventure", "scoreCulture", "scoreNature",
            "scoreCity", "scoreResort", "scoreThemePark", "scoreCruise",
            "scoreKidFriendly", "scoreRelaxation", "scoreFood",
            "scoreSafety", "scoreScenic", "scoreNightlife",
            "costTier", "avgDailyCostUsd", "bestMonths", "avoidMonths",
            "flightTimeNYC", "flightTimeLAX", "flightTimeSLC", "flightTimeORD",
            "flightTimeDFW", "flightTimeMIA", "flightTimeATL", "flightTimeSEA",
            "visaRequired", "visaNotes", "languageNotes", "healthNotes", "tags",
          ],
        },
      },
    },
    required: ["destinations"],
  },
};

function buildGenerationPrompt(
  prompt: string,
  count: number,
  existingNames: string[]
): string {
  let userPrompt = `Generate ${count} travel destinations for: ${prompt}\n\n`;

  if (existingNames.length > 0) {
    userPrompt += `IMPORTANT: Do NOT include any of these destinations that are already in our database:\n`;
    userPrompt += existingNames.join(", ");
    userPrompt += `\n\nSuggest destinations that are NOT on this list. Look for lesser-known alternatives and hidden gems.\n`;
  }

  userPrompt += `\nProvide diverse options across different cost tiers and appeal types. Include at least one unexpected or underrated choice.`;

  return userPrompt;
}

export interface GeneratedCatalogDestination {
  name: string;
  region: string;
  country: string;
  continent: string;
  description: string;
  scoreBeach: number;
  scoreAdventure: number;
  scoreCulture: number;
  scoreNature: number;
  scoreCity: number;
  scoreResort: number;
  scoreThemePark: number;
  scoreCruise: number;
  scoreKidFriendly: number;
  scoreRelaxation: number;
  scoreFood: number;
  scoreSafety: number;
  scoreScenic: number;
  scoreNightlife: number;
  costTier: string;
  avgDailyCostUsd: number;
  bestMonths: string;
  avoidMonths: string;
  minRecommendedAge: number | null;
  flightTimeNYC: number | null;
  flightTimeLAX: number | null;
  flightTimeSLC: number | null;
  flightTimeORD: number | null;
  flightTimeDFW: number | null;
  flightTimeMIA: number | null;
  flightTimeATL: number | null;
  flightTimeSEA: number | null;
  visaRequired: boolean;
  visaNotes: string;
  languageNotes: string;
  healthNotes: string;
  tags: string[];
}

export async function generateCatalogDestinations(
  prompt: string,
  count: number,
  existingNames: string[]
): Promise<{ destinations: GeneratedCatalogDestination[]; usage: LlmUsage }> {
  const model = "claude-sonnet-4-5-20250929";
  const response = await anthropic.messages.create({
    model,
    max_tokens: 16384,
    system: ADMIN_GENERATION_SYSTEM_PROMPT,
    tools: [GENERATE_CATALOG_DESTINATIONS_TOOL],
    tool_choice: { type: "tool", name: "save_catalog_destinations" },
    messages: [{ role: "user", content: buildGenerationPrompt(prompt, count, existingNames) }],
  });

  const toolBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("No tool response from Claude");
  }

  const result = toolBlock.input as { destinations: GeneratedCatalogDestination[] };
  return {
    destinations: result.destinations,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model,
    },
  };
}
