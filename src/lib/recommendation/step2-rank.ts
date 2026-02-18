import Anthropic from "@anthropic-ai/sdk";
import type { TripCriteria } from "@/lib/types";
import type { FilteredCandidate, RankedDestination, LlmUsage } from "./types";
import { buildTripTypesContext, buildPrioritiesContext } from "@/lib/constants";

const anthropic = new Anthropic();

const RANKING_SYSTEM_PROMPT = `You are TripCraft's destination ranking engine. Your job is to evaluate a set of pre-filtered travel destinations and rank them by how well they match a specific family's travel preferences.

You will receive:
1. A family profile (who's traveling, what they want)
2. A list of candidate destinations with metadata and scores

YOUR JOB: Rank the candidates by experiential fit. Consider:

TRIP TYPE ALIGNMENT:
- Match the family's selected trip types against each destination's type scores
- A destination doesn't need to score 10 in every selected type — look for the best overall balance
- If they selected multiple trip types (e.g., Beach + Culture), destinations strong in BOTH should rank higher than those strong in only one

PRIORITY WEIGHTING:
- Priorities are more important than trip types — they represent what the family cares about MOST
- "Kid-Friendly" with young children (under 5) is a critical filter — destinations that score high on adventure but low on kid-friendliness should be penalized heavily for families with toddlers
- "Safety" priority should significantly boost destinations in stable, tourist-friendly regions

FAMILY COMPOSITION INTELLIGENCE:
- Toddlers (0-3): Need destinations with easy logistics, mild climate, good medical access, stroller-friendly infrastructure
- Young kids (4-7): Theme parks, beaches, and nature destinations shine; long travel days are harder
- Tweens (8-12): Can handle more adventure and cultural destinations; start to have opinions
- Teens (13-17): Cities, adventure, and nightlife-adjacent destinations become viable
- Adults-only: Full range opens up; prioritize based purely on trip types and priorities
- Multi-generational: Large adult groups with mixed-age children suggest different needs than a couple with one child

SEASONALITY JUDGMENT:
- Even though Step 1 filtered out "avoid months," use your knowledge to assess whether the travel month is IDEAL vs. merely acceptable
- Shoulder season can be a positive (fewer crowds, lower prices) — mention this in reasoning

VARIETY & SURPRISE:
- Include at least one "wildcard" — a destination that might not score highest on paper but offers something unexpected or underrated for this family's profile
- Ensure geographic diversity in the top picks when possible (don't return 4 Caribbean beaches)

SCORING GUIDELINES:
- Match scores should range from 70-98
- Be genuinely differentiated — if the top pick is 94, the 8th pick might be 78
- A score above 90 means "this is an exceptional fit for this specific family"
- A score of 75-80 means "this works well but has trade-offs"
- Never give everything 90+ — that means you're not differentiating

Return your top 8-12 picks, ranked highest to lowest.`;

const RANKING_TOOL: Anthropic.Tool = {
  name: "rank_destinations",
  description:
    "Return the ranked list of best-fit destinations for this family.",
  input_schema: {
    type: "object" as const,
    properties: {
      rankedDestinations: {
        type: "array",
        description:
          "Destinations ranked by match quality, best first. Return 8-12 results.",
        items: {
          type: "object",
          properties: {
            catalogId: {
              type: "string",
              description: "The id of the CatalogDestination being ranked",
            },
            matchScore: {
              type: "integer",
              minimum: 70,
              maximum: 98,
              description:
                "How well this destination fits the family (70-98)",
            },
            rankingReason: {
              type: "string",
              description:
                "2-3 sentences explaining why this destination ranks here for THIS family. Reference specific criteria.",
            },
            isWildcard: {
              type: "boolean",
              description:
                "True if this is an unexpected/underrated pick that the family might not have considered",
            },
            strengths: {
              type: "array",
              items: { type: "string" },
              description:
                "2-4 key strengths for this family (e.g., 'Perfect for toddlers', 'World-class food scene')",
            },
            tradeoffs: {
              type: "array",
              items: { type: "string" },
              description:
                "1-2 honest trade-offs (e.g., 'Long flight time', 'Limited nightlife')",
            },
          },
          required: [
            "catalogId",
            "matchScore",
            "rankingReason",
            "isWildcard",
            "strengths",
            "tradeoffs",
          ],
        },
      },
    },
    required: ["rankedDestinations"],
  },
};

function buildRankingPrompt(
  criteria: TripCriteria,
  candidates: FilteredCandidate[]
): string {
  const childAgesStr =
    criteria.childAges.length > 0 ? criteria.childAges.join(", ") : "none";

  let prompt = `## Family Profile
- ${criteria.adults} adults, ${criteria.children} children (ages: ${childAgesStr})
- Trip types: ${criteria.tripTypes.length > 0 ? buildTripTypesContext(criteria.tripTypes) : "None specified"}
- Priorities: ${criteria.priorities.length > 0 ? buildPrioritiesContext(criteria.priorities) : "None specified"}
- Travel window: ${criteria.travelMonth}
- Trip duration: ${criteria.tripDuration}
- Departing from: ${criteria.departCity}
- Max flight time: ${criteria.maxFlight}
- Budget: ${criteria.budget}

## Candidate Destinations (${candidates.length} options)

`;

  for (const c of candidates) {
    const cat = c.catalog;
    const tags = Array.isArray(cat.tags)
      ? (cat.tags as string[]).join(", ")
      : "";

    prompt += `### ${cat.name} (${cat.region}, ${cat.country})
ID: ${cat.id}
${cat.description}

Trip Type Scores: Beach=${cat.scoreBeach}, Adventure=${cat.scoreAdventure}, Culture=${cat.scoreCulture}, Nature=${cat.scoreNature}, City=${cat.scoreCity}, Resort=${cat.scoreResort}, ThemePark=${cat.scoreThemePark}, Cruise=${cat.scoreCruise}
Priority Scores: KidFriendly=${cat.scoreKidFriendly}, Relaxation=${cat.scoreRelaxation}, Food=${cat.scoreFood}, Safety=${cat.scoreSafety}, Scenic=${cat.scoreScenic}, Nightlife=${cat.scoreNightlife}
Cost: ${cat.costTier} (~$${cat.avgDailyCostUsd}/day/person)
Flight: ~${c.flightTimeHours}h from ${c.hubAirportCode}
Best months: ${cat.bestMonths}${cat.avoidMonths ? ` | Avoid: ${cat.avoidMonths}` : ""}
${cat.minRecommendedAge ? `Min recommended age: ${cat.minRecommendedAge}` : "Suitable for all ages"}
${cat.visaRequired ? `Visa: ${cat.visaNotes}` : "No visa required"}
${cat.languageNotes ? `Language: ${cat.languageNotes}` : ""}
${cat.healthNotes ? `Health: ${cat.healthNotes}` : ""}
${tags ? `Tags: ${tags}` : ""}
${cat.avgRating ? `Google rating: ${Number(cat.avgRating)} (${cat.reviewCount} reviews)` : ""}

`;
  }

  prompt += `Rank these destinations from best to worst fit for this family. Return your top 8-12 picks.`;

  return prompt;
}

export async function rankCandidates(
  criteria: TripCriteria,
  candidates: FilteredCandidate[]
): Promise<{ ranked: RankedDestination[]; usage: LlmUsage }> {
  const model = "claude-sonnet-4-5-20250929";
  const response = await anthropic.messages.create({
    model,
    max_tokens: 8192,
    system: RANKING_SYSTEM_PROMPT,
    tools: [RANKING_TOOL],
    tool_choice: { type: "tool", name: "rank_destinations" },
    messages: [
      { role: "user", content: buildRankingPrompt(criteria, candidates) },
    ],
  });

  const toolBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("No ranking response from Claude");
  }

  const result = toolBlock.input as {
    rankedDestinations: RankedDestination[];
  };
  return {
    ranked: result.rankedDestinations,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model,
    },
  };
}
