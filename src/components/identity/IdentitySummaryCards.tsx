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
    <div className="identity-kpi-grid" role="region" aria-label="Workload Identity Metrics">
      {/* Central Single Identity Fidelity Dial (Clean, no extra outer rings) */}
      <div className="identity-center-dial" aria-label="Identity Fidelity Core">
        <svg className="aperture-svg" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="identityFidelityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <circle className="aperture-track" cx="50" cy="50" r="38" />
          <circle
            className="aperture-progress"
            cx="50"
            cy="50"
            r="38"
            strokeDasharray={2 * Math.PI * 38}
            strokeDashoffset={2 * Math.PI * 38 * (1 - stats.verifiedRate / 100)}
          />
        </svg>
        <div className="aperture-inner">
          <span className="aperture-rate">{stats.verifiedRate}%</span>
          <span className="aperture-title">FIDELITY</span>
          <span className="aperture-meta">{stats.verified}/{stats.total} Bound</span>
        </div>
      </div>

      {/* 1. Total Monitored Workloads (Top-Left Box) */}
      <div
        className={`identity-kpi-card card-top-left ${activeFilter === null ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.(null)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.(null);
          }
        }}
        title="View all monitored workloads"
      >
        <div className="identity-kpi-header">
          <div className="identity-kpi-icon-wrap total">
            <Layers size={17} />
          </div>
          <div className="identity-kpi-title-col">
            <span className="identity-kpi-label">TOTAL WORKLOADS</span>
            <span className="identity-kpi-meta-sub">Ground-truth cluster inventory</span>
          </div>
          <span className="identity-kpi-micro-tag lab">K8S TESTBED</span>
        </div>
        <div className="identity-kpi-body">
          <div className="identity-kpi-number">{stats.total}</div>
          <div className="identity-kpi-bar-wrap">
            <div className="identity-kpi-bar-fill total" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="identity-kpi-footer">
          <span>Introspected across 4 namespaces</span>
          <span className="identity-kpi-status-tag">100% Monitored</span>
        </div>
      </div>

      {/* 2. Verified Identities (Top-Right Box) */}
      <div
        className={`identity-kpi-card card-top-right verified ${activeFilter === 'verified' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('verified')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.('verified');
          }
        }}
        title="Filter by verified dedicated identities"
      >
        <div className="identity-kpi-header">
          <div className="identity-kpi-icon-wrap verified">
            <ShieldCheck size={17} />
          </div>
          <div className="identity-kpi-title-col">
            <span className="identity-kpi-label">VERIFIED IDENTITIES</span>
            <span className="identity-kpi-meta-sub">Projected ServiceAccount tokens</span>
          </div>
          <span className="identity-kpi-micro-tag rate">{stats.verifiedRate}% RATE</span>
        </div>
        <div className="identity-kpi-body">
          <div className="identity-kpi-number verified">{stats.verified}</div>
          <div className="identity-kpi-bar-wrap">
            <div className="identity-kpi-bar-fill verified" style={{ width: `${stats.verifiedRate}%` }} />
          </div>
        </div>
        <div className="identity-kpi-footer">
          <span>Bound to dedicated ServiceAccounts</span>
          <span className="identity-kpi-status-tag verified">Compliant</span>
        </div>
      </div>

      {/* 3. Attention Required - Identity Drift (Bottom-Left Box) */}
      <div
        className={`identity-kpi-card card-bottom-left attention ${activeFilter === 'attention_required' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('attention_required')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.('attention_required');
          }
        }}
        title="Filter by workloads requiring identity attention"
      >
        <div className="identity-kpi-header">
          <div className="identity-kpi-icon-wrap attention">
            <AlertTriangle size={17} />
          </div>
          <div className="identity-kpi-title-col">
            <span className="identity-kpi-label">ATTENTION REQUIRED</span>
            <span className="identity-kpi-meta-sub">Identity drift / unverified tokens</span>
          </div>
          <span className="identity-kpi-micro-tag drift">DRIFT DETECTED</span>
        </div>
        <div className="identity-kpi-body">
          <div className="identity-kpi-number attention">{stats.attention}</div>
          <div className="identity-kpi-bar-wrap">
            <div className="identity-kpi-bar-fill attention" style={{ width: `${stats.total > 0 ? (stats.attention / stats.total) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="identity-kpi-footer">
          <span className="text-amber-400">Uses shared default ServiceAccounts</span>
          <span className="identity-kpi-status-tag attention">Action Needed</span>
        </div>
      </div>

      {/* 4. Blocked Access (Bottom-Right Box) */}
      <div
        className={`identity-kpi-card card-bottom-right rejected ${activeFilter === 'rejected' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('rejected')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.('rejected');
          }
        }}
        title="Filter by blocked untrusted workloads"
      >
        <div className="identity-kpi-header">
          <div className="identity-kpi-icon-wrap rejected">
            <ShieldAlert size={17} />
          </div>
          <div className="identity-kpi-title-col">
            <span className="identity-kpi-label">BLOCKED ACCESS</span>
            <span className="identity-kpi-meta-sub">Zero-Trust boundary violations</span>
          </div>
          <span className="identity-kpi-micro-tag blocked">ENFORCED</span>
        </div>
        <div className="identity-kpi-body">
          <div className="identity-kpi-number rejected">{stats.rejected}</div>
          <div className="identity-kpi-bar-wrap">
            <div className="identity-kpi-bar-fill rejected" style={{ width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="identity-kpi-footer">
          <span className="text-rose-400">Untrusted pod ingress attempts</span>
          <span className="identity-kpi-status-tag rejected">Quarantined</span>
        </div>
      </div>
    </div>
  );
};
