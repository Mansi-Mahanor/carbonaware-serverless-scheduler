import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarPlus,
  ListTodo,
  Leaf,
  History,
  Settings,
  Cpu
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Schedule Workload', path: '/schedule', icon: CalendarPlus },
    { label: 'Jobs', path: '/jobs', icon: ListTodo },
    { label: 'Carbon Forecast', path: '/carbon', icon: Leaf },
    { label: 'Execution History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <Cpu className="brand-icon" size={24} />
          <Leaf className="brand-leaf-badge" size={14} />
        </div>
        <div className="brand-text">
          <span className="brand-name">EcoScheduler</span>
          <span className="brand-sub">Carbon-Aware Cloud</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              end={item.path === '/'}
            >
              <Icon size={18} className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sustainability-badge">
          <Leaf size={14} />
          <span>Green Cloud Active</span>
        </div>
        <p className="footer-text">BE Final Year Project</p>
      </div>
    </aside>
  );
}
