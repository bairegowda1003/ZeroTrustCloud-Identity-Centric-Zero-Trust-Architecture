import React, { useState } from 'react';
import {
  User,
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

  const handleSyncCluster = () => { setSyncNotice('No cluster connected. These workloads are illustrative fixtures.'); };

  return (
    <div className="identity-access-view-container">
      {/* 1. Official Domain Header */}
      <div className="domain-page-header">
        <div className="domain-header-left">
          <div className="domain-title-row">
            <div className="domain-icon-squircle identity" aria-hidden="true">
              <User size={18} />
            </div>
            <h1 className="domain-page-title">Workload Identity & Service Accounts</h1>
            <span className="domain-live-badge identity">
              <span className="live-pip cyan" />
              DEMO INVENTORY
            </span>
          </div>
          <div className="domain-meta-subrow">
            <span className="domain-meta-crumb">
              Cluster: <strong>kind-trustmesh-lab</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Namespaces: <strong>web, orders, payments, security</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Inventory: <strong>Illustrative workloads</strong>
            </span>
          </div>
        </div>

        <div className="domain-header-right">
          <button
            className={`domain-action-btn ${isSyncing ? 'syncing' : ''}`}
            onClick={handleSyncCluster}
            disabled={isSyncing}
            title="Reload workload state from manifests or live cluster"
          >
            <RefreshCw size={13} className={isSyncing ? 'spin-icon' : ''} />
            <span>{isSyncing ? 'Introspecting...' : 'Connection status'}</span>
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

