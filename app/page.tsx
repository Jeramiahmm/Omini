"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import AddressSearch from "@/components/AddressSearch";
import ImportPanel from "@/components/ImportPanel";
import StopList from "@/components/StopList";
import Map from "@/components/Map";
import SavedRoutes from "@/components/SavedRoutes";
import { optimizeRoute, saveRoute, getRoute, type StopInput } from "@/lib/api";

export default function Dashboard() {
  const [stops, setStops] = useState<StopInput[]>([]);
  const [routeOrder, setRouteOrder] = useState<number[] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedRouteId, setSavedRouteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const [clickToAdd, setClickToAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const resetRoute = useCallback(() => {
    setRouteOrder(null);
    setDistance(null);
    setDuration(null);
    setSavedRouteId(null);
  }, []);

  const handleCreateRoute = useCallback(() => {
    setStops([]);
    resetRoute();
    setError(null);
    setShowRoutes(false);
  }, [resetRoute]);

  const handleStopsLoaded = useCallback((newStops: StopInput[]) => {
    setStops(newStops);
    resetRoute();
    setError(null);
    setShowImport(false);
  }, [resetRoute]);

  const handleAddStop = useCallback((stop: StopInput) => {
    setStops((prev) => [...prev, stop]);
    resetRoute();
  }, [resetRoute]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    const id = Date.now();
    handleAddStop({ id, lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  }, [handleAddStop]);

  const handleRemoveStop = useCallback((id: number) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
    resetRoute();
  }, [resetRoute]);

  const handleClearStops = useCallback(() => {
    setStops([]);
    resetRoute();
    setError(null);
  }, [resetRoute]);

  const handleOptimize = useCallback(async () => {
    if (stops.length < 2) { setError("Add at least 2 stops"); return; }
    setOptimizing(true);
    setError(null);
    try {
      const result = await optimizeRoute(stops);
      setRouteOrder(result.route);
      setDistance(result.distance);
      setDuration(result.duration);
      setSavedRouteId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimization failed");
    } finally {
      setOptimizing(false);
    }
  }, [stops]);

  const handleSave = useCallback(async () => {
    if (!routeOrder || distance === null || duration === null) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveRoute({ stops, route_order: routeOrder, distance, duration });
      setSavedRouteId(saved.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [stops, routeOrder, distance, duration]);

  const handleSelectRoute = useCallback(async (routeId: number) => {
    try {
      const route = await getRoute(routeId);
      setStops(route.stops.map((s) => ({ id: s.stop_id, lat: s.latitude, lng: s.longitude, address: s.address })));
      setRouteOrder(route.stops.map((s) => s.stop_id));
      setDistance(route.total_distance);
      setDuration(route.total_duration);
      setSavedRouteId(route.id);
      setShowRoutes(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load route");
    }
  }, []);

  const nextId = stops.length > 0 ? Math.max(...stops.map((s) => s.id)) + 1 : 1;

  return (
    <div className="flex flex-col h-full">
      <Header
        onCreateRoute={handleCreateRoute}
        onLoadRoutes={() => setShowRoutes((v) => !v)}
        showingRoutes={showRoutes}
        stopCount={stops.length}
        isOptimized={routeOrder !== null}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-80 flex-shrink-0 border-r border-border bg-panel flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Address search */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Add Stop</label>
              <AddressSearch onAddStop={handleAddStop} nextId={nextId} />
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setClickToAdd((v) => !v)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${clickToAdd ? "border-accent/50 text-accent-hover bg-accent/5" : "border-border text-muted hover:text-foreground"}`}
              >
                <svg className="inline mr-1 -mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                {clickToAdd ? "Stop Clicking" : "Click Map"}
              </button>
              <button
                onClick={() => setShowImport((v) => !v)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${showImport ? "border-accent/50 text-accent-hover bg-accent/5" : "border-border text-muted hover:text-foreground"}`}
              >
                <svg className="inline mr-1 -mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Import
              </button>
            </div>

            {/* Import panel */}
            {showImport && (
              <div className="rounded-xl border border-border bg-surface p-3">
                <ImportPanel onStopsLoaded={handleStopsLoaded} />
              </div>
            )}

            <div className="border-t border-border" />

            {/* Optimize button */}
            <button
              onClick={handleOptimize}
              disabled={optimizing || stops.length < 2}
              className="w-full py-3.5 text-sm font-bold rounded-xl bg-gradient-to-r from-accent to-indigo-500 text-white hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-accent-glow transition-all"
            >
              {optimizing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Optimizing...
                </span>
              ) : (
                <>Optimize Route{stops.length >= 2 ? ` (${stops.length} stops)` : ""}</>
              )}
            </button>

            {/* Save */}
            {routeOrder && !savedRouteId && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 text-sm font-medium rounded-xl border border-success/50 text-success hover:bg-success/5 disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save Route"}
              </button>
            )}

            {/* Clear */}
            {stops.length > 0 && !routeOrder && (
              <button onClick={handleClearStops} className="w-full py-2 text-xs rounded-lg text-muted hover:text-danger hover:bg-danger/5">
                Clear All Stops
              </button>
            )}

            {/* Status */}
            {savedRouteId && (
              <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-center">
                <p className="text-sm text-success font-semibold">Route #{savedRouteId} saved</p>
                <a href={`/driver/${savedRouteId}`} className="text-xs text-accent hover:underline mt-1 inline-block">Open Driver View &rarr;</a>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/5 p-3">
                <p className="text-sm text-danger text-center">{error}</p>
              </div>
            )}
          </div>

          {/* Saved routes */}
          {showRoutes && (
            <div className="border-t border-border flex-shrink-0 max-h-72 overflow-y-auto">
              <div className="px-4 py-2.5 border-b border-border sticky top-0 bg-panel">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Saved Routes</span>
              </div>
              <SavedRoutes onSelectRoute={handleSelectRoute} />
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map stops={stops} routeOrder={routeOrder} onMapClick={handleMapClick} clickToAdd={clickToAdd} />
        </div>

        {/* Right panel */}
        <div className="w-80 flex-shrink-0 border-l border-border bg-panel flex flex-col">
          <div className="px-4 py-2.5 border-b border-border flex-shrink-0 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              {routeOrder ? "Optimized Route" : "Stops"}
            </span>
            {routeOrder && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-hover font-semibold">
                OPTIMIZED
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <StopList stops={stops} routeOrder={routeOrder} distance={distance} duration={duration} onRemoveStop={handleRemoveStop} />
          </div>
        </div>
      </div>
    </div>
  );
}
