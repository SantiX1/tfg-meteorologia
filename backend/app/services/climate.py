from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ClimateNormal
from app.services import openmeteo


def calculate_normals(historical_data: list[dict]) -> dict:
    """Compute mean tmax, tmin, precip from a list of same-day historical records."""
    if not historical_data:
        return {}

    tmax_vals = [r["tmax"] for r in historical_data]
    tmin_vals = [r["tmin"] for r in historical_data]
    precip_vals = [r["precip"] for r in historical_data]
    n = len(historical_data)

    return {
        "tmax_mean": sum(tmax_vals) / n,
        "tmin_mean": sum(tmin_vals) / n,
        "precip_mean": sum(precip_vals) / n,
    }


async def get_or_calculate_normals(
    db: AsyncSession,
    location_id: int,
    latitude: float,
    longitude: float,
    days_of_year: list[int],
) -> dict[int, dict]:
    """Return normals keyed by day_of_year, fetching from DB or computing on demand."""
    # Query existing normals for the requested days
    stmt = select(ClimateNormal).where(
        ClimateNormal.location_id == location_id,
        ClimateNormal.day_of_year.in_(days_of_year),
    )
    result = await db.execute(stmt)
    existing = {row.day_of_year: row for row in result.scalars().all()}

    missing_days = [d for d in days_of_year if d not in existing]

    normals: dict[int, dict] = {
        day: {
            "tmax_mean": existing[day].tmax_mean,
            "tmin_mean": existing[day].tmin_mean,
            "precip_mean": existing[day].precip_mean,
        }
        for day in days_of_year
        if day in existing
    }

    for day in missing_days:
        historical = await openmeteo.get_historical(latitude, longitude, day)
        computed = calculate_normals(historical)
        if not computed:
            continue

        record = ClimateNormal(
            location_id=location_id,
            day_of_year=day,
            month=_month_from_day_of_year(day),
            reference_years=len(historical),
            tmax_mean=computed["tmax_mean"],
            tmin_mean=computed["tmin_mean"],
            precip_mean=computed["precip_mean"],
        )
        db.add(record)
        normals[day] = computed

    await db.commit()
    return normals


def _month_from_day_of_year(day_of_year: int) -> int:
    """Return month (1-12) for a given day-of-year assuming a non-leap year."""
    # Cumulative days per month in a non-leap year
    boundaries = [31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 366]
    for month, boundary in enumerate(boundaries, start=1):
        if day_of_year <= boundary:
            return month
    return 12
