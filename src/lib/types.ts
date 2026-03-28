export interface TripCriteria {
  adults: number;
  children: number;
  childAges: number[];
  tripTypes: string[];
  priorities: string[];
  departCity: string;
  maxFlight: string;
  budget: string;
  travelMonth: string;
  tripDuration: string;
  extraNotes: string;
}

export interface AIDestination {
  name: string;
  region: string;
  country: string;
  description: string;
  matchScore: number;
  flightTimeHours: number;
  avgCostPerPerson: number;
  bestMonths: string;
  reasoning: string;
  excursions: AIExcursion[];
}

export interface AIExcursion {
  name: string;
  type: string;
  description: string;
  priceEstimate: string;
  duration: string;
  kidFriendly: boolean;
  minAge: number | null;
  kidNotes?: string;
}

export interface AIResponse {
  destinations: AIDestination[];
}

export interface PlaceReview {
  author: string;
  rating: number;
  text: string;
  time: number;
}

export type TripStatusType = "DREAMING" | "PLANNING" | "BOOKED" | "COMPLETED" | "ARCHIVED";

// ============================================
// Itinerary types
// ============================================

export type ItineraryEventCategoryValue =
  | "EXCURSION"
  | "MEAL"
  | "TRAVEL"
  | "CHECK_IN"
  | "CHECK_OUT"
  | "FREE_TIME"
  | "OTHER";

export interface AIItineraryEvent {
  excursionId?: string | null;
  category: ItineraryEventCategoryValue;
  name: string;
  description: string;
  tips?: string | null;
  location?: string | null;
  startTime?: string | null;  // "08:30" (24h)
  endTime?: string | null;    // "12:30" (24h)
  timeLabel?: string | null;  // "Morning", "Late Afternoon"
}

export interface AIItineraryDay {
  dayNumber: number;
  title: string;
  theme?: string | null;
  events: AIItineraryEvent[];
}

export interface AIItineraryBackupEvent extends AIItineraryEvent {
  backupCategory: string; // "Outdoor Adventures", "Indoor Activities", etc.
}

export interface AIItineraryResponse {
  overview: string;
  days: AIItineraryDay[];
  backupEvents: AIItineraryBackupEvent[];
}

export type ExcursionTypeValue =
  | "ADVENTURE"
  | "CULTURE"
  | "FOOD"
  | "NATURE"
  | "RELAXATION"
  | "NIGHTLIFE"
  | "SHOPPING"
  | "TRANSPORTATION"
  | "OTHER";

// ============================================
// Admin / Catalog Destination types
// ============================================

export interface CatalogDestinationData {
  id: string;
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
  avoidMonths: string | null;
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
  visaNotes: string | null;
  languageNotes: string | null;
  healthNotes: string | null;
  tags: string[];
  placeId: string | null;
  latitude: number | null;
  longitude: number | null;
  avgRating: number | null;
  reviewCount: number | null;
  photoUrls: string[] | null;
  status: string;
  generatedFrom: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  byStatus: Record<string, number>;
  byContinent: Record<string, number>;
  byCostTier: Record<string, number>;
  total: number;
}

// ============================================
// Recommendation Pipeline types (re-exported)
// ============================================

export type {
  FilteredCandidate,
  RankedDestination,
  PersonalizedDestination,
  PersonalizedExcursion,
  PersonalizationResponse,
  LlmUsage,
} from "./recommendation/types";
