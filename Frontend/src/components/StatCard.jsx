import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtext, color = 'green' }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon-wrapper">
            <Icon size={20} className="stat-card-icon" />
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        {subtext && <div className="stat-card-subtext">{subtext}</div>}
      </div>
    </div>
  );
}
