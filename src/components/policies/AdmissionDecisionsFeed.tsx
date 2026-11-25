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
          <h3 className="feed-title">Admission scenarios</h3>
        </div>

        {/* Filter Pills */}
        <div className="decision-filter-pills" role="group" aria-label="Filter simulated scenarios">
          <button
            aria-pressed={decisionFilter === 'ALL'}
            className={`decision-filter-pill ${decisionFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setDecisionFilter('ALL')}
          >
            All ({decisions.length})
          </button>
          <button
            aria-pressed={decisionFilter === 'ALLOW'}
            className={`decision-filter-pill allow ${decisionFilter === 'ALLOW' ? 'active' : ''}`}
            onClick={() => setDecisionFilter('ALLOW')}
          >
            Allow ({decisions.filter((d) => d.decision === 'ALLOW').length})
          </button>
          <button
            aria-pressed={decisionFilter === 'DENY'}
            className={`decision-filter-pill deny ${decisionFilter === 'DENY' ? 'active' : ''}`}
            onClick={() => setDecisionFilter('DENY')}
          >
            Deny ({decisions.filter((d) => d.decision === 'DENY').length})
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
              <button type="button"
                className="admission-card-summary"
                onClick={() => toggleExpand(dec.id)}
                aria-expanded={isExpanded}
              >
                <span className="card-left-group">
                  <span className={`decision-icon-badge ${isAllow ? 'allow' : 'deny'}`}>
                    {isAllow ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </span>
                  <span className="workload-info-group">
                    <span className="workload-name-row">
                      <span className="workload-name">{dec.workloadName}</span>
                      <span className="workload-kind-tag">{dec.workloadKind}</span>
                      <span className={`namespace-pill ns-${dec.namespace}`}>{dec.namespace}</span>
                      <span className="source-tag">{dec.sourceType}</span>
                    </span>
                    <span className="policy-eval-text">
                      <span>Evaluated: <strong>{dec.evaluatingPolicyName}</strong></span>
                    </span>
                  </span>
                </span>

                <span className="card-right-group">
                  <span className="timestamp-box">
                    <Clock size={12} />
                    <span>{dec.timestamp}</span>
                  </span>
                  <span className={`verdict-badge ${isAllow ? 'allow' : 'deny'}`}>
                    {dec.decision}
                  </span>
                  {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </span>
              </button>

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
                      <span className="expanded-label">SIMULATED WEBHOOK RESPONSE</span>
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

