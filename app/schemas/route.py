from datetime import datetime

from pydantic import BaseModel, Field


class StopInput(BaseModel):
    id: int
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    address: str = ""


class OptimizeRouteResponse(BaseModel):
    route: list[int]
    distance: float
    duration: float


class RouteStopDetail(BaseModel):
    id: int
    stop_id: int
    position: int
    completed: bool
    latitude: float
    longitude: float
    address: str

    model_config = {"from_attributes": True}


class RouteDetail(BaseModel):
    id: int
    created_at: datetime
    total_distance: float
    total_duration: float
    stops: list[RouteStopDetail]

    model_config = {"from_attributes": True}


class RouteListItem(BaseModel):
    id: int
    created_at: datetime
    total_distance: float
    total_duration: float
    stop_count: int
    completed_count: int

    model_config = {"from_attributes": True}


class SaveRouteRequest(BaseModel):
    stops: list[StopInput]
    route_order: list[int]
    distance: float
    duration: float
