import React, { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, Sliders, CheckCircle2, AlertOctagon } from 'lucide-react';
import { GatekeeperPolicyRecord, AdmissionDecisionRecord, PolicyAuditViolationRecord } from '../../types/policy';

interface PolicySummaryCardsProps {
  policies: GatekeeperPolicyRecord[];
  decisions: AdmissionDecisionRecord[];
  auditViolations: PolicyAuditViolationRecord[];
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

export const PolicySummaryCards: React.FC<PolicySummaryCardsProps> = ({
  policies,
  decisions,
  auditViolations,
  activeFilter,
  onFilterChange,
}) => {
  // Dynamically calculate metrics from policy and test records
  const stats = useMemo(() => {
    const totalPolicies = policies.length;
    const enforcedPolicies = policies.filter((p) => p.enforcementAction === 'deny').length;
    const totalDecisions = decisions.length;
    const blockedDecisions = decisions.filter((d) => d.decision === 'DENY').length;
    const admittedDecisions = decisions.filter((d) => d.decision === 'ALLOW').length;
    const auditCount = auditViolations.length;
    const enforcementPercent = totalPolicies > 0 ? Math.round((enforcedPolicies / totalPolicies) * 100) : 0;

    return {
      totalPolicies,
      enforcedPolicies,
      enforcementPercent,
      totalDecisions,
      blockedDecisions,
      admittedDecisions,
      auditCount,
    };
  }, [policies, decisions, auditViolations]);

  return (
    <div className="policy-kpi-grid" role="region" aria-label="Policy Summary Metrics">
      {/* 1. Total Configured Policies */}
      <div
        className={`policy-kpi-card ${activeFilter === null ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.(null)}
        role="button"
        tabIndex={0}
      >
        <div className="policy-kpi-header">
          <div className="policy-kpi-icon-wrap total">
            <Sliders size={16} />
          </div>
          <span className="policy-kpi-label">ACTIVE POLICIES</span>
        </div>
        <div className="policy-kpi-body">
          <div className="policy-kpi-number">{stats.totalPolicies}</div>
          <span className="policy-kpi-micro-tag live">OPA GATEKEEPER</span>
        </div>
        <div className="policy-kpi-footer">
          <span>{stats.enforcedPolicies} in strict enforce mode</span>
        </div>
      </div>

      {/* 2. Enforced Constraints */}
      <div
        className={`policy-kpi-card ${activeFilter === 'enforcing' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('enforcing')}
        role="button"
        tabIndex={0}
      >
        <div className="policy-kpi-header">
          <div className="policy-kpi-icon-wrap enforced">
            <ShieldCheck size={16} />
          </div>
          <span className="policy-kpi-label">ENFORCEMENT RATE</span>
        </div>
        <div className="policy-kpi-body">
          <div className="policy-kpi-number">{stats.enforcementPercent}%</div>
          <span className="policy-kpi-micro-tag enforced">100% BLOCKING</span>
        </div>
        <div className="policy-kpi-footer">
          <span>Validating webhook active</span>
        </div>
      </div>

      {/* 3. Blocked Admission Attempts */}
      <div
        className={`policy-kpi-card ${activeFilter === 'blocked' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('blocked')}
        role="button"
        tabIndex={0}
      >
        <div className="policy-kpi-header">
          <div className="policy-kpi-icon-wrap blocked">
            <AlertOctagon size={16} />
          </div>
          <span className="policy-kpi-label">BLOCKED ADMISSIONS</span>
        </div>
        <div className="policy-kpi-body">
          <div className="policy-kpi-number">{stats.blockedDecisions}</div>
          <span className="policy-kpi-micro-tag blocked">TEST EVIDENCE</span>
        </div>
        <div className="policy-kpi-footer">
          <span>{stats.admittedDecisions} compliant workloads allowed</span>
        </div>
      </div>

      {/* 4. Pre-Existing Cluster Audit Violations */}
      <div
        className={`policy-kpi-card ${activeFilter === 'audit' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('audit')}
        role="button"
        tabIndex={0}
      >
        <div className="policy-kpi-header">
          <div className="policy-kpi-icon-wrap audit">
            <ShieldAlert size={16} />
          </div>
          <span className="policy-kpi-label">AUDIT VIOLATIONS</span>
        </div>
        <div className="policy-kpi-body">
          <div className="policy-kpi-number">{stats.auditCount}</div>
          <span className="policy-kpi-micro-tag audit">CLUSTER SCAN</span>
        </div>
        <div className="policy-kpi-footer">
          <span>Flagged in existing testbed</span>
        </div>
      </div>
    </div>
  );
};

