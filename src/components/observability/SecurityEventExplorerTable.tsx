import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronRight,
  ShieldAlert,
  Server
} from 'lucide-react';
import { NormalizedSecurityEvent } from '../../types/observability';

interface SecurityEventExplorerTableProps {
  events: NormalizedSecurityEvent[];
  onSelectEvent: (event: NormalizedSecurityEvent) => void;
  domainFilter?: string;
}

export const SecurityEventExplorerTable: React.FC<SecurityEventExplorerTableProps> = ({
  events,
  onSelectEvent,
  domainFilter = 'ALL'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');

  const filteredEvents = events.filter((evt) => {
    if (domainFilter !== 'ALL' && evt.domain !== domainFilter) return false;
    if (severityFilter !== 'ALL' && evt.severity !== severityFilter) return false;
    if (outcomeFilter !== 'ALL' && evt.outcome !== outcomeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        evt.eventId.toLowerCase().includes(q) ||
        evt.workloadName.toLowerCase().includes(q) ||
        evt.namespace.toLowerCase().includes(q) ||
        evt.ruleId.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q) ||
        evt.sourceComponent.toLowerCase().includes(q) ||
        (evt.findingRef && evt.findingRef.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'ALLOWED':
        return (
          <span className="obs-outcome-badge allowed">
            ALLOWED
          </span>
        );
      case 'DENIED':
        return (
          <span className="obs-outcome-badge denied">
            DENIED
          </span>
        );
      case 'CONNECTION_RESET':
        return (
          <span className="obs-outcome-badge reset">
            RESET
          </span>
        );
      default:
        return (
          <span className="obs-outcome-badge">
            {outcome}
          </span>
        );
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="obs-sev-badge critical">CRITICAL</span>;
      case 'HIGH':
        return <span className="obs-sev-badge high">HIGH</span>;
      default:
        return <span className="obs-sev-badge info">INFO</span>;
    }
  };

  return (
    <div className="obs-table-card">
      {/* Table Header controls */}
      <div className="sc-table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity className="w-4 h-4" style={{ color: '#818cf8' }} />
          <h3 className="sc-table-title">
            Unified Security Event Stream
          </h3>
          <span className="sc-count-badge">
            {filteredEvents.length} of {events.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search box */}
          <div className="sc-search-wrap">
            <Search className="w-3.5 h-3.5 sc-search-icon" />
            <input
              type="text"
              placeholder="Search event, workload, rule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sc-search-input"
            />
          </div>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="sc-select"
          >
            <option value="ALL">Severity: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="INFORMATIONAL">Informational</option>
          </select>

          {/* Outcome filter */}
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="sc-select"
          >
            <option value="ALL">Outcome: All</option>
            <option value="ALLOWED">Allowed</option>
            <option value="DENIED">Denied</option>
            <option value="CONNECTION_RESET">Connection Reset</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="sc-table-scroll">
        <table className="sc-table">
          <thead>
            <tr>
              <th className="sc-th">Event ID / Time</th>
              <th className="sc-th">Source Component</th>
              <th className="sc-th">Resource & Namespace</th>
              <th className="sc-th">Enforcement Rule</th>
              <th className="sc-th">Verdict</th>
              <th className="sc-th" style={{ textAlign: 'right' }}>Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  No security events match the current filter criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr
                  key={evt.eventId}
                  onClick={() => onSelectEvent(evt)}
                  className="sc-tr"
                  style={{ cursor: 'pointer' }}
                >
                  {/* Event ID & Time */}
                  <td className="sc-td">
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{evt.eventId}</span>
                      {getSeverityBadge(evt.severity)}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                      {evt.sourceTimestamp}
                    </div>
                  </td>

                  {/* Source Component */}
                  <td className="sc-td">
                    <div style={{ fontWeight: 600 }}>
                      <span>{evt.sourceComponent}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
                      {evt.domain}
                    </div>
                  </td>

                  {/* Resource & Namespace */}
                  <td className="sc-td">
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {evt.affectedResource}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                      ns: {evt.namespace}
                    </div>
                  </td>

                  {/* Rule ID & Description */}
                  <td className="sc-td" style={{ maxWidth: '280px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {evt.ruleId}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {evt.description}
                    </div>
                  </td>

                  {/* Verdict */}
                  <td className="sc-td">
                    {getOutcomeBadge(evt.outcome)}
                  </td>

                  {/* Action */}
                  <td className="sc-td" style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className="sc-action-btn view"
                      style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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

