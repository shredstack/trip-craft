"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Clock, MapPin, ChevronDown, ChevronUp, Trash2, Check } from "lucide-react";
import { ITINERARY_CATEGORY_STYLES } from "@/lib/constants";
import { apiFetch } from "@/lib/user";
import { EventJournal } from "./EventJournal";

export interface ItineraryEventData {
  id: string;
  dayId: string | null;
  category: string;
  name: string;
  description: string | null;
  tips: string | null;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  timeLabel: string | null;
  sortOrder: number;
  backupCategory: string | null;
  excursionId: string | null;
  userRating: number | null;
  userReview: string | null;
  userPhotoUrls: string[] | null;
  completed: boolean;
}

interface ItineraryEventCardProps {
  event: ItineraryEventData;
  tripId: string;
  onUpdate: (event: ItineraryEventData) => void;
  onDelete: (eventId: string) => void;
  isDragOverlay?: boolean;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

function getTimeDisplay(event: ItineraryEventData): string {
  if (event.startTime && event.endTime) {
    return `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`;
  }
  if (event.startTime) {
    return formatTime(event.startTime);
  }
  return event.timeLabel || "";
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "var(--bg-dark)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-xs)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "inherit",
  width: "100%",
};

export function ItineraryEventCard({
  event,
  tripId,
  onUpdate,
  onDelete,
  isDragOverlay,
}: ItineraryEventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: event.name,
    description: event.description || "",
    tips: event.tips || "",
    location: event.location || "",
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    timeLabel: event.timeLabel || "",
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const categoryStyle = ITINERARY_CATEGORY_STYLES[event.category] ||
    ITINERARY_CATEGORY_STYLES.OTHER;
  const timeDisplay = getTimeDisplay(event);

  const handleSave = async () => {
    try {
      const res = await apiFetch(
        `/api/trips/${tripId}/itinerary/events/${event.id}`,
        { method: "PATCH", body: JSON.stringify(editData) }
      );
      const updated = await res.json();
      onUpdate({ ...event, ...updated });
      setEditing(false);
    } catch (err) {
      console.error("Failed to update event:", err);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await apiFetch(`/api/trips/${tripId}/itinerary/events/${event.id}`, {
        method: "DELETE",
      });
      onDelete(event.id);
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const handleToggleCompleted = async () => {
    try {
      const res = await apiFetch(
        `/api/trips/${tripId}/itinerary/events/${event.id}`,
        { method: "PATCH", body: JSON.stringify({ completed: !event.completed }) }
      );
      const updated = await res.json();
      onUpdate({ ...event, ...updated });
    } catch (err) {
      console.error("Failed to toggle completed:", err);
    }
  };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={{
        ...style,
        background: event.completed
          ? "rgba(16,185,129,0.05)"
          : "var(--bg-card)",
        border: `1.5px solid ${event.completed ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
        borderRadius: "var(--radius-xs)",
        padding: "12px 14px",
        marginBottom: 8,
        ...(isDragOverlay
          ? { boxShadow: "0 8px 24px rgba(0,0,0,0.25)", cursor: "grabbing" }
          : {}),
      }}
    >
      {/* Main row: drag handle + time + content */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: "grab",
            color: "var(--text-muted)",
            paddingTop: 2,
            flexShrink: 0,
            touchAction: "none",
          }}
        >
          <GripVertical size={16} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Time + category row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            {timeDisplay && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "var(--ocean-light)",
                  fontWeight: 600,
                }}
              >
                <Clock size={12} />
                {timeDisplay}
              </span>
            )}
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "var(--radius-xs)",
                background: categoryStyle.bg,
                color: categoryStyle.color,
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {event.category.replace("_", " ")}
            </span>
            {event.completed && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 11,
                  color: "var(--tropical)",
                  fontWeight: 600,
                }}
              >
                <Check size={12} /> Done
              </span>
            )}
          </div>

          {/* Name */}
          <h5
            style={{
              fontFamily: "var(--font-outfit)",
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 2,
              color: "var(--text-primary)",
            }}
          >
            {event.name}
          </h5>

          {/* Description (collapsed by default) */}
          {!expanded && event.description && (
            <p
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {event.description}
            </p>
          )}

          {/* Expanded content */}
          {expanded && (
            <div style={{ marginTop: 8 }}>
              {editing ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <input
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    placeholder="Event name"
                    style={inputStyle}
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    placeholder="Description"
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                  <textarea
                    value={editData.tips}
                    onChange={(e) =>
                      setEditData({ ...editData, tips: e.target.value })
                    }
                    placeholder="Tips, directions, what to bring..."
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                  <input
                    value={editData.location}
                    onChange={(e) =>
                      setEditData({ ...editData, location: e.target.value })
                    }
                    placeholder="Location"
                    style={inputStyle}
                  />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <input
                      type="time"
                      value={editData.startTime}
                      onChange={(e) =>
                        setEditData({ ...editData, startTime: e.target.value })
                      }
                      style={inputStyle}
                    />
                    <input
                      type="time"
                      value={editData.endTime}
                      onChange={(e) =>
                        setEditData({ ...editData, endTime: e.target.value })
                      }
                      style={inputStyle}
                    />
                    <input
                      value={editData.timeLabel}
                      onChange={(e) =>
                        setEditData({ ...editData, timeLabel: e.target.value })
                      }
                      placeholder="e.g. Morning"
                      style={inputStyle}
                    />
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
                  >
                    <button
                      onClick={() => setEditing(false)}
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
                      onClick={handleSave}
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
                <>
                  {event.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                        marginBottom: 8,
                      }}
                    >
                      {event.description}
                    </p>
                  )}
                  {event.tips && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                        background: "var(--bg-dark)",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-xs)",
                        marginBottom: 8,
                      }}
                    >
                      {event.tips}
                    </p>
                  )}
                  {event.location && (
                    <p
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginBottom: 8,
                      }}
                    >
                      <MapPin size={12} /> {event.location}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={handleToggleCompleted}
                      style={{
                        padding: "6px 12px",
                        border: `1.5px solid ${event.completed ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                        borderRadius: "var(--radius-xs)",
                        background: event.completed
                          ? "rgba(16,185,129,0.1)"
                          : "none",
                        color: event.completed
                          ? "var(--tropical)"
                          : "var(--text-muted)",
                        fontSize: 11,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: 600,
                      }}
                    >
                      <Check size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                      {event.completed ? "Completed" : "Mark Done"}
                    </button>
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        padding: "6px 12px",
                        border: "1.5px solid var(--border)",
                        borderRadius: "var(--radius-xs)",
                        background: "none",
                        color: "var(--text-muted)",
                        fontSize: 11,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteEvent}
                      style={{
                        padding: "6px 12px",
                        border: "1.5px solid rgba(255,107,90,0.3)",
                        borderRadius: "var(--radius-xs)",
                        background: "none",
                        color: "var(--coral)",
                        fontSize: 11,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <Trash2 size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />
                      Remove
                    </button>
                  </div>

                  {/* Journal section */}
                  <EventJournal
                    event={event}
                    tripId={tripId}
                    onUpdate={onUpdate}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Expand/collapse toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 4,
            flexShrink: 0,
          }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
}
