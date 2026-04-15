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

function formatDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatTime(s: number): string {
  const mins = Math.round(s / 60);
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
}

export default function StopList({ stops, routeOrder, distance, duration, onRemoveStop }: StopListProps) {
  const orderedStops = routeOrder
    ? routeOrder.map((id) => stops.find((s) => s.id === id)).filter((s): s is Stop => !!s)
    : stops;

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      {distance !== null && duration !== null && (
        <div className="grid grid-cols-3 gap-0 border-b border-border flex-shrink-0">
          <div className="px-4 py-3 text-center border-r border-border">
            <p className="text-xs text-muted">Distance</p>
            <p className="text-sm font-bold gradient-text">{formatDist(distance)}</p>
          </div>
          <div className="px-4 py-3 text-center border-r border-border">
            <p className="text-xs text-muted">Duration</p>
            <p className="text-sm font-bold gradient-text">{formatTime(duration)}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-muted">Stops</p>
            <p className="text-sm font-bold text-foreground">{stops.length}</p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {orderedStops.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <p className="text-sm text-muted">No stops yet</p>
            <p className="text-xs text-muted mt-1">Search an address, upload CSV,<br/>or click on the map</p>
          </div>
        )}
        {orderedStops.map((stop, idx) => (
          <div
            key={stop.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-panel-hover group"
          >
            <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${routeOrder ? "bg-gradient-to-br from-accent to-cyan-500 text-white" : "bg-surface border border-border text-muted"}`}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate text-foreground">
                {stop.address || `${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}`}
              </p>
              {stop.address && (
                <p className="text-xs text-muted tabular-nums">{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</p>
              )}
            </div>
            {!routeOrder && (
              <button
                onClick={() => onRemoveStop(stop.id)}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-muted hover:text-danger hover:bg-danger/10"
                title="Remove"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
