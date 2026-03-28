import Anthropic from "@anthropic-ai/sdk";
import type { TripCriteria, AIItineraryResponse } from "@/lib/types";
import type { LlmUsage } from "@/lib/recommendation/types";
import { AI_ITINERARY_CATEGORY_ENUM } from "@/lib/constants";

const anthropic = new Anthropic();

const ITINERARY_SYSTEM_PROMPT = `You are TripCraft's expert itinerary planner. You create detailed, day-by-day travel schedules for families.

You will receive:
- Trip criteria (travelers, dates, budget, preferences)
- A list of destinations the family is visiting
- A list of excursions at each destination (with IDs you MUST reference)

Your job is to arrange everything into a realistic, time-slotted daily schedule.

SCHEDULING RULES:
- Create exactly the number of days specified by the trip duration or date range
- Day 1 should include arrival logistics (travel, check-in, settling in)
- The last day should include departure logistics (check-out, travel home)
- Mornings are best for active/outdoor activities (before the heat)
- Build in transition time between activities (driving, walking, changing)
- Include meals: breakfast, lunch, and dinner with specific restaurant recommendations or "at the accommodation" notes
- Include free time / pool time / downtime blocks, especially in afternoons
- For families with young children, schedule nap-friendly downtime after lunch

TIME FORMATTING:
- Use specific times when appropriate: startTime "08:30", endTime "12:30" (24h format)
- Use timeLabel for flexible blocks: "Morning", "Late Afternoon", "Evening"
- You can use both: a startTime with a timeLabel for context

EXCURSION REFERENCES:
- When scheduling an existing excursion, include its excursionId so it links to the database
- Set category to "EXCURSION" for these
- You may also create NEW activities not in the excursion list (meals, travel, free time, etc.)

BACKUP EVENTS:
- Generate 5-10 backup events grouped by category
- Categories: "Outdoor Adventures", "Indoor Activities", "Dining Alternatives", "Cultural Stops", "Kid Alternatives"
- Backups are alternatives the family can swap in if weather changes, energy levels shift, or interests change
- Include a mix of types: some outdoor, some indoor (rainy day options), some dining alternatives

OVERVIEW:
- Write a 2-3 sentence overview capturing the trip's vibe, tailored to this specific family

Be specific, personal, and practical. Reference the kids' ages, the family's stated interests, and real details about the destinations.`;

const ITINERARY_TOOL: Anthropic.Tool = {
  name: "generate_itinerary",
  description:
    "Return a complete day-by-day itinerary with time-slotted events and backup options.",
  input_schema: {
    type: "object" as const,
    properties: {
      overview: {
        type: "string",
        description:
          "2-3 sentence trip overview capturing the vibe and what makes this trip special for this family",
      },
      days: {
        type: "array",
        description: "Array of days, one per day of the trip",
        items: {
          type: "object",
          properties: {
            dayNumber: {
              type: "number",
              description: "Day number starting at 1",
            },
            title: {
              type: "string",
              description:
                "Creative day title, e.g. 'Snow Canyon & Red Rock Exploring'",
            },
            theme: {
              type: "string",
              description:
                "Optional subtitle/theme, e.g. 'Adventure morning, pool afternoon'",
            },
            events: {
              type: "array",
              description:
                "Events for this day, in chronological order",
              items: {
                type: "object",
                properties: {
                  excursionId: {
                    type: "string",
                    nullable: true,
                    description:
                      "ID of an existing excursion if this event references one, null otherwise",
                  },
                  category: {
                    type: "string",
                    enum: AI_ITINERARY_CATEGORY_ENUM,
                    description: "Event category",
                  },
                  name: { type: "string", description: "Event name" },
                  description: {
                    type: "string",
                    description:
                      "2-3 sentences describing the event with family-specific details",
                  },
                  tips: {
                    type: "string",
                    nullable: true,
                    description:
                      "Practical tips: address, reservations, what to bring, etc.",
                  },
                  location: {
                    type: "string",
                    nullable: true,
                    description: "Location name or address",
                  },
                  startTime: {
                    type: "string",
                    nullable: true,
                    description: "Start time in 24h format, e.g. '08:30'",
                  },
                  endTime: {
                    type: "string",
                    nullable: true,
                    description: "End time in 24h format, e.g. '12:30'",
                  },
                  timeLabel: {
                    type: "string",
                    nullable: true,
                    description:
                      "General time label, e.g. 'Morning', 'Late Afternoon', 'Evening'",
                  },
                },
                required: ["category", "name", "description"],
              },
            },
          },
          required: ["dayNumber", "title", "events"],
        },
      },
      backupEvents: {
        type: "array",
        description:
          "5-10 backup/alternative events grouped by category",
        items: {
          type: "object",
          properties: {
            backupCategory: {
              type: "string",
              description:
                "Category grouping, e.g. 'Outdoor Adventures', 'Indoor Activities', 'Dining Alternatives'",
            },
            category: {
              type: "string",
              enum: AI_ITINERARY_CATEGORY_ENUM,
              description: "Event category",
            },
            name: { type: "string" },
            description: { type: "string" },
            tips: { type: "string", nullable: true },
            location: { type: "string", nullable: true },
          },
          required: ["backupCategory", "category", "name", "description"],
        },
      },
    },
    required: ["overview", "days", "backupEvents"],
  },
};

interface DestinationWithExcursions {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
  description: string | null;
  excursions: Array<{
    id: string;
    name: string;
    type: string;
    description: string | null;
    priceEstimate: string | null;
    duration: string | null;
    kidFriendly: boolean;
    minAge: number | null;
    kidNotes: string | null;
  }>;
}

function buildItineraryPrompt(
  criteria: TripCriteria,
  destinations: DestinationWithExcursions[],
  startDate: string | null,
  endDate: string | null,
  tripNotes: string | null
): string {
  const childAgesStr =
    criteria.childAges.length > 0 ? criteria.childAges.join(", ") : "none";

  let prompt = `## Family Profile
- ${criteria.adults} adults, ${criteria.children} children (ages: ${childAgesStr})
- Trip types: ${criteria.tripTypes.join(", ") || "Not specified"}
- Priorities: ${criteria.priorities.join(", ") || "Not specified"}
- Budget: ${criteria.budget}
- Departing from: ${criteria.departCity}
- Trip duration: ${criteria.tripDuration}
`;

  if (startDate) prompt += `- Start date: ${startDate}\n`;
  if (endDate) prompt += `- End date: ${endDate}\n`;

  if (criteria.extraNotes) {
    prompt += `\n## Family's Personal Notes\n${criteria.extraNotes}\n`;
  }

  if (tripNotes) {
    prompt += `\n## Additional Trip Notes\n${tripNotes}\n`;
  }

  prompt += `\n## Destinations & Excursions\n\n`;

  for (const dest of destinations) {
    prompt += `### ${dest.name}${dest.region ? ` (${dest.region})` : ""}${dest.country ? `, ${dest.country}` : ""}\n`;
    if (dest.description) prompt += `${dest.description}\n`;
    prompt += `\nAvailable excursions:\n`;

    for (const exc of dest.excursions) {
      prompt += `- **${exc.name}** (ID: ${exc.id})
  Type: ${exc.type} | Duration: ${exc.duration || "Unknown"} | Price: ${exc.priceEstimate || "Unknown"}
  Kid-friendly: ${exc.kidFriendly ? "Yes" : "No"}${exc.minAge ? ` (min age ${exc.minAge})` : ""}
  ${exc.description || ""}
  ${exc.kidNotes ? `Kid tips: ${exc.kidNotes}` : ""}
`;
    }

    prompt += "\n";
  }

  prompt += `Create a detailed day-by-day itinerary using the excursions above (reference them by their IDs). Add meals, travel time, check-in/out, and free time as needed. Also provide backup options the family can swap in.`;

  return prompt;
}

export async function generateItinerary(
  criteria: TripCriteria,
  destinations: DestinationWithExcursions[],
  startDate: string | null,
  endDate: string | null,
  tripNotes: string | null
): Promise<{ result: AIItineraryResponse; usage: LlmUsage }> {
  const userPrompt = buildItineraryPrompt(
    criteria,
    destinations,
    startDate,
    endDate,
    tripNotes
  );

  const model = "claude-sonnet-4-5-20250929";
  const response = await anthropic.messages.create({
    model,
    max_tokens: 16384,
    system: ITINERARY_SYSTEM_PROMPT,
    tools: [ITINERARY_TOOL],
    tool_choice: { type: "tool", name: "generate_itinerary" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("No itinerary response from Claude");
  }

  return {
    result: toolBlock.input as AIItineraryResponse,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model,
    },
  };
}
