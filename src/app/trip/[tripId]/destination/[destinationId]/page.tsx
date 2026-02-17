"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Star, Clock, DollarSign, Calendar, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/user";
import { PhotoGallery } from "@/components/destination-detail/PhotoGallery";
import { ReviewCard } from "@/components/destination-detail/ReviewCard";
import { AIReasoningCard } from "@/components/destination-detail/AIReasoningCard";
import type { PlaceReview } from "@/lib/types";

interface Excursion {
  id: string;
  name: string;
  type: string;
  description: string | null;
  priceEstimate: string | null;
  duration: string | null;
  kidFriendly: boolean;
  minAge: number | null;
  avgRating: number | string | null;
  photoUrls: string[] | null;
}

interface DestinationDetail {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
  description: string | null;
  matchScore: number | null;
  aiReasoning: string | null;
  flightTime: string | null;
  avgCostPp: number | string | null;
  bestMonths: string | null;
  avgRating: number | string | null;
  reviewCount: number | null;
  photoUrls: string[] | null;
  reviews: PlaceReview[] | null;
  isSelected: boolean;
  excursions: Excursion[];
  accommodations: Array<{
    id: string;
    name: string;
    avgRating: number | string | null;
    reviewCount: number | null;
    priceLevel: number | null;
    photoUrls: string[] | null;
    formattedAddress: string | null;
    websiteUrl: string | null;
  }>;
}

export default function DestinationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const destinationId = params.destinationId as string;

  const [destination, setDestination] = useState<DestinationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(
          `/api/trips/${tripId}/destinations/${destinationId}`
        );
        const data = await res.json();
        setDestination(data);
        setSaved(data.isSelected);
      } catch (err) {
        console.error("Failed to load destination:", err);
      }
      setLoading(false);
    }
    load();
  }, [tripId, destinationId]);

  const handleSave = async () => {
    setSaving(true);
    const newState = !saved;
    setSaved(newState);
    try {
      await apiFetch(`/api/trips/${tripId}/destinations`, {
        method: "PATCH",
        body: JSON.stringify({
          destinationId,
          isSelected: newState,
        }),
      });
    } catch {
      setSaved(!newState);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 40px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading destination...</p>
      </div>
    );
  }

  if (!destination) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 40px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Destination not found.</p>
      </div>
    );
  }

  const photos = destination.photoUrls ?? [];
  const reviews = destination.reviews ?? [];
  const score = destination.matchScore ?? 0;
  const scoreColor = score >= 90 ? "rgba(16,185,129,0.9)" : "rgba(251,191,36,0.9)";
  const scoreTextColor = score >= 90 ? "white" : "#1E293B";
  const heroPhoto = photos[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: 900, margin: "0 auto", padding: "40px 40px 80px" }}
    >
      {/* Back nav */}
      <button
        onClick={() => router.push(`/trip/${tripId}`)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: 14,
          cursor: "pointer",
          fontFamily: "inherit",
          marginBottom: 24,
          padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        Back to Trip
      </button>

      {/* Hero */}
      <div
        style={{
          position: "relative",
          height: 360,
          borderRadius: "var(--radius)",
          overflow: "hidden",
          marginBottom: 32,
          background: heroPhoto
            ? `url(${heroPhoto}) center/cover`
            : "linear-gradient(135deg, rgba(14,165,233,0.3) 0%, rgba(139,92,246,0.3) 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(transparent 30%, rgba(15,23,42,0.95) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 32,
            right: 32,
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-outfit)",
              fontSize: 36,
              fontWeight: 800,
              marginBottom: 6,
            }}
          >
            {destination.name}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            {[destination.region, destination.country].filter(Boolean).join(", ")}
          </p>
        </div>
        {destination.matchScore != null && (
          <div
            className="font-mono-stat"
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              padding: "8px 16px",
              borderRadius: 100,
              background: scoreColor,
              color: scoreTextColor,
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {score}% Match
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        <StatCard icon={<Clock size={18} />} label="Flight Time" value={destination.flightTime || "—"} />
        <StatCard
          icon={<DollarSign size={18} />}
          label="Cost / Person"
          value={destination.avgCostPp ? `$${Number(destination.avgCostPp).toLocaleString()}` : "—"}
        />
        <StatCard icon={<Calendar size={18} />} label="Best Months" value={destination.bestMonths || "—"} />
        <StatCard
          icon={<Star size={18} />}
          label="Rating"
          value={destination.avgRating ? `${Number(destination.avgRating).toFixed(1)}` : "—"}
          suffix={destination.reviewCount ? ` (${destination.reviewCount})` : ""}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 28px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: saved ? "var(--tropical)" : "var(--gradient-ocean)",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        >
          {saved ? (
            <>
              <Check size={16} /> Saved to Trip
            </>
          ) : (
            "Save to Trip"
          )}
        </button>
        <button
          onClick={() => router.push(`/trip/${tripId}`)}
          style={{
            padding: "12px 28px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          View Full Trip
        </button>
      </div>

      {/* Description */}
      {destination.description && (
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
            {destination.description}
          </p>
        </div>
      )}

      {/* AI Reasoning */}
      {destination.aiReasoning && (
        <div style={{ marginBottom: 40 }}>
          <AIReasoningCard
            reasoning={destination.aiReasoning}
            matchScore={destination.matchScore}
          />
        </div>
      )}

      {/* Photo Gallery */}
      {photos.length > 1 && (
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="Photos" />
          <PhotoGallery photos={photos} />
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="Traveler Reviews" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {reviews.map((review, i) => (
              <ReviewCard key={i} review={review} />
            ))}
          </div>
        </div>
      )}

      {/* Excursions */}
      {destination.excursions.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="Excursions & Activities" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {destination.excursions.map((exc) => (
              <ExcursionMiniCard key={exc.id} excursion={exc} />
            ))}
          </div>
        </div>
      )}

      {/* Accommodations */}
      {destination.accommodations.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="Where to Stay" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {destination.accommodations.map((acc) => (
              <AccommodationMiniCard key={acc.id} accommodation={acc} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-outfit)",
        fontSize: 20,
        fontWeight: 700,
        marginBottom: 16,
      }}
    >
      {title}
    </h2>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ color: "var(--ocean-light)" }}>{icon}</div>
      <div>
        <div
          className="font-mono-stat"
          style={{ fontSize: 16, fontWeight: 700, color: "var(--ocean-light)" }}
        >
          {value}
          {suffix && (
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>
              {suffix}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function ExcursionMiniCard({ excursion }: { excursion: Excursion }) {
  const photo = excursion.photoUrls?.[0] ?? null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
    >
      {photo && (
        <div
          style={{
            height: 140,
            background: `url(${photo}) center/cover`,
          }}
        />
      )}
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-outfit)" }}>
            {excursion.name}
          </h4>
          <span
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 100,
              background: "rgba(14,165,233,0.12)",
              color: "var(--ocean-light)",
              fontWeight: 600,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              marginLeft: 8,
            }}
          >
            {excursion.type}
          </span>
        </div>
        {excursion.description && (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            {excursion.description}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
          {excursion.duration && <span>{excursion.duration}</span>}
          {excursion.priceEstimate && <span>{excursion.priceEstimate}</span>}
          {excursion.kidFriendly && <span style={{ color: "var(--tropical)" }}>Kid-friendly</span>}
        </div>
      </div>
    </div>
  );
}

function AccommodationMiniCard({
  accommodation,
}: {
  accommodation: {
    id: string;
    name: string;
    avgRating: number | string | null;
    reviewCount: number | null;
    priceLevel: number | null;
    photoUrls: string[] | null;
    formattedAddress: string | null;
    websiteUrl: string | null;
  };
}) {
  const photo = accommodation.photoUrls?.[0] ?? null;
  const priceDollars = accommodation.priceLevel != null
    ? "$".repeat(accommodation.priceLevel + 1)
    : null;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 140,
          background: photo
            ? `url(${photo}) center/cover`
            : "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(139,92,246,0.2))",
        }}
      />
      <div style={{ padding: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-outfit)", marginBottom: 6 }}>
          {accommodation.name}
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          {accommodation.avgRating && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12 }}>
              <Star size={12} fill="var(--sunset)" stroke="var(--sunset)" />
              {Number(accommodation.avgRating).toFixed(1)}
            </span>
          )}
          {priceDollars && (
            <span style={{ fontSize: 12, color: "var(--tropical)" }}>{priceDollars}</span>
          )}
        </div>
        {accommodation.formattedAddress && (
          <p style={{ display: "flex", alignItems: "flex-start", gap: 4, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
            <MapPin size={12} style={{ flexShrink: 0, marginTop: 2 }} />
            {accommodation.formattedAddress}
          </p>
        )}
      </div>
    </div>
  );
}
