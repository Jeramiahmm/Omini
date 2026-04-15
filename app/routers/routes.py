import asyncio
import logging

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.stop import Stop
from app.schemas.route import (
    OptimizeRouteResponse,
    RouteDetail,
    RouteListItem,
    RouteStopDetail,
    SaveRouteRequest,
    StopInput,
)
from app.services.optimizer import solve_route

logger = logging.getLogger(__name__)
router = APIRouter(tags=["routes"])


@router.post("/optimize-route", response_model=OptimizeRouteResponse)
async def optimize_route(
    stops: list[StopInput] = Body(..., min_length=1),
):
    """Accept an array of stops and return the optimal route order."""
    if len(stops) < settings.min_stops:
        raise HTTPException(
            status_code=422,
            detail=f"At least {settings.min_stops} stops are required, got {len(stops)}",
        )
    if len(stops) > settings.max_stops:
        raise HTTPException(
            status_code=422,
            detail=f"At most {settings.max_stops} stops are allowed, got {len(stops)}",
        )

    ids = [s.id for s in stops]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=422, detail="Duplicate stop IDs are not allowed")

    try:
        result = await asyncio.to_thread(solve_route, stops)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        logger.exception("Route optimization failed")
        raise HTTPException(status_code=500, detail="Internal optimization error")

    return OptimizeRouteResponse(**result)


@router.post("/routes", response_model=RouteDetail)
async def save_route(
    request: SaveRouteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Save an optimized route with its stops."""
    stop_map = {s.id: s for s in request.stops}

    # Create Stop records
    db_stops = {}
    for s in request.stops:
        db_stop = Stop(latitude=s.lat, longitude=s.lng, address=s.address)
        db.add(db_stop)
        db_stops[s.id] = db_stop
    await db.flush()

    # Create Route record
    db_route = Route(
        total_distance=request.distance,
        total_duration=request.duration,
    )
    db.add(db_route)
    await db.flush()

    # Create RouteStop records in optimized order
    for position, stop_id in enumerate(request.route_order):
        db_route_stop = RouteStop(
            route_id=db_route.id,
            stop_id=db_stops[stop_id].id,
            position=position,
            completed=False,
        )
        db.add(db_route_stop)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Route)
        .options(selectinload(Route.route_stops).selectinload(RouteStop.stop))
        .where(Route.id == db_route.id)
    )
    route = result.scalar_one()

    return RouteDetail(
        id=route.id,
        created_at=route.created_at,
        total_distance=route.total_distance,
        total_duration=route.total_duration,
        stops=[
            RouteStopDetail(
                id=rs.id,
                stop_id=rs.stop_id,
                position=rs.position,
                completed=rs.completed,
                latitude=rs.stop.latitude,
                longitude=rs.stop.longitude,
                address=rs.stop.address or "",
            )
            for rs in route.route_stops
        ],
    )


@router.get("/routes", response_model=list[RouteListItem])
async def list_routes(db: AsyncSession = Depends(get_db)):
    """List all saved routes with completion stats."""
    result = await db.execute(
        select(
            Route.id,
            Route.created_at,
            Route.total_distance,
            Route.total_duration,
            func.count(RouteStop.id).label("stop_count"),
            func.count(RouteStop.id).filter(RouteStop.completed.is_(True)).label(
                "completed_count"
            ),
        )
        .outerjoin(RouteStop, Route.id == RouteStop.route_id)
        .group_by(Route.id)
        .order_by(Route.created_at.desc())
    )
    rows = result.all()
    return [
        RouteListItem(
            id=r.id,
            created_at=r.created_at,
            total_distance=r.total_distance,
            total_duration=r.total_duration,
            stop_count=r.stop_count,
            completed_count=r.completed_count,
        )
        for r in rows
    ]


@router.get("/routes/{route_id}", response_model=RouteDetail)
async def get_route(route_id: int, db: AsyncSession = Depends(get_db)):
    """Get a saved route with all its stops."""
    result = await db.execute(
        select(Route)
        .options(selectinload(Route.route_stops).selectinload(RouteStop.stop))
        .where(Route.id == route_id)
    )
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    return RouteDetail(
        id=route.id,
        created_at=route.created_at,
        total_distance=route.total_distance,
        total_duration=route.total_duration,
        stops=[
            RouteStopDetail(
                id=rs.id,
                stop_id=rs.stop_id,
                position=rs.position,
                completed=rs.completed,
                latitude=rs.stop.latitude,
                longitude=rs.stop.longitude,
                address=rs.stop.address or "",
            )
            for rs in route.route_stops
        ],
    )


@router.patch("/route-stops/{route_stop_id}/complete")
async def mark_stop_complete(
    route_stop_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Mark a route stop as completed."""
    result = await db.execute(
        select(RouteStop).where(RouteStop.id == route_stop_id)
    )
    route_stop = result.scalar_one_or_none()
    if not route_stop:
        raise HTTPException(status_code=404, detail="Route stop not found")

    route_stop.completed = True
    return {"status": "ok", "id": route_stop_id, "completed": True}
