import React from 'react';
import { Shield, LayoutDashboard, ListFilter, Layers, Sparkles } from 'lucide-react';
import { IntegrationProvider } from '../types/security';

export type CommandCenterTab = 'overview' | 'explorer';

interface HeaderProps {
  activeModuleTitle: string;
  activeTab: CommandCenterTab;
  onTabChange: (tab: CommandCenterTab) => void;
  findingsCount: number;
  providers: IntegrationProvider[];
  onOpenIntegrations: () => void;
  isCommandCenterActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeModuleTitle,
  activeTab,
  onTabChange,
  findingsCount,
  providers,
  onOpenIntegrations,
  isCommandCenterActive,
}) => {
  return (
    <header className="app-header">
      {/* Left: Brand & Breadcrumb */}
      <div className="header-left">
        <div className="header-brand">
          <div className="brand-logo-icon">
            <Shield size={14} />
          </div>
          <span>TrustMesh</span>
          <span className="brand-badge">ZTA CORE</span>
        </div>

        <div className="header-breadcrumbs">
          <span>ZeroTrustCloud</span>
          <span>/</span>
          <span className="active-view">{activeModuleTitle}</span>
        </div>
      </div>

      {/* Center: View Switcher (Progressive Disclosure) */}
      <div className="header-center">
        {isCommandCenterActive ? (
          <div className="view-mode-switcher">
            <button
              className={`view-mode-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => onTabChange('overview')}
            >
              <LayoutDashboard size={12} />
              <span>Command Center</span>
            </button>
            <button
              className={`view-mode-btn ${activeTab === 'explorer' ? 'active' : ''}`}
              onClick={() => onTabChange('explorer')}
            >
              <ListFilter size={12} />
              <span>Findings Explorer ({findingsCount})</span>
            </button>
          </div>
        ) : (
          <div className="env-indicator-pill">
            <span className="indicator-tag">[SIMULATED TESTBED]</span>
            <span>ZeroTrustCloud Research Platform</span>
          </div>
        )}
      </div>

      {/* Right: Connectors & Testbed tag */}
      <div className="header-right">
        <button 
          className="btn-connectors"
          onClick={onOpenIntegrations}
          title="Inspect planned multi-cluster testbeds"
        >
          <Layers size={13} color="var(--accent-teal)" />
          <span>Simulated Clusters (Phase 3)</span>
        </button>
      </div>
    </header>
  );
};
