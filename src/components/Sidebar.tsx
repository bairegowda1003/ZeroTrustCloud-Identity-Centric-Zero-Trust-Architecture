import React from 'react';
import {
  LayoutDashboard,
  Shield,
  Eye,
  Fingerprint,
  FileText,
  Network,
  GitBranch,
  Users,
  Settings,
  Grid3X3,
  Bell,
  HelpCircle,
} from 'lucide-react';
import type { ActiveModule } from '../types/security';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  currentModule: ActiveModule;
  onModuleChange: (module: ActiveModule) => void;
}

const topNavItems: { id: ActiveModule; icon: LucideIcon; label: string }[] = [
  { id: 'command_center', icon: LayoutDashboard, label: 'Command Center' },
  { id: 'workload_identity', icon: Fingerprint, label: 'Workload Identity' },
  { id: 'policy_governance', icon: Shield, label: 'Policy Governance' },
  { id: 'service_mesh', icon: Network, label: 'Service Mesh' },
  { id: 'supply_chain', icon: GitBranch, label: 'Supply Chain' },
  { id: 'experiments', icon: Eye, label: 'Experiments' },
  { id: 'integrations', icon: Users, label: 'Integrations' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentModule, onModuleChange }) => {
  return (
    <nav className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => onModuleChange('command_center')}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" stroke="#00d4aa" strokeWidth="2" fill="none" />
          <path
            d="M16 6 L16 26 M10 10 L22 22 M10 22 L22 10 M6 16 L26 16"
            stroke="#00d4aa"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <circle cx="16" cy="16" r="3" fill="#00d4aa" />
        </svg>
      </div>

      {/* Top Nav */}
      <div className="sidebar-nav">
        {topNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${currentModule === item.id ? 'active' : ''}`}
              onClick={() => onModuleChange(item.id)}
              aria-label={item.label}
              aria-current={currentModule === item.id ? 'page' : undefined}
            >
              <Icon size={18} />
              <span className="tooltip">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Nav */}
      <div className="sidebar-divider" />
      <div className="sidebar-bottom">
        <button className="sidebar-item" aria-label="Settings">
          <Settings size={18} />
          <span className="tooltip">Settings</span>
        </button>
        <button className="sidebar-item" aria-label="Applications">
          <Grid3X3 size={18} />
          <span className="tooltip">Applications</span>
        </button>
        <button className="sidebar-item" aria-label="Notifications">
          <Bell size={18} />
          <span className="tooltip">Notifications</span>
        </button>
        <button className="sidebar-item" aria-label="Help">
          <HelpCircle size={18} />
          <span className="tooltip">Help</span>
        </button>
      </div>

      {/* User Avatar */}
      <div
        style={{
          marginTop: '8px',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #4da6ff, #00d4aa)',
          color: '#0a0e1a',
          fontSize: '0.714rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'default',
        }}
      >
        TM
      </div>
    </nav>
  );
};
