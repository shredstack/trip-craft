"use client";

import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface TripCardProps {
  trip: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    destinations: Array<{ id: string; name: string; matchScore: number | null }>;
  };
}

export function TripCard({ trip }: TripCardProps) {
  const date = new Date(trip.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/trip/${trip.id}`}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 28,
        transition: "all 0.3s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-outfit)",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          {trip.name}
        </h3>
        <StatusBadge status={trip.status} />
      </div>

      {/* Meta */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 16,
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={14} />
          {trip.destinations.length} destination{trip.destinations.length !== 1 ? "s" : ""}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={14} />
          {date}
        </span>
      </div>

      {/* Destination tags */}
      {trip.destinations.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {trip.destinations.map((dest) => (
            <span
              key={dest.id}
              style={{
                padding: "4px 12px",
                borderRadius: 100,
                background: "rgba(255,255,255,0.05)",
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              {dest.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
