"use client";

import { useEffect, useState } from "react";
import { listRoutes, deleteRoute, type RouteListItem } from "@/lib/api";

interface SavedRoutesProps {
  onSelectRoute: (routeId: number) => void;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SavedRoutes({ onSelectRoute }: SavedRoutesProps) {
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoutes = () => {
    setLoading(true);
    listRoutes()
      .then(setRoutes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const handleDelete = async (e: React.MouseEvent, routeId: number) => {
    e.stopPropagation();
    try {
      await deleteRoute(routeId);
      setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-muted">Loading routes...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-400">{error}</div>;
  }

  if (routes.length === 0) {
    return (
      <div className="p-4 text-sm text-muted text-center">
        No saved routes yet.
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {routes.map((route) => (
        <div
          key={route.id}
          className="border-b border-border hover:bg-border/30 transition-colors group"
        >
          <button
            onClick={() => onSelectRoute(route.id)}
            className="w-full text-left px-4 py-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">Route #{route.id}</p>
                <p className="text-xs text-muted mt-0.5">
                  {formatDate(route.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">
                  {formatDistance(route.total_distance)}
                </p>
                <p className="text-xs text-muted">
                  {route.completed_count}/{route.stop_count} done
                </p>
              </div>
            </div>
            <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{
                  width: `${route.stop_count > 0 ? (route.completed_count / route.stop_count) * 100 : 0}%`,
                }}
              />
            </div>
          </button>
          <div className="flex items-center gap-2 px-4 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={`/driver/${route.id}`}
              className="text-xs text-accent hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Driver View
            </a>
            <span className="text-border">|</span>
            <button
              onClick={(e) => handleDelete(e, route.id)}
              className="text-xs text-muted hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
