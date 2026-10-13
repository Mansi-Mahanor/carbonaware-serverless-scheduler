import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Leaf, Activity } from 'lucide-react';

export default function Header({ currentIntensity = 125 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/schedule': return 'Schedule Workload';
      case '/jobs': return 'Workload Jobs';
      case '/carbon': return 'Carbon Intensity Forecast';
      case '/history': return 'Execution History';
      case '/settings': return 'System Settings';
      default:
        if (location.pathname.startsWith('/jobs/')) return 'Job Details';
        return 'Carbon-Aware Scheduler';
    }
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <h1 className="header-title">{getTitle()}</h1>
        <p className="header-subtitle">
          Optimizing serverless workloads for minimum carbon footprint
        </p>
      </div>

      <div className="header-right">
        <div className="header-status-badge">
          <Activity size={16} className="status-pulse-icon" />
          <div className="status-info">
            <span className="status-label">Mumbai Live Intensity</span>
            <span className="status-value">{currentIntensity} gCO₂eq/kWh</span>
          </div>
        </div>

        {location.pathname !== '/schedule' && (
          <button
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
