import React from 'react';

export default function StatusBadge({ status }) {
  const getBadgeClass = (statusVal) => {
    switch (statusVal) {
      case 'Scheduled': return 'badge-scheduled';
      case 'Running': return 'badge-running';
      case 'Completed': return 'badge-completed';
      case 'Pending': return 'badge-pending';
      case 'Failed': return 'badge-failed';
      default: return 'badge-default';
    }
  };

  return (
    <span className={`status-badge ${getBadgeClass(status)}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}
