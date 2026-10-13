
"""Deadline-aware scheduling using live WattTime forecast data.

Forecast points represent five-minute intervals beginning at their
timestamps. The scheduler checks continuous coverage, respects deadlines,
and selects the lowest-carbon feasible execution window.
"""

from datetime import datetime, timedelta, timezone
from math import ceil, isfinite


SLOT_MINUTES = 5
SLOT_SECONDS = SLOT_MINUTES * 60

# Assumed average workload power. Replace with measured workload power
# when reliable measurements are available.
AVERAGE_POWER_KW = 1.5


def parse_utc(value):
    """Parse an ISO-8601 timestamp that includes a timezone."""
    if not value:
        raise ValueError("A timestamp is required.")

    try:
        parsed = datetime.fromisoformat(
            str(value).replace("Z", "+00:00")
        )
    except (TypeError, ValueError):
        raise ValueError(
            "Timestamp must be a valid ISO-8601 date and time."
        ) from None

    if parsed.tzinfo is None:
        raise ValueError(
            "Timestamp must include a timezone, such as Z or +00:00."
        )

    return parsed.astimezone(timezone.utc)


def validate_runtime(value):
    """Validate runtime as a positive whole number of minutes."""
    if isinstance(value, bool):
        raise ValueError(
            "estimatedRuntime must be a positive integer."
        )

    try:
        numeric_value = float(value)
    except (TypeError, ValueError, OverflowError):
        raise ValueError(
            "estimatedRuntime must be a positive integer."
        ) from None

    if (
        not isfinite(numeric_value)
        or not numeric_value.is_integer()
        or numeric_value <= 0
    ):
        raise ValueError(
            "estimatedRuntime must be a positive integer."
        )

    return int(numeric_value)


def prepare_forecast_points(forecast):
    """Validate, normalize, and sort forecast intervals."""
    if not isinstance(forecast, dict):
        raise ValueError("Forecast must be a JSON object.")

    raw_points = forecast.get("data", [])

    if not isinstance(raw_points, list):
        raise ValueError("Forecast data must be a list.")

    points = []

    for item in raw_points:
        if not isinstance(item, dict):
            continue

        raw_time = item.get("time")
        raw_intensity = item.get(
            "carbonIntensityGramsPerKWh"
        )

        # Missing values cannot be used for scheduling.
        if raw_time is None or raw_intensity is None:
            continue

        try:
            timestamp = parse_utc(raw_time)
            intensity = float(raw_intensity)
        except (ValueError, TypeError, OverflowError):
            continue

        # Reject invalid and negative values, but retain zero.
        if not isfinite(intensity) or intensity < 0:
            continue

        points.append({
            "time": timestamp,
            "intensity": intensity,
        })

    points.sort(key=lambda point: point["time"])

    # Duplicate timestamps make interval interpretation ambiguous.
    for index in range(1, len(points)):
        if points[index]["time"] == points[index - 1]["time"]:
            raise ValueError(
                "Forecast contains duplicate timestamps. "
                "Clean the forecast before scheduling."
            )

    return points


def evaluate_window(points, start_index, runtime_minutes):
    """Evaluate a continuous forecast window covering the runtime."""
    start = points[start_index]["time"]
    completion = start + timedelta(minutes=runtime_minutes)

    required_points = ceil(runtime_minutes / SLOT_MINUTES)
    window = points[
        start_index:start_index + required_points
    ]

    if len(window) != required_points:
        return None

    # Verify five-minute continuity.
    for index in range(1, len(window)):
        elapsed_seconds = (
            window[index]["time"] - window[index - 1]["time"]
        ).total_seconds()

        if elapsed_seconds != SLOT_SECONDS:
            return None

    # Ensure the final interval covers the entire workload.
    coverage_end = window[-1]["time"] + timedelta(
        minutes=SLOT_MINUTES
    )

    if coverage_end < completion:
        return None

    # Calculate the time-weighted average intensity.
    # This supports runtimes that are not multiples of five minutes.
    remaining_seconds = runtime_minutes * 60
    weighted_intensity = 0.0

    for point in window:
        duration_seconds = min(
            remaining_seconds,
            SLOT_SECONDS
        )

        if duration_seconds <= 0:
            break

        weighted_intensity += (
            point["intensity"] * duration_seconds
        )
        remaining_seconds -= duration_seconds

    if remaining_seconds > 0:
        return None

    average_intensity = (
        weighted_intensity / (runtime_minutes * 60)
    )

    return {
        "start": start,
        "completion": completion,
        "averageIntensity": average_intensity,
    }


def schedule_live_workload(job, forecast):
    """Select a feasible workload execution window."""
    if not isinstance(job, dict):
        raise ValueError("Job must be a JSON object.")

    runtime = validate_runtime(
        job.get("estimatedRuntime", 30)
    )

    deadline = parse_utc(job.get("deadlineUtc"))
    now = datetime.now(timezone.utc)

    if deadline <= now:
        raise ValueError("The deadline must be in the future.")

    carbon_aware = job.get("carbonAware", True)

    if not isinstance(carbon_aware, bool):
        raise ValueError("carbonAware must be true or false.")

    points = prepare_forecast_points(forecast)

    if not points:
        raise ValueError(
            "No usable forecast values were returned."
        )

    required_points = ceil(runtime / SLOT_MINUTES)
    feasible = []

    for index in range(len(points) - required_points + 1):
        candidate = evaluate_window(
            points,
            index,
            runtime,
        )

        if candidate is None:
            continue

        # Do not schedule in the past or beyond the deadline.
        if candidate["start"] < now:
            continue

        if candidate["completion"] > deadline:
            continue

        feasible.append(candidate)

    if not feasible:
        return {
            "status": "Not Scheduled",
            "reason": (
                "No continuous forecast window can cover the full "
                "runtime and finish before the deadline."
            ),
            "source": forecast.get("source"),
            "region": forecast.get("region"),
        }

    # Candidate windows are chronologically ordered.
    earliest = feasible[0]

    # Choose the lowest-carbon window or the earliest window.
    if carbon_aware:
        chosen = min(
            feasible,
            key=lambda candidate: candidate["averageIntensity"],
        )
    else:
        chosen = earliest

    # Estimated energy based on assumed average power.
    energy_kwh = (runtime / 60) * AVERAGE_POWER_KW

    # Estimated emissions use the forecast intensity.
    estimated_co2_grams = (
        energy_kwh * chosen["averageIntensity"]
    )

    # Baseline: execute at the earliest feasible window.
    baseline_co2_grams = (
        energy_kwh * earliest["averageIntensity"]
    )

    # Savings compared with the earliest feasible window.
    saved_grams = max(
        0.0,
        baseline_co2_grams - estimated_co2_grams,
    )

    # Temporary diagnostics to verify the savings calculation.
    print("\n--- SAVINGS BASELINE CHECK ---")
    print("Earliest feasible window:", earliest)
    print("Selected window:", chosen)
    print(
        "Earliest intensity:",
        earliest["averageIntensity"]
    )
    print(
        "Selected intensity:",
        chosen["averageIntensity"]
    )
    print("Baseline CO2 (g):", baseline_co2_grams)
    print("Selected CO2 (g):", estimated_co2_grams)
    print("Calculated savings (g CO2):", saved_grams)
    print("------------------------------\n")

    # Classify the selected intensity relative to feasible windows.
    intensities = sorted(
        candidate["averageIntensity"]
        for candidate in feasible
    )

    low_threshold = intensities[
        (len(intensities) - 1) // 3
    ]

    high_threshold = intensities[
        (2 * (len(intensities) - 1)) // 3
    ]

    if chosen["averageIntensity"] <= low_threshold:
        carbon_status = "Low"
    elif chosen["averageIntensity"] <= high_threshold:
        carbon_status = "Medium"
    else:
        carbon_status = "High"

    return {
        "status": "Scheduled",
        "source": forecast.get("source"),
        "region": forecast.get("region"),
        "signalType": forecast.get("signalType"),

        "selectedTimeUtc": chosen["start"].isoformat(),
        "completionTimeUtc": chosen["completion"].isoformat(),
        "deadlineUtc": deadline.isoformat(),

        "estimatedRuntime": runtime,
        "estimatedEnergyKWh": round(energy_kwh, 4),

        "averageCarbonIntensityGramsPerKWh": round(
            chosen["averageIntensity"], 3
        ),

        "estimatedCO2Grams": round(
            estimated_co2_grams, 3
        ),

        "co2SavedGramsVsEarliest": round(
            saved_grams, 3
        ),

        "carbonStatus": carbon_status,
        "carbonStatusBasis": (
            "Relative to feasible forecast windows"
        ),

        "feasibleWindowsConsidered": len(feasible),

        "zeroIntensityPointsAccepted": True,
        "negativeIntensityPointsExcluded": True,
    }
