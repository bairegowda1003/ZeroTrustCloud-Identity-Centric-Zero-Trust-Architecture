import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Network,
  Activity,
  FileCode,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  SPIRE_CONTROL_PLANE_INFO,
  ISTIO_CONTROL_PLANE_INFO,
  SPIFFE_SVID_RECORDS,
  MESH_SERVICE_ROUTES,
  MESH_TRAFFIC_EVENTS,
} from '../../data/demoMesh';
import { SpiffeSvidRecord } from '../../types/mesh';
import { MeshSummaryCards } from './MeshSummaryCards';
import { TrustConduitHero } from './TrustConduitHero';
import { ServiceMeshMatrix } from './ServiceMeshMatrix';
import { SpiffeSvidInspectorDrawer } from './SpiffeSvidInspectorDrawer';
import { MeshTrafficStream } from './MeshTrafficStream';

interface TrustArchitectureViewProps {
  onNavigateToFinding?: (findingId: string) => void;
}

export const TrustArchitectureView: React.FC<TrustArchitectureViewProps> = ({
  onNavigateToFinding,
}) => {
  const [svids] = useState<SpiffeSvidRecord[]>(SPIFFE_SVID_RECORDS);
  const [routes] = useState(MESH_SERVICE_ROUTES);
  const [events] = useState(MESH_TRAFFIC_EVENTS);

  const [activeTab, setActiveTab] = useState<'routes' | 'traffic' | 'spiffe'>('routes');
  const [selectedSvid, setSelectedSvid] = useState<SpiffeSvidRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleInspectSvid = (svid: SpiffeSvidRecord) => {
    setSelectedSvid(svid);
    setIsDrawerOpen(true);
  };

  const handleSyncMesh = () => {
    setIsSyncing(true);
    setSyncNotice(null);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncNotice('Standalone evaluation: SPIRE SVID inventory & Istio STRICT mTLS baseline verified.');
      setTimeout(() => setSyncNotice(null), 4000);
    }, 700);
  };

  return (
    <div className="trust-architecture-container">
      {/* 1. Official Domain Header */}
      <div className="domain-page-header">
        <div className="domain-header-left">
          <div className="domain-title-row">
            <div className="domain-icon-squircle mesh" aria-hidden="true">
              <Network size={18} />
            </div>
            <h1 className="domain-page-title">Trust Architecture & Service Mesh</h1>
            <span className="domain-live-badge mesh">
              <span className="live-pip cyan" />
              STRICT mTLS Active
            </span>
          </div>
          <div className="domain-meta-subrow">
            <span className="domain-meta-crumb">
              Attestor: <strong>SPIRE {SPIRE_CONTROL_PLANE_INFO.version}</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Data Plane: <strong>Istio {ISTIO_CONTROL_PLANE_INFO.version} ({ISTIO_CONTROL_PLANE_INFO.activeSidecars} Sidecars)</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Domain: <strong>{SPIRE_CONTROL_PLANE_INFO.trustDomain}</strong>
            </span>
          </div>
        </div>

        <div className="domain-header-right">
          <button
            className={`domain-action-btn ${isSyncing ? 'syncing' : ''}`}
            onClick={handleSyncMesh}
            disabled={isSyncing}
            title="Verify SPIRE Server & Istio mutual TLS status"
          >
            <RefreshCw size={13} className={isSyncing ? 'spin-icon' : ''} />
            <span>{isSyncing ? 'Negotiating mTLS...' : 'Sync Mesh & SVIDs'}</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="sync-notice-banner animate-fade-in">
          <CheckCircle2 size={15} />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* 2. Dynamic Summary Cards */}
      <MeshSummaryCards
        svids={svids}
        routes={routes}
        events={events}
        activeFilter={activeTab === 'traffic' ? 'blocked' : activeTab === 'spiffe' ? null : 'mtls'}
        onFilterChange={(filter) => {
          if (filter === 'blocked') setActiveTab('traffic');
          else if (filter === null) setActiveTab('spiffe');
          else setActiveTab('routes');
        }}
      />

      {/* 3. Interactive Visual Trust Conduit Flow */}
      <TrustConduitHero />

      {/* 4. Subview Tabs Switcher */}
      <div className="mesh-subview-nav" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'routes'}
          className={`subview-tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          <Network size={15} />
          <span>Service Mesh Paths ({routes.length})</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'traffic'}
          className={`subview-tab-btn ${activeTab === 'traffic' ? 'active' : ''}`}
          onClick={() => setActiveTab('traffic')}
        >
          <Activity size={15} />
          <span>Live Traffic Stream ({events.length})</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'spiffe'}
          className={`subview-tab-btn ${activeTab === 'spiffe' ? 'active' : ''}`}
          onClick={() => setActiveTab('spiffe')}
        >
          <KeyRound size={15} />
          <span>SPIFFE Workload SVIDs ({svids.length})</span>
        </button>
      </div>

      {/* 5. Subview Content Area */}
      <div className="mesh-subview-content">
        {activeTab === 'routes' && (
          <ServiceMeshMatrix
            routes={routes}
            onNavigateToFinding={onNavigateToFinding}
          />
        )}

        {activeTab === 'traffic' && (
          <MeshTrafficStream
            events={events}
            onNavigateToFinding={onNavigateToFinding}
          />
        )}

        {activeTab === 'spiffe' && (
          <div className="spiffe-svids-table-wrapper">
            <div className="spiffe-table-header">
              <div className="header-left">
                <span className="section-title">Registered Workload SVID Identities</span>
                <span className="section-sub">Issued over SPIFFE Workload API Unix Socket</span>
              </div>
              <span className="domain-pill">Domain: {SPIRE_CONTROL_PLANE_INFO.trustDomain}</span>
            </div>
            <div className="spiffe-table-container">
              <table className="spiffe-table">
                <thead>
                  <tr>
                    <th>Workload</th>
                    <th>Namespace</th>
                    <th>SPIFFE ID (SAN URI)</th>
                    <th>Certificate Serial</th>
                    <th>Attestation Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {svids.map((s) => {
                    const isAttested = s.status === 'attested';
                    return (
                      <tr key={s.workloadId} className="spiffe-row">
                        <td className="cell-workload">
                          <code className="workload-code">{s.workloadName}</code>
                        </td>
                        <td className="cell-ns">
                          <span className={`namespace-badge ns-${s.namespace}`}>{s.namespace}</span>
                        </td>
                        <td className="cell-spiffeid">
                          <span className="spiffe-id-text">{s.spiffeId}</span>
                        </td>
                        <td className="cell-serial">
                          <code className="serial-code">{s.serialNumber}</code>
                        </td>
                        <td className="cell-status">
                          <span className={`status-pill ${isAttested ? 'verified' : 'rejected'}`}>
                            {isAttested ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                            <span>{isAttested ? 'Attested SVID' : 'Unattested'}</span>
                          </span>
                        </td>
                        <td className="cell-action text-right">
                          <button
                            className="inspect-svid-btn"
                            onClick={() => handleInspectSvid(s)}
                            aria-label={`Inspect ${s.workloadName} SVID`}
                          >
                            <span>Inspect SVID</span>
                            <ArrowRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 6. Spiffe SVID Inspector Drawer */}
      <SpiffeSvidInspectorDrawer
        svid={selectedSvid}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigateToFinding={onNavigateToFinding}
      />
    </div>
  );
};

