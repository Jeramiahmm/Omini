import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stopId = parseInt(id);
  if (isNaN(stopId)) {
    return NextResponse.json({ detail: "Invalid stop ID" }, { status: 400 });
  }

  const sql = getDb();
  try {
    const result = await sql`
      UPDATE route_stops SET completed = true
      WHERE id = ${stopId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ detail: "Route stop not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "ok", id: stopId, completed: true });
  } catch (e) {
    console.error("Failed to mark stop complete:", e);
    return NextResponse.json({ detail: "Failed to mark stop complete" }, { status: 500 });
  }
}
