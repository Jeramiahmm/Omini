"use client";

interface Stop {
  id: number;
  lat: number;
  lng: number;
  address: string;
}

interface StopListProps {
  stops: Stop[];
  routeOrder: number[] | null;
  distance: number | null;
  duration: number | null;
  onRemoveStop: (id: number) => void;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  }
  return `${mins} min`;
}

export default function StopList({
  stops,
  routeOrder,
  distance,
  duration,
  onRemoveStop,
}: StopListProps) {
  const orderedStops = routeOrder
    ? routeOrder
        .map((id) => stops.find((s) => s.id === id))
        .filter((s): s is Stop => s !== undefined)
    : stops;

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      {distance !== null && duration !== null && (
        <div className="flex gap-4 p-4 border-b border-border">
          <div>
            <span className="text-xs text-muted">Distance</span>
            <p className="text-sm font-medium">{formatDistance(distance)}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Duration</span>
            <p className="text-sm font-medium">{formatDuration(duration)}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Stops</span>
            <p className="text-sm font-medium">{stops.length}</p>
          </div>
        </div>
      )}

      {/* Stop list */}
      <div className="flex-1 overflow-y-auto">
        {orderedStops.length === 0 && (
          <div className="p-4 text-sm text-muted text-center">
            No stops added yet.
            <br />
            Upload a CSV or add stops manually.
          </div>
        )}
        {orderedStops.map((stop, idx) => (
          <div
            key={stop.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-border/30 transition-colors group"
          >
            <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                {stop.address || `${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}`}
              </p>
              {stop.address && (
                <p className="text-xs text-muted">
                  {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                </p>
              )}
            </div>
            {!routeOrder && (
              <button
                onClick={() => onRemoveStop(stop.id)}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all text-sm"
                title="Remove stop"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
