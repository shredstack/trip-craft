"use client";

import { useState, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/user";

interface NotesTabProps {
  notes: string;
  tripId: string;
}

export function NotesTab({ notes: initialNotes, tripId }: NotesTabProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  const saveNotes = useCallback(
    async (value: string) => {
      setSaving(true);
      try {
        await apiFetch(`/api/trips/${tripId}`, {
          method: "PATCH",
          body: JSON.stringify({ notes: value }),
        });
      } catch (err) {
        console.error("Failed to save notes:", err);
      }
      setSaving(false);
    },
    [tripId]
  );

  const handleChange = (value: string) => {
    setNotes(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => saveNotes(value), 500);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: "var(--text-secondary)",
          }}
        >
          Trip Notes
        </label>
        {saving && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Saving...</span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Write notes about your trip... ideas, packing lists, reminders..."
        style={{
          width: "100%",
          minHeight: 200,
          padding: "20px",
          background: "var(--bg-card)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--radius)",
          color: "var(--text-primary)",
          fontSize: 15,
          fontFamily: "inherit",
          lineHeight: 1.7,
          resize: "vertical",
        }}
      />
    </div>
  );
}
