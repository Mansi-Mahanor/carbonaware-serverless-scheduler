from flask import Blueprint, request, jsonify

from datetime import datetime

from job_service import (
    create_job,
    get_all_jobs,
    get_job_by_id,
    update_job,
    delete_job,
    validate_status_transition
)


jobs_bp = Blueprint("jobs", __name__)


# ==========================================
# GET ALL JOBS
# ==========================================

@jobs_bp.route("/jobs", methods=["GET"])
def get_jobs():

    try:
        jobs = get_all_jobs()

        return jsonify({
            "success": True,
            "data": jobs
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ==========================================
# GET SINGLE JOB
# ==========================================

@jobs_bp.route("/jobs/<job_id>", methods=["GET"])
def get_job(job_id):

    try:
        job = get_job_by_id(job_id)

        if job is None:
            return jsonify({
                "success": False,
                "message": "Job not found"
            }), 404

        return jsonify({
            "success": True,
            "data": job
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ==========================================
# CREATE JOB
# ==========================================

@jobs_bp.route("/jobs", methods=["POST"])
def add_job():

    try:
        job = request.get_json()

        if not job:
            return jsonify({
                "success": False,
                "message": "No job data provided"
            }), 400

        created_job = create_job(job)

        return jsonify({
            "success": True,
            "message": "Job created successfully",
            "data": created_job
        }), 201

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ==========================================
# UPDATE JOB
# ==========================================

@jobs_bp.route("/jobs/<job_id>", methods=["PUT"])
def edit_job(job_id):

    try:
        job = request.get_json()

        if not job:
            return jsonify({
                "success": False,
                "message": "No update data provided"
            }), 400

        updated_job = update_job(job_id, job)

        if updated_job is None:
            return jsonify({
                "success": False,
                "message": "Job not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "Job updated successfully",
            "data": updated_job
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ==========================================
# DELETE JOB
# ==========================================

@jobs_bp.route("/jobs/<job_id>", methods=["DELETE"])
def remove_job(job_id):

    try:
        deleted = delete_job(job_id)

        if not deleted:
            return jsonify({
                "success": False,
                "message": "Job not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "Job deleted successfully"
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ==========================================
# EXECUTE JOB (DEMONSTRATION SIMULATION)
# ==========================================

@jobs_bp.route("/jobs/<job_id>/execute", methods=["POST"])
def execute_job(job_id):
    """
    Demonstration workload execution.
    Simulates cloud serverless invocation for a scheduled/pending job,
    transitioning its state to Completed with simulated runtime metrics.
    Clearly identifies execution as a simulated demonstration.
    """
    try:
        job = get_job_by_id(job_id)

        if job is None:
            return jsonify({
                "success": False,
                "message": "Job not found"
            }), 404

        if job["status"] == "Completed":
            return jsonify({
                "success": True,
                "message": "Job is already completed.",
                "data": job,
                "executionMode": "Simulated Demonstration"
            }), 200

        estimated_runtime = job.get("estimated_runtime") or 30
        now = datetime.now().astimezone().isoformat(timespec="seconds")

        updated_job = update_job(job_id, {
            "status": "Completed",
            "actual_runtime": estimated_runtime,
            "completed_at": now
        })

        return jsonify({
            "success": True,
            "message": "Demonstration execution completed successfully (simulated cloud execution).",
            "data": updated_job,
            "executionMode": "Simulated Demonstration"
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ==========================================
# UPDATE JOB STATUS (LIFECYCLE TRANSITION)
# ==========================================

@jobs_bp.route("/jobs/<job_id>/status", methods=["POST"])
def change_job_status(job_id):
    """
    Update job status with lifecycle transition validation.
    """
    try:
        data = request.get_json(silent=True) or {}
        new_status = data.get("status")

        if not new_status:
            return jsonify({
                "success": False,
                "message": "A 'status' field is required."
            }), 400

        job = get_job_by_id(job_id)

        if job is None:
            return jsonify({
                "success": False,
                "message": "Job not found"
            }), 404

        current_status = job.get("status", "Pending")

        if not validate_status_transition(current_status, new_status):
            return jsonify({
                "success": False,
                "message": f"Invalid status transition from '{current_status}' to '{new_status}'."
            }), 400

        update_payload = {"status": new_status}

        if new_status == "Completed" and not job.get("completed_at"):
            now = datetime.now().astimezone().isoformat(timespec="seconds")
            update_payload["completed_at"] = now
            if not job.get("actual_runtime"):
                update_payload["actual_runtime"] = job.get("estimated_runtime")

        updated_job = update_job(job_id, update_payload)

        return jsonify({
            "success": True,
            "message": f"Job status transitioned to '{new_status}' successfully.",
            "data": updated_job
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
