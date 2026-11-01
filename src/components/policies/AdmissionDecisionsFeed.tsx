import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  Server,
  Layers,
} from 'lucide-react';
import { AdmissionDecisionRecord } from '../../types/policy';

interface AdmissionDecisionsFeedProps {
  decisions: AdmissionDecisionRecord[];
  onNavigateToFinding?: (findingId: string) => void;
}

export const AdmissionDecisionsFeed: React.FC<AdmissionDecisionsFeedProps> = ({
  decisions,
  onNavigateToFinding,
}) => {
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | 'ALLOW' | 'DENY'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredDecisions = decisions.filter((d) => {
    if (decisionFilter === 'ALL') return true;
    return d.decision === decisionFilter;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="admission-feed-wrapper">
      {/* Header & Filter Controls */}
      <div className="admission-feed-header">
        <div className="feed-header-left">
          <div className="live-tag">
            <span className="live-pulse-dot" />
            <span>ADMISSION WEBHOOK EVIDENCE</span>
          </div>
          <h3 className="feed-title">Kubernetes Admission Decisions</h3>
          <p className="feed-subtitle">
            Cryptographic audit of deployment attempts intercepted by the OPA Gatekeeper validating admission controller.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="decision-filter-pills" role="tablist">
          <button
            role="tab"
            aria-selected={decisionFilter === 'ALL'}
            className={`decision-filter-pill ${decisionFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setDecisionFilter('ALL')}
          >
            All ({decisions.length})
          </button>
          <button
            role="tab"
            aria-selected={decisionFilter === 'ALLOW'}
            className={`decision-filter-pill allow ${decisionFilter === 'ALLOW' ? 'active' : ''}`}
            onClick={() => setDecisionFilter('ALLOW')}
          >
            Admitted ({decisions.filter((d) => d.decision === 'ALLOW').length})
          </button>
          <button
            role="tab"
            aria-selected={decisionFilter === 'DENY'}
            className={`decision-filter-pill deny ${decisionFilter === 'DENY' ? 'active' : ''}`}
            onClick={() => setDecisionFilter('DENY')}
          >
            Blocked ({decisions.filter((d) => d.decision === 'DENY').length})
          </button>
        </div>
      </div>

      {/* Decisions List */}
      <div className="admission-decisions-list">
        {filteredDecisions.map((dec) => {
          const isAllow = dec.decision === 'ALLOW';
          const isExpanded = expandedId === dec.id;

          return (
            <div
              key={dec.id}
              className={`admission-card ${isAllow ? 'card-allow' : 'card-deny'} ${
                isExpanded ? 'expanded' : ''
              }`}
            >
              <div
                className="admission-card-summary"
                onClick={() => toggleExpand(dec.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(dec.id);
                  }
                }}
              >
                <div className="card-left-group">
                  <div className={`decision-icon-badge ${isAllow ? 'allow' : 'deny'}`}>
                    {isAllow ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </div>
                  <div className="workload-info-group">
                    <div className="workload-name-row">
                      <span className="workload-name">{dec.workloadName}</span>
                      <span className="workload-kind-tag">{dec.workloadKind}</span>
                      <span className={`namespace-pill ns-${dec.namespace}`}>{dec.namespace}</span>
                      <span className="source-tag">{dec.sourceType}</span>
                    </div>
                    <div className="policy-eval-text">
                      <span>Evaluated: <strong>{dec.evaluatingPolicyName}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="card-right-group">
                  <div className="timestamp-box">
                    <Clock size={12} />
                    <span>{dec.timestamp}</span>
                  </div>
                  <div className={`verdict-badge ${isAllow ? 'allow' : 'deny'}`}>
                    {dec.decision}
                  </div>
                  <button
                    className="expand-arrow-btn"
                    aria-label={isExpanded ? 'Collapse' : 'Expand Details'}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expandable Webhook Payload & Details */}
              {isExpanded && (
                <div className="admission-card-expanded">
                  <div className="expanded-section">
                    <span className="expanded-label">EVALUATION REASON:</span>
                    <p className="expanded-reason">{dec.reason}</p>
                  </div>

                  <div className="expanded-section">
                    <div className="raw-response-header">
                      <Terminal size={14} />
                      <span className="expanded-label">RAW KUBERNETES ADMISSION WEBHOOK OUTPUT:</span>
                    </div>
                    <div className="raw-response-block">
                      <pre>
                        <code>{dec.rawWebhookResponse}</code>
                      </pre>
                    </div>
                  </div>

                  {dec.linkedFindingId && onNavigateToFinding && (
                    <div className="expanded-footer-actions">
                      <span className="linked-finding-hint">
                        <ShieldAlert size={14} />
                        <span>Connected to Security Finding: <strong>{dec.linkedFindingId}</strong></span>
                      </span>
                      <button
                        className="jump-to-finding-btn"
                        onClick={() => onNavigateToFinding(dec.linkedFindingId!)}
                      >
                        <span>Inspect Finding</span>
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

