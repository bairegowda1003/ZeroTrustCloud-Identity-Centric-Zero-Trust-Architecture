import React, { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, Sliders, AlertOctagon, CheckCircle2 } from 'lucide-react';
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

    const criticalViolations = auditViolations.filter((v) => v.severity === 'critical').length;
    const highViolations = auditViolations.filter((v) => v.severity === 'high').length;
    const mediumViolations = auditViolations.filter((v) => v.severity === 'medium').length;

    return {
      totalPolicies,
      enforcedPolicies,
      enforcementPercent,
      totalDecisions,
      blockedDecisions,
      admittedDecisions,
      auditCount,
      criticalViolations,
      highViolations,
      mediumViolations,
    };
  }, [policies, decisions, auditViolations]);

  return (
    <div className="policy-status-board" role="region" aria-label="Policy & Admission Status Board">
      {/* 1. Policy Inventory & Enforcement Wing */}
      <div
        className={`policy-board-panel policy-panel-inventory ${activeFilter === null ? 'active-panel' : ''}`}
        onClick={() => onFilterChange?.(null)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.(null);
          }
        }}
        title="View OPA Gatekeeper policy inventory"
      >
        <div className="policy-panel-header">
          <div className="policy-panel-title-wrap">
            <Sliders size={16} className="text-cyan-400" />
            <span className="policy-panel-title">ACTIVE POLICIES</span>
          </div>
          <span className="policy-panel-badge live">OPA GATEKEEPER</span>
        </div>
        <div className="policy-panel-metric-row">
          <div className="policy-panel-val">{stats.totalPolicies}</div>
          <div className="policy-panel-sub-metric">
            <span className="rate-num text-emerald-400">{stats.enforcementPercent}%</span>
            <span className="rate-label">ENFORCED</span>
          </div>
        </div>
        <div className="policy-panel-footer">
          <span>{stats.enforcedPolicies} strict deny constraints active</span>
        </div>
      </div>

      {/* 2. Violations Status Board with Vertical Severity Columns (Matching Reference Image 3) */}
      <div
        className={`policy-board-panel policy-panel-violations ${activeFilter === 'audit' ? 'active-panel' : ''}`}
        onClick={() => onFilterChange?.('audit')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.('audit');
          }
        }}
        title="View pre-existing cluster audit violations"
      >
        <div className="policy-panel-header">
          <div className="policy-panel-title-wrap">
            <ShieldAlert size={16} className="text-amber-400" />
            <span className="policy-panel-title">AUDIT VIOLATIONS STATUS</span>
          </div>
          <span className="policy-panel-badge audit">{stats.auditCount} Flagged</span>
        </div>

        {/* Vertical Severity Histogram Columns (Direct Reference from Image 3) */}
        <div className="policy-severity-bars-row">
          {/* Critical Bar */}
          <div className="policy-severity-col">
            <div className="severity-bar-track">
              <div
                className="severity-bar-fill critical"
                style={{ height: stats.criticalViolations > 0 ? '75%' : '10%' }}
              />
            </div>
            <span className="severity-badge critical">Critical</span>
            <span className="severity-count">{stats.criticalViolations} Active</span>
            <span className="severity-status overdue">Overdue</span>
          </div>

          {/* High Bar */}
          <div className="policy-severity-col">
            <div className="severity-bar-track">
              <div
                className="severity-bar-fill high"
                style={{ height: stats.highViolations > 0 ? '55%' : '10%' }}
              />
            </div>
            <span className="severity-badge high">High</span>
            <span className="severity-count">{stats.highViolations} Active</span>
            <span className="severity-status overdue">Overdue</span>
          </div>

          {/* Medium Bar */}
          <div className="policy-severity-col">
            <div className="severity-bar-track">
              <div
                className="severity-bar-fill medium"
                style={{ height: stats.mediumViolations > 0 ? '40%' : '10%' }}
              />
            </div>
            <span className="severity-badge medium">Medium</span>
            <span className="severity-count">{stats.mediumViolations} Active</span>
            <span className="severity-status overdue">Overdue</span>
          </div>

          {/* Low Bar */}
          <div className="policy-severity-col">
            <div className="severity-bar-track">
              <div className="severity-bar-fill low" style={{ height: '15%' }} />
            </div>
            <span className="severity-badge low">Low</span>
            <span className="severity-count">0 Active</span>
            <span className="severity-status compliant">Clean</span>
          </div>
        </div>
      </div>

      {/* 3. Admission Webhook Decisions (Matching Image 3 Right-Side Panel) */}
      <div
        className={`policy-board-panel policy-panel-decisions ${activeFilter === 'blocked' ? 'active-panel' : ''}`}
        onClick={() => onFilterChange?.('blocked')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.('blocked');
          }
        }}
        title="View admission webhook blocked vs allowed decisions"
      >
        <div className="policy-panel-header">
          <div className="policy-panel-title-wrap">
            <AlertOctagon size={16} className="text-rose-400" />
            <span className="policy-panel-title">ADMISSION WEBHOOK</span>
          </div>
          <span className="policy-panel-badge blocked">FAIL-CLOSED</span>
        </div>

        <div className="policy-decisions-list">
          <div className="decision-status-box blocked">
            <div className="decision-status-label">
              <span className="status-indicator blocked" />
              <span>Blocked Admissions</span>
            </div>
            <span className="decision-status-num text-rose-400">{stats.blockedDecisions}</span>
          </div>

          <div className="decision-status-box allowed">
            <div className="decision-status-label">
              <span className="status-indicator allowed" />
              <span>Compliant Allowed</span>
            </div>
            <span className="decision-status-num text-emerald-400">{stats.admittedDecisions}</span>
          </div>
        </div>

        <div className="policy-panel-footer">
          <span>Validating webhook intercepting requests</span>
        </div>
      </div>
    </div>
  );
};

