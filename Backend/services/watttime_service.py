
"""
Live carbon forecast service using WattTime API V3.
Keeps WattTime data separate from the existing demo forecast.
"""

import os
from pathlib import Path

import requests
from dotenv import load_dotenv


BASE_URL = "https://api.watttime.org"

# Load Backend/.env regardless of the terminal's working directory.
ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_FILE)


def get_live_forecast(
    region="CAISO_NORTH",
    signal_type="co2_moer",
    horizon_hours=24
):
    """Fetch a live WattTime forecast and convert its units."""

    username = os.getenv("WATTTIME_USERNAME")
    password = os.getenv("WATTTIME_PASSWORD")

    if not username or not password:
        raise RuntimeError(
            "WattTime credentials are missing from Backend/.env."
        )

    # Obtain an API token.
    login_response = requests.get(
        f"{BASE_URL}/login",
        auth=(username, password),
        timeout=20
    )

    if not login_response.ok:
        raise RuntimeError(
            f"WattTime login failed: HTTP {login_response.status_code}."
        )

    token = login_response.json().get("token")

    if not token:
        raise RuntimeError("WattTime did not return an API token.")

    # Retrieve the requested forecast.
    response = requests.get(
        f"{BASE_URL}/v3/forecast",
        headers={"Authorization": f"Bearer {token}"},
        params={
            "region": region,
            "signal_type": signal_type,
            "horizon_hours": horizon_hours
        },
        timeout=30
    )

    if not response.ok:
        raise RuntimeError(
            f"WattTime forecast failed: HTTP {response.status_code}."
        )

    payload = response.json()
    raw_points = payload.get("data", [])

    points = []

    for item in raw_points:
        raw_value = item.get("value")

        point = {
            "time": item.get("point_time"),
            "moerLbsCo2PerMWh": raw_value,
            "carbonIntensityGramsPerKWh": (
                round(float(raw_value) * 0.45359237, 3)
                if raw_value is not None else None
            )
        }

        points.append(point)

    return {
        "source": "WattTime API V3",
        "region": region,
        "signalType": signal_type,
        "intervalSeconds": 300,
        "rawUnit": "lb CO2/MWh",
        "convertedUnit": "g CO2/kWh",
        "data": points
    }
