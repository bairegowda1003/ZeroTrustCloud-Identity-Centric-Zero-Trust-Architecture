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
        <h2 className="priority-findings-title">Priority Findings</h2>
        <button
          className="view-all-link-btn"
          onClick={onViewAllFindings}
          aria-label="View all security findings"
        >
          <span>View all</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* List of 3 Priority Findings */}
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
              {item.iconType === 'critical' && <AlertTriangle size={17} className="text-red-400" />}
              {item.iconType === 'warning' && <AlertCircle size={17} className="text-amber-400" />}
              {item.iconType === 'info' && <Info size={17} className="text-sky-400" />}
            </div>

            {/* Text Info */}
            <div className="finding-text-col">
              <div className="finding-title-row">
                <h3 className="finding-item-title">{item.title}</h3>
                <div className={`finding-severity-pill ${item.severity}`}>
                  <span className="severity-dot" />
                  <span>{item.severity === 'high' ? 'High' : item.severity === 'medium' ? 'Medium' : 'Low'}</span>
                </div>
              </div>
              <p className="finding-item-desc">{item.description}</p>
              <span className="finding-item-meta">{item.source}</span>
            </div>

            {/* Right Chevron */}
            <div className="finding-chevron">
              <ChevronRight size={15} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
