
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

const REGION_LABEL = 'CAISO_NORTH';

export default function CarbonChart({
  data = [],
  selectedRegion = REGION_LABEL,
}) {
  // Adapt WattTime forecast points to the chart's data format.
  const chartData = (Array.isArray(data) ? data : [])
    .map((point) => {
      const rawVal =
        point?.carbonIntensityGramsPerKWh ?? point?.carbonIntensity;
      const intensity =
        rawVal !== null && rawVal !== undefined ? Number(rawVal) : NaN;

      if (
        !point?.time ||
        !Number.isFinite(intensity)
      ) {
        return null;
      }

      const date = new Date(point.time);

      return {
        time: point.time,
        displayTime: Number.isNaN(date.getTime())
          ? point.time
          : date.toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
        carbonIntensity: intensity,
      };
    })
    .filter(Boolean);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) {
      return null;
    }

    const point = payload[0]?.payload;

    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-time">
          Forecast time:{' '}
          <strong>
            {point?.displayTime || 'Unavailable'}
          </strong>
        </p>

        <div className="tooltip-items">
          <div className="tooltip-item">
            <span
              className="tooltip-dot"
              style={{ backgroundColor: '#10b981' }}
            />

            <span className="tooltip-name">
              {selectedRegion || REGION_LABEL} MOER:
            </span>

            <span className="tooltip-val">
              {Number(point?.carbonIntensity).toFixed(2)}
              {' gCO₂/kWh'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div
        className="chart-empty-state"
        role="status"
        style={{
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <p>
          No valid WattTime forecast points are available
          to plot. Check the live forecast API response.
        </p>
      </div>
    );
  }

  return (
    <div className="chart-wrapper">
      <div
        style={{
          marginBottom: 12,
          fontSize: 13,
          color: '#64748b',
        }}
      >
        Region: <strong>{selectedRegion}</strong>
        {' · '}
        Forecast points: <strong>{chartData.length}</strong>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 15,
            bottom: 25,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
          />

          <XAxis
            dataKey="displayTime"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            minTickGap={35}
            interval="preserveStartEnd"
          />

          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={75}
            domain={[0, (dataMax) => (Number.isFinite(dataMax) ? Math.max(150, Math.ceil(dataMax * 1.15)) : 'auto')]}
            label={{
              value: 'MOER (gCO₂/kWh)',
              angle: -90,
              position: 'insideLeft',
              style: {
                textAnchor: 'middle',
                fill: '#64748b',
              },
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: 10 }}
          />

          <ReferenceLine
            y={135}
            stroke="#10b981"
            strokeDasharray="4 4"
            label={{
              value: 'Illustrative threshold: 135 gCO₂/kWh',
              fill: '#059669',
              fontSize: 10,
              position: 'insideTopRight',
            }}
          />

          <Line
            type="monotone"
            dataKey="carbonIntensity"
            name="WattTime MOER Forecast"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
