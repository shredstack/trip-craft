"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Copy, MapPin, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScoreBar } from "@/components/admin/ScoreBar";
import { TRIP_TYPE_SCORES, PRIORITY_SCORES, HUB_AIRPORTS, CONTINENTS, COST_TIERS, CATALOG_STATUSES } from "@/lib/admin-constants";
import { apiFetch } from "@/lib/user";
import type { CatalogDestinationData } from "@/lib/types";

// Helper to safely access dynamic score fields
function getScore(data: CatalogDestinationData, key: string): number {
  return (data as unknown as Record<string, number>)[key] ?? 0;
}

function getFlightTime(data: CatalogDestinationData, key: string): number | null {
  return (data as unknown as Record<string, number | null>)[key] ?? null;
}

interface DestinationEditFormProps {
  destination: CatalogDestinationData;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--bg-dark)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-xs)",
  color: "var(--text-primary)",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--text-muted)",
  marginBottom: 6,
};

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontFamily: "var(--font-outfit)",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {title}
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div style={{ padding: "0 24px 24px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function DestinationEditForm({ destination }: DestinationEditFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CatalogDestinationData>(destination);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tagInput, setTagInput] = useState("");

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await apiFetch(`/api/admin/destinations/${form.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      setSuccess("Saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    try {
      const res = await apiFetch(`/api/admin/destinations/${form.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/destinations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleDuplicate() {
    try {
      const { id: _id, createdAt: _c, updatedAt: _u, ...data } = form;
      const res = await apiFetch("/api/admin/destinations", {
        method: "POST",
        body: JSON.stringify({
          destinations: [{ ...data, name: `${data.name} (copy)`, status: "draft" }],
          status: "draft",
        }),
      });
      if (!res.ok) throw new Error("Duplicate failed");
      const result = await res.json();
      if (result.destinations?.[0]?.id) {
        router.push(`/admin/destinations/${result.destinations[0].id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplicate failed");
    }
  }

  async function handleEnrich() {
    setEnriching(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/enrich", {
        method: "POST",
        body: JSON.stringify({
          destinations: [{ name: form.name, country: form.country, tempId: "edit" }],
        }),
      });
      if (!res.ok) throw new Error("Enrichment failed");
      const data = await res.json();
      if (data.results?.[0]) {
        const r = data.results[0];
        setForm((prev) => ({
          ...prev,
          placeId: r.placeId ?? prev.placeId,
          latitude: r.latitude ?? prev.latitude,
          longitude: r.longitude ?? prev.longitude,
          avgRating: r.avgRating ?? prev.avgRating,
          reviewCount: r.reviewCount ?? prev.reviewCount,
          photoUrls: r.photoUrls ?? prev.photoUrls,
        }));
        setSuccess("Enriched with Google Places data");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrichment failed");
    } finally {
      setEnriching(false);
    }
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !form.tags.includes(tag)) {
      updateField("tags", [...form.tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    updateField("tags", form.tags.filter((t) => t !== tag));
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => router.push("/admin/destinations")}
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
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: 24, fontWeight: 700 }}>
            {form.name}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>
            {form.region} | {form.continent}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="back"
            onClick={handleDuplicate}
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            <Copy size={14} />
            Duplicate
          </Button>
          <Button
            variant="back"
            onClick={handleDelete}
            style={{ padding: "8px 16px", fontSize: 13, color: "var(--coral)" }}
          >
            <Trash2 size={14} />
            Delete
          </Button>
          <Button
            variant="action"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "8px 20px", fontSize: 13 }}
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {error && <p style={{ color: "var(--coral)", fontSize: 14, marginBottom: 16 }}>{error}</p>}
      {success && <p style={{ color: "var(--tropical)", fontSize: 14, marginBottom: 16 }}>{success}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Identity Section */}
        <Section title="Identity">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input value={form.name} onChange={(e) => updateField("name", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Region</label>
              <input value={form.region} onChange={(e) => updateField("region", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <input value={form.country} onChange={(e) => updateField("country", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Continent</label>
              <select
                value={form.continent}
                onChange={(e) => updateField("continent", e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {CONTINENTS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {CATALOG_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Admin Notes</label>
            <textarea
              value={form.adminNotes || ""}
              onChange={(e) => updateField("adminNotes", e.target.value || null)}
              rows={2}
              placeholder="Private notes..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </Section>

        {/* Trip Type Scores */}
        <Section title="Trip Type Scores">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {TRIP_TYPE_SCORES.map(({ key, label }) => (
              <div key={key}>
                <ScoreBar score={getScore(form, key)} label={label} />
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={getScore(form, key)}
                  onChange={(e) => updateField(key, parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--ocean)", marginTop: 4 }}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Priority Scores */}
        <Section title="Priority Scores">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {PRIORITY_SCORES.map(({ key, label }) => (
              <div key={key}>
                <ScoreBar score={getScore(form, key)} label={label} />
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={getScore(form, key)}
                  onChange={(e) => updateField(key, parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--ocean)", marginTop: 4 }}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Hard Constraints */}
        <Section title="Hard Constraints">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Cost Tier</label>
              <select
                value={form.costTier}
                onChange={(e) => updateField("costTier", e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {COST_TIERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Avg Daily Cost (USD)</label>
              <input
                type="number"
                value={form.avgDailyCostUsd}
                onChange={(e) => updateField("avgDailyCostUsd", parseInt(e.target.value) || 0)}
                style={{ ...inputStyle, fontFamily: "var(--font-space)" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Best Months</label>
              <input
                value={form.bestMonths}
                onChange={(e) => updateField("bestMonths", e.target.value)}
                placeholder="Jan,Feb,Mar"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Avoid Months</label>
              <input
                value={form.avoidMonths || ""}
                onChange={(e) => updateField("avoidMonths", e.target.value || null)}
                placeholder="Jun,Jul,Aug"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Min Recommended Age</label>
              <input
                type="number"
                value={form.minRecommendedAge ?? ""}
                onChange={(e) => updateField("minRecommendedAge", e.target.value === "" ? null : parseInt(e.target.value))}
                placeholder="All ages"
                style={inputStyle}
              />
            </div>
          </div>
        </Section>

        {/* Logistics */}
        <Section title="Logistics">
          <div style={{ marginBottom: 16 }}>
            <label style={{ ...labelStyle, marginBottom: 12 }}>Flight Times (hours from US hubs)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {HUB_AIRPORTS.map(({ code, label, field }) => (
                <div key={code}>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                    {code} <span style={{ fontSize: 10 }}>({label})</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={getFlightTime(form, field) ?? ""}
                    onChange={(e) => updateField(field, e.target.value === "" ? null : parseFloat(e.target.value))}
                    placeholder="n/a"
                    style={{ ...inputStyle, fontFamily: "var(--font-space)", textAlign: "center" }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "start" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-secondary)", paddingTop: 28 }}>
              <input
                type="checkbox"
                checked={form.visaRequired}
                onChange={(e) => updateField("visaRequired", e.target.checked)}
                style={{ accentColor: "var(--ocean)", width: 16, height: 16 }}
              />
              Visa Required
            </label>
            <div>
              <label style={labelStyle}>Visa Notes</label>
              <input
                value={form.visaNotes || ""}
                onChange={(e) => updateField("visaNotes", e.target.value || null)}
                placeholder="e.g. Visa on arrival, 30 days"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Language Notes</label>
              <input
                value={form.languageNotes || ""}
                onChange={(e) => updateField("languageNotes", e.target.value || null)}
                placeholder="e.g. English widely spoken"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Health Notes</label>
              <input
                value={form.healthNotes || ""}
                onChange={(e) => updateField("healthNotes", e.target.value || null)}
                placeholder="e.g. Malaria prophylaxis recommended"
                style={inputStyle}
              />
            </div>
          </div>
        </Section>

        {/* Tags */}
        <Section title="Tags">
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add tag..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <Button
              variant="secondary"
              onClick={addTag}
              style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8 }}
            >
              Add
            </Button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {form.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  padding: "4px 12px",
                  borderRadius: 100,
                  background: "var(--bg-dark)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        </Section>

        {/* Google Places Data */}
        <Section title="Google Places Data" defaultOpen={false}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <Button
              variant="secondary"
              onClick={handleEnrich}
              disabled={enriching}
              style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8 }}
            >
              <MapPin size={14} />
              {enriching ? "Enriching..." : "Re-enrich from Google Places"}
            </Button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Place ID</label>
              <input
                value={form.placeId || ""}
                onChange={(e) => updateField("placeId", e.target.value || null)}
                style={{ ...inputStyle, fontSize: 12 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Latitude</label>
              <input
                type="number"
                step="0.0000001"
                value={form.latitude ?? ""}
                onChange={(e) => updateField("latitude", e.target.value === "" ? null : parseFloat(e.target.value))}
                style={{ ...inputStyle, fontFamily: "var(--font-space)", fontSize: 12 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Longitude</label>
              <input
                type="number"
                step="0.0000001"
                value={form.longitude ?? ""}
                onChange={(e) => updateField("longitude", e.target.value === "" ? null : parseFloat(e.target.value))}
                style={{ ...inputStyle, fontFamily: "var(--font-space)", fontSize: 12 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Rating</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={5}
                value={form.avgRating ?? ""}
                onChange={(e) => updateField("avgRating", e.target.value === "" ? null : parseFloat(e.target.value))}
                style={{ ...inputStyle, fontFamily: "var(--font-space)", fontSize: 12 }}
              />
            </div>
          </div>
          {form.photoUrls && form.photoUrls.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Photos</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {form.photoUrls.map((url, i) => (
                  <div
                    key={i}
                    style={{
                      width: 100,
                      height: 75,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "var(--bg-dark)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${form.name} photo ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
