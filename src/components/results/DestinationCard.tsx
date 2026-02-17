"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { apiFetch } from "@/lib/user";

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

interface DestinationCardProps {
  destination: Destination;
  tripId: string;
  showActions?: boolean;
}

const fallbackImages: Record<string, string> = {
  default:
    "linear-gradient(135deg, rgba(14,165,233,0.3) 0%, rgba(139,92,246,0.3) 100%)",
};

export function DestinationCard({ destination, tripId, showActions = true }: DestinationCardProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(destination.isSelected);
  const [saving, setSaving] = useState(false);

  const score = destination.matchScore ?? 0;
  const scoreColor = score >= 90 ? "rgba(16,185,129,0.9)" : "rgba(251,191,36,0.9)";
  const scoreTextColor = score >= 90 ? "white" : "#1E293B";

  const photoUrl = destination.photoUrls && destination.photoUrls.length > 0 ? destination.photoUrls[0] : null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(!saved);
    try {
      await apiFetch(`/api/trips/${tripId}/destinations`, {
        method: "PATCH",
        body: JSON.stringify({
          destinationId: destination.id,
          isSelected: !saved,
        }),
      });
    } catch {
      setSaved(saved);
    }
    setSaving(false);
  };

  const handleExplore = async () => {
    if (!saved) {
      await apiFetch(`/api/trips/${tripId}/destinations`, {
        method: "PATCH",
        body: JSON.stringify({
          destinationId: destination.id,
          isSelected: true,
        }),
      });
    }
    router.push(`/trip/${tripId}/destination/${destination.id}`);
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        transition: "all 0.3s",
        cursor: "default",
      }}
    >
      {/* Image area */}
      <div
        style={{
          height: 200,
          position: "relative",
          background: photoUrl ? `url(${photoUrl}) center/cover` : fallbackImages.default,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(transparent 40%, rgba(15,23,42,0.9) 100%)",
          }}
        />
        {/* Match score badge */}
        {destination.matchScore && (
          <div
            className="font-mono-stat"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              padding: "6px 14px",
              borderRadius: 100,
              background: scoreColor,
              color: scoreTextColor,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {score}% Match
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 24 }}>
        <h3
          style={{
            fontFamily: "var(--font-outfit)",
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {destination.name}
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          {destination.region}
        </p>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
          {destination.description}
        </p>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <StatItem label="Flight" value={destination.flightTime || "—"} />
          <StatItem label="Cost/pp" value={destination.avgCostPp ? `$${Number(destination.avgCostPp).toLocaleString()}` : "—"} />
          <StatItem label="Best" value={destination.bestMonths || "—"} />
        </div>

        {/* Actions */}
        {showActions && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: saved ? "var(--tropical)" : "var(--gradient-ocean)",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: "inherit",
              }}
            >
              {saved ? (
                <>
                  <Check size={16} /> Saved!
                </>
              ) : (
                "Save to Trip"
              )}
            </button>
            <button
              onClick={handleExplore}
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
            >
              Explore →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        className="font-mono-stat"
        style={{ fontSize: 16, fontWeight: 700, color: "var(--ocean-light)", marginBottom: 4 }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
