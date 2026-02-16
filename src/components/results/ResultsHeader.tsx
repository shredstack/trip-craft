import type { TripCriteria } from "@/lib/types";

interface ResultsHeaderProps {
  criteria: TripCriteria | null;
}

export function ResultsHeader({ criteria }: ResultsHeaderProps) {
  const tags: string[] = [];
  if (criteria) {
    if (criteria.adults || criteria.children) {
      tags.push(`${criteria.adults} adults, ${criteria.children} kids`);
    }
    criteria.tripTypes.forEach((t) => tags.push(t));
    if (criteria.maxFlight) tags.push(`Max ${criteria.maxFlight}`);
    if (criteria.budget) tags.push(criteria.budget);
    if (criteria.departCity) tags.push(`From ${criteria.departCity}`);
  }

  return (
    <div style={{ marginBottom: 40, textAlign: "center" }}>
      <h1
        style={{
          fontFamily: "var(--font-outfit)",
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: "-1.5px",
          marginBottom: 12,
        }}
      >
        Your Top Destinations
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 24 }}>
        AI-curated matches based on your criteria, validated with real traveler data
      </p>

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "6px 16px",
                borderRadius: 100,
                background: "rgba(14,165,233,0.1)",
                border: "1px solid rgba(14,165,233,0.2)",
                color: "var(--ocean-light)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
