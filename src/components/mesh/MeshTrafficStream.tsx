import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  ArrowRight,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { MeshTrafficEvent } from '../../types/mesh';

interface MeshTrafficStreamProps {
  events: MeshTrafficEvent[];
  onNavigateToFinding?: (findingId: string) => void;
}

export const MeshTrafficStream: React.FC<MeshTrafficStreamProps> = ({
  events,
  onNavigateToFinding,
}) => {
  return (
    <div className="traffic-stream-wrapper">
      <div className="stream-header-row">
        <div className="stream-header-left">
          <div className="stream-tag">
            <span className="stream-pulse-dot" />
            <span>LIVE SERVICE MESH TELEMETRY</span>
          </div>
          <h3 className="stream-title">Real-Time Traffic Decisions</h3>
          <p className="stream-subtitle">
            Istio Envoy data plane authorization logs and mutual TLS handshake evaluations.
          </p>
        </div>
        <div className="stream-header-right">
          <span className="events-count-pill">{events.length} Intercepted Transactions</span>
        </div>
      </div>

      <div className="traffic-events-list">
        {events.map((evt) => {
          const isAllow = evt.verdict === 'ALLOW';

          return (
            <div
              key={evt.id}
              className={`traffic-card ${isAllow ? 'card-allow' : 'card-deny'}`}
            >
              <div className="traffic-card-left">
                <div className={`verdict-circle ${isAllow ? 'allow' : 'deny'}`}>
                  {isAllow ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </div>

                <div className="traffic-route-info">
                  <div className="flow-nodes-line">
                    <span className="node-bold">{evt.source}</span>
                    <small className="node-ns">({evt.sourceNamespace})</small>
                    <ArrowRight size={13} className="flow-arrow" />
                    <span className="node-bold">{evt.destination}</span>
                    <small className="node-ns">({evt.destinationNamespace})</small>
                    <span className="http-method-tag">{evt.method}</span>
                    <code className="http-path-text">{evt.path}</code>
                  </div>
                  <p className="traffic-reason-text">{evt.reason}</p>
                </div>
              </div>

              <div className="traffic-card-right">
                <div className="cipher-chip">
                  <Lock size={11} />
                  <span>{evt.tlsVersion} {evt.cipherSuite !== 'None' ? `· ${evt.cipherSuite}` : '(Plaintext Dropped)'}</span>
                </div>
                <div className="time-status-group">
                  <div className="event-time">
                    <Clock size={11} />
                    <span>{evt.timestamp}</span>
                  </div>
                  <span className={`http-status-badge ${isAllow ? 'status-200' : 'status-403'}`}>
                    {evt.httpStatus > 0 ? `HTTP ${evt.httpStatus}` : 'TCP RST'}
                  </span>
                </div>
                {evt.linkedFindingId && onNavigateToFinding && (
                  <button
                    className="finding-jump-btn"
                    onClick={() => onNavigateToFinding(evt.linkedFindingId!)}
                    title={`Inspect finding ${evt.linkedFindingId}`}
                  >
                    <ShieldAlert size={12} />
                    <span>Alert</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

