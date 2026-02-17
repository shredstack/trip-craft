"use client";

import { Star, MapPin, ExternalLink } from "lucide-react";
import type { PlaceReview } from "@/lib/types";

interface AccommodationCardProps {
  accommodation: {
    id: string;
    name: string;
    avgRating: number | string | null;
    reviewCount: number | null;
    priceLevel: number | null;
    photoUrls: string[] | null;
    formattedAddress: string | null;
    websiteUrl: string | null;
    reviews: PlaceReview[] | null;
  };
}

export function AccommodationCard({ accommodation }: AccommodationCardProps) {
  const photo =
    accommodation.photoUrls && accommodation.photoUrls.length > 0
      ? accommodation.photoUrls[0]
      : null;
  const priceDollars =
    accommodation.priceLevel != null
      ? "$".repeat(accommodation.priceLevel + 1)
      : null;
  const firstReview = (accommodation.reviews ?? [])[0];

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        transition: "all 0.3s",
      }}
    >
      {/* Photo */}
      <div
        style={{
          height: 180,
          background: photo
            ? `url(${photo}) center/cover`
            : "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(139,92,246,0.2))",
        }}
      />

      {/* Body */}
      <div style={{ padding: 20 }}>
        <h4
          style={{
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "var(--font-outfit)",
            marginBottom: 8,
          }}
        >
          {accommodation.name}
        </h4>

        {/* Rating + Price */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
          }}
        >
          {accommodation.avgRating && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Star size={14} fill="var(--sunset)" stroke="var(--sunset)" />
              {Number(accommodation.avgRating).toFixed(1)}
              {accommodation.reviewCount != null && (
                <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 12 }}>
                  ({accommodation.reviewCount})
                </span>
              )}
            </span>
          )}
          {priceDollars && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--tropical)",
              }}
            >
              {priceDollars}
            </span>
          )}
        </div>

        {/* Address */}
        {accommodation.formattedAddress && (
          <p
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            <MapPin size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            {accommodation.formattedAddress}
          </p>
        )}

        {/* Review snippet */}
        {firstReview && (
          <div
            style={{
              padding: 12,
              background: "rgba(14,165,233,0.06)",
              borderRadius: "var(--radius-xs)",
              marginBottom: 12,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontStyle: "italic",
              }}
            >
              &ldquo;{firstReview.text}&rdquo;
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
              — {firstReview.author}
            </p>
          </div>
        )}

        {/* Website link */}
        {accommodation.websiteUrl && (
          <a
            href={accommodation.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--ocean-light)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Visit Website <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
