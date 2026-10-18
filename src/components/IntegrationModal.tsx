import React from 'react';
import { X, Cloud, Database, Key, GitBranch, Activity, Wifi } from 'lucide-react';
import { IntegrationProvider } from '../types/security';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: IntegrationProvider[];
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  aws: <Cloud size={16} />,
  azure: <Cloud size={16} />,
  gcp: <Cloud size={16} />,
  okta: <Key size={16} />,
  github: <GitBranch size={16} />,
  vault: <Database size={16} />,
  istio: <Activity size={16} />,
  default: <Wifi size={16} />,
};

const PROVIDER_COLORS: Record<string, string> = {
  aws: '#ff9900',
  azure: '#0078d4',
  gcp: '#4285f4',
  okta: '#007dc1',
  github: '#f0f0f0',
  vault: '#000000',
  istio: '#466bb0',
};

export const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, onClose, providers }) => {
  return (
    <>
      <div
        className={`modal-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      >
        <div
          className="modal-panel"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal-header">
            <h2 id="modal-title" className="modal-title">Connect Data Source</h2>
            <button className="modal-close" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>

          <div className="modal-body">
            <p style={{
              fontSize: '0.857rem',
              color: 'var(--text-tertiary)',
              marginBottom: '20px',
              lineHeight: '1.6',
            }}>
              Connect cloud providers, identity platforms, and security tools to enable
              zero-trust telemetry ingestion. <strong style={{ color: '#eab308' }}>Demo mode</strong> — 
              integrations shown are planned for future phases.
            </p>

            {providers.map((provider) => (
              <div key={provider.id} className="modal-integration-card">
                <div
                  className="modal-integration-icon"
                  style={{
                    background: `${PROVIDER_COLORS[provider.id] || '#333'}22`,
                    color: PROVIDER_COLORS[provider.id] || 'var(--text-secondary)',
                  }}
                >
                  {PROVIDER_ICONS[provider.id] || PROVIDER_ICONS.default}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="modal-integration-name">{provider.name}</div>
                  <div className="modal-integration-desc">{provider.description}</div>
                  <span className="modal-integration-status">
                    {provider.status === 'Not Connected' ? '○ Not Connected' : `◯ ${provider.status}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
