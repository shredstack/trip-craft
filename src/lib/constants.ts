import type { ExcursionTypeValue, ItineraryEventCategoryValue } from "./types";

// ============================================
// TRIP TYPES - What kind of trip the user wants
// ============================================

export interface TripTypeOption {
  value: string;
  label: string;
  emoji: string;
  description: string;
}

export const TRIP_TYPES: readonly TripTypeOption[] = [
  {
    value: "Beach",
    emoji: "🏖",
    label: "🏖 Beach",
    description: "Coastal destinations with sandy beaches, ocean activities, and waterfront relaxation",
  },
  {
    value: "Adventure",
    emoji: "🏔",
    label: "🏔 Adventure",
    description: "Active travel with hiking, extreme sports, exploration, and physical challenges",
  },
  {
    value: "Culture",
    emoji: "🏛",
    label: "🏛 Culture",
    description: "Historical sites, museums, local traditions, architecture, and cultural immersion",
  },
  {
    value: "Nature",
    emoji: "🌿",
    label: "🌿 Nature",
    description: "National parks, wildlife, forests, mountains, and scenic natural landscapes",
  },
  {
    value: "City",
    emoji: "🌆",
    label: "🌆 City",
    description: "Urban destinations with shopping, dining, entertainment, and metropolitan attractions",
  },
  {
    value: "Resort",
    emoji: "🏨",
    label: "🏨 Resort",
    description: "All-inclusive or resort-style stays with on-site amenities and activities",
  },
  {
    value: "Theme Park",
    emoji: "🎢",
    label: "🎢 Theme Park",
    description: "Destinations centered around theme parks and amusement attractions",
  },
  {
    value: "Cruise",
    emoji: "🚢",
    label: "🚢 Cruise",
    description: "Ocean or river cruise itineraries visiting multiple ports of call",
  },
];

// ============================================
// PRIORITIES - What matters most to the user
// ============================================

export interface PriorityOption {
  value: string;
  label: string;
  emoji: string;
  description: string;
}

export const PRIORITIES: readonly PriorityOption[] = [
  {
    value: "Kid-Friendly",
    emoji: "👶",
    label: "👶 Kid-Friendly",
    description: "Activities and destinations safe and enjoyable for young children",
  },
  {
    value: "Relaxation",
    emoji: "🧘",
    label: "🧘 Relaxation",
    description: "Spas, slow pace, minimal logistics, stress-free environments",
  },
  {
    value: "Great Food",
    emoji: "🍽",
    label: "🍽 Great Food",
    description: "Exceptional local cuisine, food tours, renowned restaurants, culinary experiences",
  },
  {
    value: "Safety",
    emoji: "🛡",
    label: "🛡 Safety",
    description: "Low crime, stable regions, good healthcare access, family-safe areas",
  },
  {
    value: "Scenic",
    emoji: "📸",
    label: "📸 Scenic",
    description: "Photogenic locations, dramatic landscapes, stunning views and vistas",
  },
  {
    value: "Nightlife",
    emoji: "🌙",
    label: "🌙 Nightlife",
    description: "Bars, clubs, live music, evening entertainment, and vibrant after-dark scenes",
  },
];

// ============================================
// EXCURSION TYPES - Categories for AI-generated activities
// Keep in sync with ExcursionType enum in prisma/schema.prisma
// and ExcursionTypeValue in src/lib/types.ts
// ============================================

export interface ExcursionTypeOption {
  value: ExcursionTypeValue;
  label: string;
  emoji: string;
  description: string;
  color: string;
  bg: string;
}

export const EXCURSION_TYPES: readonly ExcursionTypeOption[] = [
  {
    value: "ADVENTURE",
    label: "Adventure",
    emoji: "🏔",
    description: "Outdoor activities, extreme sports, and physical challenges",
    color: "var(--coral)",
    bg: "rgba(255,107,90,0.15)",
  },
  {
    value: "CULTURE",
    label: "Culture",
    emoji: "🏛",
    description: "Museums, historical sites, local traditions, and cultural experiences",
    color: "#A78BFA",
    bg: "rgba(139,92,246,0.15)",
  },
  {
    value: "FOOD",
    label: "Food",
    emoji: "🍽",
    description: "Restaurants, food tours, cooking classes, and culinary experiences",
    color: "var(--sand)",
    bg: "rgba(251,191,36,0.15)",
  },
  {
    value: "NATURE",
    label: "Nature",
    emoji: "🌿",
    description: "Parks, wildlife, hiking, and natural attractions",
    color: "#6EE7B7",
    bg: "rgba(16,185,129,0.15)",
  },
  {
    value: "RELAXATION",
    label: "Relaxation",
    emoji: "🧘",
    description: "Spas, beaches, pools, and low-key leisure activities",
    color: "var(--ocean-light)",
    bg: "rgba(14,165,233,0.15)",
  },
  {
    value: "NIGHTLIFE",
    label: "Nightlife",
    emoji: "🌙",
    description: "Bars, clubs, live music, and evening entertainment",
    color: "#A78BFA",
    bg: "rgba(139,92,246,0.15)",
  },
  {
    value: "SHOPPING",
    label: "Shopping",
    emoji: "🛍",
    description: "Markets, malls, boutiques, and local artisan shops",
    color: "var(--sand)",
    bg: "rgba(251,191,36,0.15)",
  },
  {
    value: "TRANSPORTATION",
    label: "Transportation",
    emoji: "🚌",
    description: "Scenic drives, boat rides, train journeys, and transport experiences",
    color: "var(--ocean-light)",
    bg: "rgba(14,165,233,0.15)",
  },
  {
    value: "OTHER",
    label: "Other",
    emoji: "✨",
    description: "Activities that don't fit neatly into other categories",
    color: "var(--text-muted)",
    bg: "rgba(100,116,139,0.15)",
  },
];

// ============================================
// DERIVED HELPERS
// ============================================

/** Map from excursion type value to its style config (color, bg) */
export const EXCURSION_TYPE_STYLES: Record<string, { color: string; bg: string }> =
  Object.fromEntries(
    EXCURSION_TYPES.map((t) => [t.value, { color: t.color, bg: t.bg }])
  ) as Record<string, { color: string; bg: string }>;

/** Excursion type values for the AI tool schema enum (excludes TRANSPORTATION and OTHER) */
export const AI_EXCURSION_TYPE_ENUM: string[] = EXCURSION_TYPES
  .filter((t) => t.value !== "TRANSPORTATION" && t.value !== "OTHER")
  .map((t) => t.value);

/** Build a description string for AI context about trip types */
export function buildTripTypesContext(selectedTypes: string[]): string {
  return selectedTypes
    .map((value) => {
      const opt = TRIP_TYPES.find((t) => t.value === value);
      return opt ? `${opt.value}: ${opt.description}` : value;
    })
    .join("\n  - ");
}

// ============================================
// ITINERARY EVENT CATEGORIES
// Keep in sync with ItineraryEventCategory enum in prisma/schema.prisma
// ============================================

export interface ItineraryCategoryOption {
  value: ItineraryEventCategoryValue;
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

export const ITINERARY_EVENT_CATEGORIES: readonly ItineraryCategoryOption[] = [
  {
    value: "EXCURSION",
    label: "Excursion",
    emoji: "🎯",
    color: "var(--coral)",
    bg: "rgba(255,107,90,0.15)",
  },
  {
    value: "MEAL",
    label: "Meal",
    emoji: "🍽",
    color: "var(--sand)",
    bg: "rgba(251,191,36,0.15)",
  },
  {
    value: "TRAVEL",
    label: "Travel",
    emoji: "🚗",
    color: "var(--ocean-light)",
    bg: "rgba(14,165,233,0.15)",
  },
  {
    value: "CHECK_IN",
    label: "Check In",
    emoji: "🏨",
    color: "#6EE7B7",
    bg: "rgba(16,185,129,0.15)",
  },
  {
    value: "CHECK_OUT",
    label: "Check Out",
    emoji: "🧳",
    color: "#6EE7B7",
    bg: "rgba(16,185,129,0.15)",
  },
  {
    value: "FREE_TIME",
    label: "Free Time",
    emoji: "🧘",
    color: "#A78BFA",
    bg: "rgba(139,92,246,0.15)",
  },
  {
    value: "OTHER",
    label: "Other",
    emoji: "✨",
    color: "var(--text-muted)",
    bg: "rgba(100,116,139,0.15)",
  },
];

/** Map from itinerary event category value to its style config */
export const ITINERARY_CATEGORY_STYLES: Record<string, { color: string; bg: string }> =
  Object.fromEntries(
    ITINERARY_EVENT_CATEGORIES.map((c) => [c.value, { color: c.color, bg: c.bg }])
  ) as Record<string, { color: string; bg: string }>;

/** Itinerary event category values for the AI tool schema */
export const AI_ITINERARY_CATEGORY_ENUM: string[] = ITINERARY_EVENT_CATEGORIES.map(
  (c) => c.value
);

/** Build a description string for AI context about priorities */
export function buildPrioritiesContext(selectedPriorities: string[]): string {
  return selectedPriorities
    .map((value) => {
      const opt = PRIORITIES.find((p) => p.value === value);
      return opt ? `${opt.value}: ${opt.description}` : value;
    })
    .join("\n  - ");
}
