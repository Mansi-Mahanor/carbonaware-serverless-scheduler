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
} from 'lucide-react';

export default function Dashboard({
  jobs = [],
  carbonForecast = [],
  currentIntensity = 0,
}) {
  const navigate = useNavigate();

  // ==========================================
  // JOB STATISTICS
  // ==========================================

  const totalJobs = jobs.length;

  const scheduledOrPending = jobs.filter(
    (job) =>
      job.status === 'Scheduled' ||
      job.status === 'Pending' ||
      job.status === 'Running'
  ).length;

  const completedJobs = jobs.filter(
    (job) => job.status === 'Completed'
  ).length;

  const totalCo2Saved = jobs
    .reduce(
      (total, job) =>
        total +
        Number(
          job.co2Saved ??
          job.co2_saved ??
          0
        ),
      0
    )
    .toFixed(1);

  // ==========================================
  // FIND BEST CARBON SLOT
  // ==========================================

  const validForecast = carbonForecast.filter(
    (item) =>
      item &&
      item.time &&
      item.Mumbai !== undefined &&
      item.Mumbai !== null &&
      !Number.isNaN(Number(item.Mumbai))
  );

  const bestSlot =
    validForecast.length > 0
      ? validForecast.reduce(
          (best, current) =>
            Number(current.Mumbai) <
            Number(best.Mumbai)
              ? current
              : best
        )
      : null;

  const bestSlotTime =
    bestSlot?.time || 'N/A';

  const bestSlotIntensity = bestSlot
    ? Number(bestSlot.Mumbai)
    : Number(currentIntensity);

  // ==========================================
  // CARBON STATUS
  // ==========================================

  const getCarbonStatus = (intensity) => {
    const value = Number(intensity);

    if (value <= 150) {
      return 'Low Carbon Window';
    }

    if (value <= 200) {
      return 'Moderate Carbon';
    }

    return 'High Carbon';
  };

  const carbonStatus =
    getCarbonStatus(currentIntensity);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="page-container">

      {/* ======================================
          PROJECT BANNER
      ====================================== */}

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
            Intelligently shifts cloud serverless
            jobs to low-carbon time slots and
            regions, significantly reducing
            indirect greenhouse gas emissions
            (CO₂) without compromising deadlines.
          </p>

          <div className="hero-actions">

            <button
              className="btn btn-primary"
              onClick={() =>
                navigate('/schedule')
              }
            >
              <PlusCircle size={18} />
              <span>
                Schedule New Workload
              </span>
            </button>

            <button
              className="btn btn-outline"
              onClick={() =>
                navigate('/carbon')
              }
            >
              <TrendingDown size={18} />
              <span>
                View Carbon Forecast
              </span>
            </button>

          </div>

        </div>

        {/* ======================================
            LIVE CARBON STATUS
        ====================================== */}

        <div className="hero-gauge-card">

          <div className="gauge-header">

            <Zap
              size={16}
              className="gauge-icon"
            />

            <span>
              Current Grid Status (ap-south-1)
            </span>

          </div>

          <div className="gauge-value">

            {Number(currentIntensity)}

            <small>
              {' '}gCO₂eq/kWh
            </small>

          </div>

          <div className="gauge-badge status-low">

            <Leaf size={12} />

            {carbonStatus}

          </div>

          <p className="gauge-footer font-mono">

            Best Slot Today:{' '}
            {bestSlotTime}

            {bestSlot && (
              <>
                {' '}
                ({bestSlotIntensity}{' '}
                gCO₂eq/kWh)
              </>
            )}

          </p>

        </div>

      </div>

      {/* ======================================
          STAT CARDS
      ====================================== */}

      <div className="stats-grid">

        <StatCard
          title="Total Jobs"
          value={totalJobs}
          icon={Server}
          subtext="Submitted workloads"
          color="blue"
        />

        <StatCard
          title="Pending / Scheduled"
          value={scheduledOrPending}
          icon={Clock}
          subtext="Waiting for optimal slot"
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
          subtext="Total emissions prevented"
          color="emerald"
        />

      </div>

      {/* ======================================
          RECENT JOBS
      ====================================== */}

      <div className="card dashboard-table-card">

        <div className="card-header">

          <div>

            <h2 className="card-title">
              Recent Workloads
            </h2>

            <p className="card-subtitle">
              Latest submitted and scheduled
              serverless tasks
            </p>

          </div>

          <button
            className="btn btn-outline btn-sm"
            onClick={() =>
              navigate('/jobs')
            }
          >
            <span>
              View All Jobs
            </span>

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
