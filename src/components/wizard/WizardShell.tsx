"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Rocket } from "lucide-react";
import { StepTravelers } from "./StepTravelers";
import { StepPreferences } from "./StepPreferences";
import { StepLogistics } from "./StepLogistics";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/user";
import type { TripCriteria } from "@/lib/types";

const TOTAL_STEPS = 3;

const defaultCriteria: TripCriteria = {
  adults: 2,
  children: 2,
  childAges: [5, 5],
  tripTypes: [],
  priorities: [],
  departCity: "",
  maxFlight: "5 hours",
  budget: "$$ ($1,000–$2,500)",
  travelMonth: "Flexible",
  tripDuration: "Week (5-7 days)",
  extraNotes: "",
};

export function WizardShell() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [criteria, setCriteria] = useState<TripCriteria>(defaultCriteria);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCriteria = (updates: Partial<TripCriteria>) => {
    setCriteria((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create trip
      const tripRes = await apiFetch("/api/trips", {
        method: "POST",
        body: JSON.stringify({ criteria }),
      });
      const trip = await tripRes.json();

      // 2. Kick off generation in the background (results page polls for completion)
      apiFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ tripId: trip.id }),
      });

      // 3. Redirect immediately to results
      router.push(`/results/${trip.id}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "60px 40px",
      }}
    >
      {/* Progress Dots */}
      <div style={{ display: "flex", gap: 8, marginBottom: 48, justifyContent: "center" }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 60 : 40,
              height: 6,
              borderRadius: 3,
              background:
                i === step
                  ? "var(--gradient-sunset)"
                  : i < step
                    ? "var(--tropical)"
                    : "var(--border)",
              transition: "all 0.4s",
            }}
          />
        ))}
      </div>

      {/* Step Content */}
      <div style={{ marginBottom: 48 }}>
        {step === 0 && <StepTravelers criteria={criteria} onChange={updateCriteria} />}
        {step === 1 && <StepPreferences criteria={criteria} onChange={updateCriteria} />}
        {step === 2 && <StepLogistics criteria={criteria} onChange={updateCriteria} />}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {step > 0 ? (
          <Button variant="back" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={16} />
            Back
          </Button>
        ) : (
          <div />
        )}

        {isLastStep ? (
          <Button
            variant="action"
            onClick={handleSubmit}
            disabled={isSubmitting || !criteria.departCity}
          >
            <Rocket size={16} />
            {isSubmitting ? "Finding destinations..." : "Find Destinations"}
          </Button>
        ) : (
          <Button variant="action" onClick={() => setStep(step + 1)}>
            Next →
          </Button>
        )}
      </div>
    </motion.div>
  );
}
