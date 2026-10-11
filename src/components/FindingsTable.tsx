import React from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { SecurityFinding, FindingSeverity } from '../types/security';

export type SortField = 'severity' | 'riskScore' | 'title' | 'affectedAsset' | 'domain' | 'status';
export type SortDirection = 'asc' | 'desc';

interface FindingsTableProps {
  findings: SecurityFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (finding: SecurityFinding) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onToggleSort: (field: SortField) => void;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  selectedFindingId,
  onSelectFinding,
  sortField,
  sortDirection,
  onToggleSort,
}) => {
  const renderSeverityBadge = (severity: FindingSeverity, riskScore: number) => {
    switch (severity) {
      case 'critical':
        return (
          <div className="sev-cell-wrapper">
            <span className="sev-chevron-pill critical">
              <span>▲▲</span> Critical
            </span>
            <span className="score-badge">{riskScore}</span>
          </div>
        );
      case 'high':
        return (
          <div className="sev-cell-wrapper">
            <span className="sev-chevron-pill high">
              <span>▲</span> High
            </span>
            <span className="score-badge">{riskScore}</span>
          </div>
        );
      case 'medium':
        return (
          <div className="sev-cell-wrapper">
            <span className="sev-chevron-pill medium">
              <span>■</span> Medium
            </span>
            <span className="score-badge">{riskScore}</span>
          </div>
        );
      case 'low':
        return (
          <div className="sev-cell-wrapper">
            <span className="sev-chevron-pill low">
              <span>●</span> Low
            </span>
            <span className="score-badge">{riskScore}</span>
          </div>
        );
    }
  };

  const renderStatusPill = (status: SecurityFinding['status']) => {
    switch (status) {
      case 'new':
        return (
          <span className="status-diamond-pill new">
            <span>◇</span> New
          </span>
        );
      case 'in_progress':
        return (
          <span className="status-diamond-pill in_progress">
            <span>◓</span> In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="status-diamond-pill resolved">
            <span>✓</span> Resolved
          </span>
        );
      default:
        return <span className="status-diamond-pill">{status}</span>;
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} style={{ opacity: 0.35, marginLeft: 4 }} />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={11} style={{ color: 'var(--accent-cyan)', marginLeft: 4 }} />
    ) : (
      <ArrowDown size={11} style={{ color: 'var(--accent-cyan)', marginLeft: 4 }} />
    );
  };

  const formatDomainLabel = (domain: SecurityFinding['domain']) => {
    switch (domain) {
      case 'supply_chain':
        return 'Supply Chain';
      case 'policy':
        return 'Policy-as-Code';
      case 'identity':
        return 'Workload Identity';
      case 'service_mesh':
        return 'Service Mesh';
      case 'workload_runtime':
        return 'Runtime Guard';
    }
  };

  return (
    <div className="table-viewport-card">
      <div className="table-scroll-container">
        <table className="cortex-data-table">
          <thead>
            <tr>
              <th 
                className="sortable" 
                onClick={() => onToggleSort('severity')}
                style={{ width: '150px' }}
              >
                Severity & Score {renderSortIndicator('severity')}
              </th>
              <th 
                className="sortable" 
                onClick={() => onToggleSort('title')}
              >
                Finding & Identifier {renderSortIndicator('title')}
              </th>
              <th 
                className="sortable" 
                onClick={() => onToggleSort('affectedAsset')}
                style={{ width: '230px' }}
              >
                Target Workload {renderSortIndicator('affectedAsset')}
              </th>
              <th 
                className="sortable" 
                onClick={() => onToggleSort('domain')}
                style={{ width: '140px' }}
              >
                Architecture Pillar {renderSortIndicator('domain')}
              </th>
              <th 
                className="sortable" 
                onClick={() => onToggleSort('status')}
                style={{ width: '120px' }}
              >
                Status {renderSortIndicator('status')}
              </th>
              <th style={{ width: '90px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {findings.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No security findings match the active search query or selected filter criteria.
                </td>
              </tr>
            ) : (
              findings.map((f) => (
                <tr 
                  key={f.id}
                  className={`data-row ${selectedFindingId === f.id ? 'selected' : ''}`}
                  onClick={() => onSelectFinding(f)}
                >
                  <td>
                    {renderSeverityBadge(f.severity, f.riskScore)}
                  </td>
                  <td>
                    <div className="cell-title-block">
                      <span className="cell-title-main" title={f.title}>
                        {f.title}
                      </span>
                      <div className="cell-title-meta">
                        <span className="rule-id-tag">{f.cveOrRuleId}</span>
                        <span>•</span>
                        <span>{f.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="workload-cell-block">
                      <span className="workload-asset-name">
                        {f.affectedAsset}
                      </span>
                      <span className="workload-cluster-namespace">
                        {f.cluster.replace(' (Planned)', '')} • {f.namespace}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="domain-cell-pill">
                      {formatDomainLabel(f.domain)}
                    </span>
                  </td>
                  <td>
                    {renderStatusPill(f.status)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-inspect-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFinding(f);
                      }}
                    >
                      <span>Inspect</span>
                      <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
