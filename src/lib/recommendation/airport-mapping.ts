export interface HubAirport {
  code: string;
  label: string;
  field: string; // Prisma field name, e.g., "flightTimeNYC"
  lat: number;
  lng: number;
}

export const HUB_AIRPORT_DATA: HubAirport[] = [
  { code: "NYC", label: "New York (JFK/EWR)", field: "flightTimeNYC", lat: 40.6413, lng: -73.7781 },
  { code: "LAX", label: "Los Angeles", field: "flightTimeLAX", lat: 33.9425, lng: -118.4081 },
  { code: "SLC", label: "Salt Lake City", field: "flightTimeSLC", lat: 40.7899, lng: -111.9791 },
  { code: "ORD", label: "Chicago (O'Hare)", field: "flightTimeORD", lat: 41.9742, lng: -87.9073 },
  { code: "DFW", label: "Dallas/Fort Worth", field: "flightTimeDFW", lat: 32.8998, lng: -97.0403 },
  { code: "MIA", label: "Miami", field: "flightTimeMIA", lat: 25.7959, lng: -80.287 },
  { code: "ATL", label: "Atlanta", field: "flightTimeATL", lat: 33.6407, lng: -84.4277 },
  { code: "SEA", label: "Seattle", field: "flightTimeSEA", lat: 47.4502, lng: -122.3088 },
];

// City name patterns → hub airport code
// Order matters: more specific patterns should come first
const CITY_TO_HUB: Record<string, string> = {
  // Direct matches for hub cities
  "salt lake": "SLC",
  "provo": "SLC",
  "ogden": "SLC",
  "park city": "SLC",
  "logan, ut": "SLC",
  "boise": "SLC",
  "idaho falls": "SLC",
  "jackson": "SLC",
  "pocatello": "SLC",

  "new york": "NYC",
  "manhattan": "NYC",
  "brooklyn": "NYC",
  "queens": "NYC",
  "bronx": "NYC",
  "staten island": "NYC",
  "newark": "NYC",
  "jersey city": "NYC",
  "hoboken": "NYC",
  "long island": "NYC",
  "westchester": "NYC",
  "stamford": "NYC",
  "hartford": "NYC",
  "new haven": "NYC",
  "providence": "NYC",
  "boston": "NYC",
  "philadelphia": "NYC",
  "trenton": "NYC",
  "albany": "NYC",
  "syracuse": "NYC",
  "buffalo": "NYC",
  "rochester, ny": "NYC",
  "pittsburgh": "NYC",

  "los angeles": "LAX",
  "burbank": "LAX",
  "long beach, ca": "LAX",
  "santa monica": "LAX",
  "pasadena": "LAX",
  "san diego": "LAX",
  "palm springs": "LAX",
  "san jose": "LAX",
  "san francisco": "LAX",
  "oakland": "LAX",
  "sacramento": "LAX",
  "fresno": "LAX",
  "bakersfield": "LAX",
  "las vegas": "LAX",
  "phoenix": "LAX",
  "tucson": "LAX",
  "reno": "LAX",
  "honolulu": "LAX",

  "chicago": "ORD",
  "evanston": "ORD",
  "milwaukee": "ORD",
  "madison, wi": "ORD",
  "indianapolis": "ORD",
  "detroit": "ORD",
  "grand rapids": "ORD",
  "columbus, oh": "ORD",
  "cleveland": "ORD",
  "cincinnati": "ORD",
  "dayton": "ORD",
  "des moines": "ORD",
  "omaha": "ORD",
  "minneapolis": "ORD",
  "st. paul": "ORD",
  "st paul": "ORD",
  "kansas city": "ORD",
  "st. louis": "ORD",
  "st louis": "ORD",
  "wichita": "ORD",
  "lexington": "ORD",
  "louisville": "ORD",

  "dallas": "DFW",
  "fort worth": "DFW",
  "arlington, tx": "DFW",
  "austin": "DFW",
  "san antonio": "DFW",
  "houston": "DFW",
  "el paso": "DFW",
  "oklahoma city": "DFW",
  "tulsa": "DFW",
  "little rock": "DFW",
  "lubbock": "DFW",
  "waco": "DFW",
  "denver": "DFW",
  "colorado springs": "DFW",
  "albuquerque": "DFW",

  "miami": "MIA",
  "fort lauderdale": "MIA",
  "west palm": "MIA",
  "key west": "MIA",
  "naples, fl": "MIA",
  "san juan": "MIA",

  "atlanta": "ATL",
  "savannah": "ATL",
  "charleston": "ATL",
  "charlotte": "ATL",
  "raleigh": "ATL",
  "durham": "ATL",
  "greensboro": "ATL",
  "greenville, sc": "ATL",
  "columbia, sc": "ATL",
  "birmingham": "ATL",
  "huntsville": "ATL",
  "nashville": "ATL",
  "memphis": "ATL",
  "jacksonville": "ATL",
  "tampa": "ATL",
  "orlando": "ATL",
  "sarasota": "ATL",
  "pensacola": "ATL",
  "myrtle beach": "ATL",
  "knoxville": "ATL",
  "chattanooga": "ATL",
  "richmond": "ATL",
  "norfolk": "ATL",
  "washington": "ATL",
  "baltimore": "ATL",
  "new orleans": "ATL",

  "seattle": "SEA",
  "tacoma": "SEA",
  "bellevue, wa": "SEA",
  "portland": "SEA",
  "spokane": "SEA",
  "anchorage": "SEA",
  "eugene": "SEA",
  "bend": "SEA",
};

/**
 * Find the nearest hub airport for a departure city string.
 * The departure city comes from Google Places Autocomplete (e.g., "Salt Lake City, UT, USA").
 */
export function findNearestHub(departCity: string): HubAirport {
  const normalized = departCity.toLowerCase();

  for (const [pattern, hubCode] of Object.entries(CITY_TO_HUB)) {
    if (normalized.includes(pattern)) {
      return HUB_AIRPORT_DATA.find((h) => h.code === hubCode)!;
    }
  }

  // Default to SLC (app's primary user base)
  return HUB_AIRPORT_DATA.find((h) => h.code === "SLC")!;
}

/**
 * Parse the wizard's max flight time string to a number.
 * "5 hours" → 5, "No limit" → Infinity
 */
export function parseMaxFlightHours(maxFlight: string): number {
  if (maxFlight === "No limit") return Infinity;
  const match = maxFlight.match(/(\d+)/);
  return match ? parseInt(match[1]) : Infinity;
}
