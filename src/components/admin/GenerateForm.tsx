"use client";

import { useState } from "react";
import { Sparkles, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { REGIONAL_PROMPTS } from "@/lib/admin-constants";
import { apiFetch } from "@/lib/user";
import type { GeneratedCatalogDestination } from "@/lib/generate-destinations";

interface GenerateFormProps {
  onGenerated: (destinations: GeneratedCatalogDestination[], prompt: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  background: "var(--bg-dark)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  fontSize: 15,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--text-secondary)",
  marginBottom: 8,
};

export function GenerateForm({ onGenerated }: GenerateFormProps) {
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [count, setCount] = useState(10);
  const [excludeExisting, setExcludeExisting] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [testCap, setTestCap] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const effectivePrompt = selectedPrompt === "custom" ? customPrompt : selectedPrompt;
  const canGenerate = effectivePrompt.trim().length > 0 && !loading;

  async function handleGenerate() {
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/admin/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: effectivePrompt,
          count,
          excludeExisting,
          testMode,
          testCap,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      onGenerated(data.destinations, effectivePrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-outfit)",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Generate Destinations
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
        Use AI to generate a batch of curated destination data for the catalog.
      </p>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: 640,
        }}
      >
        {/* Prompt Selection */}
        <div>
          <label style={labelStyle}>Generation Prompt</label>
          <select
            value={selectedPrompt}
            onChange={(e) => setSelectedPrompt(e.target.value)}
            style={{
              ...inputStyle,
              cursor: "pointer",
              appearance: "auto",
            }}
          >
            <option value="">Select a region or category...</option>
            {REGIONAL_PROMPTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
            <option value="custom">Custom prompt...</option>
          </select>
        </div>

        {/* Custom Prompt */}
        {selectedPrompt === "custom" && (
          <div>
            <label style={labelStyle}>Custom Prompt</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder='e.g. "Underrated European mountain towns" or "Best destinations for families with toddlers under 3"'
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>
        )}

        {/* Count Slider */}
        <div>
          <label style={labelStyle}>
            Number of Destinations: <span style={{ color: "var(--ocean)", fontFamily: "var(--font-space)" }}>{count}</span>
          </label>
          <input
            type="range"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            style={{
              width: "100%",
              accentColor: "var(--ocean)",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        {/* Exclude Existing */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={excludeExisting}
            onChange={(e) => setExcludeExisting(e.target.checked)}
            style={{ accentColor: "var(--ocean)", width: 16, height: 16 }}
          />
          Exclude destinations already in database
        </label>

        {/* Test Mode */}
        <div
          style={{
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: 16,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              color: "var(--text-secondary)",
              cursor: "pointer",
              marginBottom: testMode ? 12 : 0,
            }}
          >
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              style={{ accentColor: "var(--sand)", width: 16, height: 16 }}
            />
            <FlaskConical size={14} style={{ color: "var(--sand)" }} />
            Test Mode
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              — caps generation count
            </span>
          </label>
          {testMode && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 26 }}>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Max destinations:
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={testCap}
                onChange={(e) => setTestCap(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                style={{
                  ...inputStyle,
                  width: 80,
                  textAlign: "center",
                  fontFamily: "var(--font-space)",
                }}
              />
            </div>
          )}
        </div>

        {error && (
          <p style={{ color: "var(--coral)", fontSize: 14 }}>{error}</p>
        )}

        <Button
          variant="action"
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            width: "100%",
            opacity: canGenerate ? 1 : 0.5,
            marginTop: 8,
          }}
        >
          <Sparkles size={16} />
          {loading ? "Generating..." : `Generate ${testMode ? Math.min(count, testCap) : count} Destinations`}
        </Button>
      </div>
    </div>
  );
}
