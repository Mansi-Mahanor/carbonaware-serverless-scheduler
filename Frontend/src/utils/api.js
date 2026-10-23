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




export async function getCarbonForecast(
  region = "CAISO_NORTH",
  horizonHours = 24
) {
  const url =
    `${API_BASE_URL}/carbon/live-forecast` +
    `?region=${encodeURIComponent(region)}` +
    `&horizon_hours=${encodeURIComponent(horizonHours)}`;

  const response = await fetch(url);
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Backend returned an invalid response.");
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
      result.error ||
      "Failed to fetch live WattTime forecast."
    );
  }

  const forecast = result.data;

  if (!forecast || !Array.isArray(forecast.data)) {
    throw new Error("WattTime returned an invalid forecast response.");
  }

  if (forecast.data.length === 0) {
    throw new Error("WattTime returned no forecast points.");
  }

  return forecast;
}



// Returns the latest available forecast point, not a measured current value.
export async function getCurrentIntensity(region = "CAISO_NORTH") {
  const forecast = await getCarbonForecast(region, 1);
  const latestPoint = forecast.data[0];

  return {
    region: forecast.region || region,
    carbonIntensity:
      latestPoint.carbonIntensityGramsPerKWh,
    timestamp: latestPoint.time,
    source: forecast.source || "WattTime",
    signalType: forecast.signalType || "co2_moer",
  };
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

export async function scheduleLiveJob(job, file = null) {
  let response;

  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job", JSON.stringify(job));

    response = await fetch(`${API_BASE_URL}/schedule-live`, {
      method: "POST",
      body: formData,
    });
  } else {
    response = await fetch(`${API_BASE_URL}/schedule-live`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(job),
    });
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Backend returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message ||
      result.error ||
      "Failed to schedule live workload."
    );
  }

  return result;
}

export async function executeJob(jobId) {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/execute`, {
    method: "POST",
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Backend returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to execute workload.");
  }

  return mapBackendJob(result.data);
}

export async function updateJobStatus(jobId, status) {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Backend returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to update job status.");
  }

  return mapBackendJob(result.data);
}

// Convert Flask/SQLite format → React format
export function mapBackendJob(job) {
  if (!job) return null;

  return {
    id: job.job_id || job.id,

    jobId: job.job_id || job.id,

    name: job.name,
    type: job.type,

    estimatedRuntime: job.estimated_runtime ?? job.estimatedRuntime ?? 0,
    actualRuntime: job.actual_runtime ?? job.actualRuntime ?? null,

    deadline: job.deadline,
    selectedTime: job.selected_time ?? job.selectedTime ?? "",
    completionTime: job.completion_time ?? job.completionTime ?? null,

    region: job.region || job.selectedRegion || "",

    carbonIntensity: job.carbon_intensity ?? job.carbonIntensity ?? 0,

    estimatedEnergy: job.estimated_energy ?? job.estimatedEnergy ?? 0,
    estimatedCO2: job.estimated_co2 ?? job.estimatedCO2 ?? 0,
    co2Saved: job.co2_saved ?? job.co2Saved ?? 0,

    status: job.status,
    priority: job.priority,

    fileName: job.file_name ?? job.fileName ?? null,
    fileSizeBytes: job.file_size_bytes ?? job.fileSizeBytes ?? null,
    fileType: job.file_type ?? job.fileType ?? null,

    createdAt: job.created_at ?? job.createdAt ?? "",
    completedAt: job.completed_at ?? job.completedAt ?? null,
  };
}
