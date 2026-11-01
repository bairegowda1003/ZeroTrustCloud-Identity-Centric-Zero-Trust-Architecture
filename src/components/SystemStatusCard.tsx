import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SystemStatusCardProps {
  onViewDetails?: () => void;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ onViewDetails }) => {
  const systems = [
    {
      id: 'dashboard',
      name: 'TrustMesh Dashboard',
      status: 'Healthy',
      statusType: 'healthy',
      dotColor: '#20D6A2',
    },
    {
      id: 'opa',
      name: 'Policy Engine (OPA)',
      status: 'Healthy',
      statusType: 'healthy',
      dotColor: '#20D6A2',
    },
    {
      id: 'istio',
      name: 'Service Mesh (Istio)',
      status: 'Planned',
      statusType: 'planned',
      dotColor: '#16D9E8',
    },
    {
      id: 'cloud',
      name: 'Cloud Integrations (AWS/Azure)',
      status: 'Planned',
      statusType: 'planned',
      dotColor: '#16D9E8',
    },
  ];

  return (
    <div className="system-status-card" role="region" aria-label="Component Health and Integration Status">
      {/* Header */}
      <div className="status-card-header">
        <h2 className="status-title">System Status</h2>
        <button className="view-all-link-btn" onClick={onViewDetails} aria-label="View system status details">
          <span>View details</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Systems List */}
      <div className="status-list">
        {systems.map((sys) => (
          <div key={sys.id} className="status-row">
            <div className="status-row-left">
              <span className="status-indicator-dot" style={{ backgroundColor: sys.dotColor }} />
              <span className="status-system-name">{sys.name}</span>
            </div>
            <div className="status-row-right">
              <span className={`system-status-pill status-${sys.statusType}`}>{sys.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

