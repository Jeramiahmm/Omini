import { NextRequest, NextResponse } from "next/server";
import { solveRoute } from "@/lib/optimizer";

interface StopInput {
  id: number;
  lat: number;
  lng: number;
  address?: string;
}

export async function POST(request: NextRequest) {
  let stops: StopInput[];
  try {
    stops = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(stops)) {
    return NextResponse.json({ detail: "Expected an array of stops" }, { status: 422 });
  }

  if (stops.length < 2) {
    return NextResponse.json(
      { detail: `At least 2 stops required, got ${stops.length}` },
      { status: 422 }
    );
  }

  if (stops.length > 500) {
    return NextResponse.json(
      { detail: `At most 500 stops allowed, got ${stops.length}` },
      { status: 422 }
    );
  }

  // Validate each stop
  const ids = new Set<number>();
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (typeof s.id !== "number" || typeof s.lat !== "number" || typeof s.lng !== "number") {
      return NextResponse.json(
        { detail: `Stop at index ${i}: id, lat, lng must be numbers` },
        { status: 422 }
      );
    }
    if (s.lat < -90 || s.lat > 90 || s.lng < -180 || s.lng > 180) {
      return NextResponse.json(
        { detail: `Stop ${s.id}: lat/lng out of range` },
        { status: 422 }
      );
    }
    if (ids.has(s.id)) {
      return NextResponse.json(
        { detail: "Duplicate stop IDs are not allowed" },
        { status: 422 }
      );
    }
    ids.add(s.id);
  }

  try {
    const result = solveRoute(stops);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Optimization failed:", e);
    return NextResponse.json(
      { detail: "Internal optimization error" },
      { status: 500 }
    );
  }
}
