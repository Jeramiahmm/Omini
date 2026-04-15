import asyncio
import logging

from fastapi import APIRouter, Body, HTTPException

from app.config import settings
from app.schemas.route import OptimizeRouteResponse, StopInput
from app.services.optimizer import solve_route

logger = logging.getLogger(__name__)
router = APIRouter(tags=["routes"])


@router.post("/optimize-route", response_model=OptimizeRouteResponse)
async def optimize_route(
    stops: list[StopInput] = Body(..., min_length=1),
):
    """Accept an array of stops and return the optimal route order.

    The optimization runs OR-Tools in a background thread to avoid
    blocking the async event loop.
    """
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

    # Check for duplicate IDs
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
