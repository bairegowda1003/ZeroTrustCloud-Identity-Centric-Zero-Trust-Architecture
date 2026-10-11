import React from 'react';
import { X, CloudOff, AlertCircle, ShieldAlert, CheckCircle2, Layers } from 'lucide-react';
import { IntegrationProvider } from '../types/security';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: IntegrationProvider[];
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({
  isOpen,
  onClose,
  providers,
}) => {
  if (!isOpen) return null;

  return (
    <div className="integration-modal-backdrop" onClick={onClose}>
      <div className="integration-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="integration-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Multi-Cluster Infrastructure & Security Engine Connectors
            </h3>
          </div>
          <button className="btn-close-drawer" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="integration-modal-body">
          <div style={{ 
            background: 'rgba(0, 229, 255, 0.05)', 
            border: '1px solid rgba(0, 229, 255, 0.2)', 
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            <strong style={{ color: 'var(--accent-cyan)' }}>Data Integrity Notice (PROJECT_CORE.md Source of Truth):</strong>
            <p style={{ marginTop: '4px' }}>
              TrustMesh is operating strictly in <strong>Phase 1: Dashboard Foundation</strong>. Live cluster API connections, cloud provider IAM syncing, and OPA/Istio admission webhooks are scheduled for provisioning in Phase 3 and Phase 4. All findings shown in the console are controlled demonstration fixtures designed for interface verification.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {providers.map((p) => (
              <div key={p.id} className="connector-row-card">
                <div className="connector-row-left">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="connector-name">{p.name}</span>
                    <span style={{ 
                      fontSize: '10px', 
                      color: 'var(--text-muted)', 
                      border: '1px solid var(--border-subtle)', 
                      padding: '1px 5px', 
                      borderRadius: 'var(--radius-xs)' 
                    }}>
                      {p.category}
                    </span>
                  </div>
                  <p className="connector-desc">{p.description}</p>
                  <p style={{ color: 'var(--accent-cyan)', fontSize: '11px', marginTop: '3px' }}>
                    Planned Capability: {p.plannedCapability}
                  </p>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className="connector-status-badge">
                    {p.status}
                  </span>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {p.targetPhase}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
