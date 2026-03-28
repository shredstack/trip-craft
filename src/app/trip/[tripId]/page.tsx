"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { TripDetailHeader } from "@/components/trip-detail/TripDetailHeader";
import { DetailTabs } from "@/components/trip-detail/DetailTabs";
import { DestinationsTab } from "@/components/trip-detail/DestinationsTab";
import { ExcursionsTab } from "@/components/trip-detail/ExcursionsTab";
import { ItineraryTab } from "@/components/trip-detail/itinerary/ItineraryTab";
import { LogisticsTab } from "@/components/trip-detail/LogisticsTab";
import { NotesTab } from "@/components/trip-detail/NotesTab";
import { AccommodationsTab } from "@/components/trip-detail/AccommodationsTab";
import { apiFetch } from "@/lib/user";

interface TripData {
  id: string;
  name: string;
  status: string;
  notes: string | null;
  createdAt: string;
  destinations: Array<{
    id: string;
    name: string;
    region: string | null;
    description: string | null;
    matchScore: number | null;
    flightTime: string | null;
    avgCostPp: number | string | null;
    bestMonths: string | null;
    avgRating: number | string | null;
    reviewCount: number | null;
    country: string | null;
    photoUrls: string[] | null;
    isSelected: boolean;
    excursions: Array<{
      id: string;
      name: string;
      type: string;
      description: string | null;
      priceEstimate: string | null;
      duration: string | null;
      kidFriendly: boolean;
      minAge: number | null;
      kidNotes: string | null;
    }>;
  }>;
  tripItems: Array<{
    id: string;
    type: string;
    name: string;
    description: string | null;
  }>;
  itinerary: { id: string } | null;
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<TripData | null>(null);
  const [activeTab, setActiveTab] = useState("destinations");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/api/trips/${tripId}`);
        const data = await res.json();
        setTrip(data);
      } catch (err) {
        console.error("Failed to load trip:", err);
      }
      setLoading(false);
    }
    load();
  }, [tripId]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this trip?")) return;
    await apiFetch(`/api/trips/${tripId}`, { method: "DELETE" });
    router.push("/dashboard");
  };

  const handleDeleteDestination = async (destinationId: string) => {
    try {
      await apiFetch(
        `/api/trips/${tripId}/destinations?destinationId=${destinationId}`,
        { method: "DELETE" }
      );
      setTrip({
        ...trip!,
        destinations: trip!.destinations.filter((d) => d.id !== destinationId),
      });
    } catch (err) {
      console.error("Failed to delete destination:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 40px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading trip...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 40px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Trip not found.</p>
      </div>
    );
  }

  // Flatten excursions from all destinations
  const allExcursions = trip.destinations.flatMap((d) =>
    d.excursions.map((e) => ({
      ...e,
      destination: { id: d.id, name: d.name },
    }))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 40px" }}
    >
      <TripDetailHeader
        trip={trip}
        onNameChange={(name) => setTrip({ ...trip, name })}
        onStatusChange={(status) => setTrip({ ...trip, status })}
      />

      <DetailTabs active={activeTab} onChange={setActiveTab} />

      <div style={{ minHeight: 300 }}>
        {activeTab === "destinations" && (
          <DestinationsTab
            destinations={trip.destinations}
            tripId={tripId}
            onDelete={handleDeleteDestination}
          />
        )}
        {activeTab === "excursions" && (
          <ExcursionsTab
            excursions={allExcursions}
            tripId={tripId}
            destinations={trip.destinations.map((d) => ({ id: d.id, name: d.name }))}
            onAdd={(exc) =>
              setTrip({
                ...trip,
                destinations: trip.destinations.map((d) =>
                  d.id === exc.destination.id
                    ? { ...d, excursions: [...d.excursions, exc] }
                    : d
                ),
              })
            }
          />
        )}
        {activeTab === "itinerary" && (
          <ItineraryTab
            tripId={tripId}
            hasItinerary={!!trip.itinerary}
            hasDestinations={trip.destinations.length > 0}
          />
        )}
        {activeTab === "accommodations" && (
          <AccommodationsTab
            destinations={trip.destinations.map((d) => ({
              id: d.id,
              name: d.name,
              country: d.country,
            }))}
            tripId={tripId}
          />
        )}
        {activeTab === "logistics" && (
          <LogisticsTab
            items={trip.tripItems}
            tripId={tripId}
            onAdd={(item) => setTrip({ ...trip, tripItems: [...trip.tripItems, item] })}
          />
        )}
        {activeTab === "notes" && <NotesTab notes={trip.notes || ""} tripId={tripId} />}
      </div>

      {/* Delete trip */}
      <div style={{ marginTop: 60, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <button
          onClick={handleDelete}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            border: "1.5px solid rgba(255,107,90,0.3)",
            borderRadius: "var(--radius-xs)",
            background: "none",
            color: "var(--coral)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        >
          <Trash2 size={14} />
          Delete Trip
        </button>
      </div>
    </motion.div>
  );
}
