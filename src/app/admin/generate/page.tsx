"use client";

import { useState } from "react";
import { GenerateForm } from "@/components/admin/GenerateForm";
import { GenerateReviewCards } from "@/components/admin/GenerateReviewCards";
import type { GeneratedCatalogDestination } from "@/lib/generate-destinations";

export default function AdminGeneratePage() {
  const [phase, setPhase] = useState<"form" | "review">("form");
  const [generatedDestinations, setGeneratedDestinations] = useState<GeneratedCatalogDestination[]>([]);
  const [generationPrompt, setGenerationPrompt] = useState("");

  if (phase === "review") {
    return (
      <GenerateReviewCards
        destinations={generatedDestinations}
        generationPrompt={generationPrompt}
        onBack={() => setPhase("form")}
      />
    );
  }

  return (
    <GenerateForm
      onGenerated={(destinations, prompt) => {
        setGeneratedDestinations(destinations);
        setGenerationPrompt(prompt);
        setPhase("review");
      }}
    />
  );
}
