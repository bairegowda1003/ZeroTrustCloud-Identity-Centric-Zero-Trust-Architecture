import type { CommandSources, Observation } from '../hooks/useCommandSources';
import type { ActiveModule } from '../types/security';

export const policyContext = 'kind-trustmesh-lab';
export const networkContext = 'kind-trustmesh-network-lab';
const namespace = 'trustmesh-integration-test';
export interface TopologyNode {
  id: string;
  label: string;
  context: string;
  securityFunction: string;
  summary: string;
  source: string;
  state: string;
  reason: string | null;
  time?: string;
  evidence: string[];
  route: ActiveModule;
  verdict?: string;
}

const functions: Record<string,string> = {
  admission:'Admission control environment', fabric:'Network and identity environment',
  gate:'Admission policy', calico:'Network isolation', istio:'Peer authentication',
  spire:'Workload identity registration', pods:'Workload lifecycle', sidecars:'Service mesh sidecar inventory',
};

function node<T extends { collectedAt: string }>(
  id: string, label: string, context: string, source: string, snapshot: Observation<T>,
  available: boolean, category: string, evidence: string[], route: ActiveModule,
): TopologyNode {
  const state = snapshot.staleReason ? 'Stale' : snapshot.isLoading ? 'Loading' : available ? category : 'Unavailable';
  return { id, label, context, securityFunction:functions[id], summary:'', source, state, time: snapshot.data?.collectedAt,
    reason: snapshot.staleReason || snapshot.error || (!available && snapshot.data ? 'No matching resource observation available.' : null),
    evidence, route };
}

export function topologyNodes(s: CommandSources) {
  const clusters = [policyContext, networkContext].map((context, i) => {
    const c = s.cluster.data?.clusters.find(item => item.context === context);
    const evidence = c ? [c.connected ? 'Cluster reachable' : 'Cluster unreachable',
      ...c.nodes.map(n => n.name + ' · ' + (!c.connected ? 'Readiness unknown' : n.ready ? 'Ready' : 'Not ready'))] : [];
    return node(i ? 'fabric' : 'admission', i ? 'Network & identity' : 'Admission cluster', context,
      '/api/cluster/status', s.cluster, !!c, c?.connected ? 'Observed' : 'Unreachable', evidence, i ? 'service_mesh' : 'policy_governance');
  });
  const p = s.policy.data;
  const n = s.network.data;
  const i = s.identity.data;
  const policies = p?.cluster === policyContext && p.available ? p.constraints : undefined;
  const networkScoped = n?.cluster === networkContext && n.namespace === namespace && n.available;
  const identityScoped = i?.cluster === networkContext && i.namespace === namespace && i.available;
  const np = networkScoped && n.networkPoliciesAvailable ? n.networkPolicies : undefined;
  const mtls = networkScoped && n.peerAuthenticationsAvailable ? n.peerAuthentications : undefined;
  const registration = identityScoped && i.spireRegistration.available ? i.spireRegistration : undefined;
  const sidecars=networkScoped && n.workloadsAvailable ? n.workloads : undefined;
  const records: Record<string,unknown> = {
    admission:s.cluster.data?.clusters.find(c=>c.context===policyContext),
    fabric:s.cluster.data?.clusters.find(c=>c.context===networkContext),
    gate:policies, calico:np, istio:mtls, spire:identityScoped ? i.spireRegistration : undefined,
    pods:identityScoped ? i.workloads : undefined, sidecars,
  };
  return [...clusters,
    node('gate','Gatekeeper','Admission policy','/api/policies/gatekeeper',s.policy,!!policies,policies?.length?'Configured':'None reported',
      policies?.map(c => c.name + ' · ' + (c.enforcementAction ?? 'action unknown') + ' · namespaces ' + JSON.stringify(c.match.namespaces)) ?? [],'policy_governance'),
    node('calico','Calico','Network isolation','/api/security/network',s.network,!!np,np?.length?'Configured':'None reported',
      np?.map(p => p.name + ' · targets ' + JSON.stringify(p.podSelector) + ' · ' + p.policyTypes.join(', ')) ?? [],'service_mesh'),
    node('istio','Istio','Peer authentication','/api/security/network',s.network,!!mtls,mtls?.length?'Configured':'None reported',
      mtls?.map(a => a.name + ' · ' + a.mode + ' · selector ' + JSON.stringify(a.selector)) ?? [],'service_mesh'),
    node('spire','SPIRE','Workload registration','/api/identity/workloads',s.identity,!!registration,'Configured',
      registration ? [registration.name, registration.spiffeIDTemplate ?? 'Template unavailable', 'Pod selector ' + JSON.stringify(registration.podSelector)] : [],'workload_identity'),
    node('pods','Integration workloads',namespace,'/api/identity/workloads',s.identity,!!identityScoped,'Observed',
      identityScoped ? i.workloads.map(w => w.name + ' · ' + w.phase + ' · ' + w.readyContainers + '/' + w.totalContainers + ' ready · SA ' + w.serviceAccountName) : [],'workload_identity'),
    node('sidecars','Sidecar inventory',namespace,'/api/security/network',s.network,!!networkScoped && !!n?.workloadsAvailable,'Observed',
      networkScoped && n.workloadsAvailable ? n.workloads.map(w => w.name + ' · ' + (w.sidecar.present ? w.sidecar.containerName + ' present in ' + w.sidecar.location : 'No sidecar reported')) : [],'service_mesh'),
  ].map(n => {
    const groups: Record<string, (id: string) => boolean> = {
      admission: id => id === 'k8s-cluster-readiness-lab',
      fabric: id => id === 'k8s-cluster-readiness-network-lab',
      gate: id => id.startsWith('gatekeeper-'),
      calico: id => id.startsWith('calico-'),
      istio: id => id.startsWith('istio-') && !id.includes('sidecar'),
      spire: id => id.startsWith('spire-'),
      pods: id => id.startsWith('workload-'),
      sidecars: id => id === 'istio-sidecar-injection-posture',
    };
    const checks = s.verification.data?.checks.filter(c => groups[n.id](c.id)) ?? [];
    const verdict = checks.length ? ['FAIL','UNKNOWN','PASS'].find(status => checks.some(c => c.status === status)) : undefined;
    let summary = 'No resource observation available.';
    if (n.state==='Loading') summary='Collecting resource evidence.';
    if (n.id==='admission' || n.id==='fabric') {
      const cluster=s.cluster.data?.clusters.find(c=>c.context===n.context);
      if(cluster) summary=cluster.connected ? 'Cluster reachable. '+cluster.nodes.filter(node=>node.ready).length+' of '+cluster.nodes.length+' reported nodes ready.' : 'The cluster was reported unreachable.';
    } else if(n.id==='gate' && policies) {
      summary=policies.length+' constraints reported, '+policies.filter(c=>c.enforcementAction==='deny').length+' configured with deny.';
    } else if(n.id==='calico' && np) {
      summary=np.length+' network policies reported in '+namespace+'.';
    } else if(n.id==='istio' && mtls) {
      summary=mtls.length ? mtls.map(a=>a.mode+' mTLS configured for '+(Object.keys(a.selector.matchLabels).length?'the selected workloads':'the reported scope')).join('; ')+'.' : 'No peer authentication records reported.';
    } else if(n.id==='spire' && registration) {
      summary='A SPIRE registration was reported'+(registration.podSelector?' with a pod selector.':'.');
    } else if(n.id==='pods' && identityScoped) {
      summary=i.workloads.length+' workloads reported in '+i.namespace+'.';
    } else if(n.id==='sidecars' && sidecars) {
      summary=sidecars.filter(w=>w.sidecar.present).length+' of '+sidecars.length+' reported workloads have a sidecar.';
    }
    return { ...n, summary, records:records[n.id], verdict: s.verification.staleReason ? undefined : verdict, checks };
  });
}
