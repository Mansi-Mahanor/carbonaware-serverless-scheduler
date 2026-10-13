const API_BASE_URL = "http://127.0.0.1:5000/api";

export async function getJobs() {
  const response = await fetch(`${API_BASE_URL}/jobs`);

  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }

  const result = await response.json();

  return result.data.map(mapBackendJob);
}

export async function getJob(jobId) {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch job");
  }

  const result = await response.json();

  return mapBackendJob(result.data);
}

export async function getCarbonForecast() {
  const response = await fetch(`${API_BASE_URL}/carbon/forecast`);

  if (!response.ok) {
    throw new Error("Failed to fetch carbon forecast");
  }

  const result = await response.json();

  return result.data;
}

export async function getCurrentIntensity(region = "Mumbai") {
  const response = await fetch(
    `${API_BASE_URL}/carbon/current?region=${encodeURIComponent(region)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch carbon intensity");
  }

  const result = await response.json();

  return result.data;
}

export async function scheduleJob(job) {
  const response = await fetch(`${API_BASE_URL}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(job),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to schedule job");
  }

  return mapBackendJob(result.data);
}


// Convert Flask/SQLite format → React format
export function mapBackendJob(job) {
  return {
    id: job.job_id,

    jobId: job.job_id,

    name: job.name,
    type: job.type,

    estimatedRuntime: job.estimated_runtime,
    actualRuntime: job.actual_runtime,

    deadline: job.deadline,
    selectedTime: job.selected_time,
    completionTime: job.completion_time,

    region: job.region,

    carbonIntensity: job.carbon_intensity,

    estimatedEnergy: job.estimated_energy,
    estimatedCO2: job.estimated_co2,
    co2Saved: job.co2_saved,

    status: job.status,
    priority: job.priority,

    createdAt: job.created_at,
    completedAt: job.completed_at,
  };
}
