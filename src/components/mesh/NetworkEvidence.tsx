import React from 'react';
import type { LiveSecurityNetworkResponse as Network, LiveSecurityNetworkWorkload as Pod, LiveSecurityNetworkPolicy as Policy } from '../../utils/securityNetwork';
import type { VerificationCheck } from '../../utils/securityVerification';
import { SnapshotTime } from '../SnapshotTime';

export const networkEndpoint = '/api/security/network';
export const verificationEndpoint = '/api/security/verification';
export const labels = (values: Record<string,string>) => Object.entries(values).map(([k,v]) => k + '=' + v).join(', ');
export const podTitle = ({labels: l, name}: Pod) => {
  if (l['trustmesh.io/test'] === 'plaintext-negative' || l.app === 'trustmesh-integration-plaintext') return 'Plaintext client';
  if (l.app === 'trustmesh-integration-server') return 'Integration server';
  if (l.app === 'trustmesh-integration-verifier') return 'SPIFFE verifier';
  if (l.app === 'trustmesh-integration-client' && l.role === 'authorized') return 'Authorized client';
  if (l.app === 'trustmesh-integration-client' && l.role === 'unauthorized') return 'Unauthorized client';
  return name;
};
export function Policies({items, available}: {items: Policy[]; available: boolean}) {
  if (!available || !items.length) return <p>{available ? 'No matching NetworkPolicies reported.' : 'NetworkPolicy inventory unavailable.'}</p>;
  const targets = [...new Set(items.map(p => labels(p.podSelector.matchLabels) || 'All Pods in namespace'))];
  const shared = items.length > 1 && targets.length === 1;
  return <>{shared && <p>Shared Pod selector · <code>{targets[0]}</code></p>}
    {items.map(p => <article key={p.name}><strong>{p.name}</strong>{!shared && <p>Pod selector · <code>{labels(p.podSelector.matchLabels) || 'All Pods in namespace'}</code></p>}
    <p>{p.policyTypes.join(' / ')}{p.policyTypes.includes('Ingress') && !p.ingress.length && ' · No ingress allowances in this policy'}</p>
    {p.ingress.map((r,i) => <div key={i} className="ns-rule"><b>Ingress rule {i+1}</b><p>{r.from.map(peer => [
      peer.namespaceSelector ? 'Namespace selector: ' + (labels(peer.namespaceSelector.matchLabels ?? {}) || 'all') : peer.podSelector ? 'Same namespace' : '',
      peer.podSelector ? 'Pod selector: ' + (labels(peer.podSelector.matchLabels ?? {}) || 'all') : ''
    ].filter(Boolean).join(' · ') || 'Peer selector unspecified').join(' OR ') || 'Any source'}</p><code>{r.ports.map(port => port.protocol + '/' + (port.port ?? 'any')).join(', ') || 'All ports'}</code></div>)}</article>)}</>;
}
export function MeshPolicies({data}: {data: Network | null}) {
  if (!data?.available || !data.peerAuthenticationsAvailable) return <p>PeerAuthentication inventory unavailable.</p>;
  return <>{data.peerAuthentications.map(p => <article key={p.name}><strong>{p.name}</strong><p>{p.mode} · {p.workloadScoped ? 'Workload-scoped' : 'Namespace scope'}</p><code>{labels(p.selector.matchLabels) || 'All workloads in namespace'}</code></article>)}{!data.peerAuthentications.length && <p>No PeerAuthentication reported.</p>}</>;
}
export function PodEvidence({pod}: {pod: Pod}) {
  const s = pod.sidecar;
  return <article><strong>{pod.name}</strong><p>{pod.phase}{pod.phase === 'Succeeded' && ' · Completed workload'}</p><code>{labels(pod.labels)}</code>
    <p>{s.present ? `${s.containerName ?? 'Sidecar'} · ${s.location} · ${s.ready ? 'ready' : 'not ready'}` : 'No Istio sidecar reported'}</p></article>;
}
export function Checks({items}: {items: VerificationCheck[]}) {
  if (!items.length) return <p>UNKNOWN · No related check reported.</p>;
  return <div className="ns-checks">{items.map(c => <details key={c.id}>
    <summary><span className={'ns-verdict ns-'+c.status}>{c.status}</span><span>{c.control}</span></summary>
    <p>{c.reason}</p><small>{verificationEndpoint} · {c.source} · <SnapshotTime value={c.observedAt}/></small>
  </details>)}</div>;
}
