"use client";

interface HeaderProps {
  onCreateRoute: () => void;
  onLoadRoutes: () => void;
  showingRoutes: boolean;
}

export default function Header({
  onCreateRoute,
  onLoadRoutes,
  showingRoutes,
}: HeaderProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-panel">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Omini
        </h1>
        <span className="text-sm text-muted">{today}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onLoadRoutes}
          className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-border/50 transition-colors"
        >
          {showingRoutes ? "Hide Routes" : "Saved Routes"}
        </button>
        <button
          onClick={onCreateRoute}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
        >
          Create Route
        </button>
      </div>
    </header>
  );
}
