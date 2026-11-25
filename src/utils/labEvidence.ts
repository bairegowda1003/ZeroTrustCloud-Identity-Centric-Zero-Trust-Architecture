import type { CommandSources, Observation } from '../hooks/useCommandSources';
import { policyContext, networkContext } from './commandTopology';
import type { LiveKubernetesStatusResponse } from './kubernetesStatus';
import { contextOf, scopeNotes } from '../components/verification/verificationDomains';

export const fixedContexts = [policyContext, networkContext] as const;
export type ClusterFeed = Observation<LiveKubernetesStatusResponse>;

export function environmentStatus(feed: ClusterFeed) {
  if (feed.staleReason) return 'Cluster status API · ' + feed.staleReason;
  if (feed.isLoading) return 'Checking cluster status API';
  return feed.data ? 'Cluster status API reachable' : 'Cluster status API unavailable';
}

export const technologies = {
  policyNodes: { name: 'Kubernetes', context: policyContext, endpoint: '/api/cluster/status', checks: ['k8s-cluster-readiness-lab'] },
  gatekeeper: { name: 'Gatekeeper', context: policyContext, endpoint: '/api/policies/gatekeeper',
    checks: ['gatekeeper-constraints-inventory','gatekeeper-enforcement-action-deny','gatekeeper-scope-workload-deployments','gatekeeper-webhook-enforced'] },
  networkNodes: { name: 'Kubernetes', context: networkContext, endpoint: '/api/cluster/status', checks: ['k8s-cluster-readiness-network-lab'] },
  calico: { name: 'Calico', context: networkContext, endpoint: '/api/security/network', checks: ['calico-default-deny-server','calico-allow-authorized-server'] },
  istio: { name: 'Istio', context: networkContext, endpoint: '/api/security/network',
    checks: ['istio-control-plane-ready','istio-workload-strict-mtls','istio-sidecar-injection-posture'] },
  spire: { name: 'SPIRE', context: networkContext, endpoint: '/api/identity/workloads', checks: ['spire-control-plane-components','spire-workload-registration'] },
  workloads: { name: 'Workload identity', context: networkContext, endpoint: '/api/identity/workloads', checks: ['workload-service-accounts','workload-lifecycle-and-identity'] },
};
export type Technology = keyof typeof technologies;
type Entry = { resource: string; observation: string };
type Inventory = { title: string; entries?: Entry[]; error?: string | null };
const entry = (resource: string, observation: string): Entry => ({ resource, observation });
const labels = (map: Record<string,string>) => Object.entries(map).map(([k,v]) => k + '=' + v).join(', ') || 'all workloads';
const replicas = (ready: number | null, desired: number | null) =>
  'Ready replicas ' + (ready ?? 'unreported') + ' · Desired ' + (desired ?? 'unreported');
const readinessLimit = 'Node conditions describe the collected Kubernetes readiness state. Application health requires separate evidence.';

export function labEvidence(id: Technology, sources: CommandSources) {
  const { context, checks: ids } = technologies[id];
  const identity = sources.identity.data;
  const network = sources.network.data;
  const policy = sources.policy.data;
  const ns = 'trustmesh-integration-test';
  const n = network?.cluster === context && network.namespace === ns && network.available ? network : undefined;
  const i = identity?.cluster === context && identity.namespace === ns && identity.available ? identity : undefined;
  const inventories: Inventory[] = [];
  let limit = readinessLimit;
  let feed: Observation<{collectedAt: string}> = sources.cluster;
  let headline = '';
  switch (id) {
    case 'policyNodes':
    case 'networkNodes': {
      const record = sources.cluster.data?.clusters.find(c => c.context === context);
      headline = !record ? 'Context unreported' : !record.connected ? 'Context unreachable' : !record.nodes.length ? 'Readiness unknown' :
        record.nodes.every(node => node.ready) ? 'Nodes ready' : 'Nodes not ready';
      inventories.push({title: 'Node conditions', entries: record?.connected ? record.nodes.map(node =>
        entry('Node/' + node.name, node.ready ? 'Ready' : 'Not ready')) : undefined });
      break;
    }
    case 'gatekeeper': {
      feed = sources.policy;
      limit = scopeNotes['Policy enforcement']!;
      const constraints = policy?.available && policy.cluster === context ? policy.constraints : undefined;
      if (constraints) headline = constraints.length + ' constraints';
      inventories.push({title: 'Constraint inventory', error: policy?.error, entries: constraints?.map(c => {
        const kinds = c.match.kinds.map(k => (k.apiGroups?.join(', ') || 'core / unspecified') + ' / ' + (k.kinds?.join(', ') || 'unspecified')).join(', ');
        const webhook = c.webhookEnforced === null ? 'unreported' : c.webhookEnforced ? 'enforced' : 'not enforced';
        return entry(c.kind + '/' + c.name, 'Action ' + (c.enforcementAction ?? 'unreported') + ' · Scope ' +
          (kinds || 'no explicit kind filter') + ' · Namespaces ' + (c.match.namespaces.join(', ') || 'no explicit namespace filter') + ' · Webhook ' + webhook);
      })});
      break;
    }
    case 'calico':
      feed = sources.network;
      limit = scopeNotes['Network isolation']!;
      if (n?.networkPoliciesAvailable) headline = n.networkPolicies.length + ' policies';
      inventories.push({title: 'NetworkPolicies', error: n?.networkPoliciesError,
        entries: n?.networkPoliciesAvailable ? n.networkPolicies.map(p => entry(ns + '/NetworkPolicy/' + p.name,
          p.policyTypes.join(', ') + ' · Target ' + labels(p.podSelector.matchLabels) + ' · Ingress rules ' + p.ingress.length)) : undefined});
      break;
    case 'istio':
      feed = sources.network;
      if (n?.peerAuthenticationsAvailable) headline = n.peerAuthentications.length + (n.peerAuthentications.length === 1 ? ' mTLS policy' : ' mTLS policies');
      limit = scopeNotes['Istio mTLS']!;
      inventories.push({title: 'Control plane', error: n?.istiod.error, entries: n?.istiod.available ?
        [entry(n.istioSystemNamespace + '/Deployment/' + n.istiod.name, (n.istiod.ready ? 'Ready' : 'Not ready') + ' · ' + replicas(n.istiod.readyReplicas,n.istiod.desiredReplicas))] : undefined},
        {title: 'PeerAuthentication', error: n?.peerAuthenticationsError, entries: n?.peerAuthenticationsAvailable ?
          n.peerAuthentications.map(p => entry(ns + '/PeerAuthentication/' + p.name, p.mode + ' · ' +
            (p.workloadScoped ? 'Workload selector ' + labels(p.selector.matchLabels) : 'Namespace scope'))) : undefined},
        {title: 'Pod sidecars', error: n?.workloadsError, entries: n?.workloadsAvailable ? n.workloads.map(p =>
          entry(ns + '/Pod/' + p.name, p.sidecar.present ? (p.sidecar.containerName ?? 'Sidecar') + ' · ' + (p.sidecar.ready ? 'Ready' : 'Not ready') : 'No sidecar reported')) : undefined});
      break;
    case 'spire':
      feed = sources.identity;
      if (i?.spireComponents.length && i.spireComponents.every(c => c.available && c.readyReplicas !== null && c.desiredReplicas !== null)) {
        const ready = i.spireComponents.filter(c => c.desiredReplicas! > 0 && c.readyReplicas === c.desiredReplicas).length;
        headline = ready + '/' + i.spireComponents.length + ' controllers ready';
      }
      limit = scopeNotes['SPIRE & workload identity']!;
      for (const c of i?.spireComponents ?? []) {
        inventories.push({title: c.available ? c.kind + ' readiness' : 'trustmesh-spire/' + c.kind + '/' + c.name, error: c.error, entries: c.available ?
          [entry('trustmesh-spire/' + c.kind + '/' + c.name, replicas(c.readyReplicas,c.desiredReplicas))] : undefined});
      }
      if (!i?.spireComponents.length) inventories.push({title:'Controller readiness'});
      inventories.push({title:'ClusterSPIFFEID registration', error:i?.spireRegistration.error, entries: i?.spireRegistration.available ?
        [entry('ClusterSPIFFEID/' + i.spireRegistration.name, (i.spireRegistration.spiffeIDTemplate ?? 'Template unreported') +
          ' · Namespace selector ' + (i.spireRegistration.namespaceSelector ? JSON.stringify(i.spireRegistration.namespaceSelector) : 'unreported') +
          ' · Pod selector ' + (i.spireRegistration.podSelector ? JSON.stringify(i.spireRegistration.podSelector) : 'unreported'))] : undefined});
      break;
    case 'workloads':
      feed = sources.identity;
      limit = scopeNotes['SPIRE & workload identity']!;
      if (i) headline = i.workloads.length + ' pods';
      inventories.push({title:'Pod identity bindings', entries:i?.workloads.map(p => entry(ns + '/Pod/' + p.name,
        p.phase + ' · ServiceAccount/' + p.serviceAccountName))},
        {title:'ServiceAccounts', entries:i?.serviceAccounts.map(sa => entry(ns + '/ServiceAccount/' + sa.name,'Present in inventory'))});
      break;
  }
  const available = inventories.filter(inventory => inventory.entries !== undefined).length;
  const coverage = !available ? 'Unavailable' : available < inventories.length ? 'Partial' : 'Observed';
  const state = feed.staleReason ? 'Last known' : feed.isLoading ? 'Collecting' : coverage;
  const checks = sources.verification.data?.checks.filter(c => contextOf(c.source) === context && ids.includes(c.id)) ?? [];
  return { ...technologies[id], headline, state, coverage, feed, inventories, limit, checks };
}
