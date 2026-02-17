export const CONTINENTS = [
  "North America",
  "Central America",
  "South America",
  "Caribbean",
  "Europe",
  "Africa",
  "Middle East",
  "Asia",
  "Oceania",
] as const;

export const COST_TIERS = [
  { value: "budget", label: "Budget (< $100/day)" },
  { value: "moderate", label: "Moderate ($100-250/day)" },
  { value: "premium", label: "Premium ($250-500/day)" },
  { value: "luxury", label: "Luxury ($500+/day)" },
] as const;

export const CATALOG_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

export const REGIONAL_PROMPTS = [
  { value: "Caribbean & Central America beach destinations", label: "Caribbean & Central America beach destinations" },
  { value: "Southeast Asia destinations", label: "Southeast Asia destinations" },
  { value: "European cities for culture & food", label: "European cities for culture & food" },
  { value: "African safari & adventure destinations", label: "African safari & adventure destinations" },
  { value: "South Pacific & Oceania", label: "South Pacific & Oceania" },
  { value: "South American highlights", label: "South American highlights" },
  { value: "Middle East & North Africa", label: "Middle East & North Africa" },
  { value: "East Asian destinations", label: "East Asian destinations" },
  { value: "North American hidden gems", label: "North American hidden gems" },
  { value: "Scandinavian & Northern Europe", label: "Scandinavian & Northern Europe" },
] as const;

export const HUB_AIRPORTS = [
  { code: "NYC", label: "New York (JFK/EWR)", field: "flightTimeNYC" as const },
  { code: "LAX", label: "Los Angeles", field: "flightTimeLAX" as const },
  { code: "SLC", label: "Salt Lake City", field: "flightTimeSLC" as const },
  { code: "ORD", label: "Chicago (O'Hare)", field: "flightTimeORD" as const },
  { code: "DFW", label: "Dallas/Fort Worth", field: "flightTimeDFW" as const },
  { code: "MIA", label: "Miami", field: "flightTimeMIA" as const },
  { code: "ATL", label: "Atlanta", field: "flightTimeATL" as const },
  { code: "SEA", label: "Seattle", field: "flightTimeSEA" as const },
] as const;

export const TRIP_TYPE_SCORES = [
  { key: "scoreBeach", label: "Beach" },
  { key: "scoreAdventure", label: "Adventure" },
  { key: "scoreCulture", label: "Culture" },
  { key: "scoreNature", label: "Nature" },
  { key: "scoreCity", label: "City" },
  { key: "scoreResort", label: "Resort" },
  { key: "scoreThemePark", label: "Theme Park" },
  { key: "scoreCruise", label: "Cruise" },
] as const;

export const PRIORITY_SCORES = [
  { key: "scoreKidFriendly", label: "Kid-Friendly" },
  { key: "scoreRelaxation", label: "Relaxation" },
  { key: "scoreFood", label: "Food" },
  { key: "scoreSafety", label: "Safety" },
  { key: "scoreScenic", label: "Scenic" },
  { key: "scoreNightlife", label: "Nightlife" },
] as const;
