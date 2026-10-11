export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export type FindingStatus = 'new' | 'in_progress' | 'resolved' | 'suppressed';

export type SecurityDomain = 
  | 'identity' 
  | 'policy' 
  | 'service_mesh' 
  | 'supply_chain' 
  | 'workload_runtime';

export interface AttackPathStep {
  step: number;
  label: string;
  type: 'attacker' | 'ingress' | 'workload' | 'exploit' | 'impact';
  details: string;
}

export interface SecurityFinding {
  id: string;
  title: string;
  cveOrRuleId: string;
  severity: FindingSeverity;
  riskScore: number; // 0 - 100
  domain: SecurityDomain;
  status: FindingStatus;
  affectedAsset: string;
  cluster: string;
  namespace: string;
  description: string;
  threatImpact: string;
  zeroTrustPrincipleViolated: string;
  remediationGuidance: string;
  regoOrConfigSnippet?: string;
  firstDetected: string;
  lastObserved: string;
  attackPath: AttackPathStep[];
  isDemoData: true; // Enforces honest data tagging
}

export interface IntegrationProvider {
  id: string;
  name: string;
  shortName: string;
  category: 'Cloud Provider' | 'Policy Engine' | 'Service Mesh' | 'Identity Attestor' | 'Supply Chain';
  status: 'Not Connected' | 'Planned Phase 3' | 'Planned Phase 4' | 'Planned Phase 5';
  targetPhase: string;
  description: string;
  plannedCapability: string;
  healthScore: number | null;
}

export type ActiveModule = 
  | 'command_center'
  | 'workload_identity'
  | 'policy_governance'
  | 'service_mesh'
  | 'supply_chain'
  | 'experiments'
  | 'integrations';
