import React from 'react';
import { Cpu, ShieldAlert, Sparkles, Layers } from 'lucide-react';

interface EngineStatus {
  name: string;
  role: string;
  status: 'simulated' | 'planned' | 'testbed';
  label: string;
}

const SECURITY_ENGINES: EngineStatus[] = [
  { name: 'SPIRE', role: 'Identity', status: 'planned', label: 'Planned (Phase 4)' },
  { name: 'OPA', role: 'Policy', status: 'simulated', label: 'Simulated Policy' },
  { name: 'Istio', role: 'Service Mesh', status: 'simulated', label: 'Simulated mTLS' },
  { name: 'Cosign', role: 'Supply Chain', status: 'planned', label: 'Planned (Phase 5)' },
  { name: 'Trivy', role: 'Vulnerability', status: 'simulated', label: 'Simulated Scan' },
  { name: 'Kubernetes', role: 'Workload', status: 'testbed', label: 'Local Testbed' },
];

interface GreetingEngineBarProps {
  onOpenIntegrations?: () => void;
}

export const GreetingEngineBar: React.FC<GreetingEngineBarProps> = ({ onOpenIntegrations }) => {
  return (
    <section className="greeting-engine-bar" aria-label="Greeting and Security Engines Overview">
      <div className="greeting-text-group">
        <h1 className="greeting-title">
          Good morning, <span className="greeting-name-accent">Hithaishi</span>
        </h1>
        <p className="greeting-subtitle">
          Here's your zero-trust posture across cloud, identity, policy, and service mesh.
        </p>
      </div>

      <div className="engine-status-group">
        <div className="engine-header-meta">
          <span className="engine-count-badge">
            <Cpu size={12} className="engine-count-icon" />
            <span className="engine-fraction">6 // 6</span>
            <span className="engine-label">Security Engines</span>
          </span>
          <button 
            type="button" 
            className="engine-manage-link" 
            onClick={onOpenIntegrations}
            title="Inspect planned integration architecture and roadmap"
          >
            Roadmap →
          </button>
        </div>

        <div className="engine-chips-row">
          {SECURITY_ENGINES.map((engine) => (
            <div
              key={engine.name}
              className={`engine-chip engine-chip--${engine.status}`}
              title={`${engine.name} (${engine.role}) — ${engine.label}`}
              onClick={onOpenIntegrations}
            >
              <span className={`engine-chip-dot engine-chip-dot--${engine.status}`} />
              <span className="engine-chip-name">{engine.name}</span>
              <span className="engine-chip-status">{engine.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
