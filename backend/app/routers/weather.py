from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import crud
from app.db.database import get_db
from app.services import anomaly as anomaly_service
from app.services import openmeteo
from app.services.climate import get_or_calculate_normals

router = APIRouter()


def _parse_forecast(raw: dict) -> list[dict]:
    daily = raw["daily"]
    result = []
    for i, d in enumerate(daily["time"]):
        forecast_date = date.fromisoformat(d)
        result.append(
            {
                "date": forecast_date,
                "day_offset": i,
                "day_of_year": forecast_date.timetuple().tm_yday,
                "tmax": daily["temperature_2m_max"][i] or 0.0,
                "tmin": daily["temperature_2m_min"][i] or 0.0,
                "precip": daily["precipitation_sum"][i] or 0.0,
            }
        )
    return result


@router.get("/weather")
async def get_weather(
    lat: float = Query(...),
    lon: float = Query(...),
    name: str = Query(...),
    country: str | None = Query(None),
    region: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    location = await crud.get_or_create_location(db, name, lat, lon, country, region)

    cached = await crud.get_forecast_cache(db, location.id, date.today())

    if cached:
        forecast_list = [
            {
                "date": row.forecast_date,
                "day_offset": row.day_offset,
                "day_of_year": row.forecast_date.timetuple().tm_yday,
                "tmax": row.tmax,
                "tmin": row.tmin,
                "precip": row.precip,
            }
            for row in cached
        ]
        days_of_year = [d["day_of_year"] for d in forecast_list]
        normals_db = await crud.get_normals(db, location.id, days_of_year)
        normals_dict = {
            doy: {
                "tmax_mean": n.tmax_mean,
                "tmin_mean": n.tmin_mean,
                "precip_mean": n.precip_mean,
            }
            for doy, n in normals_db.items()
        }
    else:
        raw_forecast = await openmeteo.get_forecast(lat, lon)
        forecast_list = _parse_forecast(raw_forecast)
        days_of_year = [d["day_of_year"] for d in forecast_list]
        normals_dict = await get_or_calculate_normals(db, location.id, lat, lon, days_of_year)
        await crud.save_forecast(db, location.id, forecast_list)

    anomaly = anomaly_service.calculate_anomaly(forecast_list, normals_dict)
    temp_by_date = {t["date"]: t for t in anomaly["temperature"]}

    forecast_response = [
        {
            "date": day["date"].isoformat(),
            "day_offset": day["day_offset"],
            "day_of_year": day["day_of_year"],
            "tmax": day["tmax"],
            "tmin": day["tmin"],
            "precip": day["precip"],
            "tmax_anomaly": temp_by_date.get(day["date"], {}).get("tmax_category"),
            "tmin_anomaly": temp_by_date.get(day["date"], {}).get("tmin_category"),
        }
        for day in forecast_list
    ]

    normals_response = [
        {
            "day_of_year": doy,
            "tmax_mean": round(n["tmax_mean"], 2),
            "tmin_mean": round(n["tmin_mean"], 2),
            "precip_mean": round(n["precip_mean"], 2),
        }
        for doy, n in normals_dict.items()
    ]

    return {
        "location": {
            "id": location.id,
            "name": location.name,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "country": location.country,
            "region": location.region,
        },
        "forecast": forecast_response,
        "precip_anomaly": {
            "value_pct": anomaly["precipitation"]["anomaly_pct"],
            "category": anomaly["precipitation"]["category"],
        },
        "normals": normals_response,
    }
