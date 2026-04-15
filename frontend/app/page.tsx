"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import CsvUpload from "@/components/CsvUpload";
import StopEntry from "@/components/StopEntry";
import StopList from "@/components/StopList";
import Map from "@/components/Map";
import SavedRoutes from "@/components/SavedRoutes";
import {
  optimizeRoute,
  saveRoute,
  getRoute,
  type StopInput,
} from "@/lib/api";

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

  const handleCreateRoute = useCallback(() => {
    setStops([]);
    setRouteOrder(null);
    setDistance(null);
    setDuration(null);
    setSavedRouteId(null);
    setError(null);
    setShowRoutes(false);
  }, []);

  const handleStopsLoaded = useCallback((newStops: StopInput[]) => {
    setStops(newStops);
    setRouteOrder(null);
    setDistance(null);
    setDuration(null);
    setSavedRouteId(null);
    setError(null);
  }, []);

  const handleAddStop = useCallback(
    (stop: StopInput) => {
      setStops((prev) => [...prev, stop]);
      setRouteOrder(null);
      setDistance(null);
      setDuration(null);
      setSavedRouteId(null);
    },
    []
  );

  const handleRemoveStop = useCallback((id: number) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
    setRouteOrder(null);
    setDistance(null);
    setDuration(null);
    setSavedRouteId(null);
  }, []);

  const handleOptimize = useCallback(async () => {
    if (stops.length < 2) {
      setError("Add at least 2 stops to optimize");
      return;
    }
    setOptimizing(true);
    setError(null);
    try {
      const result = await optimizeRoute(stops);
      setRouteOrder(result.route);
      setDistance(result.distance);
      setDuration(result.duration);
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
      const saved = await saveRoute({
        stops,
        route_order: routeOrder,
        distance,
        duration,
      });
      setSavedRouteId(saved.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save route");
    } finally {
      setSaving(false);
    }
  }, [stops, routeOrder, distance, duration]);

  const handleSelectRoute = useCallback(async (routeId: number) => {
    try {
      const route = await getRoute(routeId);
      const loadedStops: StopInput[] = route.stops.map((s) => ({
        id: s.stop_id,
        lat: s.latitude,
        lng: s.longitude,
        address: s.address,
      }));
      setStops(loadedStops);
      setRouteOrder(route.stops.map((s) => s.stop_id));
      setDistance(route.total_distance);
      setDuration(route.total_duration);
      setSavedRouteId(route.id);
      setShowRoutes(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load route");
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <Header
        onCreateRoute={handleCreateRoute}
        onLoadRoutes={() => setShowRoutes((v) => !v)}
        showingRoutes={showRoutes}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-72 flex-shrink-0 border-r border-border bg-panel overflow-y-auto">
          <div className="p-4 space-y-5">
            <CsvUpload onStopsLoaded={handleStopsLoaded} />
            <div className="border-t border-border" />
            <StopEntry
              onAddStop={handleAddStop}
              nextId={stops.length > 0 ? Math.max(...stops.map((s) => s.id)) + 1 : 1}
            />
            <div className="border-t border-border" />

            {/* Optimize button */}
            <button
              onClick={handleOptimize}
              disabled={optimizing || stops.length < 2}
              className="w-full px-4 py-3 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {optimizing ? "Optimizing..." : "Optimize Route"}
            </button>

            {/* Save button */}
            {routeOrder && !savedRouteId && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-success text-success hover:bg-success/10 disabled:opacity-40 transition-colors"
              >
                {saving ? "Saving..." : "Save Route"}
              </button>
            )}

            {/* Saved confirmation */}
            {savedRouteId && (
              <div className="text-center">
                <p className="text-sm text-success">Route saved!</p>
                <a
                  href={`/driver/${savedRouteId}`}
                  className="text-xs text-accent hover:underline"
                >
                  Open Driver View &rarr;
                </a>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}
          </div>

          {/* Saved routes panel */}
          {showRoutes && (
            <div className="border-t border-border">
              <div className="p-3 border-b border-border">
                <span className="text-xs font-medium text-muted uppercase tracking-wide">
                  Saved Routes
                </span>
              </div>
              <SavedRoutes onSelectRoute={handleSelectRoute} />
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map stops={stops} routeOrder={routeOrder} />
          {/* Stop count overlay */}
          {stops.length > 0 && (
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-panel/90 rounded-lg border border-border text-xs text-muted backdrop-blur-sm">
              {stops.length} stop{stops.length !== 1 ? "s" : ""}
              {routeOrder ? " — optimized" : ""}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-80 flex-shrink-0 border-l border-border bg-panel">
          <div className="p-3 border-b border-border">
            <span className="text-xs font-medium text-muted uppercase tracking-wide">
              {routeOrder ? "Optimized Route" : "Stops"}
            </span>
          </div>
          <StopList
            stops={stops}
            routeOrder={routeOrder}
            distance={distance}
            duration={duration}
            onRemoveStop={handleRemoveStop}
          />
        </div>
      </div>
    </div>
  );
}
