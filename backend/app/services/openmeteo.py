from datetime import date

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


async def get_historical_batch(
    latitude: float,
    longitude: float,
    days_of_year: list[int],
) -> dict[int, list[dict]]:
    """
    Single archive request covering 10 full years.
    Returns records grouped by day_of_year, filtered to only the requested days.
    One HTTP call replaces N separate calls, avoiding rate limiting.
    """
    current_year = date.today().year
    start_date = date(current_year - 10, 1, 1)
    end_date = date(current_year - 1, 12, 31)

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": DAILY_VARS,
        "timezone": "UTC",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.get(ARCHIVE_URL, params=params)
        response.raise_for_status()
        chunk = response.json()

    if chunk.get("error"):
        raise ValueError(f"Archive API error: {chunk.get('reason', 'unknown')}")

    result: dict[int, list[dict]] = {doy: [] for doy in days_of_year}
    days_set = set(days_of_year)
    daily = chunk.get("daily", {})
    dates = daily.get("time", [])
    tmax_list = daily.get("temperature_2m_max", [])
    tmin_list = daily.get("temperature_2m_min", [])
    precip_list = daily.get("precipitation_sum", [])

    for i, d in enumerate(dates):
        parsed = date.fromisoformat(d)
        doy = parsed.timetuple().tm_yday
        if doy not in days_set:
            continue
        tmax = tmax_list[i]
        tmin = tmin_list[i]
        precip = precip_list[i]
        if tmax is None or tmin is None or precip is None:
            continue
        result[doy].append(
            {
                "date": d,
                "year": parsed.year,
                "tmax": tmax,
                "tmin": tmin,
                "precip": precip,
            }
        )

    return result
