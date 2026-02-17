import Anthropic from "@anthropic-ai/sdk";
import type { TripCriteria, AIResponse } from "./types";
import { AI_EXCURSION_TYPE_ENUM, buildTripTypesContext, buildPrioritiesContext } from "./constants";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are TripCraft, an expert travel planner AI. You help families find the perfect vacation destinations.

Rules:
- Recommend 3-4 destinations, ranked by match score (highest first)
- Match scores should be realistic (75-98 range), not all 95+
- Flight times must be realistic from the departure city
- Cost estimates should reflect the budget tier they selected
- Include 4-6 excursions per destination, mix of types
- Be honest about kid-friendliness — not everything is great for toddlers
- Include at least one "wildcard" destination they might not have considered
- Consider seasonality and weather for their travel window
- Factor in practical logistics (passport requirements, language barriers, health considerations)`;

const DESTINATION_TOOL: Anthropic.Tool = {
  name: "recommend_destinations",
  description:
    "Recommend travel destinations based on the family's criteria. Call this tool with the full list of destination recommendations.",
  input_schema: {
    type: "object" as const,
    properties: {
      destinations: {
        type: "array",
        description: "List of recommended destinations, ranked by match score (highest first)",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Destination name" },
            region: { type: "string", description: "Specific region, e.g. 'Riviera Maya, Mexico'" },
            country: { type: "string", description: "Country name" },
            description: {
              type: "string",
              description:
                "2-3 sentence compelling description tailored to this family's specific needs. Mention why it's great for their kids' ages.",
            },
            matchScore: {
              type: "number",
              description: "How well this destination matches the criteria (75-98 range)",
            },
            flightTimeHours: {
              type: "number",
              description: "Estimated flight time in hours from the departure city",
            },
            avgCostPerPerson: {
              type: "number",
              description: "Average cost per person in USD",
            },
            bestMonths: {
              type: "string",
              description: "Best months to visit, e.g. 'Mar-Apr'",
            },
            reasoning: {
              type: "string",
              description:
                "Detailed explanation of why this destination matches their criteria. Reference specific criteria they provided.",
            },
            excursions: {
              type: "array",
              description: "4-6 recommended excursions, mix of types",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Excursion name" },
                  type: {
                    type: "string",
                    enum: AI_EXCURSION_TYPE_ENUM,
                    description: "Type of excursion",
                  },
                  description: {
                    type: "string",
                    description:
                      "2-3 sentences. Include specific details about the experience, and note any age-specific considerations.",
                  },
                  priceEstimate: { type: "string", description: "Price estimate, e.g. '$100/person'" },
                  duration: { type: "string", description: "Duration, e.g. 'Full day' or '2-3 hours'" },
                  kidFriendly: { type: "boolean", description: "Whether this is suitable for children" },
                  minAge: {
                    type: "number",
                    nullable: true,
                    description: "Minimum recommended age, or null if suitable for all ages",
                  },
                  kidNotes: {
                    type: "string",
                    description: "Specific tips for families with young children",
                  },
                },
                required: ["name", "type", "description", "priceEstimate", "duration", "kidFriendly", "minAge"],
              },
            },
          },
          required: [
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

function buildUserPrompt(criteria: TripCriteria): string {
  const childAgesStr = criteria.childAges.length > 0 ? criteria.childAges.join(", ") : "none";

  return `Plan a trip for:
- ${criteria.adults} adults and ${criteria.children} children (ages: ${childAgesStr})
- Departing from: ${criteria.departCity}
- Max flight time: ${criteria.maxFlight}
- Budget: ${criteria.budget} per person
- Trip types:
  - ${buildTripTypesContext(criteria.tripTypes)}
- Priorities:
  - ${buildPrioritiesContext(criteria.priorities)}
- Travel window: ${criteria.travelMonth}
- Trip duration: ${criteria.tripDuration}
- Additional notes: ${criteria.extraNotes || "None"}`;
}

export async function generateDestinations(criteria: TripCriteria): Promise<AIResponse> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16384,
    system: SYSTEM_PROMPT,
    tools: [DESTINATION_TOOL],
    tool_choice: { type: "tool", name: "recommend_destinations" },
    messages: [{ role: "user", content: buildUserPrompt(criteria) }],
  });

  const toolBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("No tool response from Claude");
  }

  return toolBlock.input as AIResponse;
}
