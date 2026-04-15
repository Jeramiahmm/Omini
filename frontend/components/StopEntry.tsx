"use client";

import { useState } from "react";
import type { StopInput } from "@/lib/api";

interface StopEntryProps {
  onAddStop: (stop: StopInput) => void;
  nextId: number;
}

export default function StopEntry({ onAddStop, nextId }: StopEntryProps) {
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    setError(null);
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      setError("Enter valid lat/lng numbers");
      return;
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setError("Lat/lng out of range");
      return;
    }

    onAddStop({ id: nextId, lat: latNum, lng: lngNum, address });
    setAddress("");
    setLat("");
    setLng("");
  }

  return (
    <div>
      <label className="text-xs font-medium text-muted uppercase tracking-wide">
        Add Stop
      </label>
      <div className="mt-2 space-y-2">
        <input
          type="text"
          placeholder="Address (optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-1/2 px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder="Longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="w-1/2 px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={handleAdd}
          className="w-full px-3 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-border/50 transition-colors"
        >
          Add Stop
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
