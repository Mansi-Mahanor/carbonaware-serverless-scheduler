
import React from 'react';
import CarbonChart from '../components/CarbonChart';
import {
  Leaf,
  Filter,
  Info,
  Globe,
  AlertCircle,
} from 'lucide-react';

const REGION = 'CAISO_NORTH';
const REGION_LABEL = 'CAISO_NORTH — Northern California';

export default function CarbonForecast({
  carbonForecast = [],
  forecastInfo = {},
}) {
  const points = Array.isArray(carbonForecast)
    ? carbonForecast
    : [];

  const getIntensity = (point) => {
    const value = Number(point?.carbonIntensityGramsPerKWh);
    return Number.isFinite(value) ? value : null;
  };

  const formatTime = (value) => {
    if (!value) return 'Time unavailable';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  const getStatus = (intensity) => {
    if (intensity === null) return 'Unavailable';

    // MOER-specific display categories, not universal grid thresholds.
    if (intensity <= 135) return 'Low';
    if (intensity <= 300) return 'Medium';
    return 'High';
  };

  const getStatusBadge = (status) => {
    if (status === 'Low') {
      return (
        <span className="badge-carbon status-low">
          <Leaf size={12} /> Low
        </span>
      );
    }

    if (status === 'Medium') {
      return (
        <span className="badge-carbon status-medium">
          Medium
        </span>
      );
    }

    if (status === 'High') {
      return (
        <span className="badge-carbon status-high">
          High
        </span>
      );
    }

    return <span className="text-muted">Unavailable</span>;
  };

  const validPoints = points.filter(
    (point) => getIntensity(point) !== null
  );

  const source = forecastInfo.source || 'WattTime';
  const signalType = forecastInfo.signalType || 'co2_moer';

  return (
    <div className="page-container">
      <div className="page-header-block">
        <h1 className="page-title">
          WattTime Marginal Emissions Forecast
        </h1>

        <p className="page-description">
          Forecasted marginal operating emissions rate (MOER)
          for the configured electricity grid region. Lower
          forecast values may indicate preferable execution
          windows for deferrable workloads.
        </p>
      </div>

      {/* Live forecast region */}
      <div className="card margin-bottom-lg">
        <div className="card-body flex-between-center gap-md wrap">
          <div className="flex-center gap-sm">
            <Globe
              size={20}
              className="text-green-accent"
            />

            <div>
              <strong className="font-medium text-main">
                WattTime Forecast Region
              </strong>

              <div>{REGION_LABEL}</div>
            </div>
          </div>

          <div>
            <strong>Source:</strong> {source}
            {' · '}
            <strong>Signal:</strong> {signalType}
          </div>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="card margin-bottom-lg">
          <div className="card-body">
            <AlertCircle size={20} />

            <h2>No forecast data available</h2>

            <p>
              The application has not received any WattTime
              forecast points. Check that the backend is
              running and the live forecast endpoint is
              responding successfully.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Forecast chart */}
          <div className="card margin-bottom-lg">
            <div className="card-header">
              <div className="card-title-group">
                <Leaf
                  size={20}
                  className="text-green-accent"
                />

                <h2 className="card-title">
                  Forecast Trajectory — {REGION}
                </h2>
              </div>
            </div>

            <div className="card-body">
              <CarbonChart
                data={points}
                selectedRegion={REGION}
              />
            </div>
          </div>

          {/* Forecast table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Filter
                  size={20}
                  className="text-green-accent"
                />

                <h2 className="card-title">
                  Forecast Table — {REGION}
                </h2>
              </div>

              <div className="card-subtitle-badge">
                <Info size={14} />
                Display category: Low ≤ 135 gCO₂/kWh
              </div>
            </div>

            <div className="card-body">
              <p className="text-muted">
                {validPoints.length} valid forecast points
                {' · '}
                Values are forecasts, not measured actual emissions.
              </p>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Forecast Time</th>
                      <th>Region</th>
                      <th>MOER Forecast</th>
                      <th>Display Category</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>

                  <tbody>
                    {points.map((point, index) => {
                      const intensity = getIntensity(point);
                      const status = getStatus(intensity);
                      const isLow = status === 'Low';

                      return (
                        <tr
                          key={`${point.time || 'point'}-${index}`}
                          className={
                            isLow
                              ? 'table-row-highlight-green'
                              : ''
                          }
                        >
                          <td className="font-mono font-medium">
                            {formatTime(point.time)}
                          </td>

                          <td>{REGION}</td>

                          <td className="font-medium">
                            {intensity === null
                              ? 'Unavailable'
                              : intensity.toFixed(2)}

                            {intensity !== null && (
                              <small> gCO₂/kWh</small>
                            )}
                          </td>

                          <td>{getStatusBadge(status)}</td>

                          <td>
                            {isLow ? (
                              <span className="text-green-accent font-medium flex-center gap-xs">
                                <Leaf size={14} />
                                Lower forecast value
                              </span>
                            ) : intensity === null ? (
                              <span className="text-muted">
                                No valid value
                              </span>
                            ) : (
                              <span className="text-muted">
                                Compare with other forecast slots
                              </span>
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
        </>
      )}
    </div>
  );
}
