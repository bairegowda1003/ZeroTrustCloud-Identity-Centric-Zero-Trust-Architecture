import type { VerificationCheck } from '../../utils/securityVerification';

export const domains = [
  'Kubernetes readiness', 'Policy enforcement', 'Network isolation',
  'Istio mTLS', 'SPIRE & workload identity', 'Other controls'
] as const;
export function domainOf(id: string) {
  const prefix = id.split('-')[0];
  switch (prefix) {
    case 'k8s': return domains[0];
    case 'gatekeeper': return domains[1];
    case 'calico': return domains[2];
    case 'istio': return domains[3];
    case 'spire': case 'workload': return domains[4];
    default: return domains[5];
  }
}
const captions: Record<string,string> = {
  'k8s-cluster-readiness-lab':'Lab nodes',
  'k8s-cluster-readiness-network-lab':'Network lab nodes',
  'gatekeeper-constraints-inventory':'Constraint inventory',
  'gatekeeper-enforcement-action-deny':'Deny configuration',
  'gatekeeper-scope-workload-deployments':'Deployment scope',
  'gatekeeper-webhook-enforced':'Webhook posture',
  'calico-default-deny-server':'Default-deny ingress',
  'calico-allow-authorized-server':'Authorized ingress',
  'istio-control-plane-ready':'Control plane',
  'istio-workload-strict-mtls':'Workload STRICT policy',
  'istio-sidecar-injection-posture':'Sidecar injection',
  'spire-control-plane-components':'SPIRE components',
  'spire-workload-registration':'Workload registration',
  'workload-service-accounts':'ServiceAccounts',
  'workload-lifecycle-and-identity':'Pod identity bindings'
};
export const caption = (check: VerificationCheck) => captions[check.id] ?? check.control;
export const scopeNotes: Partial<Record<typeof domains[number],string>> = {
  'Policy enforcement':'Deny configuration describes policy posture. Audit violation counts cannot establish how many admission requests were blocked.',
  'Network isolation':'Selectors and ingress rules describe configured access. Packet outcomes require a traffic test.',
  'Istio mTLS':'Workload-scoped STRICT policy and sidecar configuration alone cannot establish encryption on every connection.',
  'SPIRE & workload identity':'Registration and ServiceAccount bindings describe identity configuration. Current SVID validity requires separate evidence. Istio uses its own certificate authority in this lab.'
};
export const contextOf = (source: string) => source.includes(' / ') ? source.split(' / ')[0].trim() : '';
