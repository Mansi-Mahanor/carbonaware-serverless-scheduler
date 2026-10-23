import React, { useState } from 'react';
import { AWS_REGIONS } from '../data/mockData';
import { Settings as SettingsIcon, Save, Activity, Server, Code, CheckCircle } from 'lucide-react';

export default function Settings({ settings = {}, onUpdateSettings, onResetData }) {
  const [formData, setFormData] = useState({
    defaultRegion: settings.defaultRegion || 'Mumbai (ap-south-1)',
    carbonAwareEnabled: settings.carbonAwareEnabled !== undefined ? settings.carbonAwareEnabled : true,
    runtimeSafetyMargin: settings.runtimeSafetyMargin || '10%',
    allowAutoRegionFallback: settings.allowAutoRegionFallback !== undefined ? settings.allowAutoRegionFallback : true
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="page-container">
      <div className="page-header-block">
        <h1 className="page-title">System Settings & Configuration</h1>
        <p className="page-description">
          Configure default scheduling policies, regional preferences, and inspect API integration health.
        </p>
      </div>

      <div className="settings-layout">
        {/* Main Settings Card */}
        <div className="card settings-card">
          <div className="card-header">
            <div className="card-title-group">
              <SettingsIcon size={20} className="text-green-accent" />
              <h2 className="card-title">Scheduler Preferences</h2>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave} className="form-grid">

              {/* Default Region */}
              <div className="form-group full-width">
                <label className="form-label">Default AWS Region</label>
                <select
                  name="defaultRegion"
                  value={formData.defaultRegion}
                  onChange={handleChange}
                  className="form-select"
                >
                  {AWS_REGIONS.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Safety Margin */}
              <div className="form-group">
                <label className="form-label">Default Runtime Safety Margin</label>
                <select
                  name="runtimeSafetyMargin"
                  value={formData.runtimeSafetyMargin}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="0%">0% (Exact estimate)</option>
                  <option value="10%">10% (Recommended)</option>
                  <option value="20%">20% (Conservative)</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="form-group full-width checkbox-group-box">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="carbonAwareEnabled"
                    checked={formData.carbonAwareEnabled}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom" />
                  <span className="checkbox-text">
                    <strong>Enable Carbon-Aware Scheduling by Default:</strong> Automatically minimize emission intensity.
                  </span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="allowAutoRegionFallback"
                    checked={formData.allowAutoRegionFallback}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom" />
                  <span className="checkbox-text">
                    <strong>Automatic Region Fallback:</strong> Allow cross-region placement if local grid intensity exceeds thresholds.
                  </span>
                </label>
              </div>

              {/* Save button */}
              <div className="form-actions full-width flex-between-center">
                <button type="submit" className="btn btn-primary">
                  <Save size={18} />
                  <span>Save Configuration</span>
                </button>

                {savedSuccess && (
                  <span className="text-green-accent flex-center gap-xs font-medium">
                    <CheckCircle size={16} /> Preferences updated!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* API Health & Integration Info Card */}
        <div className="card integration-info-card">
          <div className="card-header">
            <div className="card-title-group">
              <Activity size={20} className="text-green-accent" />
              <h2 className="card-title">Grid & Backend Status</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="status-item-box">
              <span className="status-item-label">Carbon Intensity API Status</span>
              <span className="status-item-value text-green-accent font-medium flex-center gap-xs">
                <span className="badge-dot dot-green" /> Connected (WattTime API v3)
              </span>
            </div>

            <div className="status-item-box">
              <span className="status-item-label">Scheduler Backend Connection</span>
              <span className="status-item-value text-muted font-mono">
                Flask API & SQLite on http://127.0.0.1:5000
              </span>
            </div>

            <div className="backend-integration-note">
              <h4><Code size={16} /> Grid Balancing Authority vs Cloud Region</h4>
              <p>
                Marginal emissions rates are queried from WattTime for balancing authorities such as
                <strong> CAISO_NORTH</strong> (Northern California grid). Serverless workloads can be scheduled in
                matching cloud regions (e.g. AWS <code>us-west-1</code>).
              </p>
            </div>

            <div className="margin-top-lg">
              <button
                type="button"
                className="btn btn-outline btn-sm full-width text-danger"
                onClick={onResetData}
              >
                Reset Mock Data to Initial State
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
