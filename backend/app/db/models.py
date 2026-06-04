from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    country = Column(String(100))
    region = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("latitude", "longitude"),)


class ClimateNormal(Base):
    __tablename__ = "climate_normals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    day_of_year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    reference_years = Column(Integer, nullable=False, default=50)
    tmax_mean = Column(Float, nullable=False)
    tmin_mean = Column(Float, nullable=False)
    precip_mean = Column(Float, nullable=False)
    calculated_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("location_id", "day_of_year"),
        CheckConstraint("day_of_year >= 1 AND day_of_year <= 366", name="ck_climate_normals_day_of_year"),
        CheckConstraint("month >= 1 AND month <= 12", name="ck_climate_normals_month"),
    )


class WeatherForecast(Base):
    __tablename__ = "weather_forecast"

    id = Column(Integer, primary_key=True, autoincrement=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    forecast_date = Column(Date, nullable=False)
    day_offset = Column(Integer, nullable=False)
    tmax = Column(Float, nullable=False)
    tmin = Column(Float, nullable=False)
    precip = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("location_id", "forecast_date", "day_offset"),
        CheckConstraint("day_offset >= 0 AND day_offset <= 6", name="ck_weather_forecast_day_offset"),
    )
