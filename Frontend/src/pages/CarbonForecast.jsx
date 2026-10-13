import React, { useState } from 'react';
import CarbonChart from '../components/CarbonChart';
import { getCarbonIntensityStatus } from '../utils/scheduler';
import { Leaf, Filter, Info, Globe } from 'lucide-react';

export default function CarbonForecast({ carbonForecast = [] }) {
  const [selectedRegion, setSelectedRegion] = useState('Mumbai');

  const regions = [
    { key: 'Mumbai', name: 'Mumbai (ap-south-1)' },
    { key: 'Singapore', name: 'Singapore (ap-southeast-1)' },
    { key: 'Tokyo', name: 'Tokyo (ap-northeast-1)' },
    { key: 'US East', name: 'US East (us-east-1)' }
  ];

  // Helper to get status badge class
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Low':
        return <span className="badge-carbon status-low"><Leaf size={12} /> Low</span>;
      case 'Medium':
        return <span className="badge-carbon status-medium">Medium</span>;
      case 'High':
        return <span className="badge-carbon status-high">High</span>;
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-block">
        <h1 className="page-title">Grid Carbon Intensity Forecast</h1>
        <p className="page-description">
          Hourly predicted carbon intensity ($gCO_2eq/kWh$) for cloud data center regions.
          Green highlighted slots indicate optimal low-carbon execution windows.
        </p>
      </div>

      {/* Region Selector Bar */}
      <div className="card margin-bottom-lg">
        <div className="card-body flex-between-center gap-md wrap">
          <div className="flex-center gap-sm">
            <Globe size={20} className="text-green-accent" />
            <span className="font-medium text-main">Select AWS Region:</span>
          </div>

          <div className="region-pills-group">
            {regions.map((reg) => (
              <button
                key={reg.key}
                className={`region-pill ${selectedRegion === reg.key ? 'active' : ''}`}
                onClick={() => setSelectedRegion(reg.key)}
              >
                {reg.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts Forecast Graph Card */}
      <div className="card margin-bottom-lg">
        <div className="card-header">
          <div className="card-title-group">
            <Leaf size={20} className="text-green-accent" />
            <h2 className="card-title">Hourly Carbon Intensity Trajectory ({selectedRegion})</h2>
          </div>
        </div>
        <div className="card-body">
          <CarbonChart data={carbonForecast} selectedRegion={selectedRegion} />
        </div>
      </div>

      {/* Forecast Data Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <Filter size={20} className="text-green-accent" />
            <h2 className="card-title">Forecast Table ({selectedRegion})</h2>
          </div>
          <div className="card-subtitle-badge">
            <Info size={14} /> Low &lt;= 135 gCO₂eq/kWh
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Time Slot</th>
                  <th>Region</th>
                  <th>Carbon Intensity</th>
                  <th>Grid Status</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {carbonForecast.map((row) => {
                  const intensity = row[selectedRegion];
                  const status = getCarbonIntensityStatus(intensity);
                  const isLow = status === 'Low';

                  return (
                    <tr
                      key={row.time}
                      className={isLow ? 'table-row-highlight-green' : ''}
                    >
                      <td className="font-mono font-medium">{row.time}</td>
                      <td>{selectedRegion}</td>
                      <td className="font-medium">
                        {intensity} <small>gCO₂eq/kWh</small>
                      </td>
                      <td>{getStatusBadge(status)}</td>
                      <td>
                        {isLow ? (
                          <span className="text-green-accent font-medium flex-center gap-xs">
                            <Leaf size={14} /> Recommended Slot
                          </span>
                        ) : (
                          <span className="text-muted">Standard Slot</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
