import React from 'react';
import { 
  LayoutDashboard, 
  Fingerprint, 
  ShieldCheck, 
  Network, 
  PackageCheck, 
  Activity, 
  Layers
} from 'lucide-react';
import { ActiveModule } from '../types/security';

interface SidebarProps {
  currentModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  findingsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  findingsCount,
}) => {
  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Operations</div>

        <button 
          className={`nav-item ${currentModule === 'command_center' ? 'active' : ''}`}
          onClick={() => onSelectModule('command_center')}
        >
          <div className="nav-item-left">
            <LayoutDashboard size={14} />
            <span>Command Center</span>
          </div>
          <span className="nav-badge-count">{findingsCount}</span>
        </button>

        <div className="nav-section-title">Zero-Trust Pillars</div>

        <button 
          className={`nav-item ${currentModule === 'workload_identity' ? 'active' : ''}`}
          onClick={() => onSelectModule('workload_identity')}
        >
          <div className="nav-item-left">
            <Fingerprint size={14} />
            <span>Workload Identity</span>
          </div>
          <span className="nav-badge-planned">Ph 4</span>
        </button>

        <button 
          className={`nav-item ${currentModule === 'policy_governance' ? 'active' : ''}`}
          onClick={() => onSelectModule('policy_governance')}
        >
          <div className="nav-item-left">
            <ShieldCheck size={14} />
            <span>Policy-as-Code</span>
          </div>
          <span className="nav-badge-planned">Ph 4</span>
        </button>

        <button 
          className={`nav-item ${currentModule === 'service_mesh' ? 'active' : ''}`}
          onClick={() => onSelectModule('service_mesh')}
        >
          <div className="nav-item-left">
            <Network size={14} />
            <span>Service Mesh Trust</span>
          </div>
          <span className="nav-badge-planned">Ph 4</span>
        </button>

        <button 
          className={`nav-item ${currentModule === 'supply_chain' ? 'active' : ''}`}
          onClick={() => onSelectModule('supply_chain')}
        >
          <div className="nav-item-left">
            <PackageCheck size={14} />
            <span>Supply Chain Defense</span>
          </div>
          <span className="nav-badge-planned">Ph 5</span>
        </button>

        <div className="nav-section-title">Evaluation</div>

        <button 
          className={`nav-item ${currentModule === 'experiments' ? 'active' : ''}`}
          onClick={() => onSelectModule('experiments')}
        >
          <div className="nav-item-left">
            <Activity size={14} />
            <span>Experiments EXP-01–08</span>
          </div>
          <span className="nav-badge-planned">Ph 6</span>
        </button>

        <button 
          className={`nav-item ${currentModule === 'integrations' ? 'active' : ''}`}
          onClick={() => onSelectModule('integrations')}
        >
          <div className="nav-item-left">
            <Layers size={14} />
            <span>Cluster Connectors</span>
          </div>
          <span className="nav-badge-planned">Ph 3</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="footer-capstone-card">
          <div className="footer-capstone-tag">PRJ-34 CAPSTONE</div>
          <div className="footer-capstone-title">
            ZeroTrustCloud: Identity-Centric Security Mesh
          </div>
        </div>
      </div>
    </aside>
  );
};
