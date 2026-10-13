import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleJob } from '../utils/api';
import {
  JOB_TYPES,
  AWS_REGIONS,
  PRIORITY_OPTIONS
} from '../data/mockData';
import {
  CalendarPlus,
  CheckCircle,
  Leaf,
  Clock,
  Globe,
  Zap,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function ScheduleWorkload({ onAddJob, carbonForecast = [] }) {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'CSV Processing',
    estimatedRuntime: '30',
    deadline: '17:00',
    priority: 'Normal',
    preferredRegion: 'Mumbai (ap-south-1)',
    allowRegionChange: true,
    carbonAware: true
  });

  const [errors, setErrors] = useState({});
  const [schedulingResult, setSchedulingResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Job name is required';
    }
    if (!formData.estimatedRuntime || parseInt(formData.estimatedRuntime, 10) <= 0) {
      newErrors.estimatedRuntime = 'Please enter a valid runtime in minutes';
    }
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline time is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  setIsSubmitting(true);
  setSchedulingResult(null);

  try {
    const requestBody = {
      job_name: formData.name,
      type: formData.type,
      estimatedRuntime: parseInt(formData.estimatedRuntime, 10),
      deadline: formData.deadline,
      preferredRegion: formData.preferredRegion,
      allowRegionChange: formData.allowRegionChange,
      carbonAware: formData.carbonAware,
      priority: formData.priority,

      carbonForecast: carbonForecast
    };

    console.log("Sending to backend:", requestBody);

    const savedJob = await scheduleJob(requestBody);

    console.log("Backend response:", savedJob);

    // Add actual database job to React state
    onAddJob(savedJob);

    // Display backend scheduling result
    setSchedulingResult({
      selectedTime: savedJob.selectedTime,
      selectedRegion: savedJob.region,
      carbonIntensity: savedJob.carbonIntensity,
      estimatedCO2: savedJob.estimatedCO2,
      estimatedRuntime: savedJob.estimatedRuntime,
      deadline: savedJob.deadline,
      status: savedJob.status,
      jobId: savedJob.jobId,
      jobName: savedJob.name
    });

  } catch (error) {

    console.error("Scheduling failed:", error);

    setErrors({
      submit: error.message || "Failed to schedule workload"
    });

  } finally {

    setIsSubmitting(false);

  }
};


  return (
    <div className="page-container">
      <div className="page-header-block">
        <h1 className="page-title">Schedule New Cloud Workload</h1>
        <p className="page-description">
          Submit your serverless job parameters. Our scheduler will compute the optimal time slot
          and region to minimize carbon intensity ($gCO_2eq/kWh$).
        </p>
      </div>

      <div className="schedule-layout">
        {/* Form Card */}
        <div className="card schedule-form-card">
          <div className="card-header">
            <div className="card-title-group">
              <CalendarPlus size={20} className="text-green-accent" />
              <h2 className="card-title">Workload Specifications</h2>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="form-grid">

              {/* Job Name */}
              <div className="form-group full-width">
                <label className="form-label required">Job Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Daily Data Analytics Pipeline"
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && <span className="field-error-text">{errors.name}</span>}
              </div>

              {/* Job Type */}
              <div className="form-group">
                <label className="form-label">Job Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-select"
                >
                  {JOB_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="form-select"
                >
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Estimated Runtime */}
              <div className="form-group">
                <label className="form-label required">Estimated Runtime (minutes)</label>
                <div className="input-group">
                  <input
                    type="number"
                    name="estimatedRuntime"
                    value={formData.estimatedRuntime}
                    onChange={handleChange}
                    min="1"
                    max="1440"
                    placeholder="30"
                    className={`form-input ${errors.estimatedRuntime ? 'input-error' : ''}`}
                  />
                  <span className="input-addon">min</span>
                </div>
                {errors.estimatedRuntime && <span className="field-error-text">{errors.estimatedRuntime}</span>}
              </div>

              {/* Deadline */}
              <div className="form-group">
                <label className="form-label required">Deadline (HH:MM)</label>
                <input
                  type="time"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className={`form-input ${errors.deadline ? 'input-error' : ''}`}
                />
                {errors.deadline && <span className="field-error-text">{errors.deadline}</span>}
              </div>

              {/* Preferred Region */}
              <div className="form-group full-width">
                <label className="form-label">Preferred AWS Region</label>
                <select
                  name="preferredRegion"
                  value={formData.preferredRegion}
                  onChange={handleChange}
                  className="form-select"
                >
                  {AWS_REGIONS.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="form-group full-width checkbox-group-box">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="allowRegionChange"
                    checked={formData.allowRegionChange}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom" />
                  <span className="checkbox-text">
                    <strong>Allow Region Change:</strong> Permit algorithm to automatically pick a greener AWS region if available.
                  </span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="carbonAware"
                    checked={formData.carbonAware}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom" />
                  <span className="checkbox-text">
                    <strong>Carbon-Aware Scheduling (ON/OFF):</strong> Minimize carbon footprint ($gCO_2eq/kWh$) before deadline.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="form-actions full-width">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg full-width"
                >
                  {isSubmitting ? 'Computing Carbon-Aware Slot...' : 'Submit Workload'}
                </button>
                {errors.submit && (
  <div className="field-error-text">
    {errors.submit}
  </div>
)}
              </div>
            </form>
          </div>
        </div>

        {/* Scheduling Result Box */}
        <div className="schedule-result-sidebar">
          {schedulingResult ? (
            <div className="card result-card animate-fade-in">
              <div className="result-card-header">
                <CheckCircle size={24} className="text-green-accent" />
                <div>
                  <h3 className="result-title">Scheduling Result</h3>
                  <span className="result-job-id">{schedulingResult.jobId}</span>
                </div>
              </div>

              <div className="result-body">
                <div className="result-item highlight-item">
                  <span className="result-label">
                    <Clock size={16} /> Recommended Execution Time
                  </span>
                  <span className="result-value text-green-accent">
                    {schedulingResult.selectedTime}
                  </span>
                </div>

                <div className="result-item">
                  <span className="result-label">
                    <Globe size={16} /> Selected Region
                  </span>
                  <span className="result-value">{schedulingResult.selectedRegion}</span>
                </div>

                <div className="result-item">
                  <span className="result-label">
                    <Leaf size={16} /> Predicted Carbon Intensity
                  </span>
                  <span className="result-value">
                    {Number(schedulingResult.carbonIntensity).toFixed(0)} gCO₂eq/kWh
                  </span>
                </div>

                <div className="result-item">
                  <span className="result-label">
                    <Zap size={16} /> Estimated CO₂
                  </span>
                  <span className="result-value">{schedulingResult.estimatedCO2} gCO₂</span>
                </div>

                <div className="result-item">
                  <span className="result-label">Estimated Runtime</span>
                  <span className="result-value">{schedulingResult.estimatedRuntime} minutes</span>
                </div>

                <div className="result-item">
                  <span className="result-label">Deadline</span>
                  <span className="result-value">{schedulingResult.deadline}</span>
                </div>

                <div className="result-item">
                  <span className="result-label">Scheduling Status</span>
                  <span className="result-status-badge badge-scheduled">
                    {schedulingResult.status}
                  </span>
                </div>
              </div>

              <div className="result-footer">
                <button
                  className="btn btn-outline full-width"
                  onClick={() => navigate(`/jobs/${schedulingResult.jobId}`)}
                >
                  <span>View Details & Timeline</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="card result-placeholder-card">
              <Leaf size={48} className="placeholder-icon" />
              <h3>Scheduling Analysis</h3>
              <p>
                Fill out the workload parameters on the left and click
                <strong> Submit Workload</strong> to execute the carbon-optimization algorithm.
              </p>
              <div className="placeholder-info-box">
                <AlertCircle size={16} />
                <span>Optimization formula: argmin(Carbon Intensity) subject to completion time ≤ deadline.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
