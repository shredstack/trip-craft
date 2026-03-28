"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CalendarDays, RefreshCw, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/user";
import {
  ItineraryDayColumn,
  type ItineraryDayData,
} from "./ItineraryDayColumn";
import {
  ItineraryEventCard,
  type ItineraryEventData,
} from "./ItineraryEventCard";
import { BackupPool } from "./BackupPool";
import { AddEventForm } from "./AddEventForm";

interface ItineraryTabProps {
  tripId: string;
  hasItinerary: boolean;
  hasDestinations: boolean;
}

interface ItineraryData {
  id: string;
  overview: string | null;
  days: ItineraryDayData[];
  backupEvents: ItineraryEventData[];
}

export function ItineraryTab({
  tripId,
  hasItinerary,
  hasDestinations,
}: ItineraryTabProps) {
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(hasItinerary);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<ItineraryEventData | null>(null);
  const [editingOverview, setEditingOverview] = useState(false);
  const [overviewText, setOverviewText] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load itinerary
  const loadItinerary = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/trips/${tripId}/itinerary`);
      if (res.ok) {
        const data = await res.json();
        setItinerary(data);
        setOverviewText(data.overview || "");
        setGenerating(false);
        setJobId(null);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      // Not found is ok during generation
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    if (hasItinerary) {
      loadItinerary();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [hasItinerary, loadItinerary]);

  // Poll for generation completion
  // Poll for generation completion — check job status, with timeout
  useEffect(() => {
    if (!jobId) return;
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 60 * 3s = 3 minutes max

    pollRef.current = setInterval(async () => {
      attempts++;

      // Check job status first
      try {
        const jobRes = await apiFetch(`/api/jobs/${jobId}`);
        if (jobRes.ok) {
          const job = await jobRes.json();
          if (job.status === "FAILED") {
            console.error("Itinerary generation failed:", job.error);
            setGenerating(false);
            setJobId(null);
            if (pollRef.current) clearInterval(pollRef.current);
            return;
          }
        }
      } catch {
        // Job status endpoint may not exist — fall through to itinerary check
      }

      // Check if itinerary exists
      try {
        const res = await apiFetch(`/api/trips/${tripId}/itinerary`);
        if (res.ok) {
          await loadItinerary();
          return;
        }
      } catch {
        // Still generating
      }

      // Timeout
      if (attempts >= MAX_ATTEMPTS) {
        console.error("Itinerary generation timed out");
        setGenerating(false);
        setJobId(null);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId, tripId, loadItinerary]);

  // Generate itinerary
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await apiFetch(`/api/trips/${tripId}/itinerary`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.done) {
        // Direct execution completed — load immediately
        await loadItinerary();
      } else if (data.jobId) {
        // Queued via Inngest — poll for completion
        setJobId(data.jobId);
      }
    } catch (err) {
      console.error("Failed to start generation:", err);
      setGenerating(false);
    }
  };

  // Delete itinerary
  const handleDelete = async () => {
    if (!confirm("Delete this itinerary? You can regenerate it later.")) return;
    try {
      await apiFetch(`/api/trips/${tripId}/itinerary`, { method: "DELETE" });
      setItinerary(null);
    } catch (err) {
      console.error("Failed to delete itinerary:", err);
    }
  };

  // Save overview
  const handleSaveOverview = async () => {
    if (!itinerary) return;
    try {
      await apiFetch(`/api/trips/${tripId}/itinerary/events/${itinerary.id}`, {
        method: "PATCH",
      });
    } catch {
      // Fallback: just save locally
    }
    // Update the overview via the itinerary itself — we need a dedicated endpoint
    // For now, we update local state
    setItinerary({ ...itinerary, overview: overviewText });
    setEditingOverview(false);
  };

  // Event handlers for child components
  const handleUpdateEvent = (updated: ItineraryEventData) => {
    if (!itinerary) return;
    setItinerary({
      ...itinerary,
      days: itinerary.days.map((d) => ({
        ...d,
        events: d.events.map((e) => (e.id === updated.id ? updated : e)),
      })),
      backupEvents: itinerary.backupEvents.map((e) =>
        e.id === updated.id ? updated : e
      ),
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!itinerary) return;
    setItinerary({
      ...itinerary,
      days: itinerary.days.map((d) => ({
        ...d,
        events: d.events.filter((e) => e.id !== eventId),
      })),
      backupEvents: itinerary.backupEvents.filter((e) => e.id !== eventId),
    });
  };

  const handleAddEvent = (event: ItineraryEventData) => {
    if (!itinerary) return;
    if (event.dayId) {
      setItinerary({
        ...itinerary,
        days: itinerary.days.map((d) =>
          d.id === event.dayId ? { ...d, events: [...d.events, event] } : d
        ),
      });
    } else {
      setItinerary({
        ...itinerary,
        backupEvents: [...itinerary.backupEvents, event],
      });
    }
  };

  // DnD handlers
  const findEventAndContainer = (eventId: string) => {
    for (const day of itinerary?.days || []) {
      const idx = day.events.findIndex((e) => e.id === eventId);
      if (idx !== -1)
        return { containerId: `day-${day.id}`, dayId: day.id, index: idx };
    }
    const idx = (itinerary?.backupEvents || []).findIndex(
      (e) => e.id === eventId
    );
    if (idx !== -1)
      return { containerId: "backup-pool", dayId: null, index: idx };
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const allEvents = [
      ...(itinerary?.days.flatMap((d) => d.events) || []),
      ...(itinerary?.backupEvents || []),
    ];
    const evt = allEvents.find((e) => e.id === active.id);
    if (evt) setActiveEvent(evt);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveEvent(null);
    const { active, over } = event;
    if (!over || !itinerary) return;

    const activeId = active.id as string;
    const source = findEventAndContainer(activeId);
    if (!source) return;

    // Determine target container
    let targetContainerId: string;
    let targetDayId: string | null;

    // Check if dropping on a container or on another event
    const overData = over.data.current;
    if (overData?.type === "day") {
      targetContainerId = `day-${overData.dayId}`;
      targetDayId = overData.dayId;
    } else if (overData?.type === "backup") {
      targetContainerId = "backup-pool";
      targetDayId = null;
    } else {
      // Dropping on another event — find its container
      const targetEvent = findEventAndContainer(over.id as string);
      if (!targetEvent) return;
      targetContainerId = targetEvent.containerId;
      targetDayId = targetEvent.dayId;
    }

    // If same container and same position, do nothing
    if (source.containerId === targetContainerId && active.id === over.id) return;

    // Build updated state
    const newItinerary = { ...itinerary };
    const updatedEvents: Array<{
      id: string;
      dayId: string | null;
      sortOrder: number;
    }> = [];

    // Remove from source
    let movedEvent: ItineraryEventData | undefined;
    if (source.dayId) {
      const srcDay = newItinerary.days.find((d) => d.id === source.dayId);
      if (srcDay) {
        movedEvent = srcDay.events[source.index];
        srcDay.events = srcDay.events.filter((e) => e.id !== activeId);
      }
    } else {
      movedEvent = newItinerary.backupEvents[source.index];
      newItinerary.backupEvents = newItinerary.backupEvents.filter(
        (e) => e.id !== activeId
      );
    }

    if (!movedEvent) return;

    // Insert into target
    if (targetDayId) {
      const tgtDay = newItinerary.days.find((d) => d.id === targetDayId);
      if (tgtDay) {
        // Find insert position
        const overEventIdx = tgtDay.events.findIndex(
          (e) => e.id === (over.id as string)
        );
        const insertIdx =
          overEventIdx >= 0 ? overEventIdx : tgtDay.events.length;

        movedEvent = { ...movedEvent, dayId: targetDayId, backupCategory: null };
        tgtDay.events.splice(insertIdx, 0, movedEvent);

        // Update sort orders for all events in target day
        tgtDay.events.forEach((e, i) => {
          e.sortOrder = i;
          updatedEvents.push({ id: e.id, dayId: targetDayId, sortOrder: i });
        });
      }
    } else {
      // Moving to backup pool
      movedEvent = {
        ...movedEvent,
        dayId: null,
        backupCategory: movedEvent.backupCategory || "Other",
      };
      newItinerary.backupEvents.push(movedEvent);
      newItinerary.backupEvents.forEach((e, i) => {
        e.sortOrder = i;
        updatedEvents.push({ id: e.id, dayId: null, sortOrder: i });
      });
    }

    // Also update sort orders in the source container if it's different
    if (source.containerId !== targetContainerId) {
      if (source.dayId) {
        const srcDay = newItinerary.days.find((d) => d.id === source.dayId);
        srcDay?.events.forEach((e, i) => {
          e.sortOrder = i;
          if (!updatedEvents.find((u) => u.id === e.id)) {
            updatedEvents.push({ id: e.id, dayId: source.dayId, sortOrder: i });
          }
        });
      } else {
        newItinerary.backupEvents.forEach((e, i) => {
          e.sortOrder = i;
          if (!updatedEvents.find((u) => u.id === e.id)) {
            updatedEvents.push({ id: e.id, dayId: null, sortOrder: i });
          }
        });
      }
    }

    // Optimistic update
    setItinerary({
      ...newItinerary,
      days: newItinerary.days.map((d) => ({ ...d, events: [...d.events] })),
      backupEvents: [...newItinerary.backupEvents],
    });

    // Persist
    if (updatedEvents.length > 0) {
      try {
        await apiFetch(`/api/trips/${tripId}/itinerary/events`, {
          method: "PATCH",
          body: JSON.stringify({ events: updatedEvents }),
        });
      } catch (err) {
        console.error("Failed to persist drag:", err);
        // Reload to revert
        loadItinerary();
      }
    }
  };

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <p style={{ color: "var(--text-muted)" }}>Loading itinerary...</p>
      </div>
    );
  }

  // ── Generating state ───────────────────────────────────────
  if (generating) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid var(--border)",
            borderTopColor: "var(--ocean-light)",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite",
          }}
        />
        <h3
          style={{
            fontFamily: "var(--font-outfit)",
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Building Your Itinerary
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Planning day-by-day activities, meals, and backup options...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────
  if (!itinerary) {
    return (
      <div>
        <EmptyState
          icon="📅"
          title="No itinerary yet"
          description={
            hasDestinations
              ? "Generate a day-by-day itinerary from your destinations and excursions."
              : "Generate destinations first, then create your itinerary."
          }
        />
        {hasDestinations && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={handleGenerate}
              style={{
                padding: "14px 28px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: "var(--gradient-ocean)",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CalendarDays size={18} />
              Generate Itinerary
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Main itinerary view ────────────────────────────────────
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        {/* Overview */}
        {itinerary.overview && (
          <div
            style={{
              textAlign: "center",
              marginBottom: 32,
              maxWidth: 700,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {editingOverview ? (
              <div>
                <textarea
                  value={overviewText}
                  onChange={(e) => setOverviewText(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "var(--bg-dark)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-xs)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                    lineHeight: 1.6,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    marginTop: 8,
                  }}
                >
                  <button
                    onClick={() => {
                      setOverviewText(itinerary.overview || "");
                      setEditingOverview(false);
                    }}
                    style={{
                      padding: "8px 16px",
                      border: "1.5px solid var(--border)",
                      borderRadius: "var(--radius-xs)",
                      background: "none",
                      color: "var(--text-secondary)",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOverview}
                    style={{
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: "var(--radius-xs)",
                      background: "var(--gradient-ocean)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => setEditingOverview(true)}
                style={{
                  fontSize: 15,
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                  cursor: "pointer",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-xs)",
                  transition: "background 0.2s",
                }}
              >
                {itinerary.overview}
              </p>
            )}
          </div>
        )}

        {/* Day columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          {itinerary.days.map((day) => (
            <div key={day.id}>
              <ItineraryDayColumn
                day={day}
                tripId={tripId}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
              />
              <AddEventForm
                tripId={tripId}
                dayId={day.id}
                onAdd={handleAddEvent}
              />
            </div>
          ))}
        </div>

        {/* Backup pool */}
        <BackupPool
          events={itinerary.backupEvents}
          tripId={tripId}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
        />

        {/* Actions row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 32,
            paddingTop: 20,
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={handleGenerate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-xs)",
              background: "none",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
          <button
            onClick={handleDelete}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              border: "1.5px solid rgba(255,107,90,0.3)",
              borderRadius: "var(--radius-xs)",
              background: "none",
              color: "var(--coral)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Trash2 size={14} />
            Delete Itinerary
          </button>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeEvent ? (
          <ItineraryEventCard
            event={activeEvent}
            tripId={tripId}
            onUpdate={() => {}}
            onDelete={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
