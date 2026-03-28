"use client";

import { useRef, useState } from "react";
import { Star, Upload, X, Camera } from "lucide-react";
import { apiFetch } from "@/lib/user";
import type { ItineraryEventData } from "./ItineraryEventCard";

interface EventJournalProps {
  event: ItineraryEventData;
  tripId: string;
  onUpdate: (event: ItineraryEventData) => void;
}

export function EventJournal({ event, tripId, onUpdate }: EventJournalProps) {
  const [review, setReview] = useState(event.userReview || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photos = (event.userPhotoUrls as string[]) || [];

  const handleRating = async (rating: number) => {
    try {
      const res = await apiFetch(
        `/api/trips/${tripId}/itinerary/events/${event.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ userRating: rating }),
        }
      );
      const updated = await res.json();
      onUpdate({ ...event, ...updated });
    } catch (err) {
      console.error("Failed to save rating:", err);
    }
  };

  const handleSaveReview = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(
        `/api/trips/${tripId}/itinerary/events/${event.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ userReview: review }),
        }
      );
      const updated = await res.json();
      onUpdate({ ...event, ...updated });
    } catch (err) {
      console.error("Failed to save review:", err);
    }
    setSaving(false);
  };

  const handlePhotoUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("photos", files[i]);
      }

      // Use raw fetch for FormData — apiFetch sets Content-Type: application/json
      // which breaks multipart form uploads
      const res = await fetch(
        `/api/trips/${tripId}/itinerary/events/${event.id}/photos`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (data.photoUrls) {
        onUpdate({ ...event, userPhotoUrls: data.photoUrls });
      }
    } catch (err) {
      console.error("Failed to upload photos:", err);
    }
    setUploading(false);
  };

  const handleDeletePhoto = async (url: string) => {
    try {
      const res = await apiFetch(
        `/api/trips/${tripId}/itinerary/events/${event.id}/photos`,
        {
          method: "DELETE",
          body: JSON.stringify({ url }),
        }
      );
      const data = await res.json();
      if (data.photoUrls) {
        onUpdate({ ...event, userPhotoUrls: data.photoUrls });
      }
    } catch (err) {
      console.error("Failed to delete photo:", err);
    }
  };

  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid var(--border)",
      }}
    >
      <h6
        style={{
          fontFamily: "var(--font-outfit)",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 10,
        }}
      >
        Your Experience
      </h6>

      {/* Star Rating */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 10,
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              color:
                star <= (event.userRating || 0)
                  ? "var(--sand)"
                  : "var(--border)",
              transition: "color 0.15s",
            }}
          >
            <Star
              size={20}
              fill={star <= (event.userRating || 0) ? "currentColor" : "none"}
            />
          </button>
        ))}
        {event.userRating && (
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginLeft: 4,
            }}
          >
            {event.userRating}/5
          </span>
        )}
      </div>

      {/* Photos */}
      <div style={{ marginBottom: 10 }}>
        {photos.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            {photos.map((url, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  width: 72,
                  height: 72,
                  borderRadius: "var(--radius-xs)",
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <button
                  onClick={() => handleDeletePhoto(url)}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handlePhotoUpload(e.target.files);
            }
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            border: "1.5px dashed var(--border)",
            borderRadius: "var(--radius-xs)",
            background: "none",
            color: "var(--text-muted)",
            fontSize: 12,
            cursor: uploading ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {uploading ? (
            <>
              <Upload size={12} /> Uploading...
            </>
          ) : (
            <>
              <Camera size={12} /> Add Photos
            </>
          )}
        </button>
      </div>

      {/* Review text */}
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Share your experience, tips, or recommendations..."
        rows={2}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "var(--bg-dark)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--radius-xs)",
          color: "var(--text-primary)",
          fontSize: 13,
          fontFamily: "inherit",
          resize: "vertical",
          lineHeight: 1.5,
        }}
      />
      {review !== (event.userReview || "") && (
        <button
          onClick={handleSaveReview}
          disabled={saving}
          style={{
            marginTop: 6,
            padding: "6px 14px",
            border: "none",
            borderRadius: "var(--radius-xs)",
            background: "var(--gradient-ocean)",
            color: "white",
            fontSize: 12,
            fontWeight: 600,
            cursor: saving ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {saving ? "Saving..." : "Save Review"}
        </button>
      )}
    </div>
  );
}
