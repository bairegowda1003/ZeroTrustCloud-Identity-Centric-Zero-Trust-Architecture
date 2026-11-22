import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Clock,
  Radio,
  Network,
  CheckCircle2,
  XCircle,
  Layers,
  Lock,
  Cpu,
  Info,
} from 'lucide-react';
import {
  LiveSecurityNetworkResponse,
  LiveSecurityNetworkPolicy,
  LiveSecurityNetworkWorkload,
  requestSecurityNetwork,
  snapshotAgeReason,
} from '../../utils/securityNetwork';

export const LiveNetworkSecurityStatus: React.FC = () => {
  const [snapshot, setSnapshot] = useState<{
    data: LiveSecurityNetworkResponse;
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
      const result = await requestSecurityNetwork(controller.signal);
      if (id !== requestId.current || controller.signal.aborted) return;
      const received = Date.now();
      setSnapshot({ data: result, retrievedAt: new Date(received).toISOString() });
      setNow(received);
    } catch (err: unknown) {
      if (id !== requestId.current || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Unable to retrieve live network security telemetry');
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

  const renderSelector = (matchLabels: Record<string, string>) => {
    const keys = Object.keys(matchLabels);
    if (keys.length === 0) return <span className="selector-empty">None (Namespace-wide)</span>;
    return (
      <span className="selector-labels">
        {keys.map((k) => (
          <code key={k} className="selector-tag">
            {k}={matchLabels[k]}
          </code>
        ))}
      </span>
    );
  };

  return (
    <section
      className="live-network-security-container"
      aria-label="Live Kubernetes Network & Mesh Security"
    >
      {/* 1. Header Bar */}
      <div className="live-network-header">
        <div className="header-meta-group">
          <div className="header-badge-row">
            <span className="live-k8s-source-badge network">
              <Radio size={12} className="source-pip animate-pulse" />
              <span>LIVE KUBERNETES</span>
            </span>
            <span className="cluster-name-chip">
              Cluster: <strong>{data?.cluster ?? 'kind-trustmesh-network-lab'}</strong>
            </span>
            <span className="cluster-name-chip">
              Namespace: <strong>{data?.namespace ?? 'trustmesh-integration-test'}</strong>
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
              Collected:{' '}
              <strong>{formatTimestamp(data?.collectedAt)}</strong>
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="live-refresh-btn"
            onClick={() => void fetchStatus()}
            disabled={isLoading}
            title="Query kind-trustmesh-network-lab cluster for Istio and Calico posture"
            aria-label="Refresh live network security telemetry"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Querying K8s…' : 'Refresh Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* 2. Error State */}
      {error && !data && (
        <div className="live-network-error-banner" role="alert">
          <XCircle size={16} />
          <div className="error-text">
            <strong>Network Telemetry Query Error:</strong> {error}
          </div>
          <button className="error-retry-btn" onClick={() => void fetchStatus()}>
            Retry
          </button>
        </div>
      )}

      {/* 3. Initial Loading State */}
      {isLoading && !data && (
        <div className="live-network-loading-placeholder">
          <RefreshCw size={22} className="animate-spin text-cyan-400" />
          <p>Connecting to kind-trustmesh-network-lab via API gateway…</p>
        </div>
      )}

      {/* 4. Live Data Body */}
      {data && (
        <div className="live-network-body">
          {/* Scientific / Honest Academic Disclaimers */}
          <div className="live-network-disclaimers">
            <div className="network-disclaimer-notice">
              <Info size={13} className="disclaimer-icon text-cyan" />
              <span>
                <strong>Workload-Scoped STRICT mTLS:</strong> PeerAuthentication{' '}
                <code>trustmesh-integration-strict-mtls</code> targets{' '}
                <code>app=trustmesh-integration-server</code>. It is strictly workload-scoped and does not enforce mTLS namespace-wide.
              </span>
            </div>
            <div className="network-disclaimer-notice">
              <Info size={13} className="disclaimer-icon text-amber" />
              <span>
                <strong>Actual Sidecar Inspection:</strong> Sidecar injection is verified per Pod in{' '}
                <code>spec.initContainers</code> and <code>spec.containers</code>. The namespace label{' '}
                <code>istio-injection=enabled</code> does not guarantee sidecar presence for every workload (e.g. plaintext clients or batch jobs).
              </span>
            </div>
            <div className="network-disclaimer-notice">
              <Info size={13} className="disclaimer-icon text-cyan" />
              <span>
                <strong>Selective Calico NetworkPolicies:</strong> Calico policies select server pods via{' '}
                <code>app=trustmesh-integration-server</code>. They restrict server ingress without blocking unrelated namespace traffic.
              </span>
            </div>
          </div>

          {/* Quick Metrics / Status Chips */}
          <div className="live-network-stats-row">
            <div className="net-stat-chip">
              <span className="chip-label">Istio Control Plane:</span>
              <span className={`chip-val ${data.istiod.ready ? 'green' : 'amber'}`}>
                {data.istiod.name} ({data.istiod.readyReplicas ?? 0}/{data.istiod.desiredReplicas ?? 1} Ready)
              </span>
            </div>
            <div className="net-stat-chip">
              <span className="chip-label">Namespace Injection:</span>
              <span className={`chip-val ${data.namespaceInjection.enabled ? 'green' : 'neutral'}`}>
                istio-injection={data.namespaceInjection.labelValue ?? 'none'}
              </span>
            </div>
            <div className="net-stat-chip">
              <span className="chip-label">PeerAuthentication:</span>
              <span className="chip-val cyan">
                {data.peerAuthentications.length} Modeled Policy ({data.peerAuthentications[0]?.mode ?? 'None'})
              </span>
            </div>
            <div className="net-stat-chip">
              <span className="chip-label">NetworkPolicies:</span>
              <span className="chip-val blue">
                {data.networkPolicies.length} Calico / K8s Policies
              </span>
            </div>
          </div>

          {/* Detailed Telemetry Grid */}
          <div className="live-network-grid">
            {/* Column A: Istio Service Mesh & PeerAuthentication */}
            <div className="live-network-col">
              <div className="network-section-card">
                <div className="section-card-header">
                  <div className="card-title-box">
                    <Lock size={15} className="title-icon text-cyan" />
                    <span className="card-title-text">Istio mTLS & PeerAuthentication</span>
                  </div>
                  <span className="card-badge cyan">
                    {data.peerAuthentications.length} Configured
                  </span>
                </div>

                <div className="section-card-content">
                  {data.peerAuthenticationsError ? (
                    <div className="partial-error-box">
                      <AlertTriangle size={13} />
                      <span>{data.peerAuthenticationsError}</span>
                    </div>
                  ) : data.peerAuthentications.length === 0 ? (
                    <div className="empty-sub-state">No PeerAuthentication resources found.</div>
                  ) : (
                    <div className="peer-auth-list">
                      {data.peerAuthentications.map((pa) => (
                        <div key={pa.name} className="peer-auth-item">
                          <div className="pa-top-row">
                            <span className="pa-name">{pa.name}</span>
                            <span className={`pa-mode-badge ${pa.mode === 'STRICT' ? 'strict' : 'permissive'}`}>
                              Mode: {pa.mode}
                            </span>
                          </div>
                          <div className="pa-meta-row">
                            <span className="meta-label">Scope:</span>
                            <span className="scope-tag">
                              {pa.workloadScoped ? 'Workload-Scoped (Selected Pods Only)' : 'Namespace-Wide'}
                            </span>
                          </div>
                          <div className="pa-meta-row">
                            <span className="meta-label">Selector:</span>
                            {renderSelector(pa.selector.matchLabels)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Workload Sidecar Telemetry Subtable */}
                  <div className="workload-sidecar-subview">
                    <div className="subview-sub-header">
                      <Cpu size={13} className="text-muted" />
                      <span>Integration Workload Sidecars ({data.workloads.length})</span>
                    </div>

                    {data.workloadsError ? (
                      <div className="partial-error-box">
                        <AlertTriangle size={13} />
                        <span>{data.workloadsError}</span>
                      </div>
                    ) : data.workloads.length === 0 ? (
                      <div className="empty-sub-state">No integration pods discovered.</div>
                    ) : (
                      <div className="workload-sidecar-table-wrapper">
                        <table className="workload-sidecar-table">
                          <thead>
                            <tr>
                              <th>Pod Name</th>
                              <th>Phase</th>
                              <th>Sidecar Presence</th>
                              <th>Injection Point</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.workloads.map((w: LiveSecurityNetworkWorkload) => {
                              const hasSidecar = w.sidecar.present;
                              return (
                                <tr key={w.name} className="workload-row">
                                  <td className="cell-pod-name">
                                    <code className="pod-code" title={w.name}>
                                      {w.name}
                                    </code>
                                  </td>
                                  <td>
                                    <span className={`phase-badge ${w.phase.toLowerCase()}`}>
                                      {w.phase}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`sidecar-badge ${hasSidecar ? 'present' : 'absent'}`}>
                                      {hasSidecar ? (
                                        <>
                                          <CheckCircle2 size={11} />
                                          <span>Present ({w.sidecar.containerName})</span>
                                        </>
                                      ) : (
                                        <>
                                          <XCircle size={11} />
                                          <span>No Sidecar (Direct)</span>
                                        </>
                                      )}
                                    </span>
                                  </td>
                                  <td className="cell-location">
                                    <code className="loc-code">
                                      {w.sidecar.location === 'initContainers'
                                        ? 'spec.initContainers (Native)'
                                        : w.sidecar.location === 'containers'
                                        ? 'spec.containers'
                                        : 'none'}
                                    </code>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Column B: Calico / Kubernetes NetworkPolicies */}
            <div className="live-network-col">
              <div className="network-section-card">
                <div className="section-card-header">
                  <div className="card-title-box">
                    <Network size={15} className="title-icon text-blue" />
                    <span className="card-title-text">Calico / K8s NetworkPolicies</span>
                  </div>
                  <span className="card-badge blue">
                    {data.networkPolicies.length} Active
                  </span>
                </div>

                <div className="section-card-content">
                  {data.networkPoliciesError ? (
                    <div className="partial-error-box">
                      <AlertTriangle size={13} />
                      <span>{data.networkPoliciesError}</span>
                    </div>
                  ) : data.networkPolicies.length === 0 ? (
                    <div className="empty-sub-state">No NetworkPolicy resources found.</div>
                  ) : (
                    <div className="network-policy-list">
                      {data.networkPolicies.map((np: LiveSecurityNetworkPolicy) => {
                        const hasIngressRules = np.ingress && np.ingress.length > 0;
                        return (
                          <div key={np.name} className="netpol-item">
                            <div className="netpol-header-row">
                              <span className="netpol-name">{np.name}</span>
                              <div className="netpol-types">
                                {np.policyTypes.map((pt) => (
                                  <span key={pt} className="policy-type-tag">
                                    {pt}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="netpol-meta-row">
                              <span className="meta-label">Applies To:</span>
                              {renderSelector(np.podSelector.matchLabels)}
                              <span className="scope-tag workload">Selected Pods</span>
                            </div>

                            <div className="netpol-rules-box">
                              <span className="rules-heading">Ingress Rule Configuration:</span>
                              {!hasIngressRules ? (
                                <div className="rule-deny-pill">
                                  <ShieldAlert size={12} className="text-amber" />
                                  <span>Default Ingress Deny — Ingress array is empty (blocks all incoming traffic to selected pods unless allowed by another policy)</span>
                                </div>
                              ) : (
                                <div className="rule-allow-list">
                                  {np.ingress.map((rule, rIdx) => (
                                    <div key={rIdx} className="rule-entry">
                                      <div className="rule-from-row">
                                        <span className="from-label">From Workload:</span>
                                        {rule.from.length === 0 ? (
                                          <span className="text-muted">Any source</span>
                                        ) : (
                                          rule.from.map((peer, pIdx) => (
                                            <span key={pIdx} className="peer-match">
                                              {peer.podSelector?.matchLabels
                                                ? renderSelector(peer.podSelector.matchLabels)
                                                : 'Unrestricted peer'}
                                            </span>
                                          ))
                                        )}
                                      </div>
                                      <div className="rule-ports-row">
                                        <span className="ports-label">Allowed Ports:</span>
                                        {rule.ports.length === 0 ? (
                                          <span className="text-muted">All ports</span>
                                        ) : (
                                          rule.ports.map((p, pIdx) => (
                                            <code key={pIdx} className="port-tag">
                                              {p.protocol}/{p.port ?? 'Any'}
                                            </code>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
