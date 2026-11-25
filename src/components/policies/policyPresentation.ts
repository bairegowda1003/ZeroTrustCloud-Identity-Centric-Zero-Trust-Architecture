import type { LiveGatekeeperConstraint as Constraint } from '../../utils/gatekeeperPolicies';

const policies = {
  'trustmesh-container-security': ['Container security', 'shield'],
  'trustmesh-require-dedicated-sa': ['Dedicated ServiceAccount', 'key'],
  'trustmesh-workload-hardening': ['Workload hardening', 'layers'],
} as const;
export function guardian(name: string) {
  return Object.prototype.hasOwnProperty.call(policies, name)
    ? policies[name as keyof typeof policies] : [name, 'generic'] as const;
}
export function scope(c: Constraint) {
  const resources = c.match.kinds.flatMap(k =>
    (k.apiGroups ?? []).flatMap(group => (k.kinds ?? []).map(kind => (group || 'core') + '/' + kind)));
  return { resources: resources.join(', ') || 'Unspecified resources',
    namespaces: c.match.namespaces.join(', ') || 'Unspecified namespaces' };
}
export function webhook(value: boolean | null) {
  return value === true ? 'Reported enforced' : value === false ? 'Reported unenforced' : 'Unknown';
}
export function summary(rows: Constraint[]) {
  const scopes = rows.map(scope);
  const common = scopes[0] && scopes.every(s => s.resources === scopes[0].resources && s.namespaces === scopes[0].namespaces);
  return {
    scope: common ? scopes[0] : {resources: rows.length ? 'Multiple scopes' : 'Scope unavailable', namespaces: rows.length ? 'See constraint evidence' : 'No reported target'},
    webhook: rows.length && rows.every(c => c.webhookEnforced === rows[0].webhookEnforced)
      ? webhook(rows[0].webhookEnforced) : rows.length ? 'Mixed reports' : 'Unknown',
    violations: rows.length && rows.every(c => c.audit.totalViolations !== null)
      ? rows.reduce((sum, c) => sum + c.audit.totalViolations!, 0) : 'Unknown',
  };
}
