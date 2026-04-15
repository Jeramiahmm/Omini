from pydantic import BaseModel, Field


class StopInput(BaseModel):
    id: int
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class OptimizeRouteResponse(BaseModel):
    route: list[int]
    distance: float
    duration: float
