import json
import os
from pathlib import Path
from werkzeug.utils import secure_filename
from services.live_scheduler import schedule_live_workload
from services.watttime_service import get_live_forecast

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, timezone
from math import isfinite

from services.scheduler import schedule_workload
from job_service import create_job



def get_forecast_coverage(forecast):
    """Report forecast span and validate continuous five-minute coverage."""
    from datetime import datetime, timedelta, timezone
    from math import isfinite

    data = forecast.get("data", [])
    interval_seconds = forecast.get("intervalSeconds", 300)

    try:
        interval_seconds = float(interval_seconds)
        if not isfinite(interval_seconds) or interval_seconds <= 0:
            interval_seconds = 300
    except (TypeError, ValueError):
        interval_seconds = 300

    if not isinstance(data, list):
        data = []

    timestamps = []
    invalid_points = 0

    for point in data:
        if not isinstance(point, dict):
            invalid_points += 1
            continue

        raw_time = point.get("time")
        raw_intensity = point.get("carbonIntensityGramsPerKWh")

        if raw_time is None or raw_intensity is None:
            invalid_points += 1
            continue

        try:
            timestamp = datetime.fromisoformat(
                str(raw_time).replace("Z", "+00:00")
            )

            if timestamp.tzinfo is None:
                invalid_points += 1
                continue

            intensity = float(raw_intensity)

            if not isfinite(intensity) or intensity < 0:
                invalid_points += 1
                continue

            timestamps.append(timestamp.astimezone(timezone.utc))

        except (TypeError, ValueError, OverflowError):
            invalid_points += 1

    timestamps.sort()

    duplicates = sum(
        1 for index in range(1, len(timestamps))
        if timestamps[index] == timestamps[index - 1]
    )

    unique_timestamps = sorted(set(timestamps))

    missing_intervals = 0

    for index in range(1, len(unique_timestamps)):
        elapsed = (
            unique_timestamps[index] - unique_timestamps[index - 1]
        ).total_seconds()

        if elapsed > interval_seconds:
            missing_intervals += max(
                1, round(elapsed / interval_seconds) - 1
            )
        elif elapsed < interval_seconds:
            # A shorter interval indicates irregular forecast spacing.
            missing_intervals += 1

    continuous = (
        len(unique_timestamps) > 0
        and duplicates == 0
        and missing_intervals == 0
        and invalid_points == 0
    )

    if not unique_timestamps:
        coverage_start = None
        coverage_end = None
        coverage_hours = 0.0
    else:
        coverage_start_dt = unique_timestamps[0]
        coverage_end_dt = (
            unique_timestamps[-1]
            + timedelta(seconds=interval_seconds)
        )

        coverage_start = coverage_start_dt.isoformat()
        coverage_end = coverage_end_dt.isoformat()
        coverage_hours = (
            coverage_end_dt - coverage_start_dt
        ).total_seconds() / 3600

    return {
        "requestedHorizonHours": None,
        "availableForecastPoints": len(data),
        "usableForecastPoints": len(timestamps),
        "coverageStartUtc": coverage_start,
        "coverageEndUtc": coverage_end,
        "availableCoverageHours": round(coverage_hours, 3),
        "duplicateTimestamps": duplicates,
        "missingIntervals": missing_intervals,
        "invalidPoints": invalid_points,
        "continuousCoverage": continuous,
        "coversRequestedHorizon": False,
    }



schedule_bp = Blueprint("schedule", __name__)


@schedule_bp.route("/schedule", methods=["POST"])
def schedule():
    try:
        job = request.get_json()

        # Check request data
        if not job:
            return jsonify({
                "success": False,
                "message": "No job data provided"
            }), 400

        # Get carbon forecast from request
        carbon_forecast = job.get("carbonForecast", [])

        # Run scheduling algorithm
        result = schedule_workload(job, carbon_forecast)

        if result.get("status") != "Scheduled":
            return jsonify({
                "success": True,
                "message": result.get("reason", "No feasible scheduling window was found."),
                "data": result,
                "saved": False
            }), 200

        # Prepare data for database
        job_to_save = {
            "name": job.get("job_name", job.get("name", "Unnamed Job")),
            "type": job.get("type", "Data Processing"),

            "estimatedRuntime": result.get(
                "estimatedRuntime",
                job.get("estimatedRuntime", 30)
            ),

            "deadline": result.get(
                "deadline",
                job.get("deadline", "18:00")
            ),

            "selectedTime": result.get("selectedTime", ""),
            "completionTime": result.get("completionTime"),

            "selectedRegion": result.get(
                "selectedRegion",
                job.get("preferredRegion", "")
            ),

            "carbonIntensity": result.get("carbonIntensity", 0),
            "estimatedEnergy": result.get("estimatedEnergy", 0),
            "estimatedCO2": result.get("estimatedCO2", 0),
            "co2Saved": result.get("co2Saved", 0),

            "status": result.get("status", "Scheduled"),
            "priority": job.get("priority", "Normal"),

            "createdAt": job.get(
                "createdAt",
                datetime.now().strftime("%Y-%m-%d %H:%M")
            ),

            "actualRuntime": None,
            "completedAt": None
        }

        # Save scheduled job into database
        saved_job = create_job(job_to_save)

        # Return scheduling result + database record
        return jsonify({
            "success": True,
            "message": "Job scheduled and saved successfully",
            "data": saved_job
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@schedule_bp.route("/schedule-live", methods=["POST"])
def schedule_live():
    try:
        uploaded_file = None
        file_metadata = {
            "file_name": None,
            "file_size_bytes": None,
            "file_type": None
        }

        # Support both multipart/form-data and application/json
        if request.content_type and "multipart/form-data" in request.content_type:
            if "job" in request.form:
                try:
                    job = json.loads(request.form["job"])
                except Exception:
                    job = {}
            else:
                job = request.form.to_dict()

            if "file" in request.files:
                uploaded_file = request.files["file"]
        else:
            job = request.get_json(silent=True)

        if not isinstance(job, dict):
            return jsonify({
                "success": False,
                "message": "A JSON or form-encoded job object is required."
            }), 400

        # Type conversion for form submissions
        if isinstance(job.get("carbonAware"), str):
            job["carbonAware"] = job["carbonAware"].lower() in ("true", "1", "yes")
        if isinstance(job.get("estimatedRuntime"), str):
            try:
                job["estimatedRuntime"] = int(job["estimatedRuntime"])
            except ValueError:
                pass

        # Validate and process uploaded workload file if attached
        if uploaded_file and uploaded_file.filename:
            raw_filename = uploaded_file.filename
            safe_name = secure_filename(raw_filename) or "workload_file.bin"

            # Calculate actual file size in bytes from the server-side stream
            uploaded_file.seek(0, os.SEEK_END)
            actual_size_bytes = uploaded_file.tell()
            uploaded_file.seek(0)

            MAX_UPLOAD_SIZE = 15 * 1024 * 1024  # 15 MB
            if actual_size_bytes > MAX_UPLOAD_SIZE:
                return jsonify({
                    "success": False,
                    "message": f"Uploaded file exceeds the maximum limit of {MAX_UPLOAD_SIZE // (1024 * 1024)} MB."
                }), 400

            upload_dir = Path(__file__).resolve().parent.parent / "data" / "uploads"
            upload_dir.mkdir(parents=True, exist_ok=True)
            saved_filename = f"{int(datetime.now().timestamp())}_{safe_name}"
            uploaded_file.save(upload_dir / saved_filename)

            file_metadata["file_name"] = raw_filename
            file_metadata["file_size_bytes"] = actual_size_bytes
            file_metadata["file_type"] = uploaded_file.content_type or "application/octet-stream"

        # Strictly validate the requested forecast horizon.
        raw_horizon = job.get("horizonHours", 24)

        if isinstance(raw_horizon, bool):
            return jsonify({
                "success": False,
                "message": "horizonHours must be a whole number from 1 to 72."
            }), 400

        try:
            numeric_horizon = float(raw_horizon)
        except (TypeError, ValueError, OverflowError):
            return jsonify({
                "success": False,
                "message": "horizonHours must be a whole number from 1 to 72."
            }), 400

        if (
            not isfinite(numeric_horizon)
            or not numeric_horizon.is_integer()
            or not 1 <= numeric_horizon <= 72
        ):
            return jsonify({
                "success": False,
                "message": "horizonHours must be a whole number from 1 to 72."
            }), 400

        horizon_hours = int(numeric_horizon)

        # Retrieve the live WattTime forecast.
        forecast = get_live_forecast(
            region="CAISO_NORTH",
            signal_type="co2_moer",
            horizon_hours=horizon_hours
        )

        # Report the actual timestamp span returned by the service.
        coverage = get_forecast_coverage(forecast)
        coverage["requestedHorizonHours"] = horizon_hours
        coverage["coversRequestedHorizon"] = (
    coverage["availableCoverageHours"] >= horizon_hours
    and coverage["continuousCoverage"]
)

        # Run the live deadline-aware scheduler.
        result = schedule_live_workload(job, forecast)

        print("\n--- LIVE FORECAST DIAGNOSTIC ---")
        print("Forecast region:", forecast.get("region"))
        print("Forecast source:", forecast.get("source"))
        print("Selected time:", result.get("selectedTimeUtc"))
        print("Selected intensity:", result.get("averageCarbonIntensityGramsPerKWh"))
        print("Estimated energy:", result.get("estimatedEnergyKWh"))
        print("Estimated CO2:", result.get("estimatedCO2Grams"))
        print("Estimated savings:", result.get("co2SavedGramsVsEarliest"))
        print("--------------------------------\n")

        if result.get("status") != "Scheduled":
            return jsonify({
                "success": True,
                "message": "No feasible scheduling window was found.",
                "data": result,
                "forecastCoverage": coverage,
                "saved": False
            }), 200

        now = datetime.now().astimezone().isoformat(timespec="seconds")

        job_to_save = {
            "name": job.get(
                "job_name",
                job.get("name", "Unnamed Job")
            ),
            "type": job.get("type", "Data Processing"),
            "estimatedRuntime": result["estimatedRuntime"],
            "actualRuntime": None,
            "deadline": result["deadlineUtc"],
            "selectedTime": result["selectedTimeUtc"],
            "completionTime": result["completionTimeUtc"],
            "selectedRegion": result["region"],
            "carbonIntensity": result[
                "averageCarbonIntensityGramsPerKWh"
            ],
            "estimatedEnergy": result["estimatedEnergyKWh"],
            "estimatedCO2": result["estimatedCO2Grams"],
            "co2Saved": result["co2SavedGramsVsEarliest"],
            "status": "Scheduled",
            "priority": job.get("priority", "Normal"),
            "file_name": file_metadata["file_name"],
            "file_size_bytes": file_metadata["file_size_bytes"],
            "file_type": file_metadata["file_type"],
            "createdAt": now,
            "completedAt": None
        }

        # Persist only a successfully scheduled workload.
        saved_job = create_job(job_to_save)

        response_data = {
            **result,
            "jobId": saved_job["job_id"],
            "saved": True,
            "savedJob": saved_job,
            "forecastCoverage": coverage
        }

        return jsonify({
            "success": True,
            "message": "Live workload scheduled and saved successfully.",
            "data": response_data
        }), 201

    except ValueError as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    except Exception:
        import traceback
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": (
                "Live scheduling or database saving failed. "
                "Check the backend terminal."
            )
        }), 500
