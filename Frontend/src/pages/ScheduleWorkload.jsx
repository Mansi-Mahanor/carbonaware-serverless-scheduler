
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { scheduleLiveJob } from '../utils/api';

import {
  CalendarPlus,
  CheckCircle,
  Leaf,
  Clock,
  Globe,
  Zap,
  AlertCircle,
  ArrowRight,
  UploadCloud,
  FileText,
} from 'lucide-react';

const WATTTIME_REGION = 'CAISO_NORTH';

const JOB_TYPES = [
  'CSV Processing',
  'Data Analysis',
  'Data Processing',
  'Machine Learning',
  'Report Generation',
  'Database Backup',
];

const PRIORITY_OPTIONS = [
  'Low',
  'Normal',
  'High',
  'Critical',
];

export default function ScheduleWorkload({
  onAddJob,
  carbonForecast = [],
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    type: 'CSV Processing',
    estimatedRuntime: '30',
    deadline: '23:00',
    priority: 'Normal',
    preferredRegion: WATTTIME_REGION,
    allowRegionChange: false,
    carbonAware: true,
  });

  const [attachedFile, setAttachedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [schedulingResult, setSchedulingResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const runtime = Number(formData.estimatedRuntime);

    if (!formData.name.trim()) {
      newErrors.name = 'Job name is required.';
    }

    if (
      !Number.isFinite(runtime) ||
      runtime <= 0 ||
      runtime > 1440
    ) {
      newErrors.estimatedRuntime =
        'Enter a runtime between 1 and 1440 minutes.';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline time is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setSchedulingResult(null);
    setErrors({});

    try {
      // Interpret the chosen deadline in the user's local timezone.
      const [hours, minutes] = formData.deadline
        .split(':')
        .map(Number);

      const now = new Date();

      const localDeadline = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0,
        0
      );

      // If today's deadline has passed, use tomorrow.
      if (localDeadline <= now) {
        localDeadline.setDate(localDeadline.getDate() + 1);
      }

      const requestBody = {
        name: formData.name.trim(),
        type: formData.type,
        estimatedRuntime: Number(formData.estimatedRuntime),
        deadlineUtc: localDeadline.toISOString(),
        region: WATTTIME_REGION,
        preferredRegion: WATTTIME_REGION,
        carbonAware: formData.carbonAware,
        priority: formData.priority,
        horizonHours: 24,
      };

      console.log(
        'Submitting WattTime live workload:',
        requestBody
      );

      const result = await scheduleLiveJob(requestBody, attachedFile);

      console.log('Live scheduling response:', result);

      if (result.status !== 'Scheduled') {
        throw new Error(
          result.reason ||
          result.message ||
          'No feasible execution window was found. Check the forecast coverage and deadline.'
        );
      }

      if (result.savedJob && onAddJob) {
        onAddJob(result.savedJob);
      }

      setSchedulingResult({
        selectedTime:
          result.selectedTimeUtc ||
          result.selectedTime ||
          'Not provided',

        selectedRegion:
          result.region ||
          WATTTIME_REGION,

        carbonIntensity: Number(
          result.averageCarbonIntensityGramsPerKWh
        ),

        estimatedCO2:
          result.estimatedCO2Grams ?? null,

        estimatedRuntime:
          result.estimatedRuntime ??
          Number(formData.estimatedRuntime),

        deadline:
          result.deadlineUtc ||
          localDeadline.toISOString(),

        status: result.status,
        jobId: result.jobId || result.savedJob?.job_id,
        jobName: formData.name,
        fileName:
          result.savedJob?.file_name ||
          (attachedFile ? attachedFile.name : null),
        fileSizeBytes:
          result.savedJob?.file_size_bytes ||
          (attachedFile ? attachedFile.size : null),
      });
    } catch (error) {
      console.error('Live scheduling failed:', error);

      setErrors({
        submit:
          error.message ||
          'Failed to schedule the workload.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value || value === 'Not provided') {
      return value || 'Not provided';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  return (
    <div className="page-container">
      <div className="page-header-block">
        <h1 className="page-title">
          Schedule New Cloud Workload
        </h1>

        <p className="page-description">
          Submit workload parameters. The scheduler uses
          WattTime marginal emissions forecasts to find a
          feasible, lower-carbon execution window before
          your deadline.
        </p>
      </div>

      <div className="schedule-layout">
        <div className="card schedule-form-card">
          <div className="card-header">
            <div className="card-title-group">
              <CalendarPlus
                size={20}
                className="text-green-accent"
              />
              <h2 className="card-title">
                Workload Specifications
              </h2>
            </div>
          </div>

          <div className="card-body">
            <form
              onSubmit={handleSubmit}
              className="form-grid"
            >
              <div className="form-group full-width">
                <label className="form-label required">
                  Job Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Daily Data Analytics Pipeline"
                  className={`form-input ${
                    errors.name ? 'input-error' : ''
                  }`}
                />

                {errors.name && (
                  <span className="field-error-text">
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Job Type
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-select"
                >
                  {JOB_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Priority
                </label>

                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="form-select"
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option
                      key={priority}
                      value={priority}
                    >
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">
                  Estimated Runtime (minutes)
                </label>

                <div className="input-group">
                  <input
                    type="number"
                    name="estimatedRuntime"
                    value={formData.estimatedRuntime}
                    onChange={handleChange}
                    min="1"
                    max="1440"
                    className={`form-input ${
                      errors.estimatedRuntime
                        ? 'input-error'
                        : ''
                    }`}
                  />

                  <span className="input-addon">min</span>
                </div>

                {errors.estimatedRuntime && (
                  <span className="field-error-text">
                    {errors.estimatedRuntime}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label required">
                  Deadline (HH:MM)
                </label>

                <input
                  type="time"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.deadline ? 'input-error' : ''
                  }`}
                />

                {errors.deadline && (
                  <span className="field-error-text">
                    {errors.deadline}
                  </span>
                )}
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  WattTime Forecast Region (Balancing Authority)
                </label>

                <select
                  name="preferredRegion"
                  value={WATTTIME_REGION}
                  disabled
                  className="form-select"
                >
                  <option value={WATTTIME_REGION}>
                    CAISO_NORTH — Northern California (Grid Balancing Authority)
                  </option>
                </select>

                <small>
                  Live marginal emissions forecast region configured for WattTime.
                  This is an electricity grid balancing authority, mapped to matching cloud regions (e.g. AWS us-west-1).
                </small>
              </div>

              {/* Workload File Upload (Phase 5) */}
              <div className="form-group full-width">
                <label className="form-label">
                  Workload File / Script (Optional)
                </label>

                {!attachedFile ? (
                  <div
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: 8,
                      padding: '16px 20px',
                      textAlign: 'center',
                      background: 'rgba(241, 245, 249, 0.5)',
                      cursor: 'pointer',
                    }}
                    onClick={() => document.getElementById('workload-file-input').click()}
                  >
                    <input
                      id="workload-file-input"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachedFile(e.target.files[0]);
                        }
                      }}
                    />
                    <UploadCloud size={24} style={{ color: '#10b981', marginBottom: 6 }} />
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      Click to attach a workload file or script package
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      Supports Python scripts (.py), data files (.csv, .json), bash (.sh), or archives (max 15MB)
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 6,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={20} className="text-green-accent" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{attachedFile.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          Client size: {(attachedFile.size / 1024).toFixed(1)} KB
                          {attachedFile.type ? ` · ${attachedFile.type}` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#dc2626' }}
                      onClick={() => setAttachedFile(null)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group full-width checkbox-group-box">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="carbonAware"
                    checked={formData.carbonAware}
                    onChange={handleChange}
                  />

                  <span className="checkbox-custom" />

                  <span className="checkbox-text">
                    <strong>
                      Carbon-Aware Scheduling
                    </strong>
                    : Prefer lower forecast emissions while
                    respecting the deadline.
                  </span>
                </label>

                <p className="checkbox-text">
                  <strong>Forecast source:</strong> WattTime
                  {' · '}
                  <strong>Signal:</strong> MOER
                  {' · '}
                  <strong>Interval:</strong> 5 minutes
                </p>
              </div>

              {errors.submit && (
                <div
                  className="field-error-text full-width"
                  role="alert"
                >
                  <AlertCircle
                    size={16}
                    style={{
                      display: 'inline',
                      marginRight: 6,
                    }}
                  />
                  {errors.submit}
                </div>
              )}

              <div className="form-actions full-width">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg full-width"
                >
                  {isSubmitting
                    ? 'Computing Live Carbon-Aware Slot...'
                    : 'Submit Workload'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="schedule-result-sidebar">
          {schedulingResult ? (
            <div className="card result-card animate-fade-in">
              <div className="result-card-header">
                <CheckCircle
                  size={24}
                  className="text-green-accent"
                />

                <div>
                  <h3 className="result-title">
                    Scheduling Result
                  </h3>

                  <span className="result-job-id">
                    {schedulingResult.jobId || 'Job saved'}
                  </span>
                </div>
              </div>

              <div className="result-body">
                <div className="result-item highlight-item">
                  <span className="result-label">
                    <Clock size={16} />
                    Recommended Execution Time
                  </span>

                  <span className="result-value text-green-accent">
                    {formatDateTime(
                      schedulingResult.selectedTime
                    )}
                  </span>
                </div>

                <div className="result-item">
                  <span className="result-label">
                    <Globe size={16} />
                    Forecast Region
                  </span>

                  <span className="result-value">
                    {schedulingResult.selectedRegion}
                  </span>
                </div>

                <div className="result-item">
                  <span className="result-label">
                    <Leaf size={16} />
                    Predicted Carbon Intensity
                  </span>

                  <span className="result-value">
                    {Number.isFinite(
                      schedulingResult.carbonIntensity
                    )
                      ? `${schedulingResult.carbonIntensity.toFixed(2)} gCO₂/kWh`
                      : 'Not provided'}
                  </span>
                </div>

                <div className="result-item">
                  <span className="result-label">
                    <Zap size={16} />
                    Estimated CO₂
                  </span>

                  <span className="result-value">
                    {schedulingResult.estimatedCO2 != null
                      ? `${schedulingResult.estimatedCO2} g CO₂`
                      : 'Not provided'}
                  </span>
                </div>

                <div className="result-item">
                  <span className="result-label">
                    Estimated Runtime
                  </span>

                  <span className="result-value">
                    {schedulingResult.estimatedRuntime} minutes
                  </span>
                </div>

                <div className="result-item">
                  <span className="result-label">
                    Deadline
                  </span>

                  <span className="result-value">
                    {formatDateTime(
                      schedulingResult.deadline
                    )}
                  </span>
                </div>

                {schedulingResult.fileName && (
                  <div className="result-item">
                    <span className="result-label">
                      <FileText size={16} />
                      Attached File
                    </span>

                    <span className="result-value">
                      {schedulingResult.fileName}
                      {schedulingResult.fileSizeBytes != null && (
                        <small> ({(schedulingResult.fileSizeBytes / 1024).toFixed(1)} KB)</small>
                      )}
                    </span>
                  </div>
                )}

                <div className="result-item">
                  <span className="result-label">
                    Scheduling Status
                  </span>

                  <span className="result-status-badge badge-scheduled">
                    {schedulingResult.status}
                  </span>
                </div>
              </div>

              <div className="result-footer">
                <button
                  type="button"
                  className="btn btn-outline full-width"
                  onClick={() => {
                    if (schedulingResult.jobId) {
                      navigate(
                        `/jobs/${schedulingResult.jobId}`
                      );
                    } else {
                      navigate('/jobs');
                    }
                  }}
                >
                  <span>View Job Details</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="card result-placeholder-card">
              <Leaf
                size={48}
                className="placeholder-icon"
              />

              <h3>Scheduling Analysis</h3>

              <p>
                Enter the workload parameters and submit the
                form to find a feasible execution window
                using the live WattTime forecast.
              </p>

              <div className="placeholder-info-box">
                <AlertCircle size={16} />

                <span>
                  The scheduler minimizes forecast carbon
                  intensity subject to the workload finishing
                  before its deadline.
                </span>
              </div>

              <p>
                Forecast points available: {carbonForecast.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
