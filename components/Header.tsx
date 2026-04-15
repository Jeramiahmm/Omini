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
    <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-panel flex-shrink-0">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex-shrink-0">
          Omini
        </h1>
        <span className="text-xs sm:text-sm text-muted truncate hidden sm:block">
          {today}
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          onClick={onLoadRoutes}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border border-border text-foreground hover:bg-border/50 transition-colors"
        >
          {showingRoutes ? "Hide" : "Routes"}
        </button>
        <button
          onClick={onCreateRoute}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
        >
          New Route
        </button>
      </div>
    </header>
  );
}
