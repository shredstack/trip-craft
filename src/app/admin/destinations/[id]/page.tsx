"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DestinationEditForm } from "@/components/admin/DestinationEditForm";
import { apiFetch } from "@/lib/user";
import type { CatalogDestinationData } from "@/lib/types";

export default function AdminDestinationEditPage() {
  const params = useParams();
  const id = params.id as string;
  const [destination, setDestination] = useState<CatalogDestinationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/admin/destinations/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Destination not found");
        return res.json();
      })
      .then(setDestination)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p style={{ color: "var(--text-muted)", padding: 40 }}>Loading...</p>;
  }

  if (error || !destination) {
    return <p style={{ color: "var(--coral)", padding: 40 }}>{error || "Destination not found"}</p>;
  }

  return <DestinationEditForm destination={destination} />;
}
