import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, Filter, ArrowLeft, Download } from 'lucide-react';
import { SecurityFinding, FindingSeverity, FindingStatus, SecurityDomain } from '../types/security';
import { CommandCenterHero } from './CommandCenterHero';
import { FindingsTable, SortField, SortDirection } from './FindingsTable';
import { FindingDetailDrawer } from './FindingDetailDrawer';
import { CommandCenterTab } from './Header';

interface CommandCenterProps {
  findings: SecurityFinding[];
  onUpdateFindingStatus: (id: string, newStatus: FindingStatus) => void;
  onOpenIntegrations: () => void;
  activeTab: CommandCenterTab;
  onTabChange: (tab: CommandCenterTab) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  findings,
  onUpdateFindingStatus,
  onOpenIntegrations,
  activeTab,
  onTabChange,
}) => {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Detail Drawer state
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);

  // Filtering & Sorting logic
  const filteredAndSortedFindings = useMemo(() => {
    return findings
      .filter((f) => {
        // Free-text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            f.title.toLowerCase().includes(q) ||
            f.cveOrRuleId.toLowerCase().includes(q) ||
            f.affectedAsset.toLowerCase().includes(q) ||
            f.namespace.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Severity filter
        if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) {
          return false;
        }

        // Domain filter
        if (selectedDomain !== 'all' && f.domain !== selectedDomain) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'all' && f.status !== selectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;

        if (sortField === 'severity') {
          const weight: Record<FindingSeverity, number> = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
          };
          return (weight[a.severity] - weight[b.severity]) * dir;
        }

        if (sortField === 'riskScore') {
          return (a.riskScore - b.riskScore) * dir;
        }

        if (sortField === 'title') {
          return a.title.localeCompare(b.title) * dir;
        }

        if (sortField === 'affectedAsset') {
          return a.affectedAsset.localeCompare(b.affectedAsset) * dir;
        }

        if (sortField === 'domain') {
          return a.domain.localeCompare(b.domain) * dir;
        }

        if (sortField === 'status') {
          return a.status.localeCompare(b.status) * dir;
        }

        return 0;
      });
  }, [findings, searchQuery, selectedSeverity, selectedDomain, selectedStatus, sortField, sortDirection]);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSeverity('all');
    setSelectedDomain('all');
    setSelectedStatus('all');
  };

  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    selectedSeverity !== 'all' || 
    selectedDomain !== 'all' || 
    selectedStatus !== 'all';

  return (
    <div className="command-center">
      {activeTab === 'overview' ? (
        /* MINIMAL FIRST VIEW: Distinctive 2.5D Isometric Telemetry Space */
        <CommandCenterHero
          findings={findings}
          onSelectFinding={(f) => setSelectedFinding(f)}
          onNavigateToExplorer={() => onTabChange('explorer')}
        />
      ) : (
        /* PROGRESSIVE DISCLOSURE: Dedicated Findings Explorer Workspace */
        <div className="findings-workspace-section">
          {/* Workspace Filter & Query Toolbar */}
          <div className="workspace-toolbar-bar">
            <div className="toolbar-left">
              <div className="search-input-box">
                <Search size={13} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search findings by title, CVE, pod, namespace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-select-pills">
                <select
                  className="cortex-select"
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                >
                  <option value="all">Severity: All</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Only</option>
                  <option value="medium">Medium Only</option>
                  <option value="low">Low Only</option>
                </select>

                <select
                  className="cortex-select"
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                >
                  <option value="all">Pillar: All</option>
                  <option value="supply_chain">Supply Chain</option>
                  <option value="policy">Policy-as-Code</option>
                  <option value="identity">Workload Identity</option>
                  <option value="service_mesh">Service Mesh</option>
                  <option value="workload_runtime">Runtime Guard</option>
                </select>

                <select
                  className="cortex-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">Status: All</option>
                  <option value="new">New (Unreviewed)</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>

                {hasActiveFilters && (
                  <button
                    className="btn-reset-filters"
                    onClick={handleResetFilters}
                    title="Reset all active filters"
                  >
                    <RotateCcw size={11} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            <div className="toolbar-right">
              <span className="results-stats-tag">
                Showing <strong>{filteredAndSortedFindings.length}</strong> of <strong>{findings.length}</strong> findings
              </span>
            </div>
          </div>

          {/* High-Density Data Grid */}
          <FindingsTable
            findings={filteredAndSortedFindings}
            selectedFindingId={selectedFinding ? selectedFinding.id : null}
            onSelectFinding={(f) => setSelectedFinding(f)}
            sortField={sortField}
            sortDirection={sortDirection}
            onToggleSort={handleToggleSort}
          />
        </div>
      )}

      {/* Slide-Over Glassmorphic Investigation Drawer */}
      <FindingDetailDrawer
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onUpdateStatus={(id, status) => {
          onUpdateFindingStatus(id, status);
          if (selectedFinding && selectedFinding.id === id) {
            setSelectedFinding({ ...selectedFinding, status });
          }
        }}
      />
    </div>
  );
};
