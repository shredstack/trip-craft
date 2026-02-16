"use client";

import { DestinationCard } from "@/components/results/DestinationCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface Destination {
  id: string;
  name: string;
  region: string | null;
  description: string | null;
  matchScore: number | null;
  flightTime: string | null;
  avgCostPp: number | string | null;
  bestMonths: string | null;
  avgRating: number | string | null;
  reviewCount: number | null;
  photoUrls: string[] | null;
  isSelected: boolean;
}

interface DestinationsTabProps {
  destinations: Destination[];
  tripId: string;
}

export function DestinationsTab({ destinations, tripId }: DestinationsTabProps) {
  if (destinations.length === 0) {
    return (
      <EmptyState
        icon="🗺"
        title="No destinations yet"
        description="Generate recommendations or add destinations manually."
      />
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 24,
      }}
    >
      {destinations.map((dest) => (
        <DestinationCard key={dest.id} destination={dest} tripId={tripId} showActions={false} />
      ))}
    </div>
  );
}
