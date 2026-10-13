import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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
  getCurrentIntensity,
} from './utils/api';

/*
 * Convert backend snake_case fields into the camelCase
 * fields used by the React components.
 *
 * We keep both versions so the frontend remains compatible
 * with existing code.
 */
const normalizeJob = (job = {}) => {
  return {
    ...job,

    // ID
    id: job.id ?? job.job_id,
    job_id: job.job_id ?? job.id,

    // Basic information
    name: job.name ?? 'Unnamed Job',
    type: job.type ?? 'Data Processing',

    // Runtime
    estimatedRuntime:
      job.estimatedRuntime ??
      job.estimated_runtime ??
      0,

    actualRuntime:
      job.actualRuntime ??
      job.actual_runtime ??
      null,

    // Time
    deadline: job.deadline ?? '',

    selectedTime:
      job.selectedTime ??
      job.selected_time ??
      '',

    completionTime:
      job.completionTime ??
      job.completion_time ??
      null,

    // Region
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

    // Carbon
    carbonIntensity:
      Number(
        job.carbonIntensity ??
        job.carbon_intensity ??
        0
      ),

    estimatedEnergy:
      Number(
        job.estimatedEnergy ??
        job.estimated_energy ??
        0
      ),

    estimatedCO2:
      Number(
        job.estimatedCO2 ??
        job.estimated_co2 ??
        0
      ),

    co2Saved:
      Number(
        job.co2Saved ??
        job.co2_saved ??
        0
      ),

    // Status
    status: job.status ?? 'Scheduled',

    priority: job.priority ?? 'Normal',

    // Dates
    createdAt:
      job.createdAt ??
      job.created_at ??
      '',

    completedAt:
      job.completedAt ??
      job.completed_at ??
      null,
  };
};

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [carbonForecast, setCarbonForecast] = useState([]);
  const [currentIntensity, setCurrentIntensity] = useState(0);

  const [settings, setSettings] = useState({
    defaultRegion: 'Mumbai',
    carbonAware: true,
    allowRegionChange: true,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * Load all backend data
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        jobsData,
        forecastData,
        intensityData,
      ] = await Promise.all([
        getJobs(),
        getCarbonForecast(),
        getCurrentIntensity('Mumbai'),
      ]);

      // Normalize backend jobs
      const normalizedJobs = Array.isArray(jobsData)
        ? jobsData.map(normalizeJob)
        : [];

      setJobs(normalizedJobs);

      setCarbonForecast(
        Array.isArray(forecastData)
          ? forecastData
          : []
      );

      setCurrentIntensity(
        Number(
          intensityData?.carbonIntensity ??
          intensityData?.carbon_intensity ??
          0
        )
      );

    } catch (err) {
      console.error(
        'Failed to load backend data:',
        err
      );

      setError(
        err.message ||
        'Failed to connect to backend'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
   * Add newly scheduled job
   */
  const handleAddJob = (newJob) => {
    const normalizedJob = normalizeJob(newJob);

    setJobs((prevJobs) => [
      normalizedJob,
      ...prevJobs,
    ]);
  };

  /*
   * Update settings
   */
  const handleUpdateSettings = (newSettings) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  /*
   * Loading screen
   */
  if (loading) {
    return (
      <div className="app-loading">
        <h2>
          Loading Carbon-Aware Scheduler...
        </h2>

        <p>
          Connecting to backend...
        </p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">

        <Sidebar />

        <div className="main-wrapper">

          <Header
            currentIntensity={currentIntensity}
          />

          <main className="main-content">

            {error && (
              <div className="card error-message">

                <strong>
                  Backend Connection Error
                </strong>

                <p>
                  {error}
                </p>

                <button
                  className="btn btn-primary"
                  onClick={loadData}
                >
                  Retry
                </button>

              </div>
            )}

            <Routes>

              {/* Dashboard */}
              <Route
                path="/"
                element={
                  <Dashboard
                    jobs={jobs}
                    carbonForecast={carbonForecast}
                    currentIntensity={currentIntensity}
                  />
                }
              />

              {/* Schedule */}
              <Route
                path="/schedule"
                element={
                  <ScheduleWorkload
                    onAddJob={handleAddJob}
                    carbonForecast={carbonForecast}
                  />
                }
              />

              {/* All Jobs */}
              <Route
                path="/jobs"
                element={
                  <Jobs jobs={jobs} />
                }
              />

              {/* Job Details */}
              <Route
                path="/jobs/:id"
                element={
                  <JobDetails jobs={jobs} />
                }
              />

              {/* Carbon Forecast */}
              <Route
                path="/carbon"
                element={
                  <CarbonForecast
                    carbonForecast={carbonForecast}
                  />
                }
              />

              {/* History */}
              <Route
                path="/history"
                element={
                  <History jobs={jobs} />
                }
              />

              {/* Settings */}
              <Route
                path="/settings"
                element={
                  <Settings
                    settings={settings}
                    onUpdateSettings={
                      handleUpdateSettings
                    }
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
