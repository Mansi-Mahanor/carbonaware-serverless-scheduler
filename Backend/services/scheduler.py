def time_to_minutes(time_str):
    """
    Convert HH:MM into minutes from midnight.
    Example: 14:30 -> 870
    """
    if not time_str:
        return 0

    hours, minutes = map(int, time_str.split(":"))
    return hours * 60 + minutes


def minutes_to_time(total_minutes):
    """
    Convert minutes from midnight back to HH:MM.
    Example: 870 -> 14:30
    """
    total_minutes = total_minutes % (24 * 60)

    hours = total_minutes // 60
    minutes = total_minutes % 60

    return f"{hours:02d}:{minutes:02d}"

def get_carbon_intensity_status(intensity):
    """
    Categorize carbon intensity.
    """

    if intensity <= 135:
        return "Low"

    if intensity <= 170:
        return "Medium"

    return "High"

REGION_KEY_MAP = {
    "Mumbai (ap-south-1)": "Mumbai",
    "Singapore (ap-southeast-1)": "Singapore",
    "Tokyo (ap-northeast-1)": "Tokyo",
    "US East (us-east-1)": "US East"
}


REGION_FULL_NAME_MAP = {
    "Mumbai": "Mumbai (ap-south-1)",
    "Singapore": "Singapore (ap-southeast-1)",
    "Tokyo": "Tokyo (ap-northeast-1)",
    "US East": "US East (us-east-1)"
}

def schedule_workload(job, carbon_forecast):
    """
    Find the lowest-carbon feasible execution slot.
    """

    estimated_runtime = int(job.get("estimatedRuntime", 30))

    deadline = job.get("deadline", "18:00")

    deadline_minutes = time_to_minutes(deadline)

    preferred_region = job.get(
        "preferredRegion",
        "Mumbai (ap-south-1)"
    )

    allow_region_change = bool(
        job.get("allowRegionChange", False)
    )

    carbon_aware = job.get("carbonAware", True)

    # Determine which regions can be considered
    if allow_region_change:
        target_regions = [
            "Mumbai",
            "Singapore",
            "Tokyo",
            "US East"
        ]
    else:
        target_regions = [
            REGION_KEY_MAP.get(
                preferred_region,
                "Mumbai"
            )
        ]

    feasible_slots = []

    peak_intensity = 0

    # Examine every forecast slot
    for slot in carbon_forecast:

        slot_time = slot["time"]

        slot_minutes = time_to_minutes(slot_time)

        completion_minutes = (
            slot_minutes + estimated_runtime
        )

        # Job must finish before deadline
        if completion_minutes <= deadline_minutes:

            for region in target_regions:

                intensity = slot.get(region)

                if intensity is None:
                    continue

                # Track highest intensity
                peak_intensity = max(
                    peak_intensity,
                    intensity
                )

                feasible_slots.append({
                    "time": slot_time,
                    "slotMinutes": slot_minutes,
                    "regionKey": region,
                    "regionFullName":
                        REGION_FULL_NAME_MAP[region],
                    "carbonIntensity": intensity,
                    "completionTime":
                        minutes_to_time(completion_minutes)
                })

    # No valid slot
    if not feasible_slots:

        return {
            "status": "Scheduled",
            "isFallback": True,
            "reason":
                "No slot completed before deadline."
        }

    # Carbon-aware scheduling
    if carbon_aware:

        chosen_slot = min(
            feasible_slots,
            key=lambda x: x["carbonIntensity"]
        )

    # Normal scheduling
    else:

        chosen_slot = feasible_slots[0]

    # Energy calculation
    #
    # Assumption:
    # Average compute power = 1.5 kW
    #
    estimated_energy = (
        estimated_runtime / 60
    ) * 1.5

    estimated_energy = round(
        estimated_energy,
        3
    )

    # CO2 calculation
    estimated_co2 = (
        estimated_energy *
        chosen_slot["carbonIntensity"]
    )

    estimated_co2 = round(
        estimated_co2,
        1
    )

    # Baseline using highest intensity
    peak_co2 = (
        estimated_energy *
        peak_intensity
    )

    co2_saved = max(
        0,
        peak_co2 - estimated_co2
    )

    co2_saved = round(
        co2_saved,
        1
    )

    return {
        "selectedTime":
            chosen_slot["time"],

        "selectedRegion":
            chosen_slot["regionFullName"],

        "carbonIntensity":
            chosen_slot["carbonIntensity"],

        "carbonStatus":
            get_carbon_intensity_status(
                chosen_slot["carbonIntensity"]
            ),

        "completionTime":
            chosen_slot["completionTime"],

        "estimatedCO2":
            estimated_co2,

        "estimatedEnergy":
            estimated_energy,

        "co2Saved":
            co2_saved,

        "estimatedRuntime":
            estimated_runtime,

        "deadline":
            deadline,

        "status":
            "Scheduled",

        "isFallback":
            False
    }
