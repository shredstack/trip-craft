import { prisma } from "@/lib/db";
import type { CatalogDestination } from "@prisma/client";
import type { TripCriteria } from "@/lib/types";
import type { FilteredCandidate } from "./types";
import { findNearestHub, parseMaxFlightHours, type HubAirport } from "./airport-mapping";

// Trip type value → CatalogDestination score field name
const TRIP_TYPE_TO_FIELD: Record<string, keyof CatalogDestination> = {
  Beach: "scoreBeach",
  Adventure: "scoreAdventure",
  Culture: "scoreCulture",
  Nature: "scoreNature",
  City: "scoreCity",
  Resort: "scoreResort",
  "Theme Park": "scoreThemePark",
  Cruise: "scoreCruise",
};

// Priority value → CatalogDestination score field name
// Note: "Great Food" maps to "scoreFood"
const PRIORITY_TO_FIELD: Record<string, keyof CatalogDestination> = {
  "Kid-Friendly": "scoreKidFriendly",
  Relaxation: "scoreRelaxation",
  "Great Food": "scoreFood",
  Safety: "scoreSafety",
  Scenic: "scoreScenic",
  Nightlife: "scoreNightlife",
};

// Budget string → allowed cost tiers
const BUDGET_TO_COST_TIERS: Record<string, string[]> = {
  "$ (Under $1,000)": ["budget"],
  "$$ ($1,000–$2,500)": ["budget", "moderate"],
  "$$$ ($2,500–$5,000)": ["moderate", "premium"],
  "$$$$ ($5,000+)": ["premium", "luxury"],
};

// Month name → 3-letter abbreviation (matching catalog bestMonths/avoidMonths format)
const MONTH_ABBREVS: Record<string, string> = {
  January: "Jan",
  February: "Feb",
  March: "Mar",
  April: "Apr",
  May: "May",
  June: "Jun",
  July: "Jul",
  August: "Aug",
  September: "Sep",
  October: "Oct",
  November: "Nov",
  December: "Dec",
};

export interface Step1Result {
  candidates: FilteredCandidate[];
  hubAirport: HubAirport;
  relaxations: string[];
}

export async function filterCatalogDestinations(
  criteria: TripCriteria
): Promise<Step1Result> {
  const hubAirport = findNearestHub(criteria.departCity);
  const maxFlightHours = parseMaxFlightHours(criteria.maxFlight);
  const allowedCostTiers =
    BUDGET_TO_COST_TIERS[criteria.budget] ?? ["budget", "moderate", "premium", "luxury"];
  const youngestChildAge =
    criteria.childAges.length > 0 ? Math.min(...criteria.childAges) : null;

  const relaxations: string[] = [];

  // Attempt 1: All constraints
  let candidates = await queryAndFilter(
    allowedCostTiers,
    youngestChildAge,
    hubAirport,
    maxFlightHours,
    criteria,
    false
  );

  if (candidates.length >= 8) {
    return sortAndReturn(candidates, hubAirport, relaxations);
  }

  // Relaxation 1: Expand cost tiers by one level
  const expandedCostTiers = expandCostTiers(allowedCostTiers);
  candidates = await queryAndFilter(
    expandedCostTiers,
    youngestChildAge,
    hubAirport,
    maxFlightHours,
    criteria,
    false
  );

  if (candidates.length >= 8) {
    relaxations.push("Expanded budget range to find more options");
    return sortAndReturn(candidates, hubAirport, relaxations);
  }

  // Relaxation 2: Also add 2 hours to flight time
  const expandedFlightHours =
    maxFlightHours === Infinity ? Infinity : maxFlightHours + 2;
  candidates = await queryAndFilter(
    expandedCostTiers,
    youngestChildAge,
    hubAirport,
    expandedFlightHours,
    criteria,
    false
  );

  if (candidates.length >= 8) {
    relaxations.push("Expanded budget range and flight time");
    return sortAndReturn(candidates, hubAirport, relaxations);
  }

  // Relaxation 3: Also remove season restriction
  candidates = await queryAndFilter(
    expandedCostTiers,
    youngestChildAge,
    hubAirport,
    expandedFlightHours,
    criteria,
    true
  );

  if (candidates.length >= 5) {
    relaxations.push("Expanded budget, flight time, and removed season restriction");
  }

  return sortAndReturn(candidates, hubAirport, relaxations);
}

function sortAndReturn(
  candidates: FilteredCandidate[],
  hubAirport: HubAirport,
  relaxations: string[]
): Step1Result {
  candidates.sort((a, b) => b.combinedScore - a.combinedScore);
  return { candidates, hubAirport, relaxations };
}

function expandCostTiers(tiers: string[]): string[] {
  const allTiers = ["budget", "moderate", "premium", "luxury"];
  const indices = tiers.map((t) => allTiers.indexOf(t)).filter((i) => i >= 0);
  const minIdx = Math.max(0, Math.min(...indices) - 1);
  const maxIdx = Math.min(allTiers.length - 1, Math.max(...indices) + 1);
  const expanded = new Set(tiers);
  for (let i = minIdx; i <= maxIdx; i++) {
    expanded.add(allTiers[i]);
  }
  return [...expanded];
}

async function queryAndFilter(
  costTiers: string[],
  youngestChildAge: number | null,
  hubAirport: HubAirport,
  maxFlightHours: number,
  criteria: TripCriteria,
  skipSeasonFilter: boolean
): Promise<FilteredCandidate[]> {
  // Build Prisma where clause for hard constraints
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: "published",
    costTier: { in: costTiers },
  };

  if (youngestChildAge !== null) {
    where.OR = [
      { minRecommendedAge: null },
      { minRecommendedAge: { lte: youngestChildAge } },
    ];
  }

  const allPublished = await prisma.catalogDestination.findMany({ where });

  // In-app filtering for flight time, season, and relevance
  const monthAbbrev = MONTH_ABBREVS[criteria.travelMonth]; // undefined if "Flexible"

  return allPublished
    .map((dest) => {
      const flightTimeRaw = dest[hubAirport.field as keyof CatalogDestination];
      const flightTimeHours =
        flightTimeRaw !== null && flightTimeRaw !== undefined
          ? Number(flightTimeRaw)
          : null;

      // Compute trip type relevance score (average of matching scores)
      let tripTypeScore = 0;
      if (criteria.tripTypes.length > 0) {
        for (const type of criteria.tripTypes) {
          const field = TRIP_TYPE_TO_FIELD[type];
          if (field) tripTypeScore += Number(dest[field]) || 0;
        }
        tripTypeScore = tripTypeScore / criteria.tripTypes.length;
      }

      // Compute priority relevance score
      let priorityScore = 0;
      if (criteria.priorities.length > 0) {
        for (const priority of criteria.priorities) {
          const field = PRIORITY_TO_FIELD[priority];
          if (field) priorityScore += Number(dest[field]) || 0;
        }
        priorityScore = priorityScore / criteria.priorities.length;
      }

      return {
        catalog: dest,
        flightTimeHours,
        hubAirportCode: hubAirport.code,
        tripTypeScore,
        priorityScore,
        combinedScore: tripTypeScore + priorityScore,
      } satisfies FilteredCandidate;
    })
    .filter((candidate) => {
      // Flight time filter
      if (candidate.flightTimeHours === null) return false;
      if (candidate.flightTimeHours > maxFlightHours) return false;

      // Season filter: exclude destinations in their avoid months
      if (!skipSeasonFilter && monthAbbrev) {
        const avoidMonths = candidate.catalog.avoidMonths ?? "";
        if (
          avoidMonths
            .split(",")
            .map((m) => m.trim())
            .includes(monthAbbrev)
        ) {
          return false;
        }
      }

      // Minimum relevance: at least one selected trip type scores >= 4
      if (criteria.tripTypes.length > 0) {
        const hasRelevantType = criteria.tripTypes.some((type) => {
          const field = TRIP_TYPE_TO_FIELD[type];
          return field && (Number(candidate.catalog[field]) || 0) >= 4;
        });
        if (!hasRelevantType) return false;
      }

      return true;
    });
}
