PRECIP_CATEGORIES = [
    (0, 40, "Extremadamente seco"),
    (41, 60, "Seco"),
    (61, 139, "Normal"),
    (140, 200, "Muy húmedo"),
]

TEMP_THRESHOLD = 5.0  # °C


def _precip_category(anomaly_pct: float) -> str:
    for low, high, label in PRECIP_CATEGORIES:
        if low <= anomaly_pct <= high:
            return label
    return "Extremadamente húmedo"


def _temp_category(difference: float) -> str:
    if difference > TEMP_THRESHOLD:
        return "Anomalía cálida"
    if difference < -TEMP_THRESHOLD:
        return "Anomalía fría"
    return "Sin anomalías"


def calculate_anomaly(forecast_data: list[dict], normals_data: dict[int, dict]) -> dict:
    """
    forecast_data: list of dicts with keys date, day_of_year, tmax, tmin, precip
    normals_data:  dict keyed by day_of_year with tmax_mean, tmin_mean, precip_mean
    """
    forecast_precip_total = sum(d["precip"] for d in forecast_data)
    historical_precip_total = sum(
        normals_data[d["day_of_year"]]["precip_mean"]
        for d in forecast_data
        if d["day_of_year"] in normals_data
    )

    if historical_precip_total == 0:
        precip_result = {"category": "Sin referencia", "anomaly_pct": None}
    else:
        anomaly_pct = (forecast_precip_total / historical_precip_total) * 100
        precip_result = {
            "category": _precip_category(anomaly_pct),
            "anomaly_pct": round(anomaly_pct, 1),
        }

    daily_temp = []
    for day in forecast_data:
        doy = day["day_of_year"]
        if doy not in normals_data:
            continue
        normal = normals_data[doy]
        tmax_diff = day["tmax"] - normal["tmax_mean"]
        tmin_diff = day["tmin"] - normal["tmin_mean"]
        daily_temp.append(
            {
                "date": day["date"],
                "tmax_diff": round(tmax_diff, 2),
                "tmax_category": _temp_category(tmax_diff),
                "tmin_diff": round(tmin_diff, 2),
                "tmin_category": _temp_category(tmin_diff),
            }
        )

    return {
        "precipitation": precip_result,
        "temperature": daily_temp,
    }
