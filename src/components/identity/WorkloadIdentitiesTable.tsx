import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Server,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { WorkloadIdentityRecord } from '../../types/identity';

interface WorkloadIdentitiesTableProps {
  workloads: WorkloadIdentityRecord[];
  onSelectWorkload: (workload: WorkloadIdentityRecord) => void;
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
}

export const WorkloadIdentitiesTable: React.FC<WorkloadIdentitiesTableProps> = ({
  workloads,
  onSelectWorkload,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');

  // Compute unique namespaces dynamically from workloads
  const namespaces = useMemo(() => {
    const set = new Set<string>();
    workloads.forEach((w) => set.add(w.namespace));
    return ['all', ...Array.from(set)];
  }, [workloads]);

  // Filter workloads based on search, namespace, and status
  const filteredWorkloads = useMemo(() => {
    return workloads.filter((w) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.serviceAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.namespace.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.workloadType.toLowerCase().includes(searchTerm.toLowerCase());

      // Namespace filter
      const matchesNamespace =
        selectedNamespace === 'all' || w.namespace === selectedNamespace;

      // Status filter
      const matchesStatus =
        !statusFilter || w.status === statusFilter;

      return matchesSearch && matchesNamespace && matchesStatus;
    });
  }, [workloads, searchTerm, selectedNamespace, statusFilter]);

  return (
    <div className="workload-table-wrapper">
      {/* Table Toolbar: Search + Namespace + Status Filter */}
      <div className="workload-toolbar">
        <div className="toolbar-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search by workload, ServiceAccount, or namespace..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Namespace Pills */}
        <div className="toolbar-namespace-pills" role="tablist" aria-label="Namespace Filters">
          <span className="namespace-label">
            <Layers size={13} />
            <span>NS:</span>
          </span>
          {namespaces.map((ns) => (
            <button
              key={ns}
              role="tab"
              aria-selected={selectedNamespace === ns}
              className={`namespace-pill ${selectedNamespace === ns ? 'active' : ''}`}
              onClick={() => setSelectedNamespace(ns)}
            >
              {ns}
            </button>
          ))}
        </div>

        {/* Status Quick Reset */}
        {statusFilter && (
          <div className="toolbar-status-filter-badge">
            <span>Filtered by: <strong>{statusFilter.replace('_', ' ')}</strong></span>
            <button
              className="filter-reset-btn"
              onClick={() => onStatusFilterChange(null)}
              title="Reset status filter"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="workload-table-container">
        <table className="workload-table" aria-label="Kubernetes Workload Identities">
          <thead>
            <tr>
              <th scope="col">Workload & Kind</th>
              <th scope="col">Namespace</th>
              <th scope="col">Service Account & Auth</th>
              <th scope="col">Verification Status</th>
              <th scope="col">Microsegmentation Boundary</th>
              <th scope="col" className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkloads.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty-row">
                  <div className="empty-message-box">
                    <Filter size={24} />
                    <h4>No Workload Identities Match</h4>
                    <p>Adjust your search query or reset status/namespace filters to view workloads.</p>
                    <button
                      className="reset-all-filters-btn"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedNamespace('all');
                        onStatusFilterChange(null);
                      }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredWorkloads.map((w) => {
                const isVerified = w.status === 'verified';
                const isAttention = w.status === 'attention_required';
                const isRejected = w.status === 'rejected';

                return (
                  <tr
                    key={w.id}
                    className="workload-row"
                    onClick={() => onSelectWorkload(w)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectWorkload(w);
                      }
                    }}
                  >
                    {/* 1. Workload & Kind */}
                    <td className="cell-workload">
                      <div className="workload-title-box">
                        <div className="workload-icon">
                          <Server size={15} />
                        </div>
                        <div className="workload-names">
                          <span className="workload-name">{w.name}</span>
                          <span className="workload-kind-tag">{w.workloadType}</span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Namespace */}
                    <td className="cell-namespace">
                      <span className={`namespace-badge ns-${w.namespace}`}>
                        {w.namespace}
                      </span>
                    </td>

                    {/* 3. Service Account & Auth */}
                    <td className="cell-sa">
                      <div className="sa-cell-box">
                        <code className="sa-name">{w.serviceAccount}</code>
                        <span className={`sa-auth-badge ${w.authMethod}`}>
                          {w.authMethod === 'projected_sa_token'
                            ? 'Projected Token'
                            : w.authMethod === 'k8s_service_account'
                            ? 'Mounted Secret'
                            : 'Default Unbound'}
                        </span>
                      </div>
                    </td>

                    {/* 4. Verification Status */}
                    <td className="cell-status">
                      <div
                        className={`status-pill ${
                          isVerified
                            ? 'verified'
                            : isAttention
                            ? 'attention'
                            : 'rejected'
                        }`}
                      >
                        {isVerified && <ShieldCheck size={13} />}
                        {isAttention && <AlertTriangle size={13} />}
                        {isRejected && <ShieldAlert size={13} />}
                        <span>
                          {isVerified
                            ? 'Verified'
                            : isAttention
                            ? 'Attention Required'
                            : 'Rejected'}
                        </span>
                      </div>
                    </td>

                    {/* 5. Microsegmentation Boundary */}
                    <td className="cell-boundary">
                      <div className="boundary-cell-box">
                        <span className="boundary-summary ingress" title={`Allowed ingress: ${w.allowedIngressSources.join(', ') || 'None'}`}>
                          In: {w.allowedIngressSources.length}
                        </span>
                        <span className="boundary-summary egress" title={`Allowed egress: ${w.allowedEgressDestinations.join(', ') || 'None'}`}>
                          Out: {w.allowedEgressDestinations.length}
                        </span>
                        {w.linkedFindingId && (
                          <span className="finding-flag" title="Has linked security finding">
                            Linked Alert
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 6. Action */}
                    <td className="cell-action text-right">
                      <button
                        className="inspect-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorkload(w);
                        }}
                        aria-label={`Inspect ${w.name}`}
                      >
                        <span>Inspect</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Count */}
      <div className="workload-table-footer">
        <span>
          Showing <strong>{filteredWorkloads.length}</strong> of <strong>{workloads.length}</strong> Kubernetes workloads
        </span>
        <span className="manifest-provenance-hint">
          Source: <code>k8s/microservices/02-workloads.yaml</code>
        </span>
      </div>
    </div>
  );
};

