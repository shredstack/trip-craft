"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/user";
import { AccommodationCard } from "./AccommodationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PlaceReview } from "@/lib/types";

interface Accommodation {
  id: string;
  name: string;
  avgRating: number | string | null;
  reviewCount: number | null;
  priceLevel: number | null;
  photoUrls: string[] | null;
  formattedAddress: string | null;
  websiteUrl: string | null;
  reviews: PlaceReview[] | null;
}

interface DestinationInfo {
  id: string;
  name: string;
  country: string | null;
}

interface AccommodationsTabProps {
  destinations: DestinationInfo[];
  tripId: string;
}

interface DestinationAccommodations {
  loading: boolean;
  accommodations: Accommodation[];
  error: string | null;
}

function buildInitialState(destinations: DestinationInfo[]): Record<string, DestinationAccommodations> {
  const initial: Record<string, DestinationAccommodations> = {};
  destinations.forEach((d) => {
    initial[d.id] = { loading: true, accommodations: [], error: null };
  });
  return initial;
}

export function AccommodationsTab({ destinations, tripId }: AccommodationsTabProps) {
  const [data, setData] = useState<Record<string, DestinationAccommodations>>(
    () => buildInitialState(destinations)
  );

  useEffect(() => {
    // Fetch accommodations for each destination
    destinations.forEach(async (dest) => {
      try {
        const res = await apiFetch(
          `/api/trips/${tripId}/accommodations?destinationId=${dest.id}`
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load accommodations");
        }
        setData((prev) => ({
          ...prev,
          [dest.id]: {
            loading: false,
            accommodations: json.accommodations ?? [],
            error: null,
          },
        }));
      } catch {
        setData((prev) => ({
          ...prev,
          [dest.id]: {
            loading: false,
            accommodations: [],
            error: "Failed to load accommodations",
          },
        }));
      }
    });
  }, [destinations, tripId]);

  if (destinations.length === 0) {
    return (
      <EmptyState
        icon="🏨"
        title="No destinations yet"
        description="Add destinations to your trip to discover accommodation options."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {destinations.map((dest) => {
        const state = data[dest.id];
        return (
          <div key={dest.id}>
            <h3
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {dest.name}
              {state?.loading && (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontWeight: 400,
                    fontFamily: "var(--font-sora)",
                  }}
                >
                  Loading...
                </span>
              )}
            </h3>

            {state?.error && (
              <p style={{ fontSize: 13, color: "var(--coral)" }}>{state.error}</p>
            )}

            {!state?.loading && state?.accommodations.length === 0 && !state?.error && (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                No accommodations found for this destination.
              </p>
            )}

            {state?.accommodations.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 20,
                }}
              >
                {state.accommodations.map((acc) => (
                  <AccommodationCard key={acc.id} accommodation={acc} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
