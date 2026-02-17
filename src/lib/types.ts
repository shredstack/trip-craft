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
