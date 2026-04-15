"use client";

import { useRef, useState, useCallback } from "react";
import type { StopInput } from "@/lib/api";
import { batchGeocode } from "@/lib/geocode";

type Tab = "csv" | "paste";

interface ImportPanelProps {
  onStopsLoaded: (stops: StopInput[]) => void;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") { fields.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

export default function ImportPanel({ onStopsLoaded }: ImportPanelProps) {
  const [tab, setTab] = useState<Tab>("paste");
  const [pasteText, setPasteText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const hasToken = token && token !== "pk.your_mapbox_token_here";

  // Paste addresses → geocode
  const handlePaste = useCallback(async () => {
    if (!pasteText.trim()) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    const lines = pasteText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    try {
      const results = await batchGeocode(lines, token);
      const good = results.filter((r) => !r.failed);
      const bad = results.filter((r) => r.failed);
      if (good.length === 0) {
        setError("Could not geocode any addresses. Check spelling or try with city name.");
        setProcessing(false);
        return;
      }
      const stops: StopInput[] = good.map((r, i) => ({ id: i + 1, lat: r.lat, lng: r.lng, address: r.address }));
      onStopsLoaded(stops);
      setResult(`${good.length} stops added${bad.length > 0 ? `, ${bad.length} failed` : ""}`);
      setPasteText("");
    } catch {
      setError("Geocoding failed");
    }
    setProcessing(false);
  }, [pasteText, token, onStopsLoaded]);

  // CSV file upload
  const handleCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l);
        if (lines.length < 2) { setError("CSV must have header + data rows"); return; }
        const hdr = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
        const latI = hdr.indexOf("lat");
        const lngI = hdr.indexOf("lng");
        const addrI = hdr.indexOf("address");
        if (latI === -1 || lngI === -1) { setError("CSV header must have 'lat' and 'lng' columns"); return; }

        const stops: StopInput[] = [];
        for (let i = 1; i < lines.length; i++) {
          const p = parseCsvLine(lines[i]);
          const lat = parseFloat(p[latI]);
          const lng = parseFloat(p[lngI]);
          if (isNaN(lat) || isNaN(lng)) continue;
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
          stops.push({ id: i, lat, lng, address: addrI >= 0 ? p[addrI] || "" : "" });
        }
        if (stops.length === 0) { setError("No valid stops found in CSV"); return; }
        onStopsLoaded(stops);
        setResult(`${stops.length} stops imported from CSV`);
      } catch { setError("Failed to parse CSV"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex rounded-lg bg-surface border border-border overflow-hidden mb-3">
        {(["paste", "csv"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); setResult(null); }}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === t ? "bg-accent/10 text-accent-hover border-b-2 border-accent" : "text-muted hover:text-foreground"}`}
          >
            {t === "paste" ? "Paste Addresses" : "Upload CSV"}
          </button>
        ))}
      </div>

      {tab === "paste" && (
        <div className="space-y-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={hasToken
              ? "123 Main St, Longmont\n456 Oak Ave, Boulder\n789 Pine Dr, Lyons\n..."
              : "Set MAPBOX_TOKEN for address geocoding"
            }
            disabled={!hasToken}
            rows={5}
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-surface border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none disabled:opacity-40"
          />
          <button
            onClick={handlePaste}
            disabled={processing || !pasteText.trim() || !hasToken}
            className="w-full py-2.5 text-sm font-medium rounded-xl bg-surface border border-border text-foreground hover:bg-panel-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {processing ? "Geocoding..." : "Add Addresses"}
          </button>
        </div>
      )}

      {tab === "csv" && (
        <div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCsv} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full px-3 py-6 text-sm rounded-xl border-2 border-dashed border-border text-muted hover:text-foreground hover:border-border-bright"
          >
            <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Drop CSV or click to upload
          </button>
          <p className="mt-2 text-xs text-muted text-center">Format: address,lat,lng</p>
        </div>
      )}

      {error && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger">{error}</div>
      )}
      {result && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20 text-xs text-success">{result}</div>
      )}
    </div>
  );
}
