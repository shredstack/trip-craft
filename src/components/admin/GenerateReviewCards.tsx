"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Trash2, MapPin, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScoreBar } from "@/components/admin/ScoreBar";
import { TRIP_TYPE_SCORES, PRIORITY_SCORES, HUB_AIRPORTS } from "@/lib/admin-constants";
import { apiFetch } from "@/lib/user";
import type { GeneratedCatalogDestination } from "@/lib/generate-destinations";

// Helper to safely access dynamic fields on ReviewCardData
function getCardScore(card: ReviewCardData, key: string): number {
  return (card as unknown as Record<string, number>)[key] ?? 0;
}

function getCardFlightTime(card: ReviewCardData, key: string): number | null {
  return (card as unknown as Record<string, number | null>)[key] ?? null;
}

interface ReviewCardData extends GeneratedCatalogDestination {
  tempId: string;
  included: boolean;
  expanded: boolean;
  // Google Places enrichment data
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  avgRating?: number | null;
  reviewCount?: number | null;
  photoUrls?: string[] | null;
}

interface GenerateReviewCardsProps {
  destinations: GeneratedCatalogDestination[];
  generationPrompt: string;
  onBack: () => void;
}

export function GenerateReviewCards({
  destinations,
  generationPrompt,
  onBack,
}: GenerateReviewCardsProps) {
  const router = useRouter();
  const [cards, setCards] = useState<ReviewCardData[]>(
    destinations.map((d, i) => ({
      ...d,
      tempId: `temp-${i}`,
      included: true,
      expanded: false,
    }))
  );
  const [enriching, setEnriching] = useState(false);
  const [enriched, setEnriched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const includedCards = cards.filter((c) => c.included);

  function updateCard(tempId: string, updates: Partial<ReviewCardData>) {
    setCards((prev) => prev.map((c) => (c.tempId === tempId ? { ...c, ...updates } : c)));
  }

  function updateCardField(tempId: string, field: string, value: unknown) {
    setCards((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, [field]: value } : c))
    );
  }

  async function handleEnrich() {
    setEnriching(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/enrich", {
        method: "POST",
        body: JSON.stringify({
          destinations: includedCards.map((c) => ({
            name: c.name,
            country: c.country,
            tempId: c.tempId,
          })),
        }),
      });

      if (!res.ok) throw new Error("Enrichment failed");

      const data = await res.json();
      for (const result of data.results) {
        if (result.tempId) {
          updateCard(result.tempId, {
            placeId: result.placeId,
            latitude: result.latitude,
            longitude: result.longitude,
            avgRating: result.avgRating,
            reviewCount: result.reviewCount,
            photoUrls: result.photoUrls,
          });
        }
      }
      setEnriched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrichment failed");
    } finally {
      setEnriching(false);
    }
  }

  async function handleSave(status: "draft" | "published") {
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/destinations", {
        method: "POST",
        body: JSON.stringify({
          destinations: includedCards.map((c) => ({
            name: c.name,
            region: c.region,
            country: c.country,
            continent: c.continent,
            description: c.description,
            scoreBeach: c.scoreBeach,
            scoreAdventure: c.scoreAdventure,
            scoreCulture: c.scoreCulture,
            scoreNature: c.scoreNature,
            scoreCity: c.scoreCity,
            scoreResort: c.scoreResort,
            scoreThemePark: c.scoreThemePark,
            scoreCruise: c.scoreCruise,
            scoreKidFriendly: c.scoreKidFriendly,
            scoreRelaxation: c.scoreRelaxation,
            scoreFood: c.scoreFood,
            scoreSafety: c.scoreSafety,
            scoreScenic: c.scoreScenic,
            scoreNightlife: c.scoreNightlife,
            costTier: c.costTier,
            avgDailyCostUsd: c.avgDailyCostUsd,
            bestMonths: c.bestMonths,
            avoidMonths: c.avoidMonths || null,
            minRecommendedAge: c.minRecommendedAge,
            flightTimeNYC: c.flightTimeNYC,
            flightTimeLAX: c.flightTimeLAX,
            flightTimeSLC: c.flightTimeSLC,
            flightTimeORD: c.flightTimeORD,
            flightTimeDFW: c.flightTimeDFW,
            flightTimeMIA: c.flightTimeMIA,
            flightTimeATL: c.flightTimeATL,
            flightTimeSEA: c.flightTimeSEA,
            visaRequired: c.visaRequired,
            visaNotes: c.visaNotes,
            languageNotes: c.languageNotes,
            healthNotes: c.healthNotes,
            tags: c.tags,
            placeId: c.placeId ?? null,
            latitude: c.latitude ?? null,
            longitude: c.longitude ?? null,
            avgRating: c.avgRating ?? null,
            reviewCount: c.reviewCount ?? null,
            photoUrls: c.photoUrls ?? null,
          })),
          status,
          generatedFrom: generationPrompt,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      router.push("/admin/destinations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const costTierColors: Record<string, string> = {
    budget: "var(--tropical)",
    moderate: "var(--ocean)",
    premium: "var(--purple-voyage)",
    luxury: "var(--sand)",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            borderRadius: 8,
            padding: 8,
            cursor: "pointer",
            display: "flex",
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: 24, fontWeight: 700 }}>
            Review Generated Destinations
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            {includedCards.length} of {cards.length} included
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(420, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.tempId}
            style={{
              background: "var(--bg-card)",
              border: `1.5px solid ${card.included ? "var(--border)" : "rgba(100,116,139,0.2)"}`,
              borderRadius: "var(--radius)",
              padding: 24,
              opacity: card.included ? 1 : 0.5,
              transition: "all 0.2s",
            }}
          >
            {/* Include toggle + Name */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={card.included}
                onChange={(e) => updateCard(card.tempId, { included: e.target.checked })}
                style={{ accentColor: "var(--ocean)", width: 16, height: 16, marginTop: 4 }}
              />
              <div style={{ flex: 1 }}>
                <input
                  value={card.name}
                  onChange={(e) => updateCardField(card.tempId, "name", e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-primary)",
                    fontSize: 18,
                    fontFamily: "var(--font-outfit)",
                    fontWeight: 700,
                    width: "100%",
                    outline: "none",
                    padding: 0,
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  <input
                    value={card.region}
                    onChange={(e) => updateCardField(card.tempId, "region", e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      outline: "none",
                      padding: 0,
                      width: "auto",
                    }}
                    size={card.region.length || 10}
                  />
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>|</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{card.continent}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <textarea
              value={card.description}
              onChange={(e) => updateCardField(card.tempId, "description", e.target.value)}
              rows={2}
              style={{
                width: "100%",
                background: "var(--bg-dark)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xs)",
                color: "var(--text-secondary)",
                fontSize: 13,
                padding: "8px 12px",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
                marginBottom: 16,
              }}
            />

            {/* Cost Tier Badge + Enrichment Photos */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: costTierColors[card.costTier] || "var(--text-secondary)",
                  background: `${costTierColors[card.costTier] || "var(--text-secondary)"}20`,
                  padding: "3px 10px",
                  borderRadius: 6,
                }}
              >
                {card.costTier}
              </span>
              <span style={{ fontSize: 12, fontFamily: "var(--font-space)", color: "var(--text-muted)" }}>
                ~${card.avgDailyCostUsd}/day
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Best: {card.bestMonths}
              </span>
              {card.avgRating && (
                <span style={{ fontSize: 12, color: "var(--sand)" }}>
                  {Number(card.avgRating).toFixed(1)} ({card.reviewCount} reviews)
                </span>
              )}
            </div>

            {/* Photos from enrichment */}
            {card.photoUrls && card.photoUrls.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
                {card.photoUrls.slice(0, 4).map((url, i) => (
                  <div
                    key={i}
                    style={{
                      width: 64,
                      height: 48,
                      borderRadius: 6,
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "var(--bg-dark)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Trip Type Scores (compact) */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>
                Trip Types
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                {TRIP_TYPE_SCORES.map(({ key, label }) => (
                  <ScoreBar key={key} score={getCardScore(card, key)} label={label} compact />
                ))}
              </div>
            </div>

            {/* Priority Scores (compact) */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>
                Priorities
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                {PRIORITY_SCORES.map(({ key, label }) => (
                  <ScoreBar key={key} score={getCardScore(card, key)} label={label} compact />
                ))}
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 100,
                    background: "var(--bg-dark)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Quick Edit Toggle */}
            <button
              onClick={() => updateCard(card.tempId, { expanded: !card.expanded })}
              style={{
                background: "none",
                border: "none",
                color: "var(--ocean)",
                fontSize: 12,
                cursor: "pointer",
                padding: 0,
                fontFamily: "inherit",
              }}
            >
              {card.expanded ? "Hide details" : "Quick edit"}
            </button>

            {/* Expanded Edit Section */}
            {card.expanded && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* Scores editing */}
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Edit Scores
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                  {[...TRIP_TYPE_SCORES, ...PRIORITY_SCORES].map(({ key, label }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 70 }}>{label}</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={getCardScore(card, key)}
                        onChange={(e) =>
                          updateCardField(card.tempId, key, Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))
                        }
                        style={{
                          width: 50,
                          padding: "4px 8px",
                          background: "var(--bg-dark)",
                          border: "1px solid var(--border)",
                          borderRadius: 4,
                          color: "var(--text-primary)",
                          fontSize: 12,
                          fontFamily: "var(--font-space)",
                          textAlign: "center",
                          outline: "none",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Flight times */}
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginTop: 8 }}>
                  Flight Times (hours)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                  {HUB_AIRPORTS.map(({ code, label, field }) => (
                    <div key={code} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 70 }}>{code}</span>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        value={getCardFlightTime(card, field) ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          updateCardField(card.tempId, field, val);
                        }}
                        placeholder="n/a"
                        style={{
                          width: 60,
                          padding: "4px 8px",
                          background: "var(--bg-dark)",
                          border: "1px solid var(--border)",
                          borderRadius: 4,
                          color: "var(--text-primary)",
                          fontSize: 12,
                          fontFamily: "var(--font-space)",
                          textAlign: "center",
                          outline: "none",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Cost + Months */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Cost Tier</span>
                    <select
                      value={card.costTier}
                      onChange={(e) => updateCardField(card.tempId, "costTier", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        background: "var(--bg-dark)",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        color: "var(--text-primary)",
                        fontSize: 12,
                        outline: "none",
                      }}
                    >
                      <option value="budget">Budget</option>
                      <option value="moderate">Moderate</option>
                      <option value="premium">Premium</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Daily Cost (USD)</span>
                    <input
                      type="number"
                      value={card.avgDailyCostUsd}
                      onChange={(e) => updateCardField(card.tempId, "avgDailyCostUsd", parseInt(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        background: "var(--bg-dark)",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        color: "var(--text-primary)",
                        fontSize: 12,
                        fontFamily: "var(--font-space)",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Bar */}
      {error && (
        <p style={{ color: "var(--coral)", fontSize: 14, marginBottom: 16 }}>{error}</p>
      )}

      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "rgba(15,23,42,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--border)",
          padding: "16px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="secondary"
          onClick={handleEnrich}
          disabled={enriching || includedCards.length === 0}
          style={{ padding: "10px 20px", fontSize: 13 }}
        >
          {enriching ? (
            <>Enriching...</>
          ) : enriched ? (
            <>
              <Check size={14} />
              Enriched
            </>
          ) : (
            <>
              <MapPin size={14} />
              Enrich with Google Places
            </>
          )}
        </Button>

        <div style={{ flex: 1 }} />

        <Button
          variant="back"
          onClick={() => {
            if (confirm("Discard all generated destinations?")) onBack();
          }}
          style={{ padding: "10px 20px", fontSize: 13 }}
        >
          <Trash2 size={14} />
          Discard
        </Button>

        <Button
          variant="secondary"
          onClick={() => handleSave("draft")}
          disabled={saving || includedCards.length === 0}
          style={{ padding: "10px 20px", fontSize: 13 }}
        >
          <ImageIcon size={14} />
          Save as Draft ({includedCards.length})
        </Button>

        <Button
          variant="action"
          onClick={() => handleSave("published")}
          disabled={saving || includedCards.length === 0}
          style={{ padding: "10px 20px", fontSize: 13 }}
        >
          <Check size={14} />
          {saving ? "Saving..." : `Save & Publish (${includedCards.length})`}
        </Button>
      </div>
    </div>
  );
}
