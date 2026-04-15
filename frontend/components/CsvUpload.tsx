"use client";

import { useRef, useState } from "react";
import type { StopInput } from "@/lib/api";

interface CsvUploadProps {
  onStopsLoaded: (stops: StopInput[]) => void;
}

export default function CsvUpload({ onStopsLoaded }: CsvUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length < 2) {
          setError("CSV must have a header row and at least one data row");
          return;
        }

        const header = lines[0].toLowerCase();
        if (!header.includes("lat") || !header.includes("lng")) {
          setError("CSV must have 'address', 'lat', 'lng' columns");
          return;
        }

        const cols = lines[0].split(",").map((c) => c.trim().toLowerCase());
        const latIdx = cols.indexOf("lat");
        const lngIdx = cols.indexOf("lng");
        const addrIdx = cols.indexOf("address");

        const stops: StopInput[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(",").map((p) => p.trim());
          const lat = parseFloat(parts[latIdx]);
          const lng = parseFloat(parts[lngIdx]);

          if (isNaN(lat) || isNaN(lng)) {
            setError(`Row ${i + 1}: invalid lat/lng values`);
            return;
          }
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            setError(`Row ${i + 1}: lat/lng out of range`);
            return;
          }

          stops.push({
            id: i,
            lat,
            lng,
            address: addrIdx >= 0 ? parts[addrIdx] : "",
          });
        }

        onStopsLoaded(stops);
        setError(null);
      } catch {
        setError("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <label className="text-xs font-medium text-muted uppercase tracking-wide">
        Import CSV
      </label>
      <div className="mt-2">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-dashed border-border text-muted hover:text-foreground hover:border-muted transition-colors"
        >
          {fileName || "Choose CSV file..."}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
      <p className="mt-1.5 text-xs text-muted">
        Format: address,lat,lng
      </p>
    </div>
  );
}
