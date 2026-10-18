import React from 'react';
import {
  XCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { SecurityFinding } from '../types/security';

interface DecisionEvent {
  id: string;
  timestamp: string;
  status: 'denied' | 'verified' | 'alerted';
  title: string;
  target: string;
  domain: string;
  ruleOrAttestation: string;
  findingId?: string;
}

const RECENT_DECISION_EVENTS: DecisionEvent[] = [
  {
    id: 'DEC-401',
    timestamp: '10:42',
    status: 'denied',
    title: 'Workload denied',
    target: 'legacy-node-exporter',
    domain: 'Policy',
    ruleOrAttestation: 'RULE-POL-PRIVILEGED-04',
    findingId: 'TM-SEC-102',
  },
  {
    id: 'DEC-402',
    timestamp: '10:39',
    status: 'verified',
    title: 'Image verified',
    target: 'checkout-gateway:v2.1',
    domain: 'Supply Chain',
    ruleOrAttestation: 'Sigstore Cosign Attestation',
    findingId: 'TM-SEC-101',
  },
  {
    id: 'DEC-403',
    timestamp: '10:35',
    status: 'verified',
    title: 'Identity attested',
    target: 'cart-service',
    domain: 'Identity',
    ruleOrAttestation: 'spiffe://cluster.local/ns/prod/sa/cart',
  },
  {
    id: 'DEC-404',
    timestamp: '10:31',
    status: 'alerted',
    title: 'mTLS not enforced',
    target: 'payment-gateway',
    domain: 'Service Mesh',
    ruleOrAttestation: 'RULE-MESH-MTLS-PERMISSIVE-02',
    findingId: 'TM-SEC-103',
  },
];

interface RecentDecisionsTimelineProps {
  findings: SecurityFinding[];
  onFindingClick: (finding: SecurityFinding) => void;
  onViewAllFindings?: () => void;
}

export const RecentDecisionsTimeline: React.FC<RecentDecisionsTimelineProps> = ({
  findings,
  onFindingClick,
  onViewAllFindings,
}) => {
  const handleEventClick = (event: DecisionEvent) => {
    if (event.findingId) {
      const match = findings.find((f) => f.id === event.findingId);
      if (match) {
        onFindingClick(match);
      }
    }
  };

  return (
    <div className="recent-decisions-card" aria-label="Recent Zero-Trust Decisions">
      <div className="recent-decisions-header">
        <div className="decisions-title-group">
          <h3 className="decisions-card-title">Recent Zero-Trust Decisions</h3>
          <span className="decisions-sub-badge">Simulated Testbed Audit Trail</span>
        </div>
        {onViewAllFindings && (
          <button
            type="button"
            className="decisions-view-all-btn"
            onClick={onViewAllFindings}
          >
            <span>View all findings</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      <div className="decisions-list">
        {RECENT_DECISION_EVENTS.map((event) => {
          const isClickable = Boolean(event.findingId);

          return (
            <div
              key={event.id}
              className={`decision-row ${isClickable ? 'decision-row--clickable' : ''}`}
              onClick={() => handleEventClick(event)}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              title={isClickable ? 'Click to inspect finding in detail drawer' : undefined}
            >
              <div className="decision-time-col">
                <span className="decision-timestamp">{event.timestamp}</span>
              </div>

              <div className="decision-status-col">
                {event.status === 'denied' && (
                  <span className="decision-badge decision-badge--denied">
                    <XCircle size={13} />
                    <span>Denied</span>
                  </span>
                )}
                {event.status === 'verified' && (
                  <span className="decision-badge decision-badge--verified">
                    <CheckCircle2 size={13} />
                    <span>Verified</span>
                  </span>
                )}
                {event.status === 'alerted' && (
                  <span className="decision-badge decision-badge--alerted">
                    <AlertCircle size={13} />
                    <span>Alerted</span>
                  </span>
                )}
              </div>

              <div className="decision-content-col">
                <div className="decision-title-row">
                  <span className="decision-headline">{event.title}</span>
                  <span className="decision-target-code">{event.target}</span>
                </div>
                <div className="decision-meta-row">
                  <span className="decision-domain-tag">{event.domain}</span>
                  <span className="decision-rule-text">{event.ruleOrAttestation}</span>
                </div>
              </div>

              <div className="decision-action-col">
                {isClickable && (
                  <span className="decision-inspect-pill">
                    <span>Inspect</span>
                    <ExternalLink size={11} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
