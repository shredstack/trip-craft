import type { CatalogDestination } from "@prisma/client";

// ==========================================
// Shared LLM usage tracking
// ==========================================

export interface LlmUsage {
  inputTokens: number;
  outputTokens: number;
  model: string;
}

// ==========================================
// Step 1 output: Filtered catalog candidates
// ==========================================

export interface FilteredCandidate {
  catalog: CatalogDestination;
  flightTimeHours: number | null;
  hubAirportCode: string;
  tripTypeScore: number;
  priorityScore: number;
  combinedScore: number;
}

// ==========================================
// Step 2 output: AI-ranked destinations
// ==========================================

export interface RankedDestination {
  catalogId: string;
  matchScore: number;
  rankingReason: string;
  isWildcard: boolean;
  strengths: string[];
  tradeoffs: string[];
}

// ==========================================
// Step 3 output: Personalized destinations
// ==========================================

export interface PersonalizedExcursion {
  name: string;
  type: string;
  description: string;
  priceEstimate: string;
  duration: string;
  kidFriendly: boolean;
  minAge: number | null;
  kidNotes?: string;
}

export interface PersonalizedDestination {
  catalogId: string;
  name: string;
  region: string;
  country: string;
  description: string;
  matchScore: number;
  flightTimeHours: number;
  avgCostPerPerson: number;
  bestMonths: string;
  reasoning: string;
  excursions: PersonalizedExcursion[];
}

export interface PersonalizationResponse {
  destinations: PersonalizedDestination[];
}
