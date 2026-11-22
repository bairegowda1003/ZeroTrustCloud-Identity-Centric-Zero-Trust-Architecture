import React from 'react';
import { SnapshotTime } from './SnapshotTime';
import type { CommandSources, Observation } from '../hooks/useCommandSources';
import {
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Box,
  Check,
  Radio,
} from 'lucide-react';

import { LiveKubernetesStatusResponse, KubernetesWorkloadPod } from '../utils/kubernetesStatus';
export type { KubernetesNodeStatus, KubernetesClusterStatus, KubernetesWorkloadPod, KubernetesIntegrationStatus, LiveKubernetesStatusResponse } from '../utils/kubernetesStatus';

export function LiveKubernetesStatus({ source, identity, network }: { source: Observation<LiveKubernetesStatusResponse>; identity: CommandSources['identity']; network: CommandSources['network'] }) {
  const { data, error, isLoading, staleReason, refresh: fetchStatus, retrievedAt } = source;
  const isStale = Boolean(staleReason);
  const getPodStatusInfo = (pod: KubernetesWorkloadPod) => {
    const isSucceeded = pod.phase === 'Succeeded';
    const isRunning = pod.phase === 'Running';
    const isAllReady = pod.totalContainers > 0 && pod.readyContainers === pod.totalContainers;

    if (isSucceeded) {
      return {
        badgeLabel: 'Succeeded',
        phaseClass: 'phase-succeeded',
        isHealthy: true,
        summary: 'Completed',
        description: 'API reports pod phase Succeeded',
        containersLabel: `${pod.readyContainers}/${pod.totalContainers} containers ready at collection`,
      };
    }

    if (isRunning && isAllReady) {
      return {
        badgeLabel: 'Running',
        phaseClass: 'phase-running-healthy',
        isHealthy: true,
        summary: 'Ready',
        description: 'All reported containers ready at collection',
        containersLabel: `${pod.readyContainers}/${pod.totalContainers} containers ready`,
      };
    }

    if (isRunning && !isAllReady) {
      return {
        badgeLabel: 'Running (Degraded)',
        phaseClass: 'phase-running-degraded',
        isHealthy: false,
        summary: 'Not Ready',
        description: 'Not all reported containers are ready; cause not supplied',
        containersLabel: `${pod.readyContainers}/${pod.totalContainers} containers ready`,
      };
    }

    return {
      badgeLabel: pod.phase,
      phaseClass: 'phase-failed',
      isHealthy: false,
      summary: pod.phase,
      description: `Pod status reported as ${pod.phase}`,
      containersLabel: `${pod.readyContainers}/${pod.totalContainers} containers ready`,
    };
  };

  const inventory=identity.data;
  const networkData=network.data;
  const sameScope=networkData && inventory && networkData.cluster===inventory.cluster && networkData.namespace===inventory.namespace;
  // The cluster snapshot omits cluster identity. Compare displayed fields only;
  // never use these rows to attribute a workload to a cluster.
  const comparable = data?.integration.available && inventory?.available &&
    inventory.namespace === data.integration.namespace;
  const additionalPods = data?.integration.pods.filter(pod => !comparable || !inventory.workloads.some(
    other => other.name === pod.name && other.phase === pod.phase &&
      other.readyContainers === pod.readyContainers && other.totalContainers === pod.totalContainers
  )) ?? [];
  const identityOnly = comparable ? inventory.workloads.filter(pod =>
    !data.integration.pods.some(other => other.name === pod.name)) : [];
  return (
    <>
      <section className="tm-workloads">
        <header><div><h2>Workload explorer</h2><p className="tm-inventory-context">{inventory?.namespace} {inventory?.available && <b>{inventory.workloads.length} workloads</b>}</p></div>
          <button onClick={()=>{identity.refresh();network.refresh()}} disabled={identity.isLoading || network.isLoading}><RefreshCw size={14}/> Refresh workloads</button></header>
        <small>{inventory?.cluster}</small>
        <div className="tm-source-line">Identity inventory &middot; {identity.staleReason && 'Last known / '}{identity.staleReason || (identity.isLoading?'Loading':inventory?.available?'Observed':'Unavailable')} <SnapshotTime value={inventory?.collectedAt}/> {identity.error || inventory?.error}</div>
        <div className="tm-source-line">Sidecar inventory &middot; {network.staleReason && 'Last known / '}{network.staleReason || (network.isLoading?'Loading':networkData?.available && networkData.workloadsAvailable?'Reported':'Unavailable')} <SnapshotTime value={networkData?.collectedAt}/> {network.error || networkData?.workloadsError || networkData?.error}</div>
        {inventory?.available && !inventory.workloads.length && <p>No workloads reported in this namespace.</p>}
        {inventory?.available && inventory.workloads.length>0 && <div className="tm-workload-columns" aria-hidden="true"><span/><span>Pod name</span><span>Lifecycle</span><span>Readiness</span><span>Sidecar</span></div>}
        {inventory?.available && inventory.workloads.map(pod=>{
          const status=getPodStatusInfo(pod);
          const networkPod=sameScope && networkData.available && networkData.workloadsAvailable ? networkData.workloads.find(item=>item.name===pod.name):undefined;
          const sidecar=networkPod?.sidecar;
          return <details className="tm-workload" key={pod.name}>
            <summary><Box size={17}/><strong>{pod.name}</strong><span className="tm-pod-phase" data-phase={pod.phase}>{pod.phase}</span><span>{pod.readyContainers}/{pod.totalContainers} ready</span><span>{sidecar ? sidecar.present?'Sidecar present':'No sidecar reported':'Sidecar unknown'}</span></summary>
            <dl><dt>Lifecycle</dt><dd>{status.summary} &middot; {status.description}</dd>
            <dt>ServiceAccount</dt><dd>{pod.serviceAccountName}</dd>
            <dt>Labels</dt><dd>{JSON.stringify(pod.labels)}</dd>
            <dt>Identity source</dt><dd>/api/identity/workloads &middot; <SnapshotTime value={inventory.collectedAt}/> {identity.staleReason}</dd>
            <dt>Sidecar</dt><dd>{sidecar?.present ? [sidecar.containerName,sidecar.location,sidecar.ready?'Ready':'Not ready'].join(' / ') : sidecar?'Reported absent':'Unknown'}</dd>
            <dt>Network source</dt><dd>/api/security/network &middot; <SnapshotTime value={networkData?.collectedAt} fallback="Unavailable"/> {network.staleReason}</dd></dl>
          </details>;
        })}
      </section>
      <details className="tm-cluster-inventory"><summary>Cluster, node &amp; namespace inventory</summary>
      <div className="live-k8s-panel" role="region" aria-label="Kubernetes API Snapshot">
        {/* 1. Header Bar with Explicit Provenance and Actions */}
        <div className="live-k8s-header">
          <div className="live-k8s-title-group">
            <div className="live-k8s-icon-box" aria-hidden="true">
              <Server size={18} />
            </div>
            <div className="live-k8s-title-text">
              <div className="live-k8s-heading-row">
                <h2 className="live-k8s-heading">Kubernetes environment</h2>

                {/* Explicit Provenance Badge: ONLY shown when validated live response is present */}
                {data && !error && !isStale && (
                  <span className="live-source-badge validated" title="Schema-checked snapshot from the Kubernetes status API; not security telemetry">
                    <span className="live-pulse-dot" />
                    LIVE SOURCE - SNAPSHOT
                  </span>
                )}

                {/* Stale Warning Badge if refresh fails after previous success */}
                {isStale && (
                  <span className="live-source-badge stale" title={staleReason ?? undefined}>
                    <AlertTriangle size={12} />
                    LAST KNOWN SNAPSHOT
                  </span>
                )}

                {/* Disconnected / Error Badge if no data can be retrieved */}
                {!data && error && (
                  <span className="live-source-badge disconnected" title="No live connection established">
                    <XCircle size={12} />
                    CONNECTION UNAVAILABLE
                  </span>
                )}

                {/* Initial Loading Badge */}
                {isLoading && !data && (
                  <span className="live-source-badge loading">
                    <RefreshCw size={12} className="spin-icon" />
                    CONNECTING...
                  </span>
                )}
              </div>
              <p className="live-k8s-subheading">
                Cluster connectivity and node readiness from the Kubernetes API. Snapshots expire after 60 seconds.
              </p>
            </div>
          </div>

          {/* Right Header Metadata & Manual Refresh Button */}
          <div className="live-k8s-controls">
            {data?.collectedAt && (
              <div className="live-timestamp-box" title={`API collection timestamp: ${data.collectedAt}`}>
                <Clock size={13} className="text-muted" />
                <span className="live-timestamp-label">API collected:</span>
                <span className="live-timestamp-val"><SnapshotTime value={data.collectedAt}/></span>
              </div>
            )}

            {retrievedAt && (
              <div className="live-timestamp-box">
                <span className="live-timestamp-label">Browser retrieved:</span>
                <span className="live-timestamp-val"><SnapshotTime value={retrievedAt}/></span>
              </div>
            )}
            <button
              className={`live-refresh-btn ${isLoading ? 'loading' : ''}`}
              onClick={fetchStatus}
              disabled={isLoading}
              aria-label="Refresh live Kubernetes status"
              title="Poll GET /api/cluster/status for current cluster state"
            >
              <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
              <span>{isLoading ? 'Polling API...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {isStale && <div className="live-error-banner" role="status">Last known snapshot: {staleReason}. Values below describe the previous collection, not current state.</div>}
        {/* 2. Error Notice Banner (When refresh fails or connection is down) */}
        {error && (
          <div className="live-error-banner" role="alert">
            <AlertTriangle size={16} className="text-amber" />
            <div className="live-error-content">
              <span className="live-error-title">{data ? 'Cluster refresh failed' : 'Cluster snapshot unavailable'}</span>
              <span className="live-error-desc">{error}</span>
              {!data && (
                <span className="live-error-fallback-note">
                  (Strict Data Integrity: No demonstration values or mock clusters are substituted.)
                </span>
              )}
            </div>
            {!data && (
              <button className="live-retry-btn" onClick={fetchStatus} disabled={isLoading}>
                Retry Connection
              </button>
            )}
          </div>
        )}

        {/* 3. Main Data Body: Rendered ONLY when authentic data is available */}
        {data && (
          <div className="live-k8s-body">
            {/* Dual Cluster Cards Grid */}
            <div className="live-clusters-grid">
              {data.clusters.length === 0 && <p>No clusters reported by the API.</p>}
              {data.clusters.map((cluster) => {
                const isClusterConnected = cluster.connected;
                const allNodesReady = cluster.connected && cluster.nodes.length > 0 && cluster.nodes.every((n) => n.ready);

                return (
                  <div
                    key={cluster.name}
                    className={`live-cluster-card ${isClusterConnected ? 'connected' : 'disconnected'}`}
                  >
                    <div className="cluster-card-top">
                      <div className="cluster-info-left">
                        <div className="cluster-avatar">
                          <Radio size={15} />
                        </div>
                        <div className="cluster-names-col">
                          <div className="cluster-name-row">
                            <span className="cluster-display-name">Cluster: {cluster.name}</span>
                            <span className={`cluster-state-pill ${isClusterConnected ? 'state-active' : 'state-down'}`}>
                              {isClusterConnected ? (
                                <>
                                  <Check size={11} /> Connected
                                </>
                              ) : (
                                <>
                                  <XCircle size={11} /> Unreachable
                                </>
                              )}
                            </span>
                          </div>
                          <span className="cluster-context-mono">{cluster.context}</span>
                        </div>
                      </div>

                      <div className="cluster-readiness-chip">
                        <span className={`readiness-dot ${allNodesReady ? 'ready' : 'not-ready'}`} />
                        <span>{!cluster.connected ? 'Readiness unavailable' : cluster.nodes.length === 0 ? 'No nodes reported' : allNodesReady ? 'Nodes Ready' : 'Nodes Not Ready'}</span>
                      </div>
                    </div>

                    {/* Nodes List */}
                    <div className="cluster-nodes-list">
                      <span className="cluster-nodes-caption">Nodes (roles not supplied):</span>
                      {cluster.nodes.length === 0 && <p>No node inventory available.</p>}
                      {cluster.nodes.map((node) => (
                        <div key={node.name} className="node-item-row">
                          <div className="node-item-name">
                            <CpuIcon size={13} className="text-muted" />
                            <span>{node.name}</span>
                          </div>
                          <span className={`node-status-tag ${cluster.connected && node.ready ? 'ready' : 'degraded'}`}>
                            {!cluster.connected ? 'Unknown (cluster unreachable)' : node.ready ? 'Ready' : 'NotReady'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
        {/* 4. Skeleton Loading Placeholder (when initial request is pending) */}
        {isLoading && !data && (
          <div className="live-k8s-skeleton">
            <div className="skeleton-grid">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
            <div className="skeleton-table" />
          </div>
        )}
      </div>
    {data && (
        <div className="command-workloads">
          {/* Integration Namespace Workload Inventory */}
          <div className="live-integration-section">
            <div className="integration-section-header">
              <div className="integration-header-left">
                <Layers size={16} className="text-cyan" />
                <div className="integration-header-text">
                  <h3 className="integration-title">Namespace observation</h3>
                  <span className="integration-namespace-badge">
                    Namespace: <strong>{data.integration.namespace}</strong>
                  </span>
                </div>
              </div>

              <div className="integration-header-right">
                <span className={`integration-avail-badge ${data.integration.available ? 'available' : 'unavailable'}`}>
                  {data.integration.available ? (
                    <>
                      <CheckCircle2 size={13} /> Namespace Available
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} /> Namespace Unavailable
                    </>
                  )}
                </span>
                <span className="integration-count-pill">{data.integration.pods.length} Pods</span>
              </div>
            </div>

            <p className="live-k8s-subheading">Inventory scope: the API-reported namespace; the response does not identify its cluster.</p>
            {data.integration.pods.length > additionalPods.length && <p className="tm-source-line">{data.integration.pods.length-additionalPods.length} pod records match the name, lifecycle and readiness in Workload Explorer (identity collection <SnapshotTime value={inventory?.collectedAt}/>).</p>}
            {!data.integration.available && <p>Pod inventory unavailable for this namespace.</p>}
            {data.integration.available && !data.integration.pods.length && <p>No pods reported in this namespace.</p>}
            {identityOnly.length>0 && <details><summary>Workloads reported only by the identity API ({identityOnly.length})</summary>
              <p>Namespace comparison at cluster collection <SnapshotTime value={data.collectedAt}/> and identity collection <SnapshotTime value={inventory?.collectedAt}/>.</p>
              <ul>{identityOnly.map(pod=><li key={pod.name}>{pod.name}</li>)}</ul>
            </details>}
            {additionalPods.length>0 && <details><summary>Inspect additional or differing cluster-status records ({additionalPods.length})</summary>
            <div className="live-pods-table-wrap">
              <table className="live-pods-table" aria-label="Integration Pods">
                <thead>
                  <tr>
                    <th scope="col">Workload Pod Name</th>
                    <th scope="col">Phase</th>
                    <th scope="col">Container Readiness</th>
                    <th scope="col">Reported Lifecycle Status</th>
                  </tr>
                </thead>
                <tbody>
                  {additionalPods.map((pod) => {
                    const statusInfo = getPodStatusInfo(pod);

                    return (
                      <tr key={pod.name} className={`pod-row ${statusInfo.isHealthy ? 'row-healthy' : 'row-attention'}`}>
                        <td className="pod-name-cell">
                          <div className="pod-name-box">
                            <Box size={14} className="pod-icon" />
                            <span className="pod-name-str" title={pod.name}>
                              {pod.name}
                            </span>
                          </div>
                        </td>
                        <td className="pod-phase-cell">
                          <span className={`pod-phase-badge ${statusInfo.phaseClass}`}>
                            {statusInfo.isHealthy && <span className="pod-phase-dot" />}
                            {statusInfo.badgeLabel}
                          </span>
                        </td>
                        <td className="pod-containers-cell">
                          <div className="pod-containers-box">
                            <span className="containers-ratio-val">
                              {pod.readyContainers}/{pod.totalContainers}
                            </span>
                            <span className="containers-sublabel">{statusInfo.containersLabel}</span>
                          </div>
                        </td>
                        <td className="pod-status-cell">
                          <span className={`pod-summary-tag ${statusInfo.isHealthy ? 'healthy' : 'attention'}`}>
                            {statusInfo.summary}
                          </span>
                          <span className="pod-summary-desc">{statusInfo.description}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></details>}
          </div>
        </div>
      )}
      </details>
    </>
  );
};

// Internal mini icon helper for nodes
const CpuIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M15 2v2" />
    <path d="M15 20v2" />
    <path d="M2 15h2" />
    <path d="M2 9h2" />
    <path d="M20 15h2" />
    <path d="M20 9h2" />
    <path d="M9 2v2" />
    <path d="M9 20v2" />
  </svg>
);
