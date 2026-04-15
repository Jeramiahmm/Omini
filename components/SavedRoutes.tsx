"use client";

import { useEffect, useState } from "react";
import { listRoutes, deleteRoute, type RouteListItem } from "@/lib/api";

interface SavedRoutesProps {
  onSelectRoute: (routeId: number) => void;
}

function formatDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function SavedRoutes({ onSelectRoute }: SavedRoutesProps) {
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listRoutes().then(setRoutes).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try { await deleteRoute(id); setRoutes((prev) => prev.filter((r) => r.id !== id)); } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
  };

  if (loading) return <div className="p-4 text-sm text-muted">Loading...</div>;
  if (error) return <div className="p-4 text-sm text-danger">{error}</div>;
  if (routes.length === 0) return <div className="p-4 text-sm text-muted text-center">No saved routes yet</div>;

  return (
    <div className="overflow-y-auto">
      {routes.map((route) => {
        const pct = route.stop_count > 0 ? (route.completed_count / route.stop_count) * 100 : 0;
        return (
          <div key={route.id} className="border-b border-border hover:bg-panel-hover group">
            <button onClick={() => onSelectRoute(route.id)} className="w-full text-left px-4 py-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold">Route #{route.id}</p>
                  <p className="text-xs text-muted mt-0.5">{formatDate(route.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground">{formatDist(route.total_distance)}</p>
                  <p className="text-xs text-muted">{route.completed_count}/{route.stop_count}</p>
                </div>
              </div>
              <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent to-success" style={{ width: `${pct}%` }} />
              </div>
            </button>
            <div className="flex items-center gap-3 px-4 pb-2 opacity-0 group-hover:opacity-100">
              <a href={`/driver/${route.id}`} className="text-xs text-accent hover:underline" onClick={(e) => e.stopPropagation()}>Driver View</a>
              <button onClick={(e) => handleDelete(e, route.id)} className="text-xs text-muted hover:text-danger">Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
