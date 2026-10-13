import React from 'react';
import StatusBadge from '../components/StatusBadge';
import { History as HistoryIcon, CheckCircle2, Leaf, Zap } from 'lucide-react';

export default function History({ jobs = [] }) {
  const completedJobs = jobs.filter((j) => j.status === 'Completed');

  return (
    <div className="page-container">
      <div className="page-header-block">
        <h1 className="page-title">Execution History</h1>
        <p className="page-description">
          Historical log of finished cloud serverless workloads, runtime efficiency, and carbon emissions.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <HistoryIcon size={20} className="text-green-accent" />
            <h2 className="card-title">Completed Workloads ({completedJobs.length})</h2>
          </div>
        </div>
        <div className="card-body">
          {completedJobs.length === 0 ? (
            <div className="empty-table-state">
              <CheckCircle2 size={32} className="empty-icon text-muted" />
              <p>No completed jobs recorded yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Job ID & Name</th>
                    <th>Est. Runtime</th>
                    <th>Actual Runtime</th>
                    <th>Carbon Intensity</th>
                    <th>Est. Energy</th>
                    <th>CO₂ Emissions</th>
                    <th>Execution Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div className="font-mono text-bold text-sm">{job.id}</div>
                        <div className="font-medium text-main">{job.name}</div>
                      </td>
                      <td>{job.estimatedRuntime} min</td>
                      <td className="font-medium">{job.actualRuntime || job.estimatedRuntime} min</td>
                      <td>
                        <div className="carbon-intensity-cell">
                          <Leaf size={14} className="leaf-icon" />
                          <span>{job.carbonIntensity} <small>gCO₂/kWh</small></span>
                        </div>
                      </td>
                      <td>
                        <div className="flex-center gap-xs">
                          <Zap size={14} className="text-amber" />
                          <span>{job.estimatedEnergy || 0.75} kWh</span>
                        </div>
                      </td>
                      <td className="font-medium text-green-accent">
                        {job.estimatedCO2 || 95.0} gCO₂
                      </td>
                      <td>{job.completedAt || job.createdAt}</td>
                      <td>
                        <StatusBadge status={job.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
