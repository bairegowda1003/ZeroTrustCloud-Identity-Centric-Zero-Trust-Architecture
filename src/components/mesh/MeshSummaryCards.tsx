import React, { useMemo } from 'react';
import { ShieldCheck, Lock, Network, KeyRound, AlertTriangle } from 'lucide-react';
import { SpiffeSvidRecord, MeshServiceRoute, MeshTrafficEvent } from '../../types/mesh';

interface MeshSummaryCardsProps {
  svids: SpiffeSvidRecord[];
  routes: MeshServiceRoute[];
  events: MeshTrafficEvent[];
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

export const MeshSummaryCards: React.FC<MeshSummaryCardsProps> = ({
  svids,
  routes,
  events,
  activeFilter,
  onFilterChange,
}) => {
  const stats = useMemo(() => {
    const totalSvids = svids.length;
    const attestedCount = svids.filter((s) => s.status === 'attested').length;
    const attestationPercent = totalSvids > 0 ? Math.round((attestedCount / totalSvids) * 100) : 0;

    const totalRoutes = routes.length;
    const strictRoutes = routes.filter((r) => r.mtlsMode === 'STRICT').length;
    const allowedRoutes = routes.filter((r) => r.authzStatus === 'ALLOWED').length;

    const blockedEvents = events.filter((e) => e.verdict === 'DENY').length;

    return {
      totalSvids,
      attestedCount,
      attestationPercent,
      totalRoutes,
      strictRoutes,
      allowedRoutes,
      blockedEvents,
    };
  }, [svids, routes, events]);

  return (
    <div className="mesh-kpi-grid" role="region" aria-label="Service Mesh & Attestation Metrics">
      {/* 1. SPIFFE Attested Workloads */}
      <div
        className={`mesh-kpi-card ${activeFilter === null ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.(null)}
        role="button"
        tabIndex={0}
      >
        <div className="mesh-kpi-header">
          <div className="mesh-kpi-icon-wrap spiffe">
            <KeyRound size={16} />
          </div>
          <span className="mesh-kpi-label">SPIFFE ATTESTED</span>
        </div>
        <div className="mesh-kpi-body">
          <div className="mesh-kpi-number">{stats.attestedCount}/{stats.totalSvids}</div>
          <span className="mesh-kpi-micro-tag spiffe">{stats.attestationPercent}% VERIFIED</span>
        </div>
        <div className="mesh-kpi-footer">
          <span>Short-lived X.509 SVIDs</span>
        </div>
      </div>

      {/* 2. STRICT mTLS Coverage */}
      <div
        className={`mesh-kpi-card ${activeFilter === 'mtls' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('mtls')}
        role="button"
        tabIndex={0}
      >
        <div className="mesh-kpi-header">
          <div className="mesh-kpi-icon-wrap mtls">
            <Lock size={16} />
          </div>
          <span className="mesh-kpi-label">STRICT mTLS ROUTES</span>
        </div>
        <div className="mesh-kpi-body">
          <div className="mesh-kpi-number">{stats.strictRoutes}</div>
          <span className="mesh-kpi-micro-tag mtls">ZERO PLAINTEXT</span>
        </div>
        <div className="mesh-kpi-footer">
          <span>PeerAuthentication active</span>
        </div>
      </div>

      {/* 3. Authorized Microsegmentation Routes */}
      <div
        className={`mesh-kpi-card ${activeFilter === 'routes' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('routes')}
        role="button"
        tabIndex={0}
      >
        <div className="mesh-kpi-header">
          <div className="mesh-kpi-icon-wrap routes">
            <Network size={16} />
          </div>
          <span className="mesh-kpi-label">ACTIVE MESH ROUTES</span>
        </div>
        <div className="mesh-kpi-body">
          <div className="mesh-kpi-number">{stats.allowedRoutes}</div>
          <span className="mesh-kpi-micro-tag routes">TLS 1.3 AES-GCM</span>
        </div>
        <div className="mesh-kpi-footer">
          <span>L7 AuthorizationPolicy enforced</span>
        </div>
      </div>

      {/* 4. Blocked Mesh Incursions */}
      <div
        className={`mesh-kpi-card ${activeFilter === 'blocked' ? 'active-card' : ''}`}
        onClick={() => onFilterChange?.('blocked')}
        role="button"
        tabIndex={0}
      >
        <div className="mesh-kpi-header">
          <div className="mesh-kpi-icon-wrap blocked">
            <AlertTriangle size={16} />
          </div>
          <span className="mesh-kpi-label">BLOCKED INCURSIONS</span>
        </div>
        <div className="mesh-kpi-body">
          <div className="mesh-kpi-number">{stats.blockedEvents}</div>
          <span className="mesh-kpi-micro-tag blocked">RBAC & TCP DROPS</span>
        </div>
        <div className="mesh-kpi-footer">
          <span>Plaintext & unverified callers</span>
        </div>
      </div>
    </div>
  );
};

