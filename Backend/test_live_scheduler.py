
import unittest
from datetime import datetime, timedelta, timezone

from services.live_scheduler import schedule_live_workload


class TestLiveScheduler(unittest.TestCase):

    def setUp(self):
        # Start forecasts five minutes in the future to avoid past slots.
        self.start = datetime.now(timezone.utc) + timedelta(minutes=5)

    def make_forecast(self, intensities, gaps=None):
        """Build a simulated five-minute WattTime-style forecast."""
        gaps = set(gaps or [])
        points = []

        for index, intensity in enumerate(intensities):
            if index in gaps:
                continue

            timestamp = self.start + timedelta(minutes=5 * index)

            points.append({
                "time": timestamp.isoformat(),
                "carbonIntensityGramsPerKWh": intensity,
            })

        return {
            "source": "Simulated Test Forecast",
            "region": "TEST_REGION",
            "signalType": "co2_moer",
            "data": points,
        }

    def make_job(self, runtime=10, carbon_aware=True, deadline_minutes=60):
        deadline = datetime.now(timezone.utc) + timedelta(
            minutes=deadline_minutes
        )

        return {
            "name": "Automated Test",
            "estimatedRuntime": runtime,
            "deadlineUtc": deadline.isoformat(),
            "carbonAware": carbon_aware,
        }

    def test_1_selects_lowest_carbon_window(self):
        forecast = self.make_forecast([300, 300, 100, 100, 200, 200])
        result = schedule_live_workload(
            self.make_job(runtime=10),
            forecast,
        )

        self.assertEqual(result["status"], "Scheduled")
        self.assertEqual(
            result["averageCarbonIntensityGramsPerKWh"], 100
        )
        print("\nPASS: Lowest-carbon window selected.")

    def test_2_accepts_zero_intensity(self):
        forecast = self.make_forecast([0, 0, 100, 100, 200, 200])
        result = schedule_live_workload(
            self.make_job(runtime=10),
            forecast,
        )

        self.assertEqual(result["status"], "Scheduled")
        self.assertEqual(
            result["averageCarbonIntensityGramsPerKWh"], 0
        )
        self.assertEqual(result["estimatedCO2Grams"], 0)
        print("\nPASS: Zero-intensity forecast handled.")

    def test_3_respects_deadline(self):
        forecast = self.make_forecast([100] * 12)

        result = schedule_live_workload(
            self.make_job(runtime=30, deadline_minutes=12),
            forecast,
        )

        self.assertEqual(result["status"], "Not Scheduled")
        print("\nPASS: Workload rejected when deadline cannot be met.")

    def test_4_rejects_missing_intervals(self):
        # Points are ten minutes apart, so no continuous 10-minute
        # workload window can be formed from five-minute intervals.
        forecast = self.make_forecast([100, 100, 100], gaps={1})

        result = schedule_live_workload(
            self.make_job(runtime=10),
            forecast,
        )

        self.assertEqual(result["status"], "Not Scheduled")
        print("\nPASS: Missing forecast intervals detected.")

    def test_5_carbon_aware_disabled_chooses_earliest(self):
        forecast = self.make_forecast([300, 300, 100, 100, 200, 200])

        result = schedule_live_workload(
            self.make_job(runtime=10, carbon_aware=False),
            forecast,
        )

        self.assertEqual(result["status"], "Scheduled")

        selected = datetime.fromisoformat(
            result["selectedTimeUtc"]
        )

        self.assertEqual(selected, self.start)
        self.assertEqual(
            result["averageCarbonIntensityGramsPerKWh"], 300
        )
        print("\nPASS: Earliest feasible window selected when carbon-aware is off.")


    def test_6_rejects_invalid_runtime(self):
        forecast = self.make_forecast([100] * 12)

        for runtime in [0, -5, 2.5]:
            with self.subTest(runtime=runtime):
                with self.assertRaises(ValueError):
                    schedule_live_workload(
                        self.make_job(runtime=runtime),
                        forecast,
                    )

    def test_7_rejects_past_deadline(self):
        forecast = self.make_forecast([100] * 12)

        job = self.make_job(runtime=10)
        job["deadlineUtc"] = (
            datetime.now(timezone.utc) - timedelta(minutes=5)
        ).isoformat()

        with self.assertRaises(ValueError):
            schedule_live_workload(job, forecast)

    def test_8_rejects_duplicate_timestamps(self):
        forecast = self.make_forecast([100, 100, 100])

        # Duplicate the first forecast point.
        forecast["data"].append(dict(forecast["data"][0]))

        with self.assertRaisesRegex(ValueError, "duplicate timestamps"):
            schedule_live_workload(
                self.make_job(runtime=10),
                forecast,
            )

    def test_9_supports_runtime_not_multiple_of_five(self):
        forecast = self.make_forecast([200, 100, 100, 300])

        result = schedule_live_workload(
            self.make_job(runtime=7),
            forecast,
        )

        self.assertEqual(result["status"], "Scheduled")
        self.assertEqual(result["estimatedRuntime"], 7)

        start = datetime.fromisoformat(result["selectedTimeUtc"])
        completion = datetime.fromisoformat(result["completionTimeUtc"])

        self.assertEqual(
            completion - start,
            timedelta(minutes=7),
        )

    def test_10_rejects_empty_forecast(self):
        forecast = {
            "source": "Simulated Test Forecast",
            "region": "TEST_REGION",
            "data": [],
        }

        with self.assertRaisesRegex(ValueError, "No usable forecast"):
            schedule_live_workload(
                self.make_job(runtime=10),
                forecast,
            )

    def test_6_rejects_invalid_runtime(self):
        forecast = self.make_forecast([100] * 12)

        for runtime in [0, -5, 2.5]:
            with self.subTest(runtime=runtime):
                with self.assertRaises(ValueError):
                    schedule_live_workload(
                        self.make_job(runtime=runtime), forecast
                    )

    def test_7_rejects_past_deadline(self):
        forecast = self.make_forecast([100] * 12)
        job = self.make_job(runtime=10)
        job["deadlineUtc"] = (
            datetime.now(timezone.utc) - timedelta(minutes=5)
        ).isoformat()

        with self.assertRaises(ValueError):
            schedule_live_workload(job, forecast)

    def test_8_rejects_duplicate_timestamps(self):
        forecast = self.make_forecast([100, 100, 100])
        forecast["data"].append(dict(forecast["data"][0]))

        with self.assertRaisesRegex(ValueError, "duplicate timestamps"):
            schedule_live_workload(
                self.make_job(runtime=10), forecast
            )

    def test_9_supports_runtime_not_multiple_of_five(self):
        forecast = self.make_forecast([200, 100, 100, 300])
        result = schedule_live_workload(
            self.make_job(runtime=7), forecast
        )

        self.assertEqual(result["status"], "Scheduled")
        self.assertEqual(result["estimatedRuntime"], 7)

        start = datetime.fromisoformat(result["selectedTimeUtc"])
        completion = datetime.fromisoformat(result["completionTimeUtc"])
        self.assertEqual(completion - start, timedelta(minutes=7))

    def test_10_rejects_empty_forecast(self):
        forecast = {
            "source": "Simulated Test Forecast",
            "region": "TEST_REGION",
            "data": [],
        }

        with self.assertRaisesRegex(ValueError, "No usable forecast"):
            schedule_live_workload(
                self.make_job(runtime=10), forecast
            )



    def test_11_calculates_co2_savings_against_earliest(self):
        forecast = self.make_forecast([300, 300, 100, 100, 200, 200])
        result = schedule_live_workload(
            self.make_job(runtime=10, carbon_aware=True),
            forecast,
        )

        # Energy = 10 / 60 * 1.5 = 0.25 kWh
        # Baseline emissions = 0.25 * 300 = 75 g
        # Selected emissions = 0.25 * 100 = 25 g
        self.assertEqual(result["estimatedEnergyKWh"], 0.25)
        self.assertEqual(result["estimatedCO2Grams"], 25.0)
        self.assertEqual(result["co2SavedGramsVsEarliest"], 50.0)

    def test_12_zero_intensity_is_preferred(self):
        forecast = self.make_forecast([200, 200, 0, 0, 100, 100])
        result = schedule_live_workload(
            self.make_job(runtime=10, carbon_aware=True),
            forecast,
        )

        self.assertEqual(result["status"], "Scheduled")
        self.assertEqual(
            result["averageCarbonIntensityGramsPerKWh"], 0
        )
        self.assertEqual(result["estimatedCO2Grams"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
