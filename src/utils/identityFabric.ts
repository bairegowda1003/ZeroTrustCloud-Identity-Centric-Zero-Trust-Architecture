import type { LiveIdentityWorkloadsResponse, LiveIdentityWorkloadPod, LiveSpireComponent } from './identityWorkloads';

export function replicaReadiness(component: LiveSpireComponent) {
  const { available, readyReplicas: ready, desiredReplicas: desired } = component;
  if (!available) return 'Unavailable';
  if (ready == null || desired == null || ready > desired) return 'Unknown';
  return `${ready}/${desired} replicas ready`;
}

// The collector supplies selected pod labels and the namespace name, not a complete label inventory.
// Only draw a selector edge when every predicate can be established from those fields.
function labelMatch(selector: Record<string, unknown> | null, labels: Record<string, string>): boolean | undefined {
  if (!selector || Object.keys(selector).some(key => key !== 'matchLabels')) return undefined;
  const required = 'matchLabels' in selector ? selector.matchLabels : {};
  if (!required || typeof required !== 'object' || Array.isArray(required)) return undefined;
  let known = true;
  for (const [key, value] of Object.entries(required)) {
    if (typeof value !== 'string' || !Object.prototype.hasOwnProperty.call(labels,key)) known = false;
    else if (labels[key] !== value) return false;
  }
  return known ? true : undefined;
}

export function registrationMatch(data: LiveIdentityWorkloadsResponse, pod: LiveIdentityWorkloadPod) {
  if (!data.available || !data.spireRegistration.available) return undefined;
  const { namespaceSelector, podSelector } = data.spireRegistration;
  const results = [labelMatch(namespaceSelector, {'kubernetes.io/metadata.name': data.namespace}), labelMatch(podSelector,pod.labels)];
  if (results.includes(false)) return false;
  return results.every(value => value === true) ? true : undefined;
}

export function identityRelationships(data: LiveIdentityWorkloadsResponse) {
  const pods = data.available ? data.workloads : [];
  const discovered = new Set(data.available ? data.serviceAccounts.map(sa => sa.name) : []);
  const accounts = Array.from(new Set([...pods.map(p => p.serviceAccountName), ...discovered]), name => ({
    name, discovered: discovered.has(name), isDefault: name === 'default', pods: pods.filter(p => p.serviceAccountName === name),
  }));
  return {pods, accounts, selectedPods: pods.filter(p => registrationMatch(data,p) === true)};
}
