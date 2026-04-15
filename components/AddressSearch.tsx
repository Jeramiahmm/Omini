"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { searchAddress, type GeocodeSuggestion } from "@/lib/geocode";
import type { StopInput } from "@/lib/api";

interface AddressSearchProps {
  onAddStop: (stop: StopInput) => void;
  nextId: number;
}

export default function AddressSearch({ onAddStop, nextId }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  const doSearch = useCallback(
    async (q: string) => {
      if (q.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      const results = await searchAddress(q, token);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setLoading(false);
    },
    [token]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSelect = (s: GeocodeSuggestion) => {
    onAddStop({
      id: nextId,
      lat: s.lat,
      lng: s.lng,
      address: s.placeName,
    });
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const close = () => setShowDropdown(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const hasToken = token && token !== "pk.your_mapbox_token_here";

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={hasToken ? "Search address in Longmont, Boulder, Lyons..." : "Set MAPBOX_TOKEN for address search"}
          disabled={!hasToken}
          className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-surface border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-glow disabled:opacity-40"
        />
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        {loading && (
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-accent"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 py-1 rounded-xl bg-surface border border-border shadow-2xl shadow-black/50 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-panel-hover transition-colors"
            >
              <span className="text-foreground">{s.text}</span>
              <span className="block text-xs text-muted mt-0.5 truncate">{s.placeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
