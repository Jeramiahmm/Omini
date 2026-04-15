"use client";

import { useEffect, useState, useCallback, use } from "react";
import { getRoute, markStopComplete, type RouteStopDetail } from "@/lib/api";

interface DriverPageProps {
  params: Promise<{ routeId: string }>;
}

export default function DriverPage({ params }: DriverPageProps) {
  const { routeId } = use(params);
  const [stops, setStops] = useState<RouteStopDetail[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getRoute(parseInt(routeId))
      .then((route) => {
        const sorted = [...route.stops].sort((a, b) => a.position - b.position);
        setStops(sorted);
        // Find first incomplete stop
        const firstIncomplete = sorted.findIndex((s) => !s.completed);
        setCurrentIndex(firstIncomplete >= 0 ? firstIncomplete : sorted.length);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [routeId]);

  const handleComplete = useCallback(async () => {
    const stop = stops[currentIndex];
    if (!stop) return;
    setCompleting(true);
    try {
      await markStopComplete(stop.id);
      setStops((prev) =>
        prev.map((s) => (s.id === stop.id ? { ...s, completed: true } : s))
      );
      setCurrentIndex((prev) => prev + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark complete");
    } finally {
      setCompleting(false);
    }
  }, [stops, currentIndex]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted">Loading route...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <p className="text-red-400">{error}</p>
        <a
          href="/"
          className="text-sm text-accent hover:underline"
        >
          &larr; Back to Dashboard
        </a>
      </div>
    );
  }

  const completedCount = stops.filter((s) => s.completed).length;
  const totalCount = stops.length;
  const allDone = currentIndex >= totalCount;
  const currentStop = stops[currentIndex];
  const nextStop = stops[currentIndex + 1];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border bg-panel">
        <div>
          <a
            href="/"
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            &larr; Dashboard
          </a>
          <h1 className="text-lg font-bold mt-0.5">Route #{routeId}</h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {completedCount}{" "}
            <span className="text-muted text-base font-normal">/ {totalCount}</span>
          </p>
          <p className="text-xs text-muted">stops completed</p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-2 bg-border">
        <div
          className="h-full bg-success transition-all duration-300"
          style={{
            width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {allDone ? (
          <div className="text-center space-y-4">
            <div className="text-6xl">&#10003;</div>
            <h2 className="text-2xl font-bold text-success">Route Complete!</h2>
            <p className="text-muted">
              All {totalCount} stops have been completed.
            </p>
            <a
              href="/"
              className="inline-block mt-4 px-6 py-3 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-8">
            {/* Current stop */}
            <div className="space-y-2">
              <label className="text-xs text-muted uppercase tracking-wide">
                Current Stop
              </label>
              <div className="p-5 rounded-xl border border-accent/50 bg-accent/5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                    {currentIndex + 1}
                  </span>
                  <div>
                    <p className="text-lg font-medium">
                      {currentStop.address ||
                        `${currentStop.latitude.toFixed(4)}, ${currentStop.longitude.toFixed(4)}`}
                    </p>
                    <p className="text-sm text-muted mt-1">
                      {currentStop.latitude.toFixed(6)},{" "}
                      {currentStop.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next stop preview */}
            {nextStop && (
              <div className="space-y-2">
                <label className="text-xs text-muted uppercase tracking-wide">
                  Next Stop
                </label>
                <div className="p-4 rounded-xl border border-border bg-panel">
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-border text-muted text-xs font-bold">
                      {currentIndex + 2}
                    </span>
                    <p className="text-sm text-muted">
                      {nextStop.address ||
                        `${nextStop.latitude.toFixed(4)}, ${nextStop.longitude.toFixed(4)}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-4">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full px-4 py-4 text-base font-medium rounded-xl border border-border text-foreground hover:bg-border/50 transition-colors"
              >
                Navigate &rarr;
              </a>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full px-4 py-4 text-base font-medium rounded-xl bg-success text-white hover:bg-success/90 disabled:opacity-50 transition-colors"
              >
                {completing ? "Marking..." : "Mark Complete"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Completed stops footer */}
      {!allDone && completedCount > 0 && (
        <div className="border-t border-border bg-panel p-4">
          <p className="text-xs text-muted text-center">
            {completedCount} of {totalCount} stops completed
          </p>
        </div>
      )}
    </div>
  );
}
