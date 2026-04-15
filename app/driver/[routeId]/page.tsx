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
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    getRoute(parseInt(routeId))
      .then((route) => {
        const sorted = [...route.stops].sort((a, b) => a.position - b.position);
        setStops(sorted);
        const first = sorted.findIndex((s) => !s.completed);
        setCurrentIndex(first >= 0 ? first : sorted.length);
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
      setStops((prev) => prev.map((s) => (s.id === stop.id ? { ...s, completed: true } : s)));
      setCurrentIndex((prev) => prev + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setCompleting(false);
    }
  }, [stops, currentIndex]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 bg-background">
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center max-w-sm">
          <p className="text-danger mb-4">{error}</p>
          <a href="/" className="inline-block px-5 py-2.5 text-sm rounded-xl bg-accent text-white">Back to Dashboard</a>
        </div>
      </div>
    );
  }

  const completed = stops.filter((s) => s.completed).length;
  const total = stops.length;
  const allDone = currentIndex >= total;
  const current = stops[currentIndex];
  const next = stops[currentIndex + 1];
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-panel flex-shrink-0">
        <div className="flex items-center gap-3">
          <a href="/" className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </a>
          <div>
            <h1 className="text-base sm:text-lg font-bold">Route #{routeId}</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl sm:text-2xl font-bold tabular-nums">
            {completed}<span className="text-muted text-sm font-normal"> / {total}</span>
          </p>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1.5 bg-border flex-shrink-0">
        <div className="h-full bg-gradient-to-r from-accent to-success transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {allDone ? (
          <div className="flex flex-col items-center justify-center min-h-full p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-success">Route Complete!</h2>
            <p className="text-muted mt-2">All {total} stops done.</p>
            <a href="/" className="mt-6 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-accent to-indigo-500 text-white shadow-lg shadow-accent-glow">Back to Dashboard</a>
          </div>
        ) : (
          <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-5">
            {/* Current */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">Current Stop</label>
              <div className="mt-2 p-4 sm:p-5 rounded-2xl border-2 border-accent/40 bg-accent/5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-accent to-cyan-500 text-white text-sm font-bold pulse-accent">
                    {currentIndex + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-base sm:text-lg font-semibold break-words">
                      {current.address || `${current.latitude.toFixed(4)}, ${current.longitude.toFixed(4)}`}
                    </p>
                    <p className="text-xs text-muted mt-1 tabular-nums">{current.latitude.toFixed(6)}, {current.longitude.toFixed(6)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next */}
            {next && (
              <div>
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">Next Stop</label>
                <div className="mt-2 p-3 sm:p-4 rounded-2xl border border-border bg-surface">
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-border text-muted text-xs font-bold">{currentIndex + 2}</span>
                    <p className="text-sm text-muted truncate">{next.address || `${next.latitude.toFixed(4)}, ${next.longitude.toFixed(4)}`}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${current.latitude},${current.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 text-base font-semibold rounded-2xl border-2 border-border text-foreground hover:bg-panel-hover active:bg-surface"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-6 4 3 7-7-5-7 5 3-7-6-4h7z"/></svg>
                Navigate
              </a>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full py-4 text-base font-bold rounded-2xl bg-gradient-to-r from-success to-emerald-500 text-white shadow-lg shadow-success-glow disabled:opacity-50 active:brightness-90"
              >
                {completing ? "Marking..." : "Mark Complete"}
              </button>
            </div>

            {/* All stops */}
            <button onClick={() => setShowAll((v) => !v)} className="w-full text-xs text-muted hover:text-foreground py-2">
              {showAll ? "Hide all stops" : `Show all ${total} stops`}
            </button>
            {showAll && (
              <div className="rounded-2xl border border-border overflow-hidden">
                {stops.map((s, i) => (
                  <div key={s.id} className={`flex items-center gap-3 px-3 py-2 border-b border-border last:border-0 ${i === currentIndex ? "bg-accent/10" : s.completed ? "opacity-40" : ""}`}>
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${s.completed ? "bg-success/20 text-success" : i === currentIndex ? "bg-accent text-white" : "bg-surface text-muted"}`}>
                      {s.completed ? "✓" : i + 1}
                    </span>
                    <p className="text-xs truncate flex-1">{s.address || `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}`}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!allDone && (
        <div className="border-t border-border bg-panel px-4 py-3 flex-shrink-0">
          <div className="flex justify-between items-center max-w-lg mx-auto">
            <p className="text-xs text-muted">{completed} of {total} completed</p>
            <p className="text-xs font-semibold text-accent-hover tabular-nums">{Math.round(pct)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
