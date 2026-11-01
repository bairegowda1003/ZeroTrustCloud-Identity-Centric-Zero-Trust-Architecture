import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Server,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { PolicyAuditViolationRecord } from '../../types/policy';

interface PolicyAuditViolationsTableProps {
  violations: PolicyAuditViolationRecord[];
  onNavigateToFinding?: (findingId: string) => void;
}

export const PolicyAuditViolationsTable: React.FC<PolicyAuditViolationsTableProps> = ({
  violations,
  onNavigateToFinding,
}) => {
  return (
    <div className="audit-violations-wrapper">
      <div className="audit-header-row">
        <div className="audit-header-left">
          <div className="audit-badge">
            <ShieldAlert size={14} />
            <span>BACKGROUND AUDIT SCANNER</span>
          </div>
          <h3 className="audit-title">Cluster Audit Violations</h3>
          <p className="audit-subtitle">
            Pre-existing workloads in the Kubernetes testbed violating Gatekeeper constraint policies.
          </p>
        </div>
        <div className="audit-header-right">
          <span className="audit-count-pill">{violations.length} Active Violations</span>
        </div>
      </div>

      <div className="audit-table-container">
        <table className="audit-table" aria-label="Policy Audit Violations">
          <thead>
            <tr>
              <th scope="col">Workload & Kind</th>
              <th scope="col">Namespace</th>
              <th scope="col">Violated Policy</th>
              <th scope="col">Audit Violation Detail</th>
              <th scope="col">Severity</th>
              <th scope="col" className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {violations.map((v) => (
              <tr key={v.id} className="audit-row">
                <td className="cell-workload">
                  <div className="workload-box">
                    <Server size={14} className="workload-icon" />
                    <div>
                      <span className="workload-name">{v.workloadName}</span>
                      <small className="workload-kind">{v.kind}</small>
                    </div>
                  </div>
                </td>
                <td className="cell-namespace">
                  <span className={`namespace-badge ns-${v.namespace}`}>{v.namespace}</span>
                </td>
                <td className="cell-policy">
                  <span className="policy-name">{v.policyName}</span>
                  <small className="policy-id-code">{v.policyId}</small>
                </td>
                <td className="cell-detail">
                  <span className="violation-message" title={v.violationMessage}>
                    {v.violationMessage}
                  </span>
                </td>
                <td className="cell-severity">
                  <span className={`severity-tag ${v.severity}`}>{v.severity}</span>
                </td>
                <td className="cell-action text-right">
                  {v.linkedFindingId && onNavigateToFinding ? (
                    <button
                      className="audit-inspect-btn"
                      onClick={() => onNavigateToFinding(v.linkedFindingId!)}
                      aria-label={`Inspect finding ${v.linkedFindingId}`}
                    >
                      <span>Finding</span>
                      <ExternalLink size={12} />
                    </button>
                  ) : (
                    <span className="no-finding-text">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

