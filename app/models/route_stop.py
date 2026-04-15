from sqlalchemy import Boolean, Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(
        Integer, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False
    )
    stop_id = Column(
        Integer, ForeignKey("stops.id", ondelete="CASCADE"), nullable=False
    )
    position = Column(Integer, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)

    route = relationship("Route", back_populates="route_stops")
    stop = relationship("Stop")
