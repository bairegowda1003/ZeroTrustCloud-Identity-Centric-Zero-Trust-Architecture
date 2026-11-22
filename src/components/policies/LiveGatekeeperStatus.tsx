import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Radio,
  FileCode,
  Info,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import {
  LiveGatekeeperPoliciesResponse,
  LiveGatekeeperConstraint,
  requestGatekeeperPolicies,
  snapshotAgeReason,
} from '../../utils/gatekeeperPolicies';

export const LiveGatekeeperStatus: React.FC = () => {
  const [snapshot, setSnapshot] = useState<{
    data: LiveGatekeeperPoliciesResponse;
    retrievedAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const requestId = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);

  const data = snapshot?.data ?? null;
  const staleReason = data
    ? isLoading
      ? 'Refresh pending; showing previous snapshot'
      : error
      ? 'Latest refresh failed; showing previous snapshot'
      : snapshotAgeReason(data.collectedAt, now)
    : null;
  const isStale = Boolean(staleReason);

  const fetchStatus = useCallback(async () => {
    const id = ++requestId.current;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestGatekeeperPolicies(controller.signal);
      if (id !== requestId.current || controller.signal.aborted) return;
      const received = Date.now();
      setSnapshot({ data: result, retrievedAt: new Date(received).toISOString() });
      setNow(received);
    } catch (err: unknown) {
      if (id !== requestId.current || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Unable to retrieve Gatekeeper Policies');
    } finally {
      if (id === requestId.current && !controller.signal.aborted) {
        setIsLoading(false);
        activeRequest.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      ++requestId.current;
      activeRequest.current?.abort();
      clearInterval(timer);
    };
  }, [fetchStatus]);

  const formatTimestamp = (isoString?: string | null) => {
    if (!isoString) return 'Not reported';
    try {
      const d = new Date(isoString);
      return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    } catch {
      return isoString;
    }
  };

  const formatEnforcementAction = (action?: string | null) => {
    if (!action) return 'Configured action: Unknown / Not reported';
    const capitalized = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
    return `Configured action: ${capitalized}`;
  };

  const formatWebhookStatus = (webhookEnforced?: boolean | null) => {
    if (webhookEnforced === true) return 'Webhook: Reported enforced';
    if (webhookEnforced === false) return 'Webhook: Reported NOT enforced';
    return 'Webhook: Unknown / Not reported';
  };

  const formatAuditViolations = (totalViolations?: number | null) => {
    if (typeof totalViolations === 'number') {
      return `Audit: ${totalViolations} reported violations`;
    }
    return 'Audit: Unknown / Not reported';
  };

  const formatKinds = (kinds: { apiGroups?: string[]; kinds?: string[] }[]) => {
    if (!kinds || kinds.length === 0) return 'None specified';
    return kinds
      .map((k) => {
        const group = k.apiGroups && k.apiGroups.length > 0 ? k.apiGroups.join(',') : 'core';
        const kindNames = k.kinds && k.kinds.length > 0 ? k.kinds.join(',') : '*';
        return `${group}/${kindNames}`;
      })
      .join(', ');
  };

  return (
    <div
      className="live-gatekeeper-container"
      role="region"
      aria-label="Verified Live Gatekeeper Policies and Admission Telemetry"
    >
      {/* 1. Header Bar */}
      <div className="live-k8s-header">
        <div className="live-k8s-title-group">
          <div className="live-k8s-icon-wrap" aria-hidden="true">
            <Radio size={18} className="live-k8s-icon-svg" />
          </div>
          <div>
            <div className="live-k8s-title-row">
              <h2 className="live-k8s-title">Verified Live Gatekeeper Policies & Webhook Status</h2>
              {data && !error && !isStale && (
                <span className="live-verified-badge" title="Authenticated live Gatekeeper status">
                  <span className="live-pip-beacon" />
                  LIVE KUBERNETES
                </span>
              )}
              {isStale && data && (
                <span className="live-stale-badge" title={staleReason || 'Snapshot is stale'}>
                  <AlertTriangle size={11} />
                  STALE SNAPSHOT
                </span>
              )}
              {error && !data && (
                <span className="live-error-badge" title={error}>
                  <XCircle size={11} />
                  API DISCONNECTED
                </span>
              )}
            </div>
            <div className="live-k8s-meta-row">
              <span className="meta-item">
                Cluster: <strong>{data?.cluster || 'kind-trustmesh-lab'}</strong>
              </span>
              <span className="meta-sep">•</span>
              <span className="meta-item">
                Constraints Returned:{' '}
                <strong>{data ? `${data.constraints.length} Constraints` : isLoading ? 'Querying...' : 'Unavailable'}</strong>
              </span>
              <span className="meta-sep">•</span>
              <span className="meta-item">
                <Clock size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                Collected:{' '}
                <strong>
                  {data ? formatTimestamp(data.collectedAt) : isLoading ? 'Querying...' : 'Unavailable'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="live-k8s-actions">
          <button
            type="button"
            className="live-k8s-refresh-btn"
            onClick={() => void fetchStatus()}
            disabled={isLoading}
            aria-label="Refresh live Gatekeeper policies"
          >
            <RefreshCw size={13} className={isLoading ? 'spinning' : ''} />
            <span>{isLoading ? 'Querying...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Notice Banners (Stale or Error) */}
      {staleReason && (
        <div className="live-k8s-banner stale" role="status">
          <AlertTriangle size={14} className="banner-icon" />
          <span>{staleReason}</span>
        </div>
      )}

      {error && !data && (
        <div className="live-k8s-banner error" role="alert">
          <XCircle size={14} className="banner-icon" />
          <div className="banner-text-col">
            <strong>Live Gatekeeper API Unavailable: {error}</strong>
            <span>
              Unable to query Gatekeeper constraints from Kali. The demonstration interface below remains
              available for UI inspection.
            </span>
          </div>
        </div>
      )}

      {/* 3. Loading Skeleton */}
      {isLoading && !data && (
        <div className="live-k8s-skeleton" aria-label="Loading Gatekeeper policies">
          <div className="skeleton-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
          <div className="skeleton-table" />
        </div>
      )}

      {/* 4. Architectural Boundaries and Admission Disclaimers */}
      <div className="live-gatekeeper-disclaimers">
        <div className="policy-disclaimer-notice">
          <Info size={12} className="disclaimer-icon" />
          <span>
            Webhook Enforcement: Reported webhook status reflects controller-manager pod health in status.byPod. It does not
            constitute proof of an individual real-time admission decision.
          </span>
        </div>
        <div className="policy-disclaimer-notice">
          <Info size={12} className="disclaimer-icon" />
          <span>
            Scope & Audit Notice: Constraints target Deployments in the trustmesh-lab namespace; enforcement is not cluster-wide.
            Zero audit violations indicate no non-compliant resources were discovered during the last audit cycle; it does not measure rejected admission attempts.
          </span>
        </div>
      </div>

      {/* 5. Live Constraints Data View */}
      {data && (
        <div className="live-gatekeeper-body">
          {/* Top Metric Bar */}
          <div className="live-gatekeeper-stats-row">
            <div className="live-stat-chip">
              <Layers size={14} className="text-amber-400" />
              <span>Live Constraints:</span>
              <strong>{data.constraints.length}</strong>
            </div>
            <div className="live-stat-chip">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Webhook Enforced:</span>
              <strong>
                {data.constraints.filter((c) => c.webhookEnforced === true).length}/{data.constraints.length}
              </strong>
            </div>
            <div className="live-stat-chip">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span>Target Namespace:</span>
              <strong>trustmesh-lab</strong>
            </div>
            <div className="live-stat-chip">
              <AlertOctagon size={14} className="text-rose-400" />
              <span>Reported Violations:</span>
              <strong>
                {data.constraints.reduce((sum, c) => sum + (c.audit.totalViolations ?? 0), 0)}
              </strong>
            </div>
          </div>

          {/* Empty Inventory State */}
          {data.constraints.length === 0 && (
            <div className="live-empty-constraints-card" role="status">
              <FileCode size={24} className="text-slate-400" />
              <h4>0 Constraints Returned</h4>
              <p>
                Gatekeeper API connected to cluster kind-trustmesh-lab, but no active constraint objects were
                returned for the queried kinds.
              </p>
            </div>
          )}

          {/* Constraint Cards Grid */}
          {data.constraints.length > 0 && (
            <div className="live-constraints-grid">
              {data.constraints.map((constraint: LiveGatekeeperConstraint) => {
                const actionText = formatEnforcementAction(constraint.enforcementAction);
                const webhookText = formatWebhookStatus(constraint.webhookEnforced);
                const auditText = formatAuditViolations(constraint.audit.totalViolations);
                const isDeny = constraint.enforcementAction?.toLowerCase() === 'deny';
                const isWebhookOk = constraint.webhookEnforced === true;

                return (
                  <div key={constraint.name} className="live-constraint-card">
                    {/* Card Header */}
                    <div className="constraint-card-header">
                      <div className="constraint-title-box">
                        <FileCode size={16} className="text-amber-400" />
                        <div>
                          <h3 className="constraint-name-str">{constraint.name}</h3>
                          <span className="constraint-kind-badge">{constraint.kind}</span>
                        </div>
                      </div>
                      <span className={`constraint-action-pill ${isDeny ? 'deny' : 'other'}`}>
                        {actionText}
                      </span>
                    </div>

                    {/* Status Strip */}
                    <div className="constraint-status-strip">
                      <div className={`status-strip-item ${isWebhookOk ? 'ok' : 'unknown'}`}>
                        <span className="status-dot" />
                        <span className="status-label">{webhookText}</span>
                      </div>
                      <div className="status-strip-item audit">
                        <span className="status-dot" />
                        <span className="status-label">{auditText}</span>
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="constraint-details-grid">
                      <div className="detail-item">
                        <span className="detail-key">Namespace Scope:</span>
                        <div className="detail-val-pills">
                          {constraint.match.namespaces.length > 0 ? (
                            constraint.match.namespaces.map((ns) => (
                              <span key={ns} className="scope-pill namespace">
                                {ns}
                              </span>
                            ))
                          ) : (
                            <span className="scope-pill none">None specified</span>
                          )}
                        </div>
                      </div>

                      <div className="detail-item">
                        <span className="detail-key">Target Resources:</span>
                        <span className="detail-val mono">{formatKinds(constraint.match.kinds)}</span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-key">Audit Timestamp:</span>
                        <span className="detail-val mono">{formatTimestamp(constraint.audit.auditTimestamp)}</span>
                      </div>
                    </div>

                    {/* Native Validation Enforcement Points */}
                    <div className="enforcement-points-section">
                      <span className="ep-section-title">Native Validation Engine:</span>
                      {constraint.enforcementPoints.length > 0 ? (
                        constraint.enforcementPoints.map((ep) => {
                          const isError = ep.state === 'error';
                          return (
                            <div key={ep.name} className={`enforcement-point-item ${isError ? 'error' : 'normal'}`}>
                              <AlertTriangle size={13} className="ep-icon" />
                              <div className="ep-text-group">
                                <span className="ep-main-text">
                                  Native validation: {isError ? 'Error — ' : ''}
                                  {ep.message || ep.state || 'Reported'}
                                </span>
                                <span className="ep-point-name">Point: {ep.name}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="enforcement-point-item normal">
                          <CheckCircle2 size={13} className="ep-icon" />
                          <span className="ep-main-text">Native validation: None reported</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
