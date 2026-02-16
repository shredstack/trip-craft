"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LoadingScreen } from "@/components/results/LoadingScreen";
import { ResultsHeader } from "@/components/results/ResultsHeader";
import { DestinationCard } from "@/components/results/DestinationCard";
import { apiFetch } from "@/lib/user";
import type { TripCriteria } from "@/lib/types";

interface TripData {
  id: string;
  criteria: TripCriteria | null;
  destinations: Array<{
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
  }>;
}

export default function ResultsPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollForResults = async () => {
      try {
        const res = await apiFetch(`/api/trips/${tripId}`);
        const data = await res.json();

        if (data.destinations && data.destinations.length > 0) {
          setTrip(data);
          setLoading(false);
          clearInterval(interval);
        }
      } catch {
        setError("Failed to load results. Please try again.");
        setLoading(false);
      }
    };

    // Poll every 2 seconds until destinations are available
    pollForResults();
    interval = setInterval(pollForResults, 2000);

    return () => clearInterval(interval);
  }, [tripId]);

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 40px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Something went wrong
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>{error}</p>
        <Link
          href="/plan"
          style={{
            padding: "12px 28px",
            borderRadius: 14,
            background: "var(--gradient-sunset)",
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 40px" }}
    >
      <ResultsHeader criteria={trip?.criteria ?? null} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 24,
          marginBottom: 40,
        }}
      >
        {trip?.destinations.map((dest, i) => (
          <motion.div
            key={dest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <DestinationCard destination={dest} tripId={tripId} />
          </motion.div>
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <Link
          href="/dashboard"
          style={{
            padding: "14px 32px",
            borderRadius: 14,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          View My Trips →
        </Link>
      </div>
    </motion.div>
  );
}
