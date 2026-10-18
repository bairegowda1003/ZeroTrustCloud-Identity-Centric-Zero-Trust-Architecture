import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, AlertTriangle, AlertCircle, Info, MinusCircle } from 'lucide-react';
import { SecurityFinding, FindingSeverity, FindingStatus, SecurityDomain } from '../types/security';

interface FindingsTableProps {
  findings: SecurityFinding[];
  onFindingClick: (finding: SecurityFinding) => void;
}

type SortField = 'severity' | 'title' | 'domain' | 'status' | 'riskScore';
type SortDir = 'asc' | 'desc';

const SEVERITY_ORDER: Record<FindingSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const SEVERITY_ICONS: Record<FindingSeverity, React.ReactNode> = {
  critical: <AlertTriangle size={14} />,
  high: <AlertCircle size={14} />,
  medium: <Info size={14} />,
  low: <MinusCircle size={14} />,
};

const SEVERITY_COLORS: Record<FindingSeverity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
};

const DOMAIN_LABELS: Record<SecurityDomain, string> = {
  identity: 'Identity',
  policy: 'Policy',
  service_mesh: 'Service Mesh',
  supply_chain: 'Supply Chain',
  workload_runtime: 'Runtime',
};

export const FindingsTable: React.FC<FindingsTableProps> = ({ findings, onFindingClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterSeverity, setFilterSeverity] = useState<FindingSeverity | null>(null);

  // Computed stats for donut charts
  const stats = useMemo(() => {
    const bySeverity: Record<FindingSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    const byStatus: Record<FindingStatus, number> = { new: 0, in_progress: 0, resolved: 0, suppressed: 0 };
    const byDomain: Record<string, number> = {};
    
    findings.forEach((f) => {
      bySeverity[f.severity]++;
      byStatus[f.status]++;
      byDomain[f.domain] = (byDomain[f.domain] || 0) + 1;
    });
    
    return { bySeverity, byStatus, byDomain };
  }, [findings]);

  // Filtered & sorted
  const filteredFindings = useMemo(() => {
    let result = [...findings];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.domain.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q)
      );
    }
    
    if (filterSeverity) {
      result = result.filter((f) => f.severity === filterSeverity);
    }
    
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'severity':
          cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          break;
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'domain':
          cmp = a.domain.localeCompare(b.domain);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'riskScore':
          cmp = a.riskScore - b.riskScore;
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    
    return result;
  }, [findings, searchQuery, sortField, sortDir, filterSeverity]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="sort-indicator">↕</span>;
    return sortDir === 'desc'
      ? <ChevronDown size={12} style={{ verticalAlign: 'middle', marginLeft: '2px' }} />
      : <ChevronUp size={12} style={{ verticalAlign: 'middle', marginLeft: '2px' }} />;
  };

  return (
    <div className="findings-explorer">
      {/* Summary Donuts */}
      <div className="fe-summary-row animate-in">
        {/* Severity Donut */}
        <SummaryDonutCell
          label="By Severity"
          data={[
            { label: 'Critical', value: stats.bySeverity.critical, color: SEVERITY_COLORS.critical },
            { label: 'High', value: stats.bySeverity.high, color: SEVERITY_COLORS.high },
            { label: 'Medium', value: stats.bySeverity.medium, color: SEVERITY_COLORS.medium },
            { label: 'Low', value: stats.bySeverity.low, color: SEVERITY_COLORS.low },
          ]}
          total={findings.length}
        />
        
        {/* Status Donut */}
        <SummaryDonutCell
          label="By Status"
          data={[
            { label: 'New', value: stats.byStatus.new, color: '#4da6ff' },
            { label: 'In Progress', value: stats.byStatus.in_progress, color: '#eab308' },
            { label: 'Resolved', value: stats.byStatus.resolved, color: '#22c55e' },
            { label: 'Suppressed', value: stats.byStatus.suppressed, color: '#6b7280' },
          ]}
          total={findings.length}
        />

        {/* Domain Donut */}
        <SummaryDonutCell
          label="By Domain"
          data={Object.entries(stats.byDomain).map(([domain, count]) => ({
            label: DOMAIN_LABELS[domain as SecurityDomain] || domain,
            value: count,
            color: ({
              identity: '#a78bfa',
              policy: '#f97316',
              service_mesh: '#06b6d4',
              supply_chain: '#ec4899',
              workload_runtime: '#22c55e',
            } as Record<string, string>)[domain] || '#4da6ff',
          }))}
          total={findings.length}
        />

        {/* Risk Score Overview */}
        <div className="fe-summary-cell" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div className="fe-summary-cell-label">Risk Overview</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {Math.round(findings.reduce((sum, f) => sum + f.riskScore, 0) / Math.max(findings.length, 1))}
          </div>
          <div style={{ fontSize: '0.714rem', color: 'var(--text-tertiary)' }}>Avg Risk Score</div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="fe-filter-bar animate-in animate-in-delay-1">
        <span className="fe-filter-chip" style={{ cursor: 'default', color: 'var(--text-tertiary)' }}>
          Severity:
        </span>
        {(['critical', 'high', 'medium', 'low'] as FindingSeverity[]).map((sev) => (
          <button
            key={sev}
            className={`fe-filter-chip ${filterSeverity === sev ? 'active' : ''}`}
            onClick={() => setFilterSeverity(filterSeverity === sev ? null : sev)}
            style={
              filterSeverity === sev
                ? { borderColor: SEVERITY_COLORS[sev], color: SEVERITY_COLORS[sev], background: `${SEVERITY_COLORS[sev]}15` }
                : undefined
            }
          >
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: SEVERITY_COLORS[sev], flexShrink: 0,
            }} />
            {sev} ({stats.bySeverity[sev]})
          </button>
        ))}
        {filterSeverity && (
          <button
            className="fe-filter-chip"
            onClick={() => setFilterSeverity(null)}
            style={{ color: 'var(--severity-critical)' }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="fe-search-bar animate-in animate-in-delay-2">
        <div className="fe-search-input-wrap">
          <Search />
          <input
            className="fe-search-input"
            type="text"
            placeholder="Search findings by title, domain, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span className="fe-results-count">
          {filteredFindings.length} of {findings.length} findings
        </span>
      </div>

      {/* Table */}
      <div className="fe-table-wrap animate-in animate-in-delay-3">
        <table className="fe-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('severity')} className={sortField === 'severity' ? 'sorted' : ''}>
                Severity <SortIcon field="severity" />
              </th>
              <th onClick={() => handleSort('title')} className={sortField === 'title' ? 'sorted' : ''}>
                Finding <SortIcon field="title" />
              </th>
              <th onClick={() => handleSort('domain')} className={sortField === 'domain' ? 'sorted' : ''}>
                Domain <SortIcon field="domain" />
              </th>
              <th onClick={() => handleSort('status')} className={sortField === 'status' ? 'sorted' : ''}>
                Status <SortIcon field="status" />
              </th>
              <th onClick={() => handleSort('riskScore')} className={sortField === 'riskScore' ? 'sorted' : ''} style={{ textAlign: 'right' }}>
                Score <SortIcon field="riskScore" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFindings.map((finding) => (
              <tr
                key={finding.id}
                onClick={() => onFindingClick(finding)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onFindingClick(finding)}
              >
                <td>
                  <div className="fe-severity-cell">
                    <span className="fe-severity-icon" style={{ color: SEVERITY_COLORS[finding.severity] }}>
                      {SEVERITY_ICONS[finding.severity]}
                    </span>
                    <span className={`fe-severity-text ${finding.severity}`}>
                      {finding.severity}
                    </span>
                  </div>
                </td>
                <td>{finding.title}</td>
                <td>
                  <span className={`cc-finding-domain ${finding.domain}`}>
                    {DOMAIN_LABELS[finding.domain] || finding.domain}
                  </span>
                </td>
                <td>
                  <div className="fe-status-cell">
                    <span className={`fe-status-dot ${finding.status}`} />
                    <span className="fe-status-text">
                      {finding.status.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className={`cc-finding-score ${finding.severity}`}>
                    {finding.riskScore}
                  </span>
                </td>
              </tr>
            ))}
            {filteredFindings.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                  No findings match your current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* --- Donut Chart Summary Cell --- */
interface DonutData {
  label: string;
  value: number;
  color: string;
}

const SummaryDonutCell: React.FC<{
  label: string;
  data: DonutData[];
  total: number;
}> = ({ label, data, total }) => {
  const radius = 22;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  
  let offset = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const len = total > 0 ? (d.value / total) * circumference : 0;
      const segment = { ...d, dashArray: `${len} ${circumference - len}`, dashOffset: -offset };
      offset += len;
      return segment;
    });

  return (
    <div className="fe-summary-cell">
      <div className="fe-donut-container">
        <svg className="fe-donut-svg" viewBox="0 0 56 56">
          {/* Background ring */}
          <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          {/* Segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <span className="fe-donut-center">{total}</span>
      </div>
      <div>
        <div className="fe-summary-cell-label">{label}</div>
        <div className="fe-donut-legend">
          {data.filter((d) => d.value > 0).map((d, i) => (
            <div key={i} className="fe-donut-legend-item">
              <span className="fe-donut-legend-dot" style={{ background: d.color }} />
              {d.label} ({d.value})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
