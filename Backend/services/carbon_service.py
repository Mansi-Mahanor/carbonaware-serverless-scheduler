"""
Carbon forecast service for the Carbon-Aware Serverless Workload Scheduler.
"""

from data.carbon_forecast import CARBON_FORECAST


# Available regions in our forecast
REGIONS = [
    {
        "id": "ap-south-1",
        "name": "Mumbai (ap-south-1)",
        "shortName": "Mumbai"
    },
    {
        "id": "ap-southeast-1",
        "name": "Singapore (ap-southeast-1)",
        "shortName": "Singapore"
    },
    {
        "id": "ap-northeast-1",
        "name": "Tokyo (ap-northeast-1)",
        "shortName": "Tokyo"
    },
    {
        "id": "us-east-1",
        "name": "US East (us-east-1)",
        "shortName": "US East"
    }
]


def get_carbon_forecast():
    """
    Return the complete carbon intensity forecast.
    """
    return CARBON_FORECAST


def get_available_regions():
    """
    Return all supported data-center regions.
    """
    return REGIONS


def get_current_intensity(region="Mumbai"):
    """
    Return the latest available carbon intensity
    for the requested region.

    Currently we use the 14:00 forecast slot
    as the current demonstration value.
    """

    if not region:
        region = "Mumbai"

    # Use 14:00 as current demonstration slot
    current_slot = next(
        (
            slot
            for slot in CARBON_FORECAST
            if slot["time"] == "14:00"
        ),
        CARBON_FORECAST[0]
    )

    intensity = current_slot.get(region)

    if intensity is None:
        return None

    return {
        "time": current_slot["time"],
        "region": region,
        "carbonIntensity": intensity
    }


def get_region_forecast(region):
    """
    Return forecast values for one region.
    """

    result = []

    for slot in CARBON_FORECAST:

        if region in slot:

            result.append({
                "time": slot["time"],
                "carbonIntensity": slot[region]
            })

    return result
