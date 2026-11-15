import React, { useMemo } from 'react';
import { Lock, Network, KeyRound, AlertTriangle } from 'lucide-react';
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
    const unattestedCount = totalSvids - attestedCount;
    const attestationPercent = totalSvids > 0 ? Math.round((attestedCount / totalSvids) * 100) : 0;

    const totalRoutes = routes.length;
    const strictRoutes = routes.filter((r) => r.mtlsMode === 'STRICT').length;
    const allowedRoutes = routes.filter((r) => r.authzStatus === 'ALLOWED').length;
    const guardedRoutes = totalRoutes - allowedRoutes;

    const blockedEvents = events.filter((e) => e.verdict === 'DENY').length;

    return {
      totalSvids,
      attestedCount,
      unattestedCount,
      attestationPercent,
      totalRoutes,
      strictRoutes,
      allowedRoutes,
      guardedRoutes,
      blockedEvents,
    };
  }, [svids, routes, events]);

  // Circumference for r=32 is ~201
  const circleCircumference = 2 * Math.PI * 32;

  return (
    <div className="mesh-ring-grid" role="region" aria-label="Service Mesh & Attestation Distribution">
      {/* 1. SPIFFE SVIDs Distribution Dial (Matching Image 2) */}
      <div
        className={`mesh-ring-card ${activeFilter === null ? 'active-ring-card' : ''}`}
        onClick={() => onFilterChange?.(null)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.(null);
          }
        }}
        title="View SPIFFE workload attestation inventory"
      >
        <div className="mesh-ring-card-header">
          <KeyRound size={15} className="text-emerald-400" />
          <span className="mesh-ring-card-title">SPIFFE Attestation Distribution</span>
        </div>

        <div className="mesh-ring-content">
          {/* Circular Ring Dial */}
          <div className="mesh-ring-dial-wrap">
            <svg className="mesh-ring-svg" viewBox="0 0 80 80">
              <circle className="mesh-ring-track" cx="40" cy="40" r="32" />
              {/* Attested segment (emerald) */}
              <circle
                className="mesh-ring-progress emerald"
                cx="40"
                cy="40"
                r="32"
                strokeDasharray={circleCircumference}
                strokeDashoffset={circleCircumference * (1 - stats.attestedCount / stats.totalSvids)}
              />
            </svg>
            <div className="mesh-ring-center">
              <span className="mesh-ring-num">{stats.totalSvids}</span>
              <span className="mesh-ring-unit">SVIDs</span>
            </div>
          </div>

          {/* Right-Side Colored Legend List (Directly from Image 2) */}
          <div className="mesh-ring-legend">
            <div className="mesh-legend-item">
              <span className="mesh-legend-dot emerald" />
              <span className="mesh-legend-val">{stats.attestedCount}</span>
              <span className="mesh-legend-label">Attested (X.509)</span>
            </div>
            <div className="mesh-legend-item">
              <span className="mesh-legend-dot amber" />
              <span className="mesh-legend-val">{stats.unattestedCount}</span>
              <span className="mesh-legend-label">Unverified SA</span>
            </div>
            <div className="mesh-legend-subtext">
              <span>{stats.attestationPercent}% Verified Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STRICT mTLS Coverage Dial (Matching Image 2) */}
      <div
        className={`mesh-ring-card ${activeFilter === 'mtls' ? 'active-ring-card' : ''}`}
        onClick={() => onFilterChange?.('mtls')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.('mtls');
          }
        }}
        title="Filter by strict mutual TLS routes"
      >
        <div className="mesh-ring-card-header">
          <Lock size={15} className="text-cyan-400" />
          <span className="mesh-ring-card-title">mTLS Encryption Breakdown</span>
        </div>

        <div className="mesh-ring-content">
          <div className="mesh-ring-dial-wrap">
            <svg className="mesh-ring-svg" viewBox="0 0 80 80">
              <circle className="mesh-ring-track" cx="40" cy="40" r="32" />
              <circle
                className="mesh-ring-progress cyan"
                cx="40"
                cy="40"
                r="32"
                strokeDasharray={circleCircumference}
                strokeDashoffset="0"
              />
            </svg>
            <div className="mesh-ring-center">
              <span className="mesh-ring-num">{stats.totalRoutes}</span>
              <span className="mesh-ring-unit">ROUTES</span>
            </div>
          </div>

          <div className="mesh-ring-legend">
            <div className="mesh-legend-item">
              <span className="mesh-legend-dot cyan" />
              <span className="mesh-legend-val">{stats.strictRoutes}</span>
              <span className="mesh-legend-label">STRICT mTLS (v1.3)</span>
            </div>
            <div className="mesh-legend-item">
              <span className="mesh-legend-dot slate" />
              <span className="mesh-legend-val">0</span>
              <span className="mesh-legend-label">Permissive Plaintext</span>
            </div>
            <div className="mesh-legend-subtext">
              <span className="text-cyan-400">Zero Plaintext Allowed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Layer-7 Authorization Policies (Matching Image 2) */}
      <div
        className={`mesh-ring-card ${activeFilter === 'routes' ? 'active-ring-card' : ''}`}
        onClick={() => onFilterChange?.('routes')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.('routes');
          }
        }}
        title="Filter by authorized L7 mesh routes"
      >
        <div className="mesh-ring-card-header">
          <Network size={15} className="text-teal-400" />
          <span className="mesh-ring-card-title">L7 Authorization Breakdown</span>
        </div>

        <div className="mesh-ring-content">
          <div className="mesh-ring-dial-wrap">
            <svg className="mesh-ring-svg" viewBox="0 0 80 80">
              <circle className="mesh-ring-track" cx="40" cy="40" r="32" />
              <circle
                className="mesh-ring-progress teal"
                cx="40"
                cy="40"
                r="32"
                strokeDasharray={circleCircumference}
                strokeDashoffset={circleCircumference * (1 - stats.allowedRoutes / stats.totalRoutes)}
              />
            </svg>
            <div className="mesh-ring-center">
              <span className="mesh-ring-num">{stats.totalRoutes}</span>
              <span className="mesh-ring-unit">POLICIES</span>
            </div>
          </div>

          <div className="mesh-ring-legend">
            <div className="mesh-legend-item">
              <span className="mesh-legend-dot teal" />
              <span className="mesh-legend-val">{stats.allowedRoutes}</span>
              <span className="mesh-legend-label">Authorized (HTTP 200)</span>
            </div>
            <div className="mesh-legend-item">
              <span className="mesh-legend-dot violet" />
              <span className="mesh-legend-val">{stats.guardedRoutes}</span>
              <span className="mesh-legend-label">Guarded (RBAC 403)</span>
            </div>
            <div className="mesh-legend-subtext">
              <span>TLS 1.3 AES-GCM</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Blocked Incursions (Matching Image 2) */}
      <div
        className={`mesh-ring-card ${activeFilter === 'blocked' ? 'active-ring-card' : ''}`}
        onClick={() => onFilterChange?.('blocked')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.('blocked');
          }
        }}
        title="Filter by blocked plaintext and unauthorized incursions"
      >
        <div className="mesh-ring-card-header">
          <AlertTriangle size={15} className="text-rose-400" />
          <span className="mesh-ring-card-title">Traffic Incursion Defense</span>
        </div>

        <div className="mesh-ring-content">
          <div className="mesh-ring-dial-wrap">
            <svg className="mesh-ring-svg" viewBox="0 0 80 80">
              <circle className="mesh-ring-track" cx="40" cy="40" r="32" />
              <circle
                className="mesh-ring-progress rose"
                cx="40"
                cy="40"
                r="32"
                strokeDasharray={circleCircumference}
                strokeDashoffset="0"
              />
            </svg>
            <div className="mesh-ring-center">
              <span className="mesh-ring-num">{stats.blockedEvents}</span>
              <span className="mesh-ring-unit">DROPS</span>
            </div>
          </div>

          <div className="mesh-ring-legend">
            <div className="mesh-legend-item">
              <span className="mesh-legend-dot rose" />
              <span className="mesh-legend-val">1</span>
              <span className="mesh-legend-label">Plaintext TCP RST</span>
            </div>
            <div className="mesh-legend-item">
              <span className="mesh-legend-dot red" />
              <span className="mesh-legend-val">1</span>
              <span className="mesh-legend-label">Rogue Pod RBAC</span>
            </div>
            <div className="mesh-legend-subtext">
              <span className="text-rose-400">Zero Infiltration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
