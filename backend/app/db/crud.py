from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ClimateNormal, Location, WeatherForecast

COORD_TOLERANCE = 0.01


async def get_location_by_coords(
    db: AsyncSession, latitude: float, longitude: float
) -> Location | None:
    stmt = select(Location).where(
        Location.latitude.between(latitude - COORD_TOLERANCE, latitude + COORD_TOLERANCE),
        Location.longitude.between(longitude - COORD_TOLERANCE, longitude + COORD_TOLERANCE),
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_or_create_location(
    db: AsyncSession,
    name: str,
    latitude: float,
    longitude: float,
    country: str | None = None,
    region: str | None = None,
) -> Location:
    location = await get_location_by_coords(db, latitude, longitude)
    if location:
        return location
    location = Location(
        name=name, latitude=latitude, longitude=longitude, country=country, region=region
    )
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location


async def get_forecast_cache(
    db: AsyncSession, location_id: int, target_date: date
) -> list[WeatherForecast] | None:
    stmt = (
        select(WeatherForecast)
        .where(
            WeatherForecast.location_id == location_id,
            WeatherForecast.forecast_date >= target_date,
        )
        .order_by(WeatherForecast.day_offset)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    if not rows:
        return None

    if rows[0].created_at.date() == date.today():
        return rows

    # Stale — purge all forecasts for this location and signal cache miss
    await db.execute(delete(WeatherForecast).where(WeatherForecast.location_id == location_id))
    await db.commit()
    return None


async def save_forecast(
    db: AsyncSession, location_id: int, forecast_data: list[dict]
) -> None:
    for row in forecast_data:
        db.add(
            WeatherForecast(
                location_id=location_id,
                forecast_date=row["date"],
                day_offset=row["day_offset"],
                tmax=row["tmax"],
                tmin=row["tmin"],
                precip=row["precip"],
            )
        )
    await db.commit()


async def get_normals(
    db: AsyncSession, location_id: int, days_of_year: list[int]
) -> dict[int, ClimateNormal]:
    stmt = select(ClimateNormal).where(
        ClimateNormal.location_id == location_id,
        ClimateNormal.day_of_year.in_(days_of_year),
    )
    result = await db.execute(stmt)
    return {row.day_of_year: row for row in result.scalars().all()}
