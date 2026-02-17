"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Prediction {
  placeId: string;
  description: string;
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function PlaceAutocomplete({
  value,
  onChange,
  placeholder,
  style,
}: PlaceAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isValid, setIsValid] = useState(value.length > 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
    setIsValid(value.length > 0);
  }, [value]);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.trim().length < 2) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(input)}`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setPredictions(data);
        setIsOpen(data.length > 0);
      }
    } catch {
      setPredictions([]);
      setIsOpen(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    // Clear the parent value — user must pick from dropdown
    onChange("");
    setIsValid(false);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 300);
  };

  const handleSelect = (description: string) => {
    setInputValue(description);
    onChange(description);
    setIsValid(true);
    setPredictions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < predictions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : predictions.length - 1
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(predictions[activeIndex].description);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validationColor =
    !isValid && inputValue.length > 0
      ? "var(--coral)"
      : isValid
        ? "var(--tropical)"
        : undefined;

  // Decompose the parent's `border` shorthand into longhand properties
  // to avoid React warnings about mixing shorthand and longhand styles.
  const { border, ...restStyle } = style ?? {};
  const baseStyle: React.CSSProperties = border
    ? { ...restStyle, borderWidth: "1.5px", borderStyle: "solid", borderColor: "var(--border)" }
    : { ...restStyle };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (predictions.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        style={{
          ...baseStyle,
          ...(validationColor ? { borderColor: validationColor, transition: "border-color 0.2s" } : {}),
        }}
        autoComplete="off"
      />
      {isOpen && predictions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 50,
            margin: 0,
            padding: 0,
            listStyle: "none",
            background: "var(--bg-card)",
            border: "1.5px solid var(--border)",
            borderTop: "none",
            borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {predictions.map((p, i) => (
            <li
              key={p.placeId}
              onMouseDown={() => handleSelect(p.description)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                padding: "12px 18px",
                fontSize: 15,
                color:
                  i === activeIndex
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                background:
                  i === activeIndex
                    ? "rgba(255, 255, 255, 0.05)"
                    : "transparent",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {p.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
