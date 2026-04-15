from sqlalchemy import Column, DateTime, Float, Integer, func
from sqlalchemy.orm import relationship

from app.database import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    total_distance = Column(Float, nullable=False)
    total_duration = Column(Float, nullable=False)

    route_stops = relationship(
        "RouteStop", back_populates="route", order_by="RouteStop.position"
    )
