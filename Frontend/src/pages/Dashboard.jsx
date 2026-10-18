
import React from 'react';
import { useNavigate } from 'react-router-dom';

import StatCard from '../components/StatCard';
import JobTable from '../components/JobTable';

import {
  Server,
  Clock,
  CheckCircle2,
  Leaf,
  PlusCircle,
  ArrowUpRight,
  Zap,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';

const REGION = 'CAISO_NORTH';

export default function Dashboard({
  jobs = [],
  carbonForecast = [],
  currentIntensity = null,
  forecastInfo = {},
}) {
  const navigate = useNavigate();

  // ==========================================
  // JOB STATISTICS
  // ==========================================

  const totalJobs = jobs.length;

  const scheduledOrPending = jobs.filter((job) =>
    ['Scheduled', 'Pending', 'Running'].includes(job.status)
  ).length;

  const completedJobs = jobs.filter(
    (job) => job.status === 'Completed'
  ).length;

  const totalCo2Saved = jobs
    .reduce(
      (total, job) =>
        total + Number(job.co2Saved ?? job.co2_saved ?? 0),
      0
    )
    .toFixed(1);

  // ==========================================
  // LIVE WATTTIME FORECAST
  // ==========================================

  const validForecast = (
    Array.isArray(carbonForecast) ? carbonForecast : []
  )
    .map((point) => ({
      ...point,
      intensity: Number(point.carbonIntensityGramsPerKWh),
      timestamp: new Date(point.time),
    }))
    .filter(
      (point) =>
        point.time &&
        Number.isFinite(point.intensity) &&
        !Number.isNaN(point.timestamp.getTime())
    )
    .filter(
      (point) => point.timestamp.getTime() >= Date.now()
    );

  const bestSlot =
    validForecast.length > 0
      ? validForecast.reduce((best, point) =>
          point.intensity < best.intensity ? point : best
        )
      : null;

  const formatDateTime = (value) => {
    if (!value) return 'Unavailable';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Unavailable';
    }

    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const intensity = Number(currentIntensity);
  const hasIntensity = Number.isFinite(intensity);

  const region = forecastInfo.region || REGION;
  const source = forecastInfo.source || 'WattTime';

  // UI categories for forecast values, not universal standards.
  const getCarbonStatus = (value) => {
    if (!Number.isFinite(value)) return 'Unavailable';
    if (value <= 135) return 'Low Forecast Value';
    if (value <= 300) return 'Medium Forecast Value';
    return 'High Forecast Value';
  };

  const carbonStatus = getCarbonStatus(intensity);

  const statusClass = !hasIntensity
    ? ''
    : intensity <= 135
      ? 'status-low'
      : intensity <= 300
        ? 'status-medium'
        : 'status-high';

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="page-container">
      {/* PROJECT BANNER */}

      <div className="dashboard-hero-banner">
        <div className="hero-content">
          <span className="hero-badge">
            <Leaf size={14} />
            Sustainability Driven Cloud Computing
          </span>

          <h1 className="hero-title">
            Carbon-Aware Serverless Workload Scheduler
          </h1>

          <p className="hero-desc">
            Schedule deferrable workloads during lower
            forecast marginal-emissions periods while
            respecting workload deadlines.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/schedule')}
            >
              <PlusCircle size={18} />
              <span>Schedule New Workload</span>
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/carbon')}
            >
              <TrendingDown size={18} />
              <span>View Carbon Forecast</span>
            </button>
          </div>
        </div>

        {/* CLICKABLE WATTTIME FORECAST CARD */}

        <button
          type="button"
          className="hero-gauge-card"
          onClick={() => navigate('/carbon')}
          aria-label="Open WattTime carbon forecast"
          style={{
            cursor: 'pointer',
            font: 'inherit',
            color: 'inherit',
            textAlign: 'left',
            flexShrink: 0,
            alignSelf: 'center',
            width: 'auto',
            minWidth: '250px',
            maxWidth: '100%',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div className="gauge-header">
            <Zap size={16} className="gauge-icon" />
            <span>{region} FORECAST</span>
          </div>

          <div className="gauge-value">
            {hasIntensity ? intensity.toFixed(2) : 'N/A'}

            {hasIntensity && (
              <small> gCO₂/kWh</small>
            )}
          </div>

          <div className={`gauge-badge ${statusClass}`}>
            {hasIntensity ? (
              <>
                <Leaf size={12} />
                {carbonStatus}
              </>
            ) : (
              <>
                <AlertCircle size={12} />
                Forecast Unavailable
              </>
            )}
          </div>

          <p className="gauge-footer">
            Source: {source}
          </p>

          <p className="gauge-footer font-mono">
            Lowest forecast slot:{' '}
            {bestSlot
              ? formatDateTime(bestSlot.time)
              : 'N/A'}
          </p>

          {bestSlot && (
            <p className="gauge-footer">
              {bestSlot.intensity.toFixed(2)} gCO₂/kWh
            </p>
          )}
        </button>
      </div>

      {/* JOB STATISTICS */}

      <div className="stats-grid">
        <StatCard
          title="Total Jobs"
          value={totalJobs}
          icon={Server}
          subtext="Saved workloads"
          color="blue"
        />

        <StatCard
          title="Pending / Scheduled"
          value={scheduledOrPending}
          icon={Clock}
          subtext="Waiting or scheduled"
          color="amber"
        />

        <StatCard
          title="Completed Jobs"
          value={completedJobs}
          icon={CheckCircle2}
          subtext="Successfully executed"
          color="green"
        />

        <StatCard
          title="Estimated CO₂ Saved"
          value={`${totalCo2Saved} g`}
          icon={Leaf}
          subtext="Scheduler estimates"
          color="emerald"
        />
      </div>

      {/* RECENT JOBS */}

      <div className="card dashboard-table-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              Recent Workloads
            </h2>

            <p className="card-subtitle">
              Latest submitted and scheduled workloads
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/jobs')}
          >
            <span>View All Jobs</span>
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="card-body">
          <JobTable
            jobs={jobs}
            limit={5}
            showDetailsButton={true}
          />
        </div>
      </div>
    </div>
  );
}
