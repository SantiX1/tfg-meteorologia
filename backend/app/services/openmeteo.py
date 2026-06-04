from datetime import date, timedelta

import httpx

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
DAILY_VARS = "temperature_2m_max,temperature_2m_min,precipitation_sum"


async def get_forecast(latitude: float, longitude: float) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": DAILY_VARS,
        "timezone": "auto",
        "forecast_days": 7,
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(FORECAST_URL, params=params)
        response.raise_for_status()
        return response.json()


async def get_historical(latitude: float, longitude: float, day_of_year: int) -> list[dict]:
    current_year = date.today().year

    ref = date(current_year, 1, 1) + timedelta(days=day_of_year - 1)
    try:
        start_date = ref.replace(year=current_year - 10)
    except ValueError:
        start_date = date(current_year - 10, ref.month, 28)
    try:
        end_date = ref.replace(year=current_year - 1)
    except ValueError:
        end_date = date(current_year - 1, ref.month, 28)

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": DAILY_VARS,
        "timezone": "UTC",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(ARCHIVE_URL, params=params)
        response.raise_for_status()
        chunk = response.json()

    records: list[dict] = []
    daily = chunk.get("daily", {})
    dates = daily.get("time", [])
    tmax_list = daily.get("temperature_2m_max", [])
    tmin_list = daily.get("temperature_2m_min", [])
    precip_list = daily.get("precipitation_sum", [])

    for i, d in enumerate(dates):
        parsed = date.fromisoformat(d)
        if parsed.timetuple().tm_yday == day_of_year:
            tmax = tmax_list[i]
            tmin = tmin_list[i]
            precip = precip_list[i]
            if tmax is None or tmin is None or precip is None:
                continue
            records.append(
                {
                    "date": d,
                    "year": parsed.year,
                    "tmax": tmax,
                    "tmin": tmin,
                    "precip": precip,
                }
            )

    return records
