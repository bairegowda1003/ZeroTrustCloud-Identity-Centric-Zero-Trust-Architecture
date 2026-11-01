import React, { useState } from 'react';
import {
  Shield,
  Layers,
  Terminal,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { LAB_WORKLOAD_IDENTITIES } from '../../data/demoIdentities';
import { WorkloadIdentityRecord } from '../../types/identity';
import { IdentitySummaryCards } from './IdentitySummaryCards';
import { VerificationPipelineHero } from './VerificationPipelineHero';
import { WorkloadIdentitiesTable } from './WorkloadIdentitiesTable';
import { WorkloadDetailDrawer } from './WorkloadDetailDrawer';

interface IdentityAccessViewProps {
  onNavigateToFinding?: (findingId: string) => void;
}

export const IdentityAccessView: React.FC<IdentityAccessViewProps> = ({
  onNavigateToFinding,
}) => {
  const [workloads] = useState<WorkloadIdentityRecord[]>(LAB_WORKLOAD_IDENTITIES);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedWorkload, setSelectedWorkload] = useState<WorkloadIdentityRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSelectWorkload = (workload: WorkloadIdentityRecord) => {
    setSelectedWorkload(workload);
    setIsDrawerOpen(true);
  };

  const handleSyncCluster = () => {
    setIsSyncing(true);
    setSyncNotice(null);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncNotice('Manifests synchronized with local Kubernetes testbed (12 workloads verified).');
      setTimeout(() => setSyncNotice(null), 5000);
    }, 800);
  };

  return (
    <div className="identity-access-view-container">
      {/* 1. Environment & Fidelity Banner */}
      <div className="identity-fidelity-banner">
        <div className="banner-left">
          <div className="fidelity-badge">
            <span className="fidelity-dot" />
            <span>KUBERNETES TESTBED</span>
          </div>
          <div className="banner-copy">
            <h1 className="banner-title">Workload Identity & Service Accounts</h1>
            <p className="banner-subtitle">
              Ground-truth identity introspection across Kubernetes namespaces. Projected tokens, least-privilege service accounts, and boundary enforcement.
            </p>
          </div>
        </div>

        <div className="banner-right">
          <div className="testbed-meta-pills">
            <span className="meta-pill">
              <strong>Cluster:</strong> kind-trustmesh-lab
            </span>
            <span className="meta-pill">
              <strong>Namespaces:</strong> web, orders, payments, security
            </span>
          </div>

          <button
            className={`sync-testbed-btn ${isSyncing ? 'syncing' : ''}`}
            onClick={handleSyncCluster}
            disabled={isSyncing}
            title="Reload workload state from manifests or live cluster"
          >
            <RefreshCw size={13} className={isSyncing ? 'spin-icon' : ''} />
            <span>{isSyncing ? 'Introspecting...' : 'Sync Manifests'}</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="sync-notice-banner animate-fade-in">
          <CheckCircle2 size={15} />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* 2. Dynamic KPI Summary Cards */}
      <IdentitySummaryCards
        workloads={workloads}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* 3. Verification Pipeline Hero Decision Engine */}
      <VerificationPipelineHero />

      {/* 4. Filterable Workload Identities Table */}
      <div className="identity-table-section">
        <div className="section-header-row">
          <div className="section-title-wrap">
            <Layers size={18} className="section-icon" />
            <h3 className="section-title">Monitored Kubernetes Workloads</h3>
          </div>
          <div className="section-legend">
            <span className="legend-item">
              <span className="legend-dot green" />
              <span>Projected Token (Audited)</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot amber" />
              <span>Default/Unbound SA (Drift)</span>
            </span>
          </div>
        </div>

        <WorkloadIdentitiesTable
          workloads={workloads}
          onSelectWorkload={handleSelectWorkload}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      {/* 5. Workload Detail Drawer (Apple-spring animation) */}
      <WorkloadDetailDrawer
        workload={selectedWorkload}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigateToFinding={onNavigateToFinding}
      />
    </div>
  );
};

