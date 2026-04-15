import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const routeId = parseInt(id);
  if (isNaN(routeId)) {
    return NextResponse.json({ detail: "Invalid route ID" }, { status: 400 });
  }

  const sql = getDb();
  try {
    const routes = await sql`
      SELECT id, created_at, total_distance, total_duration
      FROM routes WHERE id = ${routeId}
    `;

    if (routes.length === 0) {
      return NextResponse.json({ detail: "Route not found" }, { status: 404 });
    }

    const route = routes[0];
    const stops = await sql`
      SELECT rs.id, rs.stop_id, rs.position, rs.completed,
             s.latitude, s.longitude, s.address
      FROM route_stops rs
      JOIN stops s ON rs.stop_id = s.id
      WHERE rs.route_id = ${routeId}
      ORDER BY rs.position
    `;

    return NextResponse.json({
      id: route.id,
      created_at: route.created_at,
      total_distance: route.total_distance,
      total_duration: route.total_duration,
      stops,
    });
  } catch (e) {
    console.error("Failed to get route:", e);
    return NextResponse.json({ detail: "Failed to load route" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const routeId = parseInt(id);
  if (isNaN(routeId)) {
    return NextResponse.json({ detail: "Invalid route ID" }, { status: 400 });
  }

  const sql = getDb();
  try {
    // Delete route_stops first (cascade), then route
    await sql`DELETE FROM route_stops WHERE route_id = ${routeId}`;
    const result = await sql`DELETE FROM routes WHERE id = ${routeId} RETURNING id`;

    if (result.length === 0) {
      return NextResponse.json({ detail: "Route not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "ok", id: routeId });
  } catch (e) {
    console.error("Failed to delete route:", e);
    return NextResponse.json({ detail: "Failed to delete route" }, { status: 500 });
  }
}
