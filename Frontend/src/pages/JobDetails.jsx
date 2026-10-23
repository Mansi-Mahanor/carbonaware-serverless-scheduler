import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { getJob, executeJob } from '../utils/api';

import {
  ArrowLeft,
  Clock,
  Globe,
  Leaf,
  Zap,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  Info,
} from 'lucide-react';

export default function JobDetails({ jobs = [], onUpdateJob = null }) {

  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(
    jobs.find((j) => j.id === id) || null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionMessage, setExecutionMessage] = useState('');

  const handleSimulateExecution = async () => {
    if (!job?.id) return;
    try {
      setIsExecuting(true);
      setExecutionMessage('');
      const res = await executeJob(job.id);
      if (res && res.success && res.job) {
        setJob(res.job);
        if (onUpdateJob) {
          onUpdateJob(res.job);
        }
        setExecutionMessage('Workload executed successfully (demonstration simulation).');
      } else {
        throw new Error(res?.message || 'Execution simulation failed.');
      }
    } catch (err) {
      console.error('Execution simulation error:', err);
      setExecutionMessage(err.message || 'Execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  // ==========================================
  // FETCH JOB FROM BACKEND
  // ==========================================

  useEffect(() => {

    async function loadJob() {

      try {

        setLoading(true);
        setError('');

        const backendJob = await getJob(id);

        setJob(backendJob);

      } catch (err) {

        console.error('Failed to load job:', err);

        // If backend fails, try existing App state
        const localJob = jobs.find((j) => j.id === id);

        if (localJob) {
          setJob(localJob);
        } else {
          setError('Job not found.');
        }

      } finally {

        setLoading(false);

      }

    }

    if (id) {
      loadJob();
    }

  }, [id, jobs]);


  // ==========================================
  // LOADING
  // ==========================================

  if (loading && !job) {

    return (
      <div className="page-container">

        <div className="card text-center padding-xl">

          <h2>Loading Job Details...</h2>

          <p>
            Fetching job information from the scheduler backend.
          </p>

        </div>

      </div>
    );

  }


  // ==========================================
  // JOB NOT FOUND
  // ==========================================

  if (!job) {

    return (
      <div className="page-container">

        <div className="card text-center padding-xl">

          <AlertTriangle
            size={48}
            className="text-amber margin-auto"
          />

          <h2>Job Not Found</h2>

          <p>
            {error || `No workload job matches ID ${id}.`}
          </p>

          <button
            className="btn btn-primary margin-top-md"
            onClick={() => navigate('/jobs')}
          >
            Back to Jobs
          </button>

        </div>

      </div>
    );

  }


  // ==========================================
  // TIMELINE
  // ==========================================

  const timelineSteps = [

    {
      key: 'submitted',
      title: 'Submitted',
      desc: `Job registered at ${job.createdAt}`
    },

    {
      key: 'analysis',
      title: 'Carbon Analysis',
      desc: 'Evaluated grid intensity forecast across slots & regions'
    },

    {
      key: 'selected',
      title: 'Best Slot Selected',
      desc: `Slot ${job.selectedTime} (${job.carbonIntensity} gCO₂eq/kWh)`
    },

    {
      key: 'waiting',
      title: 'Waiting',
      desc: 'Queued for optimal low-carbon execution window'
    },

    {
      key: 'executed',
      title: 'Workload Executed',
      desc: 'Simulated serverless execution on cloud provider'
    },

    {
      key: 'completed',
      title: 'Completed',
      desc: job.completedAt
        ? `Finished at ${job.completedAt}`
        : 'Awaiting completion'
    }

  ];


  // ==========================================
  // ACTIVE TIMELINE STEP
  // ==========================================

  const getActiveStepIndex = (status) => {

    switch (status) {

      case 'Pending':
        return 1;

      case 'Scheduled':
        return 3;

      case 'Running':
        return 4;

      case 'Completed':
        return 6;

      case 'Failed':
        return 2;

      default:
        return 2;

    }

  };


  const activeStepIdx = getActiveStepIndex(job.status);


  return (

    <div className="page-container">

      {/* ======================================
          TOP NAVIGATION
      ====================================== */}

      <div className="details-nav-header">

        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigate('/jobs')}
        >

          <ArrowLeft size={16} />

          <span>Back to Jobs</span>

        </button>


        <div className="details-header-status">

          <span className="details-job-id font-mono">
            {job.id}
          </span>

          <StatusBadge status={job.status} />

        </div>

      </div>

      {/* DEMONSTRATION SIMULATION BANNER */}
      <div className="card" style={{ marginBottom: 20, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
            <Info size={20} className="text-muted" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#475569' }}>
              <strong>Demonstration Mode:</strong> Workload execution simulates completion, records actual runtime, and registers carbon savings without calling external cloud provider APIs.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {['Scheduled', 'Pending'].includes(job.status) && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSimulateExecution}
                disabled={isExecuting}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Play size={15} />
                <span>{isExecuting ? 'Simulating...' : 'Simulate Cloud Execution'}</span>
              </button>
            )}

            {job.status === 'Completed' && (
              <span className="badge-carbon status-low" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Completed (Simulation)
              </span>
            )}
          </div>
        </div>
        {executionMessage && (
          <div style={{ padding: '0 18px 12px', fontSize: 13, color: executionMessage.includes('failed') ? '#dc2626' : '#10b981' }}>
            {executionMessage}
          </div>
        )}
      </div>


      {/* ======================================
          MAIN DETAILS
      ====================================== */}

      <div className="job-details-grid">


        {/* ====================================
            JOB INFORMATION
        ==================================== */}

        <div className="card job-info-card">

          <div className="card-header">

            <div>

              <span className="job-type-badge">
                {job.type}
              </span>

              <h1 className="job-title-main">
                {job.name}
              </h1>

            </div>

          </div>


          <div className="card-body">

            <div className="details-props-grid">


              <div className="prop-item">

                <span className="prop-label">
                  <Clock size={16} />
                  Estimated Runtime
                </span>

                <span className="prop-value">
                  {job.estimatedRuntime} minutes
                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  <Clock size={16} />
                  Actual Runtime
                </span>

                <span className="prop-value">

                  {job.actualRuntime
                    ? `${job.actualRuntime} minutes`
                    : 'N/A (Pending)'}

                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  <Calendar size={16} />
                  Deadline
                </span>

                <span className="prop-value">
                  {job.deadline}
                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  <Clock size={16} />
                  Scheduled Time
                </span>

                <span className="prop-value text-green-accent font-medium">
                  {job.selectedTime || 'Pending'}
                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  <Globe size={16} />
                  Grid Balancing Authority
                </span>

                <span className="prop-value">
                  {job.region || 'CAISO_NORTH'}
                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  <Leaf size={16} />
                  Carbon Intensity
                </span>

                <span className="prop-value">
                  {job.carbonIntensity != null && Number.isFinite(Number(job.carbonIntensity))
                    ? `${Number(job.carbonIntensity).toFixed(2)} gCO₂/kWh`
                    : 'N/A'}
                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  <Zap size={16} />
                  Estimated Energy
                </span>

                <span className="prop-value">
                  {job.estimatedEnergy != null ? `${job.estimatedEnergy} kWh` : 'N/A'}
                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  <Leaf size={16} />
                  Estimated CO₂
                </span>

                <span className="prop-value text-green-accent font-medium">

                  {job.estimatedCO2 != null ? `${job.estimatedCO2} gCO₂` : 'N/A'}

                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  <FileText size={16} />
                  Workload File
                </span>

                <span className="prop-value">
                  {job.fileName || job.file_name ? (
                    <>
                      <strong>{job.fileName || job.file_name}</strong>
                      <span className="text-muted" style={{ fontSize: 12, display: 'block' }}>
                        {(job.fileSizeBytes ?? job.file_size_bytes) != null
                          ? `${Number(job.fileSizeBytes ?? job.file_size_bytes).toLocaleString()} bytes (${((job.fileSizeBytes ?? job.file_size_bytes) / 1024).toFixed(1)} KB)`
                          : ''}
                        {(job.fileType || job.file_type) ? ` · ${job.fileType || job.file_type}` : ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted">No file attached</span>
                  )}
                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  Priority Level
                </span>

                <span className="prop-value">
                  {job.priority || 'Normal'}
                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  Created At
                </span>

                <span className="prop-value">
                  {job.createdAt}
                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  Completed At
                </span>

                <span className="prop-value">
                  {job.completedAt || 'In progress / Pending'}
                </span>

              </div>


              <div className="prop-item">

                <span className="prop-label">
                  CO₂ Saved
                </span>

                <span className="prop-value text-green-accent font-bold">

                  {job.co2Saved
                    ? `${job.co2Saved} gCO₂`
                    : '0 gCO₂'}

                </span>

              </div>


            </div>

          </div>

        </div>


        {/* ====================================
            EXECUTION TIMELINE
        ==================================== */}

        <div className="card timeline-card">

          <div className="card-header">

            <h2 className="card-title">
              Execution Lifecycle Timeline
            </h2>

          </div>


          <div className="card-body">

            <div className="timeline-container">

              {timelineSteps.map((step, idx) => {

                const isStepCompleted =
                  idx < activeStepIdx;

                const isStepCurrent =
                  idx + 1 === activeStepIdx;


                return (

                  <div
                    key={step.key}
                    className={`
                      timeline-step
                      ${isStepCompleted ? 'step-completed' : ''}
                      ${isStepCurrent ? 'step-current' : ''}
                    `}
                  >

                    <div className="timeline-icon-box">

                      {isStepCompleted ? (

                        <CheckCircle2
                          size={18}
                          className="step-icon-done"
                        />

                      ) : (

                        <span className="step-number">
                          {idx + 1}
                        </span>

                      )}

                    </div>


                    <div className="timeline-content">

                      <h4 className="step-title">
                        {step.title}
                      </h4>

                      <p className="step-desc">
                        {step.desc}
                      </p>

                    </div>


                    {idx < timelineSteps.length - 1 && (

                      <div className="timeline-connector" />

                    )}

                  </div>

                );

              })}

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}
