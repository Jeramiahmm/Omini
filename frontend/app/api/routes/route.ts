import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT
        r.id,
        r.created_at,
        r.total_distance,
        r.total_duration,
        COUNT(rs.id)::int AS stop_count,
        COUNT(rs.id) FILTER (WHERE rs.completed = true)::int AS completed_count
      FROM routes r
      LEFT JOIN route_stops rs ON r.id = rs.route_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (e) {
    console.error("Failed to list routes:", e);
    return NextResponse.json({ detail: "Failed to load routes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sql = getDb();
  let body: {
    stops: { id: number; lat: number; lng: number; address: string }[];
    route_order: number[];
    distance: number;
    duration: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  // Validate route_order
  const stopIds = new Set(body.stops.map((s) => s.id));
  for (const id of body.route_order) {
    if (!stopIds.has(id)) {
      return NextResponse.json(
        { detail: `route_order contains invalid stop ID: ${id}` },
        { status: 422 }
      );
    }
  }

  try {
    // Create route
    const [route] = await sql`
      INSERT INTO routes (total_distance, total_duration)
      VALUES (${body.distance}, ${body.duration})
      RETURNING id, created_at, total_distance, total_duration
    `;

    // Create stops and build ID map
    const dbStopIds: Record<number, number> = {};
    for (const s of body.stops) {
      const [dbStop] = await sql`
        INSERT INTO stops (latitude, longitude, address)
        VALUES (${s.lat}, ${s.lng}, ${s.address || ""})
        RETURNING id
      `;
      dbStopIds[s.id] = dbStop.id;
    }

    // Create route_stops in optimized order
    for (let i = 0; i < body.route_order.length; i++) {
      const clientId = body.route_order[i];
      await sql`
        INSERT INTO route_stops (route_id, stop_id, position, completed)
        VALUES (${route.id}, ${dbStopIds[clientId]}, ${i}, false)
      `;
    }

    // Fetch the complete route for response
    const stops = await sql`
      SELECT rs.id, rs.stop_id, rs.position, rs.completed,
             s.latitude, s.longitude, s.address
      FROM route_stops rs
      JOIN stops s ON rs.stop_id = s.id
      WHERE rs.route_id = ${route.id}
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
    console.error("Failed to save route:", e);
    return NextResponse.json({ detail: "Failed to save route" }, { status: 500 });
  }
}
