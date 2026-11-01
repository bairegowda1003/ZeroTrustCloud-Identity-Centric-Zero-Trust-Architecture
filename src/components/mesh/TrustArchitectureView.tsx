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
      setSyncNotice('SPIRE Server & Istio control plane synchronized. SVIDs auto-rotated; STRICT mTLS active.');
      setTimeout(() => setSyncNotice(null), 4000);
    }, 700);
  };

  return (
    <div className="trust-architecture-container">
      {/* 1. Control Plane Status Banner */}
      <div className="mesh-engine-banner">
        <div className="engine-banner-left">
          <div className="mesh-badges-row">
            <span className="mesh-badge spire">
              <KeyRound size={12} />
              <span>SPIRE {SPIRE_CONTROL_PLANE_INFO.version}</span>
            </span>
            <span className="mesh-badge istio">
              <Lock size={12} />
              <span>ISTIO {ISTIO_CONTROL_PLANE_INFO.version} (STRICT mTLS)</span>
            </span>
          </div>
          <div className="engine-banner-copy">
            <h1 className="engine-banner-title">Trust Architecture & Service Mesh</h1>
            <p className="engine-banner-subtitle">
              Cryptographic workload attestation and mutual TLS encryption. Short-lived X.509 SVIDs, SPIFFE identity domain, and Envoy Layer 7 authorization policies.
            </p>
          </div>
        </div>

        <div className="engine-banner-right">
          <div className="engine-meta-pills">
            <span className="meta-pill">
              <strong>Trust Domain:</strong> {SPIRE_CONTROL_PLANE_INFO.trustDomain}
            </span>
            <span className="meta-pill">
              <strong>mTLS Mode:</strong> {ISTIO_CONTROL_PLANE_INFO.mtlsMode}
            </span>
            <span className="meta-pill">
              <strong>Sidecars:</strong> {ISTIO_CONTROL_PLANE_INFO.activeSidecars} Active
            </span>
          </div>

          <button
            className={`sync-engine-btn ${isSyncing ? 'syncing' : ''}`}
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

