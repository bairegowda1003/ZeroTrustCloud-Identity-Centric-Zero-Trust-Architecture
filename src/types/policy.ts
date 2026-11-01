/**
 * TrustMesh Phase 3: Policy-as-Code & Kubernetes Admission Control Data Types
 * Aligned with OPA Gatekeeper v3.15.0 ConstraintTemplates and Constraints
 */

export type EnforcementAction = 'deny' | 'dryrun' | 'warn';

export type PolicyStatus = 'active' | 'enforcing' | 'audit_only' | 'disabled';

export type DataSourceType = 'TEST EVIDENCE' | 'LIVE CLUSTER' | 'AUDIT';

export interface GatekeeperPolicyRecord {
  id: string; // e.g., "POL-ADM-01"
  name: string; // e.g., "Require Non-Root Execution"
  templateKind: string; // "K8sRequireNonRoot"
  constraintName: string; // "require-nonroot"
  category: 'Pod Security Baseline' | 'Identity Hardening' | 'Kernel Isolation';
  enforcementAction: EnforcementAction;
  status: PolicyStatus;
  description: string;
  securityObjective: string;
  targetKinds: string[]; // ["Pod", "Deployment", "StatefulSet", "Job"]
  excludedNamespaces: string[]; // ["kube-system", "gatekeeper-system", "kube-public"]
  regoSource: string; // Real Rego code
  violationTemplateMessage: string;
  remediationGuidance: string;
  remediationSnippet: string;
  activeViolationsCount: number; // Derived dynamically
  blockedAdmissionsCount: number; // Derived dynamically
  linkedFindingId: string; // Points to Phase 1 finding (e.g. TM-SEC-102)
  isLabFixture: boolean;
}

export interface AdmissionDecisionRecord {
  id: string; // e.g., "ADM-201"
  timestamp: string; // ISO or formatted timestamp
  workloadName: string; // "test-violation-root"
  workloadKind: string; // "Pod" | "Deployment" | "Job"
  namespace: string; // "web", "orders", "payments", "security"
  evaluatingPolicyId: string; // "POL-ADM-01"
  evaluatingPolicyName: string; // "Require Non-Root Execution"
  decision: 'ALLOW' | 'DENY';
  reason: string;
  rawWebhookResponse: string; // Raw Kubernetes admission webhook error output
  sourceType: DataSourceType; // "TEST EVIDENCE" | "LIVE CLUSTER" | "AUDIT"
  linkedFindingId?: string;
}

export interface PolicyAuditViolationRecord {
  id: string;
  workloadName: string;
  namespace: string;
  kind: string;
  policyId: string;
  policyName: string;
  violationMessage: string;
  severity: 'critical' | 'high' | 'medium';
  firstDetected: string;
  linkedFindingId?: string;
}

export interface PolicyMetricSummary {
  totalPolicies: number;
  enforcedPolicies: number;
  auditOnlyPolicies: number;
  totalDecisions: number;
  admittedCount: number;
  deniedCount: number;
  activeAuditViolations: number;
}

