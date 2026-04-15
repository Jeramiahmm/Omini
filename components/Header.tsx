"use client";

interface HeaderProps {
  onCreateRoute: () => void;
  onLoadRoutes: () => void;
  showingRoutes: boolean;
  stopCount: number;
  isOptimized: boolean;
}

export default function Header({
  onCreateRoute,
  onLoadRoutes,
  showingRoutes,
  stopCount,
  isOptimized,
}: HeaderProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-panel flex-shrink-0">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-cyan-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 12h4l3-9 4 18 3-9h4" />
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight">Omini</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs rounded-full bg-surface border border-border text-muted">{today}</span>
          {stopCount > 0 && (
            <span className={`px-2.5 py-1 text-xs rounded-full border ${isOptimized ? "bg-accent/10 border-accent/30 text-accent-hover" : "bg-surface border-border text-muted"}`}>
              {stopCount} stops{isOptimized ? " · optimized" : ""}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onLoadRoutes}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${showingRoutes ? "border-accent/50 text-accent-hover bg-accent/5" : "border-border text-muted-foreground hover:text-foreground hover:border-border-bright"}`}
        >
          {showingRoutes ? "Hide Routes" : "Saved Routes"}
        </button>
        <button
          onClick={onCreateRoute}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-accent to-indigo-500 text-white hover:brightness-110 transition-all shadow-lg shadow-accent-glow"
        >
          + New Route
        </button>
      </div>
    </header>
  );
}
