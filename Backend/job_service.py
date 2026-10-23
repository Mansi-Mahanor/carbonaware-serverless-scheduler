from database import get_db_connection


def generate_job_id():
    """
    Generate the next job ID in the format JOB-1001, JOB-1002, etc.
    """

    connection = get_db_connection()

    row = connection.execute("""
        SELECT job_id
        FROM jobs
        ORDER BY id DESC
        LIMIT 1
    """).fetchone()

    connection.close()

    if row is None:
        return "JOB-1001"

    try:
        last_number = int(row["job_id"].split("-")[1])
        return f"JOB-{last_number + 1}"
    except (ValueError, IndexError):
        return "JOB-1001"


def create_job(job):
    """
    Save a scheduled job into the database.
    """

    job_id = generate_job_id()

    connection = get_db_connection()

    connection.execute("""
        INSERT INTO jobs (
            job_id,
            name,
            type,
            estimated_runtime,
            actual_runtime,
            deadline,
            selected_time,
            completion_time,
            region,
            carbon_intensity,
            estimated_energy,
            estimated_co2,
            co2_saved,
            status,
            priority,
            created_at,
            completed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        job_id,
        job.get("name", "Unnamed Job"),
        job.get("type", "Data Processing"),
        job.get("estimatedRuntime", job.get("estimated_runtime", 30)),
        job.get("actualRuntime", job.get("actual_runtime")),
        job.get("deadline", "18:00"),
        job.get("selectedTime", job.get("selected_time", "")),
        job.get("completionTime", job.get("completion_time")),
        job.get("selectedRegion", job.get("region", "")),
        job.get("carbonIntensity", job.get("carbon_intensity", 0)),
        job.get("estimatedEnergy", job.get("estimated_energy", 0)),
        job.get("estimatedCO2", job.get("estimated_co2", 0)),
        job.get("co2Saved", job.get("co2_saved", 0)),
        job.get("status", "Scheduled"),
        job.get("priority", "Normal"),
        job.get("createdAt", job.get("created_at", "")),
        job.get("completedAt", job.get("completed_at"))
    ))

    connection.commit()
    connection.close()

    return get_job_by_id(job_id)


def get_all_jobs():
    """
    Return all jobs from the database.
    """

    connection = get_db_connection()

    rows = connection.execute("""
        SELECT *
        FROM jobs
        ORDER BY id DESC
    """).fetchall()

    connection.close()

    return [dict(row) for row in rows]


def get_job_by_id(job_id):
    """
    Return one job using its job ID.
    """

    connection = get_db_connection()

    row = connection.execute("""
        SELECT *
        FROM jobs
        WHERE job_id = ?
    """, (job_id,)).fetchone()

    connection.close()

    if row is None:
        return None

    return dict(row)


def update_job(job_id, job):
    """
    Update an existing job.
    """

    connection = get_db_connection()

    existing = connection.execute("""
        SELECT *
        FROM jobs
        WHERE job_id = ?
    """, (job_id,)).fetchone()

    if existing is None:
        connection.close()
        return None

    connection.execute("""
        UPDATE jobs
        SET
            name = ?,
            type = ?,
            estimated_runtime = ?,
            actual_runtime = ?,
            deadline = ?,
            selected_time = ?,
            completion_time = ?,
            region = ?,
            carbon_intensity = ?,
            estimated_energy = ?,
            estimated_co2 = ?,
            co2_saved = ?,
            status = ?,
            priority = ?,
            completed_at = ?
        WHERE job_id = ?
    """, (
        job.get("name", existing["name"]),
        job.get("type", existing["type"]),
        job.get("estimatedRuntime", job.get("estimated_runtime", existing["estimated_runtime"])),
        job.get("actualRuntime", job.get("actual_runtime", existing["actual_runtime"])),
        job.get("deadline", existing["deadline"]),
        job.get("selectedTime", job.get("selected_time", existing["selected_time"])),
        job.get("completionTime", job.get("completion_time", existing["completion_time"])),
        job.get("selectedRegion", job.get("region", existing["region"])),
        job.get("carbonIntensity", job.get("carbon_intensity", existing["carbon_intensity"])),
        job.get("estimatedEnergy", job.get("estimated_energy", existing["estimated_energy"])),
        job.get("estimatedCO2", job.get("estimated_co2", existing["estimated_co2"])),
        job.get("co2Saved", job.get("co2_saved", existing["co2_saved"])),
        job.get("status", existing["status"]),
        job.get("priority", existing["priority"]),
        job.get("completedAt", job.get("completed_at", existing["completed_at"])),
        job_id
    ))

    connection.commit()
    connection.close()

    return get_job_by_id(job_id)


def delete_job(job_id):
    """
    Delete a job from the database.
    """

    connection = get_db_connection()

    cursor = connection.execute("""
        DELETE FROM jobs
        WHERE job_id = ?
    """, (job_id,))

    connection.commit()
    connection.close()

    return cursor.rowcount > 0
