"use client";

import { useRef, useState } from "react";
import type { StopInput } from "@/lib/api";

interface CsvUploadProps {
  onStopsLoaded: (stops: StopInput[]) => void;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
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
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length < 2) {
          setError("CSV must have a header row and at least one data row");
          return;
        }

        const headerFields = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
        const latIdx = headerFields.indexOf("lat");
        const lngIdx = headerFields.indexOf("lng");
        const addrIdx = headerFields.indexOf("address");

        if (latIdx === -1 || lngIdx === -1) {
          setError("CSV header must include 'lat' and 'lng' columns");
          return;
        }

        const stops: StopInput[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const parts = parseCsvLine(lines[i]);
          const lat = parseFloat(parts[latIdx]);
          const lng = parseFloat(parts[lngIdx]);

          if (isNaN(lat) || isNaN(lng)) {
            errors.push(`Row ${i + 1}: invalid lat/lng`);
            continue;
          }
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            errors.push(`Row ${i + 1}: lat/lng out of range`);
            continue;
          }

          stops.push({
            id: i,
            lat,
            lng,
            address: addrIdx >= 0 ? parts[addrIdx] || "" : "",
          });
        }

        if (stops.length === 0) {
          setError(
            errors.length > 0
              ? errors.join("; ")
              : "No valid stops found in CSV"
          );
          return;
        }

        if (errors.length > 0) {
          setError(`${errors.length} rows skipped: ${errors[0]}`);
        }

        onStopsLoaded(stops);
      } catch {
        setError("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-uploaded
    e.target.value = "";
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
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <p className="mt-1.5 text-xs text-muted">Format: address,lat,lng</p>
    </div>
  );
}
