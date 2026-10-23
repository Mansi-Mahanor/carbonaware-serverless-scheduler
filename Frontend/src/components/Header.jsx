
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Activity } from 'lucide-react';

export default function Header({
  currentIntensity = null,
  forecastInfo = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const region = forecastInfo.region || 'CAISO_NORTH';
  const source = forecastInfo.source || 'WattTime';

  const hasIntensity =
    currentIntensity !== null &&
    currentIntensity !== undefined &&
    Number.isFinite(Number(currentIntensity));
  const intensity = hasIntensity ? Number(currentIntensity) : null;

  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/schedule':
        return 'Schedule Workload';
      case '/jobs':
        return 'Workload Jobs';
      case '/carbon':
        return 'Carbon Intensity Forecast';
      case '/history':
        return 'Execution History';
      case '/settings':
        return 'System Settings';
      default:
        if (location.pathname.startsWith('/jobs/')) {
          return 'Job Details';
        }
        return 'Carbon-Aware Scheduler';
    }
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <h1 className="header-title">{getTitle()}</h1>

        <p className="header-subtitle">
          Optimizing serverless workloads using carbon forecasts
        </p>
      </div>

      <div className="header-right">
        <div
          className="header-status-badge"
          title={`${source} forecast · Region: ${region}`}
        >
          <Activity
            size={16}
            className="status-pulse-icon"
          />

          <div className="status-info">
            <span className="status-label">
              {region} Forecast
            </span>

            <span className="status-value">
              {hasIntensity
                ? `${intensity.toFixed(2)} gCO₂/kWh`
                : 'Forecast unavailable'}
            </span>
          </div>
        </div>

        {location.pathname !== '/schedule' && (
          <button
            type="button"
            className="btn btn-primary header-action-btn"
            onClick={() => navigate('/schedule')}
          >
            <PlusCircle size={18} />
            <span>Schedule Workload</span>
          </button>
        )}
      </div>
    </header>
  );
}
