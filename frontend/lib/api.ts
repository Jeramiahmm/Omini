const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface StopInput {
  id: number;
  lat: number;
  lng: number;
  address: string;
}

export interface OptimizeResponse {
  route: number[];
  distance: number;
  duration: number;
}

export interface RouteStopDetail {
  id: number;
  stop_id: number;
  position: number;
  completed: boolean;
  latitude: number;
  longitude: number;
  address: string;
}

export interface RouteDetail {
  id: number;
  created_at: string;
  total_distance: number;
  total_duration: number;
  stops: RouteStopDetail[];
}

export interface RouteListItem {
  id: number;
  created_at: string;
  total_distance: number;
  total_duration: number;
  stop_count: number;
  completed_count: number;
}

export async function optimizeRoute(
  stops: StopInput[]
): Promise<OptimizeResponse> {
  const res = await fetch(`${API_BASE}/api/optimize-route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stops),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Optimization failed");
  }
  return res.json();
}

export async function saveRoute(data: {
  stops: StopInput[];
  route_order: number[];
  distance: number;
  duration: number;
}): Promise<RouteDetail> {
  const res = await fetch(`${API_BASE}/api/routes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Failed to save route");
  }
  return res.json();
}

export async function listRoutes(): Promise<RouteListItem[]> {
  const res = await fetch(`${API_BASE}/api/routes`);
  if (!res.ok) throw new Error("Failed to load routes");
  return res.json();
}

export async function getRoute(routeId: number): Promise<RouteDetail> {
  const res = await fetch(`${API_BASE}/api/routes/${routeId}`);
  if (!res.ok) throw new Error("Route not found");
  return res.json();
}

export async function markStopComplete(
  routeStopId: number
): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/route-stops/${routeStopId}/complete`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark stop complete");
  return res.json();
}
