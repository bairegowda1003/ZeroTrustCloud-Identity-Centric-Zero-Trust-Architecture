import React from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronRight, ArrowRight } from 'lucide-react';
import { SecurityFinding } from '../types/security';

interface PriorityFindingsCardProps {
  findings: SecurityFinding[];
  onFindingClick: (finding: SecurityFinding) => void;
  onViewAllFindings?: () => void;
}

export const PriorityFindingsCard: React.FC<PriorityFindingsCardProps> = ({
  findings,
  onFindingClick,
  onViewAllFindings,
}) => {
  const priorityItems = [
    {
      id: 'TM-SEC-101',
      title: 'Unsigned container image deployed',
      description: 'Image running without Cosign cryptographic signature',
      source: 'Supply Chain · 35m ago',
      severity: 'critical' as const,
      iconType: 'critical',
    },
    {
      id: 'TM-SEC-102',
      title: 'Privileged container configuration',
      description: 'Container running with excessive privileges',
      source: 'Kubernetes · 2h ago',
      severity: 'high' as const,
      iconType: 'critical',
    },
    {
      id: 'TM-SEC-106',
      title: 'Workload missing identity binding',
      description: 'Pod not bound to a verified identity',
      source: 'Kubernetes · 5h ago',
      severity: 'medium' as const,
      iconType: 'warning',
    },
    {
      id: 'TM-SEC-107',
      title: 'Policy rule not enforced',
      description: 'Expected policy not applied',
      source: 'OPA · 1d ago',
      severity: 'low' as const,
      iconType: 'info',
    },
  ];

  const handleItemClick = (id: string) => {
    const found = findings.find((f) => f.id === id) || findings[0];
    if (found) {
      onFindingClick(found);
    }
  };

  return (
    <div className="priority-findings-card" role="region" aria-label="Priority Security Findings">
      {/* Header */}
      <div className="priority-findings-header">
        <div className="priority-findings-title-wrap">
          <h2 className="priority-findings-title">Priority Findings</h2>
          <span className="priority-findings-count-badge">4 Unresolved</span>
        </div>
        <button
          className="view-all-link-btn"
          onClick={onViewAllFindings}
          aria-label="View all security findings"
        >
          <span>View all</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* List of 4 Priority Findings */}
      <div className="priority-findings-list">
        {priorityItems.map((item) => (
          <div
            key={item.id}
            className={`priority-finding-row ${item.severity}`}
            onClick={() => handleItemClick(item.id)}
            role="button"
            tabIndex={0}
            aria-label={`${item.title}, ${item.severity} severity`}
          >
            {/* Icon Box */}
            <div className={`finding-icon-box ${item.iconType}`}>
              {item.iconType === 'critical' && <AlertTriangle size={18} className="text-red-400" />}
              {item.iconType === 'warning' && <AlertCircle size={18} className="text-amber-400" />}
              {item.iconType === 'info' && <Info size={18} className="text-sky-400" />}
            </div>

            {/* Text Info */}
            <div className="finding-text-col">
              <h3 className="finding-item-title">{item.title}</h3>
              <p className="finding-item-desc">{item.description}</p>
              <span className="finding-item-meta">{item.source}</span>
            </div>

            {/* Right Action: Severity Pill + Chevron */}
            <div className="finding-row-right">
              <div className={`finding-severity-pill ${item.severity}`}>
                <span className="severity-dot" />
                <span>
                  {item.severity === 'critical'
                    ? 'Critical'
                    : item.severity === 'high'
                    ? 'High'
                    : item.severity === 'medium'
                    ? 'Medium'
                    : 'Low'}
                </span>
              </div>
              <div className="finding-chevron">
                <ChevronRight size={15} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Posture / Triage Status Footer */}
      <div className="priority-findings-footer">
        <div className="findings-triage-summary">
          <span className="findings-triage-dot" />
          <span className="findings-triage-text">
            <strong>4 of {findings.length || 12}</strong> active findings prioritized for triage
          </span>
        </div>
        <div className="findings-triage-policy">
          <span>Fail-Closed</span>
        </div>
      </div>
    </div>
  );
};
