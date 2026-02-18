import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import type { TripCriteria } from "@/lib/types";
import type {
  FilteredCandidate,
  RankedDestination,
  PersonalizationResponse,
  LlmUsage,
} from "./types";
import {
  AI_EXCURSION_TYPE_ENUM,
  buildTripTypesContext,
  buildPrioritiesContext,
} from "@/lib/constants";

const anthropic = new Anthropic();

const PERSONALIZATION_SYSTEM_PROMPT = `You are TripCraft, an expert family travel planner creating personalized trip recommendations.

You are in the FINAL stage of recommendation. The destinations you're working with have already been:
1. Filtered to match the family's hard constraints (budget, flight time, season)
2. Ranked by an AI evaluator for experiential fit

Your job is to create the FINAL personalized output that the family will see. This means:

PERSONALIZATION:
- Weave the family's extra notes into your descriptions and reasoning
- If they mentioned specific interests ("my kids love marine life"), highlight relevant aspects of each destination
- If they mentioned concerns ("worried about food allergies"), address these directly
- If they mentioned must-sees or must-avoids, factor these into your recommendations

PAST TRIP AWARENESS:
- If the family has traveled to certain destinations before, DO NOT recommend the same places
- Use past trips to infer preferences: if they've been to 3 beach destinations, they probably love beaches — but might also want variety
- Reference past trips in your reasoning when relevant

DESCRIPTIONS:
- Write descriptions that feel personal, not generic. Reference their kids' ages, their stated interests, their concerns
- 2-3 sentences, compelling and specific

MATCH SCORES:
- You may adjust match scores from the ranking step based on the extra notes
- If extraNotes reveal a strong positive signal for a destination, boost its score
- If extraNotes reveal a negative signal, lower its score
- Scores should still be in the 75-98 range and genuinely differentiated

EXCURSIONS:
- Generate 4-6 excursions per destination
- Tailor to the specific family: kid ages, interests from extraNotes, budget tier
- Include a mix of types (adventure, culture, food, nature, relaxation)
- Be honest about kid-friendliness and age appropriateness
- Include specific tips for families with young children when relevant
- Price estimates should reflect the destination's cost tier

Return your final 3-5 destinations with full details.`;

const PERSONALIZATION_TOOL: Anthropic.Tool = {
  name: "finalize_recommendations",
  description:
    "Return the final personalized destination recommendations with excursions.",
  input_schema: {
    type: "object" as const,
    properties: {
      destinations: {
        type: "array",
        description:
          "Final 3-5 destinations ranked by match score, highest first",
        items: {
          type: "object",
          properties: {
            catalogId: {
              type: "string",
              description:
                "The CatalogDestination id (for linking catalog data)",
            },
            name: { type: "string", description: "Destination name" },
            region: { type: "string", description: "Specific region" },
            country: { type: "string", description: "Country name" },
            description: {
              type: "string",
              description:
                "2-3 sentence personalized description tailored to THIS family's notes and interests",
            },
            matchScore: {
              type: "number",
              description:
                "Final match score (75-98), adjusted for extraNotes",
            },
            flightTimeHours: {
              type: "number",
              description:
                "Flight time from their departure city (use the data provided)",
            },
            avgCostPerPerson: {
              type: "number",
              description:
                "Average total trip cost per person in USD for their trip duration",
            },
            bestMonths: {
              type: "string",
              description: "Best months to visit",
            },
            reasoning: {
              type: "string",
              description:
                "Detailed explanation referencing their specific criteria AND extra notes. 3-5 sentences.",
            },
            excursions: {
              type: "array",
              description: "4-6 tailored excursions",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: {
                    type: "string",
                    enum: AI_EXCURSION_TYPE_ENUM,
                    description: "Excursion type",
                  },
                  description: {
                    type: "string",
                    description:
                      "2-3 sentences with family-specific details",
                  },
                  priceEstimate: {
                    type: "string",
                    description: "e.g., '$50/person' or '$200/family'",
                  },
                  duration: {
                    type: "string",
                    description: "e.g., 'Half day' or '2-3 hours'",
                  },
                  kidFriendly: { type: "boolean" },
                  minAge: {
                    type: "number",
                    nullable: true,
                  },
                  kidNotes: {
                    type: "string",
                    description:
                      "Tips for families, stroller access, etc.",
                  },
                },
                required: [
                  "name",
                  "type",
                  "description",
                  "priceEstimate",
                  "duration",
                  "kidFriendly",
                  "minAge",
                ],
              },
            },
          },
          required: [
            "catalogId",
            "name",
            "region",
            "country",
            "description",
            "matchScore",
            "flightTimeHours",
            "avgCostPerPerson",
            "bestMonths",
            "reasoning",
            "excursions",
          ],
        },
      },
    },
    required: ["destinations"],
  },
};

async function buildPersonalizationPrompt(
  criteria: TripCriteria,
  rankedDestinations: RankedDestination[],
  candidates: FilteredCandidate[],
  userId: string
): Promise<string> {
  // Fetch past trip destinations for this user
  const pastTrips = await prisma.trip.findMany({
    where: {
      userId,
      status: { in: ["COMPLETED", "BOOKED", "PLANNING"] },
    },
    include: {
      destinations: {
        select: { name: true, country: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const pastDestinations = pastTrips
    .flatMap((t) => t.destinations.map((d) => `${d.name}, ${d.country}`))
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe

  // Get top picks and enrich with catalog data
  const topPicks = rankedDestinations.slice(0, 6);
  const topCandidates = topPicks.map((ranked) => {
    const catalog = candidates.find((c) => c.catalog.id === ranked.catalogId);
    return { ranked, catalog: catalog?.catalog };
  });

  const childAgesStr =
    criteria.childAges.length > 0 ? criteria.childAges.join(", ") : "none";

  let prompt = `## Family Profile
- ${criteria.adults} adults, ${criteria.children} children (ages: ${childAgesStr})
- Trip types: ${criteria.tripTypes.length > 0 ? buildTripTypesContext(criteria.tripTypes) : "None specified"}
- Priorities: ${criteria.priorities.length > 0 ? buildPrioritiesContext(criteria.priorities) : "None specified"}
- Travel window: ${criteria.travelMonth}
- Trip duration: ${criteria.tripDuration}
- Budget: ${criteria.budget}
- Departing from: ${criteria.departCity}

## Family's Personal Notes
${criteria.extraNotes || "No additional notes provided."}

`;

  if (pastDestinations.length > 0) {
    prompt += `## Past Trips (do NOT recommend these again)
${pastDestinations.join("\n")}

`;
  }

  prompt += `## Top Destination Picks (pre-ranked, already filtered for constraints)

`;

  for (const { ranked, catalog } of topCandidates) {
    const cat = catalog;
    if (!cat) continue;

    const flightTime =
      candidates.find((c) => c.catalog.id === ranked.catalogId)
        ?.flightTimeHours ?? "unknown";

    prompt += `### ${cat.name} (${cat.region}, ${cat.country})
Catalog ID: ${cat.id}
Preliminary match score: ${ranked.matchScore}
Ranking reason: ${ranked.rankingReason}
${ranked.isWildcard ? "WILDCARD PICK" : ""}
Strengths: ${ranked.strengths.join(", ")}
Trade-offs: ${ranked.tradeoffs.join(", ")}

Cost: ${cat.costTier} (~$${cat.avgDailyCostUsd}/day/person)
Flight: ~${flightTime}h
Best months: ${cat.bestMonths}
${cat.visaRequired ? `Visa: ${cat.visaNotes}` : "No visa required"}
${cat.languageNotes ? `Language: ${cat.languageNotes}` : ""}
${cat.healthNotes ? `Health: ${cat.healthNotes}` : ""}
Tags: ${Array.isArray(cat.tags) ? (cat.tags as string[]).join(", ") : ""}

`;
  }

  prompt += `Create the final personalized recommendations. Select your best 3-5 from the candidates above. Generate tailored excursions for each.`;

  return prompt;
}

export async function personalizeDestinations(
  criteria: TripCriteria,
  rankedDestinations: RankedDestination[],
  candidates: FilteredCandidate[],
  userId: string
): Promise<{ result: PersonalizationResponse; usage: LlmUsage }> {
  const userPrompt = await buildPersonalizationPrompt(
    criteria,
    rankedDestinations,
    candidates,
    userId
  );

  const model = "claude-sonnet-4-5-20250929";
  const response = await anthropic.messages.create({
    model,
    max_tokens: 16384,
    system: PERSONALIZATION_SYSTEM_PROMPT,
    tools: [PERSONALIZATION_TOOL],
    tool_choice: { type: "tool", name: "finalize_recommendations" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("No personalization response from Claude");
  }

  return {
    result: toolBlock.input as PersonalizationResponse,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model,
    },
  };
}
