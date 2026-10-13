from services.scheduler import schedule_workload
from data.carbon_forecast import CARBON_FORECAST


job = {
    "name": "Data Processing",
    "type": "CSV Processing",
    "estimatedRuntime": 30,
    "deadline": "17:00",
    "preferredRegion": "Mumbai (ap-south-1)",
    "allowRegionChange": True,
    "carbonAware": True
}


result = schedule_workload(
    job,
    CARBON_FORECAST
)


print("\n========== SCHEDULING RESULT ==========")

for key, value in result.items():
    print(f"{key}: {value}")

print("========================================")
