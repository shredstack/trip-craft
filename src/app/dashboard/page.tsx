"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StatusFilters } from "@/components/dashboard/StatusFilters";
import { TripCard } from "@/components/dashboard/TripCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/user";

interface Trip {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  destinations: Array<{ id: string; name: string; matchScore: number | null }>;
}

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      try {
        const res = await apiFetch("/api/trips");
        const data = await res.json();
        setTrips(data);
      } catch (err) {
        console.error("Failed to load trips:", err);
      }
      setLoading(false);
    }
    loadTrips();
  }, []);

  const filteredTrips = filter === "ALL" ? trips : trips.filter((t) => t.status === filter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 40px" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-outfit)",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-1px",
          }}
        >
          My Trips
        </h1>
        <StatusFilters active={filter} onChange={setFilter} />
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>Loading trips...</p>
      )}

      {/* Trip grid */}
      {!loading && filteredTrips.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 24,
          }}
        >
          {filteredTrips.map((trip, i) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <TripCard trip={trip} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredTrips.length === 0 && (
        <EmptyState
          icon="🌍"
          title="No trips yet"
          description="Start planning your next adventure!"
          ctaLabel="Plan a Trip"
          ctaHref="/plan"
        />
      )}
    </motion.div>
  );
}
