"use client";

import type { PlaceReview } from "@/lib/types";
import { Star } from "lucide-react";

interface ReviewCardProps {
  review: PlaceReview;
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  const days = Math.floor(seconds / 86400);

  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>{review.author}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {formatRelativeTime(review.time)}
        </span>
      </div>

      {/* Star rating */}
      <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            fill={i < review.rating ? "var(--sunset)" : "none"}
            stroke={i < review.rating ? "var(--sunset)" : "var(--text-muted)"}
          />
        ))}
      </div>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {review.text}
      </p>
    </div>
  );
}
