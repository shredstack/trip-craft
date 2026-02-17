"use client";

import { useRouter } from "next/navigation";
import { Trash2, Eye } from "lucide-react";
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
  onDelete?: (destinationId: string) => void;
}

export function DestinationsTab({ destinations, tripId, onDelete }: DestinationsTabProps) {
  const router = useRouter();

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
        <div key={dest.id} style={{ position: "relative" }}>
          <DestinationCard destination={dest} tripId={tripId} showActions={false} />

          {/* Action buttons overlay */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              display: "flex",
              gap: 8,
            }}
          >
            <button
              onClick={() => router.push(`/trip/${tripId}/destination/${dest.id}`)}
              title="View details"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "rgba(15,23,42,0.7)",
                backdropFilter: "blur(8px)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Eye size={16} />
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Delete "${dest.name}" and all its excursions?`)) {
                    onDelete(dest.id);
                  }
                }}
                title="Delete destination"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(15,23,42,0.7)",
                  backdropFilter: "blur(8px)",
                  color: "var(--coral)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
