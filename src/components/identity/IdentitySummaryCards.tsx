import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Layers } from 'lucide-react';
import { WorkloadIdentityRecord } from '../../types/identity';

interface IdentitySummaryCardsProps {
  workloads: WorkloadIdentityRecord[];
  onFilterChange?: (status: string | null) => void;
  activeFilter?: string | null;
}

export const IdentitySummaryCards: React.FC<IdentitySummaryCardsProps> = ({
  workloads,
  onFilterChange,
  activeFilter,
}) => {
  // Dynamically derive all statistics from current workloads dataset
  const stats = useMemo(() => {
    const total = workloads.length;
    const verified = workloads.filter((w) => w.status === 'verified').length;
    const attention = workloads.filter((w) => w.status === 'attention_required').length;
    const rejected = workloads.filter((w) => w.status === 'rejected').length;
    const verifiedRate = total > 0 ? Math.round((verified / total) * 100) : 0;

    return { total, verified, attention, rejected, verifiedRate };
  }, [workloads]);

  return (
    <div className="identity-kpi-grid">
      {/* 1. Total Monitored Workloads */}
      <div
        className={`identity-kpi-card ${activeFilter === null ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.(null)}
        role="button"
        tabIndex={0}
        title="View all monitored workloads"
      >
        <div className="identity-kpi-header">
          <div className="identity-kpi-icon-wrap total">
            <Layers size={16} />
          </div>
          <span className="identity-kpi-label">TOTAL WORKLOADS</span>
        </div>
        <div className="identity-kpi-body">
          <div className="identity-kpi-number">{stats.total}</div>
          <span className="identity-kpi-micro-tag lab">K8S TESTBED</span>
        </div>
        <div className="identity-kpi-footer">
          <span>Introspected across 4 namespaces</span>
        </div>
      </div>

      {/* 2. Verified Identities */}
      <div
        className={`identity-kpi-card verified ${activeFilter === 'verified' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('verified')}
        role="button"
        tabIndex={0}
        title="Filter by verified dedicated identities"
      >
        <div className="identity-kpi-header">
          <div className="identity-kpi-icon-wrap verified">
            <ShieldCheck size={16} />
          </div>
          <span className="identity-kpi-label">VERIFIED IDENTITIES</span>
        </div>
        <div className="identity-kpi-body">
          <div className="identity-kpi-number verified">{stats.verified}</div>
          <span className="identity-kpi-micro-tag rate">{stats.verifiedRate}% RATE</span>
        </div>
        <div className="identity-kpi-footer">
          <span>Bound to dedicated ServiceAccounts</span>
        </div>
      </div>

      {/* 3. Attention Required (Identity Drift) */}
      <div
        className={`identity-kpi-card attention ${activeFilter === 'attention_required' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('attention_required')}
        role="button"
        tabIndex={0}
        title="Filter by workloads requiring identity attention"
      >
        <div className="identity-kpi-header">
          <div className="identity-kpi-icon-wrap attention">
            <AlertTriangle size={16} />
          </div>
          <span className="identity-kpi-label">ATTENTION REQUIRED</span>
        </div>
        <div className="identity-kpi-body">
          <div className="identity-kpi-number attention">{stats.attention}</div>
          <span className="identity-kpi-micro-tag drift">DRIFT DETECTED</span>
        </div>
        <div className="identity-kpi-footer">
          <span className="text-amber-400">Uses shared default ServiceAccounts</span>
        </div>
      </div>

      {/* 4. Blocked / Rejected Attestations */}
      <div
        className={`identity-kpi-card rejected ${activeFilter === 'rejected' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('rejected')}
        role="button"
        tabIndex={0}
        title="Filter by blocked untrusted workloads"
      >
        <div className="identity-kpi-header">
          <div className="identity-kpi-icon-wrap rejected">
            <ShieldAlert size={16} />
          </div>
          <span className="identity-kpi-label">BLOCKED ACCESS</span>
        </div>
        <div className="identity-kpi-body">
          <div className="identity-kpi-number rejected">{stats.rejected}</div>
          <span className="identity-kpi-micro-tag blocked">ENFORCED</span>
        </div>
        <div className="identity-kpi-footer">
          <span className="text-rose-400">Untrusted pod ingress attempts</span>
        </div>
      </div>
    </div>
  );
};

