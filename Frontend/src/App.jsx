import React, { useCallback, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Dashboard from './pages/Dashboard';
import ScheduleWorkload from './pages/ScheduleWorkload';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import CarbonForecast from './pages/CarbonForecast';
import History from './pages/History';
import Settings from './pages/Settings';

import {
  getJobs,
  getCarbonForecast,
} from './utils/api';

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const DEFAULT_REGION = 'CAISO_NORTH';

// --------------------------------------------------
// FORECAST HELPERS
// --------------------------------------------------

/**
 * Select the forecast point closest to the current time
 * without using a point from the past.
 *
 * A zero value is preserved because zero may be a valid
 * value returned by the API. The backend response must
 * be checked separately if the zeros look suspicious.
 */
const getLatestForecastPoint = (forecastData, intervalSeconds = 300) => {
  if (!Array.isArray(forecastData) || forecastData.length === 0) {
    return null;
  }

  const intervalMs = (intervalSeconds || 300) * 1000;
  const now = Date.now();

  const validPoints = forecastData
    .map((point) => {
      const time = point?.time || point?.point_time || point?.timestamp;
      const rawIntensity =
        point?.carbonIntensity ??
        point?.carbonIntensityGramsPerKWh ??
        point?.value;
      const intensity = Number(rawIntensity);
      if (!time || !Number.isFinite(intensity) || intensity < 0) {
        return null;
      }
      const timestamp = new Date(time).getTime();
      if (Number.isNaN(timestamp)) {
        return null;
      }
      return {
        ...point,
        time,
        timestamp,
        intensity,
        carbonIntensity: intensity,
        carbonIntensityGramsPerKWh: intensity,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (validPoints.length === 0) {
    return null;
  }

  // 1. Point that covers the current active 5-minute interval
  const activePoint = validPoints.find(
    (p) => p.timestamp <= now && now < p.timestamp + intervalMs
  );
  if (activePoint) {
    return activePoint;
  }

  // 2. Nearest upcoming point
  const nextPoint = validPoints.find((p) => p.timestamp >= now);
  if (nextPoint) {
    return nextPoint;
  }

  // 3. Fallback to most recent point
  return validPoints[validPoints.length - 1];
};

// --------------------------------------------------
// NORMALIZE BACKEND JOB DATA
// --------------------------------------------------

const normalizeJob = (job = {}) => ({
  ...job,

  id: job.id ?? job.job_id,
  jobId: job.jobId ?? job.job_id ?? job.id,
  job_id: job.job_id ?? job.id,

  name: job.name ?? 'Unnamed Job',
  type: job.type ?? 'Data Processing',

  estimatedRuntime:
    job.estimatedRuntime ??
    job.estimated_runtime ??
    0,

  actualRuntime:
    job.actualRuntime ??
    job.actual_runtime ??
    null,

  deadline: job.deadline ?? '',

  selectedTime:
    job.selectedTime ??
    job.selected_time ??
    '',

  completionTime:
    job.completionTime ??
    job.completion_time ??
    null,

  region:
    job.region ??
    job.selectedRegion ??
    job.selected_region ??
    '',

  selectedRegion:
    job.selectedRegion ??
    job.selected_region ??
    job.region ??
    '',

  carbonIntensity: Number(
    job.carbonIntensity ??
    job.carbon_intensity ??
    0
  ),

  estimatedEnergy: Number(
    job.estimatedEnergy ??
    job.estimated_energy ??
    0
  ),

  estimatedCO2: Number(
    job.estimatedCO2 ??
    job.estimated_co2 ??
    0
  ),

  co2Saved: Number(
    job.co2Saved ??
    job.co2_saved ??
    0
  ),

  status: job.status ?? 'Scheduled',
  priority: job.priority ?? 'Normal',

  fileName:
    job.fileName ??
    job.file_name ??
    null,

  fileSizeBytes:
    job.fileSizeBytes != null
      ? Number(job.fileSizeBytes)
      : job.file_size_bytes != null
        ? Number(job.file_size_bytes)
        : null,

  fileType:
    job.fileType ??
    job.file_type ??
    null,

  createdAt:
    job.createdAt ??
    job.created_at ??
    '',

  completedAt:
    job.completedAt ??
    job.completed_at ??
    null,
});

// --------------------------------------------------
// MAIN APPLICATION
// --------------------------------------------------

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [carbonForecast, setCarbonForecast] = useState([]);
  const [currentIntensity, setCurrentIntensity] = useState(null);

  const [forecastInfo, setForecastInfo] = useState({
    region: DEFAULT_REGION,
    source: 'WattTime API V3',
    signalType: 'co2_moer',
    timestamp: null,
    intervalSeconds: 300,
    convertedUnit: 'g CO2/kWh',
  });

  const [settings, setSettings] = useState({
    defaultRegion: DEFAULT_REGION,
    carbonAware: true,
    allowRegionChange: true,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ------------------------------------------------
  // LOAD JOBS AND LIVE WATTTIME FORECAST
  // ------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [jobsData, forecastResult] = await Promise.all([
        getJobs(),
        getCarbonForecast(DEFAULT_REGION, 24),
      ]);

      // Accept the forecast object returned by api.js.
      const forecastPoints = forecastResult?.data;

      if (
        !Array.isArray(forecastPoints) ||
        forecastPoints.length === 0
      ) {
        throw new Error(
          'WattTime returned no forecast points. Check the backend and API response.'
        );
      }

      const latestPoint = getLatestForecastPoint(
        forecastPoints,
        forecastResult?.intervalSeconds || 300
      );

      // Normalize all forecast points with consistent keys
      const normalizedForecast = forecastPoints
        .map((point) => {
          const time = point?.time || point?.point_time;
          const rawIntensity =
            point?.carbonIntensity ??
            point?.carbonIntensityGramsPerKWh ??
            point?.value;
          const intensity = Number(rawIntensity);
          if (!time || !Number.isFinite(intensity) || intensity < 0) {
            return null;
          }
          return {
            ...point,
            time,
            carbonIntensity: intensity,
            carbonIntensityGramsPerKWh: intensity,
          };
        })
        .filter(Boolean);

      setJobs(
        Array.isArray(jobsData)
          ? jobsData.map(normalizeJob)
          : []
      );

      setCarbonForecast(normalizedForecast);
      setCurrentIntensity(latestPoint ? latestPoint.intensity : null);

      setForecastInfo({
        region: forecastResult.region || DEFAULT_REGION,
        source: forecastResult.source || 'WattTime API V3',
        signalType: forecastResult.signalType || 'co2_moer',
        timestamp: latestPoint ? latestPoint.time : null,
        intervalSeconds: forecastResult.intervalSeconds || 300,
        convertedUnit:
          forecastResult.convertedUnit || 'g CO2/kWh',
      });

    } catch (err) {
      console.error('Failed to load application data:', err);

      setError(
        err?.message ||
        'Unable to load saved jobs or the live WattTime forecast.'
      );

      // Never substitute mock forecast values on failure.
      setCarbonForecast([]);
      setCurrentIntensity(null);

      setForecastInfo({
        region: DEFAULT_REGION,
        source: 'WattTime API V3',
        signalType: 'co2_moer',
        timestamp: null,
        intervalSeconds: 300,
        convertedUnit: 'g CO2/kWh',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ------------------------------------------------
  // ADD A NEWLY SCHEDULED JOB
  // ------------------------------------------------

  const handleAddJob = (newJob) => {
    const normalizedJob = normalizeJob(newJob);

    setJobs((previousJobs) => [
      normalizedJob,
      ...previousJobs.filter(
        (job) => job.id !== normalizedJob.id
      ),
    ]);
  };

  const handleUpdateJob = (updatedJob) => {
    const normalizedJob = normalizeJob(updatedJob);

    setJobs((previousJobs) =>
      previousJobs.map((job) =>
        job.id === normalizedJob.id ? normalizedJob : job
      )
    );
  };

  // ------------------------------------------------
  // UPDATE SETTINGS
  // ------------------------------------------------

  const handleUpdateSettings = (newSettings) => {
    setSettings((previousSettings) => ({
      ...previousSettings,
      ...newSettings,
    }));
  };

  // ------------------------------------------------
  // LOADING SCREEN
  // ------------------------------------------------

  if (loading) {
    return (
      <div className="app-loading">
        <h2>Loading Carbon-Aware Scheduler...</h2>
        <p>Connecting to the backend and WattTime forecast service...</p>
      </div>
    );
  }

  // ------------------------------------------------
  // APPLICATION ROUTES
  // ------------------------------------------------

  return (
    <Router>
      <div className="app-container">
        <Sidebar />

        <div className="main-wrapper">
          <Header
            currentIntensity={currentIntensity}
            forecastInfo={forecastInfo}
          />

          <main className="main-content">
            {error && (
              <div
                className="card error-message"
                role="alert"
              >
                <strong>
                  Backend or WattTime Forecast Error
                </strong>

                <p>{error}</p>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={loadData}
                >
                  Retry
                </button>
              </div>
            )}

            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    jobs={jobs}
                    carbonForecast={carbonForecast}
                    currentIntensity={currentIntensity}
                    forecastInfo={forecastInfo}
                  />
                }
              />

              <Route
                path="/schedule"
                element={
                  <ScheduleWorkload
                    onAddJob={handleAddJob}
                    carbonForecast={carbonForecast}
                  />
                }
              />

              <Route
                path="/jobs"
                element={<Jobs jobs={jobs} onRefreshJobs={loadData} />}
              />

              <Route
                path="/jobs/:id"
                element={<JobDetails jobs={jobs} onUpdateJob={handleUpdateJob} />}
              />

              <Route
                path="/carbon"
                element={
                  <CarbonForecast
                    carbonForecast={carbonForecast}
                    forecastInfo={forecastInfo}
                  />
                }
              />

              <Route
                path="/history"
                element={<History jobs={jobs} />}
              />

              <Route
                path="/settings"
                element={
                  <Settings
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    onResetData={loadData}
                  />
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
