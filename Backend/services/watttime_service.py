
"""
Live carbon forecast service using WattTime API V3.

Returns WattTime marginal operating emissions rate (MOER)
forecasts converted from lb CO2/MWh to g CO2/kWh.
"""

import logging
import os
from pathlib import Path

import requests
from dotenv import load_dotenv


BASE_URL = "https://api.watttime.org"
LOGGER = logging.getLogger(__name__)

# Load Backend/.env regardless of the terminal's working directory.
ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_FILE)


def get_live_forecast(
    region="CAISO_NORTH",
    signal_type="co2_moer",
    horizon_hours=24,
):
    """Fetch and validate a live WattTime forecast."""

    username = os.getenv("WATTTIME_USERNAME")
    password = os.getenv("WATTTIME_PASSWORD")

    if not username or not password:
        raise RuntimeError(
            "WattTime credentials are missing from Backend/.env."
        )

    if not isinstance(horizon_hours, int) or not 1 <= horizon_hours <= 72:
        raise ValueError("horizon_hours must be an integer from 1 to 72.")

    session = requests.Session()

    try:
        # 1. Obtain an API token.
        login_response = session.get(
            f"{BASE_URL}/login",
            auth=(username, password),
            timeout=20,
        )

        if not login_response.ok:
            raise RuntimeError(
                f"WattTime login failed: HTTP "
                f"{login_response.status_code}."
            )

        try:
            login_data = login_response.json()
        except ValueError as exc:
            raise RuntimeError(
                "WattTime login returned invalid JSON."
            ) from exc

        token = login_data.get("token")

        if not token:
            raise RuntimeError(
                "WattTime did not return an API token."
            )

        # 2. Request the forecast.
        response = session.get(
            f"{BASE_URL}/v3/forecast",
            headers={"Authorization": f"Bearer {token}"},
            params={
                "region": region,
                "signal_type": signal_type,
                "horizon_hours": horizon_hours,
            },
            timeout=30,
        )

        if not response.ok:
            raise RuntimeError(
                f"WattTime forecast failed: HTTP "
                f"{response.status_code}."
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise RuntimeError(
                "WattTime forecast returned invalid JSON."
            ) from exc

        # 3. Validate the forecast response.
        if not isinstance(payload, dict):
            raise RuntimeError(
                "WattTime forecast response must be a JSON object."
            )

        raw_points = payload.get("data")

        if not isinstance(raw_points, list):
            raise RuntimeError(
                "WattTime response did not contain a valid data list."
            )

        if not raw_points:
            raise RuntimeError(
                "WattTime returned an empty forecast."
            )
       
        # Temporary diagnostic: inspect forecast values.
        meta = payload.get("meta", {})
        values = [
            point.get("value")
            for point in raw_points
            if isinstance(point, dict) and point.get("value") is not None
        ]

        zero_points = [
            point for point in raw_points
            if isinstance(point, dict) and point.get("value") == 0
        ]

        nonzero_points = [
            point for point in raw_points
            if isinstance(point, dict)
            and isinstance(point.get("value"), (int, float))
            and point.get("value") > 0
        ]

        LOGGER.warning("WattTime metadata: %s", meta)
        LOGGER.warning("Total forecast points: %s", len(raw_points))
        LOGGER.warning("Zero-valued points: %s", len(zero_points))
        LOGGER.warning("Positive-valued points: %s", len(nonzero_points))
        LOGGER.warning("First zero-valued points: %s", zero_points[:3])
        LOGGER.warning("First positive-valued points: %s", nonzero_points[:3])
        LOGGER.warning("Last 5 forecast points: %s", raw_points[-5:])


        points = []
        invalid_count = 0
        zero_count = 0
        nonzero_count = 0

        # 4. Convert each forecast point.
        for item in raw_points:
            if not isinstance(item, dict):
                invalid_count += 1
                continue

            point_time = item.get("point_time")
            raw_value = item.get("value")

            if not point_time or raw_value is None:
                invalid_count += 1
                continue

            try:
                raw_value = float(raw_value)
            except (TypeError, ValueError):
                invalid_count += 1
                continue

            # Reject invalid numerical values, but preserve genuine zeros.
            if not __import__("math").isfinite(raw_value) or raw_value < 0:
                invalid_count += 1
                continue

            if raw_value == 0:
                zero_count += 1
            else:
                nonzero_count += 1

            intensity_g = round(raw_value * 0.45359237, 3)
            points.append({
                "time": point_time,
                "moerLbsCo2PerMWh": raw_value,
                "carbonIntensity": intensity_g,
                "carbonIntensityGramsPerKWh": intensity_g,
            })

        if not points:
            raise RuntimeError(
                "WattTime returned no valid forecast points."
            )

        # Log diagnostics without exposing credentials or API tokens.
        LOGGER.info(
            "WattTime forecast: region=%s, signal=%s, "
            "received=%d, valid=%d, zeros=%d, nonzeros=%d, invalid=%d",
            region,
            signal_type,
            len(raw_points),
            len(points),
            zero_count,
            nonzero_count,
            invalid_count,
        )

        if zero_count and nonzero_count:
            LOGGER.warning(
                "WattTime forecast contains both zero and nonzero "
                "values. Verify the raw response if this pattern "
                "is unexpected; zero values were preserved."
            )

        return {
            "source": "WattTime API V3",
            "region": region,
            "signalType": signal_type,
            "intervalSeconds": 300,
            "rawUnit": "lb CO2/MWh",
            "convertedUnit": "g CO2/kWh",
            "data": points,
            "diagnostics": {
                "receivedPoints": len(raw_points),
                "validPoints": len(points),
                "zeroValuePoints": zero_count,
                "nonzeroValuePoints": nonzero_count,
                "invalidPoints": invalid_count,
            },
        }

    finally:
        session.close()
