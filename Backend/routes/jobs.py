from flask import Blueprint, request, jsonify

from job_service import (
    create_job,
    get_all_jobs,
    get_job_by_id,
    update_job,
    delete_job
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
