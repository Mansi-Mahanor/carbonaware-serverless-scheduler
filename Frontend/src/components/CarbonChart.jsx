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
  ReferenceLine
} from 'recharts';

export default function CarbonChart({ data = [], selectedRegion = 'Mumbai' }) {
  // Region color mapping
  const regionColors = {
    Mumbai: '#10b981', // Sustainability Green
    Singapore: '#f59e0b', // Amber
    Tokyo: '#3b82f6', // Blue
    'US East': '#8b5cf6' // Purple
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-time">Time Slot: <strong>{label}</strong></p>
          <div className="tooltip-items">
            {payload.map((entry) => (
              <div key={entry.name} className="tooltip-item">
                <span className="tooltip-dot" style={{ backgroundColor: entry.color }} />
                <span className="tooltip-name">{entry.name}:</span>
                <span className="tooltip-val">{entry.value} gCO₂eq/kWh</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit=" g" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />

          {/* Low carbon baseline reference line at 135 gCO2eq/kWh */}
          <ReferenceLine y={135} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Low Carbon Threshold (<=135)', fill: '#10b981', fontSize: 11, position: 'insideBottomRight' }} />

          <Line
            type="monotone"
            dataKey="Mumbai"
            stroke={regionColors.Mumbai}
            strokeWidth={selectedRegion === 'Mumbai' ? 3 : 1.5}
            strokeOpacity={selectedRegion === 'Mumbai' || selectedRegion === 'All' ? 1 : 0.4}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Singapore"
            stroke={regionColors.Singapore}
            strokeWidth={selectedRegion === 'Singapore' ? 3 : 1.5}
            strokeOpacity={selectedRegion === 'Singapore' || selectedRegion === 'All' ? 1 : 0.4}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Tokyo"
            stroke={regionColors.Tokyo}
            strokeWidth={selectedRegion === 'Tokyo' ? 3 : 1.5}
            strokeOpacity={selectedRegion === 'Tokyo' || selectedRegion === 'All' ? 1 : 0.4}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="US East"
            stroke={regionColors['US East']}
            strokeWidth={selectedRegion === 'US East' ? 3 : 1.5}
            strokeOpacity={selectedRegion === 'US East' || selectedRegion === 'All' ? 1 : 0.4}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
