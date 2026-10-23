import os
import unittest
from unittest.mock import patch
import json
import io
import tempfile
import sqlite3
from datetime import datetime, timezone, timedelta

import database
import job_service
from app import app


class TestPhasesSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()

    def test_database_schema_and_columns(self):
        """Phase 5: Verify that jobs table has file metadata columns."""
        database.init_db()
        conn = database.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(jobs)")
        columns = [row[1] for row in cursor.fetchall()]
        conn.close()

        self.assertIn("file_name", columns)
        self.assertIn("file_size_bytes", columns)
        self.assertIn("file_type", columns)
        print("\nPASS: Database schema contains file_name, file_size_bytes, and file_type.")

    def test_status_transitions(self):
        """Phase 6: Verify valid and invalid status transitions."""
        # Valid transitions
        self.assertTrue(job_service.validate_status_transition("Submitted", "Scheduled"))
        self.assertTrue(job_service.validate_status_transition("Scheduled", "Running"))
        self.assertTrue(job_service.validate_status_transition("Running", "Completed"))
        self.assertTrue(job_service.validate_status_transition("Scheduled", "Completed"))
        self.assertTrue(job_service.validate_status_transition("Running", "Failed"))

        # Invalid transitions
        self.assertFalse(job_service.validate_status_transition("Completed", "Running"))
        self.assertFalse(job_service.validate_status_transition("Completed", "Scheduled"))
        self.assertFalse(job_service.validate_status_transition("Failed", "Running"))
        print("PASS: Workload status lifecycle transition rules enforced.")

    def test_job_service_file_metadata_and_persistence(self):
        """Phase 5: Test creating and retrieving job with file metadata."""
        test_job = {
            "name": "Metadata Test Job",
            "type": "CSV Processing",
            "estimatedRuntime": 25,
            "deadline": "23:59",
            "selectedTime": "2026-10-23T14:00:00Z",
            "region": "CAISO_NORTH",
            "carbonIntensity": 85.5,
            "estimatedCO2": 42.75,
            "co2Saved": 15.0,
            "status": "Scheduled",
            "fileName": "dataset_large.csv",
            "fileSizeBytes": 1048576,
            "fileType": "text/csv",
        }

        created = job_service.create_job(test_job)
        job_id = created["job_id"]
        self.assertTrue(job_id.startswith("JOB-"))

        retrieved = job_service.get_job_by_id(job_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["name"], "Metadata Test Job")
        self.assertEqual(retrieved["file_name"], "dataset_large.csv")
        self.assertEqual(retrieved["fileName"], "dataset_large.csv")
        self.assertEqual(retrieved["file_size_bytes"], 1048576)
        self.assertEqual(retrieved["fileSizeBytes"], 1048576)
        self.assertEqual(retrieved["file_type"], "text/csv")
        self.assertEqual(retrieved["fileType"], "text/csv")
        print("PASS: Workload file metadata persisted and retrieved successfully.")

    def test_job_execution_simulation_endpoint(self):
        """Phase 6: Test POST /api/jobs/<job_id>/execute endpoint."""
        test_job = {
            "name": "Simulation Test Job",
            "type": "Data Processing",
            "estimatedRuntime": 15,
            "deadline": "22:00",
            "status": "Scheduled",
            "carbonIntensity": 90.0,
        }
        created = job_service.create_job(test_job)
        job_id = created["job_id"]

        # Trigger execution simulation
        response = self.client.post(f"/api/jobs/{job_id}/execute")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["status"], "Completed")
        self.assertEqual(data["data"]["actual_runtime"], 15)
        self.assertIsNotNone(data["data"]["completed_at"])
        self.assertEqual(data.get("executionMode"), "Simulated Demonstration")
        print("PASS: Execution simulation endpoint transitions status to Completed with simulated runtime.")

    @patch("routes.schedule_routes.get_live_forecast")
    def test_schedule_live_with_file_upload(self, mock_forecast):
        """Phase 5 & 6: Test /api/schedule-live with multipart form upload."""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(minutes=5)
        forecast_points = []
        for i in range(12):
            t = start_time + timedelta(minutes=5 * i)
            forecast_points.append({
                "time": t.isoformat(),
                "carbonIntensity": 100 + i * 5,
                "carbonIntensityGramsPerKWh": 100 + i * 5,
            })

        mock_forecast.return_value = {
            "source": "WattTime Live API",
            "region": "CAISO_NORTH",
            "signalType": "co2_moer",
            "generatedAt": now.isoformat(),
            "data": forecast_points,
        }

        deadline = (now + timedelta(hours=4)).isoformat()
        file_bytes = b"import sys\nprint('Running carbon workload')\n"

        data = {
            "name": "Upload Live Workload",
            "type": "CSV Processing",
            "estimatedRuntime": "10",
            "deadlineUtc": deadline,
            "region": "CAISO_NORTH",
            "carbonAware": "true",
            "file": (io.BytesIO(file_bytes), "test_workload_script.py"),
        }

        response = self.client.post(
            "/api/schedule-live",
            data=data,
            content_type="multipart/form-data"
        )
        self.assertIn(response.status_code, [200, 201])
        res_json = response.get_json()
        self.assertTrue(res_json["success"])

        data_payload = res_json["data"]
        self.assertEqual(data_payload["status"], "Scheduled")
        saved_job = data_payload.get("savedJob", {})
        self.assertEqual(saved_job.get("file_name"), "test_workload_script.py")
        self.assertEqual(saved_job.get("file_size_bytes"), len(file_bytes))
        self.assertIn(saved_job.get("file_type"), ["text/x-python", "text/plain", "application/octet-stream", "application/x-python-code"])
        print("PASS: schedule-live successfully handled multipart file upload and calculated size.")


if __name__ == "__main__":
    unittest.main()
