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
  const [showAllStops, setShowAllStops] = useState(false);

  useEffect(() => {
    setLoading(true);
    getRoute(parseInt(routeId))
      .then((route) => {
        const sorted = [...route.stops].sort((a, b) => a.position - b.position);
        setStops(sorted);
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
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center space-y-3">
          <svg
            className="animate-spin h-8 w-8 text-accent mx-auto"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-muted text-sm">Loading route...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 bg-background">
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-6 text-center max-w-sm">
          <p className="text-red-400 mb-4">{error}</p>
          <a
            href="/"
            className="inline-block px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const completedCount = stops.filter((s) => s.completed).length;
  const totalCount = stops.length;
  const allDone = currentIndex >= totalCount;
  const currentStop = stops[currentIndex];
  const nextStop = stops[currentIndex + 1];
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-panel flex-shrink-0">
        <div>
          <a
            href="/"
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            &larr; Dashboard
          </a>
          <h1 className="text-base sm:text-lg font-bold mt-0.5">
            Route #{routeId}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xl sm:text-2xl font-bold tabular-nums">
            {completedCount}
            <span className="text-muted text-sm sm:text-base font-normal">
              {" "}/ {totalCount}
            </span>
          </p>
          <p className="text-xs text-muted">stops completed</p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1.5 bg-border flex-shrink-0">
        <div
          className="h-full bg-success transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {allDone ? (
          <div className="flex flex-col items-center justify-center min-h-full p-6 text-center">
            <div className="text-6xl text-success mb-4">&#10003;</div>
            <h2 className="text-2xl font-bold text-success">Route Complete!</h2>
            <p className="text-muted mt-2">
              All {totalCount} stops have been completed.
            </p>
            <a
              href="/"
              className="inline-block mt-6 px-6 py-3 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        ) : (
          <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
            {/* Current stop */}
            <div>
              <label className="text-xs text-muted uppercase tracking-wide font-medium">
                Current Stop
              </label>
              <div className="mt-2 p-4 sm:p-5 rounded-xl border-2 border-accent/40 bg-accent/5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                    {currentIndex + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-base sm:text-lg font-medium leading-snug break-words">
                      {currentStop.address ||
                        `${currentStop.latitude.toFixed(4)}, ${currentStop.longitude.toFixed(4)}`}
                    </p>
                    <p className="text-xs sm:text-sm text-muted mt-1 tabular-nums">
                      {currentStop.latitude.toFixed(6)},{" "}
                      {currentStop.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next stop preview */}
            {nextStop && (
              <div>
                <label className="text-xs text-muted uppercase tracking-wide font-medium">
                  Next Stop
                </label>
                <div className="mt-2 p-3 sm:p-4 rounded-xl border border-border bg-panel">
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-border text-muted text-xs font-bold">
                      {currentIndex + 2}
                    </span>
                    <p className="text-sm text-muted truncate">
                      {nextStop.address ||
                        `${nextStop.latitude.toFixed(4)}, ${nextStop.longitude.toFixed(4)}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full px-4 py-4 text-base font-medium rounded-xl border-2 border-border text-foreground hover:bg-border/40 active:bg-border/60 transition-colors"
              >
                Navigate &rarr;
              </a>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full px-4 py-4 text-base font-medium rounded-xl bg-success text-white hover:bg-success/90 active:bg-success/80 disabled:opacity-50 transition-colors"
              >
                {completing ? "Marking..." : "Mark Complete"}
              </button>
            </div>

            {/* All stops toggle */}
            <div className="pt-2">
              <button
                onClick={() => setShowAllStops((v) => !v)}
                className="w-full text-xs text-muted hover:text-foreground transition-colors py-2"
              >
                {showAllStops ? "Hide all stops" : `Show all ${totalCount} stops`}
              </button>
              {showAllStops && (
                <div className="mt-2 rounded-xl border border-border overflow-hidden">
                  {stops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      className={`flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 ${
                        idx === currentIndex
                          ? "bg-accent/10"
                          : stop.completed
                            ? "opacity-50"
                            : ""
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                          stop.completed
                            ? "bg-success/20 text-success"
                            : idx === currentIndex
                              ? "bg-accent text-white"
                              : "bg-border text-muted"
                        }`}
                      >
                        {stop.completed ? "\u2713" : idx + 1}
                      </span>
                      <p className="text-xs truncate flex-1">
                        {stop.address ||
                          `${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      {!allDone && (
        <div className="border-t border-border bg-panel px-4 py-3 flex-shrink-0">
          <div className="flex justify-between items-center max-w-lg mx-auto">
            <p className="text-xs text-muted">
              {completedCount} of {totalCount} stops completed
            </p>
            <p className="text-xs text-muted tabular-nums">
              {Math.round(progressPct)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
