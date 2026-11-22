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
  const unresolved = findings.filter((finding) => finding.status !== 'resolved' && finding.status !== 'suppressed');
  const priorityItems = [...unresolved].sort((a, b) => b.riskScore - a.riskScore).slice(0, 4).map((finding) => ({
    ...finding,
    source: `Demo fixture: ${finding.domain}`,
    iconType: finding.severity === 'critical' || finding.severity === 'high' ? 'critical' : finding.severity === 'medium' ? 'warning' : 'info',
  }));

  const handleItemClick = (id: string) => {
    const found = findings.find((f) => f.id === id);
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
          <span className="priority-findings-count-badge">{unresolved.length} Demo Unresolved</span>
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
        {priorityItems.length === 0 && <p>No unresolved demonstration findings.</p>}
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
            <strong>{priorityItems.length} of {unresolved.length}</strong> demo findings prioritized for session triage
          </span>
        </div>
        <div className="findings-triage-policy">
          <span>Demo Only</span>
        </div>
      </div>
    </div>
  );
};
