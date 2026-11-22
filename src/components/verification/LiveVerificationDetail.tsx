import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  Code2,
} from 'lucide-react';
import {
  LiveSecurityVerificationResponse,
  VerificationCheck,
  VerificationStatus,
  requestSecurityVerification,
  snapshotAgeReason,
} from '../../utils/securityVerification';

export const LiveVerificationDetail: React.FC = () => {
  const [snapshot, setSnapshot] = useState<{
    data: LiveSecurityVerificationResponse;
    retrievedAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | VerificationStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(Date.now);
  const requestId = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);

  const data = snapshot?.data ?? null;
  const checks = data?.checks ?? [];

  const passCount = checks.filter((c) => c.status === 'PASS').length;
  const failCount = checks.filter((c) => c.status === 'FAIL').length;
  const unknownCount = checks.filter((c) => c.status === 'UNKNOWN').length;

  const staleReason = data
    ? isLoading
      ? 'Refresh pending; showing previous snapshot'
      : error
      ? 'Latest refresh failed; showing previous snapshot'
      : snapshotAgeReason(data.collectedAt, now)
    : null;
  const isStale = Boolean(staleReason);

  const fetchVerification = useCallback(async () => {
    const id = ++requestId.current;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestSecurityVerification(controller.signal);
      if (id !== requestId.current || controller.signal.aborted) return;
      const received = Date.now();
      setSnapshot({ data: result, retrievedAt: new Date(received).toISOString() });
      setNow(received);
    } catch (err: unknown) {
      if (id !== requestId.current || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Unable to retrieve automated verification');
    } finally {
      if (id === requestId.current && !controller.signal.aborted) {
        setIsLoading(false);
        activeRequest.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void fetchVerification();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      ++requestId.current;
      activeRequest.current?.abort();
      clearInterval(timer);
    };
  }, [fetchVerification]);

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTimestamp = (isoString?: string | null) => {
    if (!isoString) return 'Not reported';
    try {
      const d = new Date(isoString);
      return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    } catch {
      return isoString;
    }
  };

  const filteredChecks = checks.filter((chk) => {
    if (statusFilter !== 'ALL' && chk.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = chk.control.toLowerCase().includes(q);
      const matchId = chk.id.toLowerCase().includes(q);
      const matchReason = chk.reason.toLowerCase().includes(q);
      const matchSource = chk.source.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchReason && !matchSource) return false;
    }
    return true;
  });

  return (
    <section
      className="live-verification-detail-container"
      aria-label="Automated Zero Trust Security Verification Telemetry"
    >
      {/* 1. Header Row */}
      <div className="verification-detail-header">
        <div className="header-meta-group">
          <div className="header-badge-row">
            <span className="live-source-pill verification">
              <ShieldCheck size={13} />
              <span>AUTOMATED VERIFICATION</span>
            </span>
            <span className="cluster-name-chip">
              Evaluator: <strong>Read-Only API Gateway</strong>
            </span>
            <span className="cluster-name-chip">
              Clusters: <strong>kind-trustmesh-lab + kind-trustmesh-network-lab</strong>
            </span>
            {isStale && (
              <span className="stale-warning-chip" title={staleReason || undefined}>
                <AlertTriangle size={12} />
                <span>{staleReason}</span>
              </span>
            )}
          </div>
          <div className="collection-time-row">
            <Clock size={11} className="time-icon" />
            <span>
              Collected: <strong>{formatTimestamp(data?.collectedAt)}</strong>
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="live-refresh-btn"
            onClick={() => void fetchVerification()}
            disabled={isLoading}
            title="Execute read-only verification across Kubernetes clusters"
            aria-label="Re-run automated verification"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Verifying Clusters…' : 'Re-verify Controls'}</span>
          </button>
        </div>
      </div>

      {/* 2. Error Banner */}
      {error && !data && (
        <div className="live-network-error-banner" role="alert">
          <XCircle size={16} />
          <div className="error-text">
            <strong>Automated Verification Error:</strong> {error}
          </div>
          <button className="error-retry-btn" onClick={() => void fetchVerification()}>
            Retry
          </button>
        </div>
      )}

      {/* 3. Loading Placeholder */}
      {isLoading && !data && (
        <div className="live-network-loading-placeholder">
          <RefreshCw size={22} className="animate-spin text-cyan-400" />
          <p>Evaluating Kubernetes Zero Trust controls across cluster contexts…</p>
        </div>
      )}

      {/* 4. Live Body */}
      {data && (
        <div className="verification-detail-body">
          {/* Scientific / Honest Academic Disclaimers */}
          <div className="live-network-disclaimers">
            <div className="network-disclaimer-notice">
              <Info size={13} className="disclaimer-icon text-cyan" />
              <span>
                <strong>Zero Trust Verification Semantics:</strong> <code>PASS</code> indicates the control is observed and matches its defined configuration/readiness requirements. It does not constitute a statistical compliance score, proof of blocked attack packets, or a guarantee against runtime bypasses.
              </span>
            </div>
            <div className="network-disclaimer-notice">
              <Info size={13} className="disclaimer-icon text-amber" />
              <span>
                <strong>Diagnostic Segregation:</strong> Audit-pod ValidatingAdmissionPolicy diagnostic warnings (e.g. <code>vap.k8s.io</code> engine missing) are retained as telemetry details and are not conflated with active admission webhook enforcement.
              </span>
            </div>
          </div>

          {/* Quick Stats Chips */}
          <div className="verification-stats-row">
            <div className="verif-stat-chip total">
              <span className="stat-label">Total Controls:</span>
              <span className="stat-val">{checks.length} Evaluated</span>
            </div>
            <div className="verif-stat-chip pass">
              <CheckCircle2 size={13} />
              <span className="stat-label">Passed:</span>
              <span className="stat-val">{passCount}</span>
            </div>
            <div className="verif-stat-chip fail">
              <XCircle size={13} />
              <span className="stat-label">Failed:</span>
              <span className="stat-val">{failCount}</span>
            </div>
            <div className="verif-stat-chip unknown">
              <HelpCircle size={13} />
              <span className="stat-label">Unknown / Unavailable:</span>
              <span className="stat-val">{unknownCount}</span>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="verification-filter-bar">
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Filter by control, ID, or source…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="verification-search-input"
              />
            </div>

            <div className="filter-pill-group" role="radiogroup" aria-label="Filter checks by status">
              <button
                className={`filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                All ({checks.length})
              </button>
              <button
                className={`filter-pill pass ${statusFilter === 'PASS' ? 'active' : ''}`}
                onClick={() => setStatusFilter('PASS')}
              >
                Pass ({passCount})
              </button>
              <button
                className={`filter-pill fail ${statusFilter === 'FAIL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('FAIL')}
              >
                Fail ({failCount})
              </button>
              <button
                className={`filter-pill unknown ${statusFilter === 'UNKNOWN' ? 'active' : ''}`}
                onClick={() => setStatusFilter('UNKNOWN')}
              >
                Unknown ({unknownCount})
              </button>
            </div>
          </div>

          {/* Verification Checks Grid / List */}
          {filteredChecks.length === 0 ? (
            <div className="empty-sub-state">No verification checks match the selected filter.</div>
          ) : (
            <div className="verification-checks-list">
              {filteredChecks.map((chk: VerificationCheck) => {
                const isExpanded = Boolean(expandedEvidence[chk.id]);
                return (
                  <div key={chk.id} className={`verification-check-card status-${chk.status.toLowerCase()}`}>
                    <div className="check-card-top-row">
                      <div className="check-title-group">
                        <div className="check-status-icon">
                          {chk.status === 'PASS' && <CheckCircle2 size={16} className="text-emerald-400" />}
                          {chk.status === 'FAIL' && <XCircle size={16} className="text-rose-400" />}
                          {chk.status === 'UNKNOWN' && <HelpCircle size={16} className="text-amber-400" />}
                        </div>
                        <div className="check-name-and-id">
                          <h4 className="check-control-title">{chk.control}</h4>
                          <code className="check-id-tag">{chk.id}</code>
                        </div>
                      </div>

                      <div className="check-header-badges">
                        <span className={`verification-status-pill ${chk.status.toLowerCase()}`}>
                          {chk.status}
                        </span>
                      </div>
                    </div>

                    <div className="check-reason-box">
                      <p className="check-reason-text">{chk.reason}</p>
                    </div>

                    <div className="check-meta-footer">
                      <div className="meta-left">
                        <span className="source-label">Source:</span>
                        <code className="source-code">{chk.source}</code>
                        <span className="meta-sep">•</span>
                        <span className="time-label">Observed:</span>
                        <span className="time-val">{formatTimestamp(chk.observedAt)}</span>
                      </div>

                      <div className="meta-right">
                        <button
                          className="evidence-toggle-btn"
                          onClick={() => toggleEvidence(chk.id)}
                          aria-expanded={isExpanded}
                        >
                          <Code2 size={12} />
                          <span>{isExpanded ? 'Hide Evidence' : 'Inspect Evidence'}</span>
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="check-evidence-drawer animate-fade-in">
                        <div className="drawer-header">
                          <span className="drawer-title">Observed Kubernetes Telemetry Evidence:</span>
                        </div>
                        <pre className="evidence-json-block">
                          <code>{JSON.stringify(chk.evidence, null, 2)}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
