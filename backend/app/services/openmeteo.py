import asyncio
from datetime import date

import httpx

BASE_URL = "https://api.open-meteo.com/v1"
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
        response = await client.get(f"{BASE_URL}/forecast", params=params)
        response.raise_for_status()
        return response.json()


async def _fetch_decade(
    client: httpx.AsyncClient,
    latitude: float,
    longitude: float,
    start_year: int,
    end_year: int,
) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": DAILY_VARS,
        "timezone": "UTC",
        "start_date": f"{start_year}-01-01",
        "end_date": f"{end_year}-12-31",
    }
    response = await client.get(f"{BASE_URL}/archive", params=params)
    response.raise_for_status()
    return response.json()


async def get_historical(latitude: float, longitude: float, day_of_year: int) -> list[dict]:
    current_year = date.today().year
    end_year = current_year - 1
    start_year = current_year - 50

    # Build decade ranges: [start_year, start_year+9], ..., up to end_year
    decades: list[tuple[int, int]] = []
    year = start_year
    while year <= end_year:
        decades.append((year, min(year + 9, end_year)))
        year += 10

    async with httpx.AsyncClient(timeout=30.0) as client:
        results = await asyncio.gather(
            *[_fetch_decade(client, latitude, longitude, s, e) for s, e in decades]
        )

    # Merge all daily data, keeping only entries matching the requested day_of_year
    records: list[dict] = []
    for chunk in results:
        daily = chunk.get("daily", {})
        dates = daily.get("time", [])
        tmax_list = daily.get("temperature_2m_max", [])
        tmin_list = daily.get("temperature_2m_min", [])
        precip_list = daily.get("precipitation_sum", [])

        for i, d in enumerate(dates):
            parsed = date.fromisoformat(d)
            # date.timetuple().tm_yday gives day-of-year
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
