/**
 * TrustMesh Phase 2: Workload Identity Data Types
 * Aligned with Kubernetes Service Accounts and Cloud-Native Identity Standards
 */

export type WorkloadType = 'Deployment' | 'StatefulSet' | 'DaemonSet' | 'Job';

export type IdentityVerificationStatus = 'verified' | 'attention_required' | 'rejected' | 'pending';

export type WorkloadAuthMethod = 'k8s_service_account' | 'projected_sa_token' | 'unbound_default';

export interface WorkloadIdentityRecord {
  id: string; // e.g., "WKL-PAY-01"
  name: string; // e.g., "payment-service"
  workloadType: WorkloadType;
  namespace: string; // "payments", "orders", "web", "security"
  cluster: string; // "kind-trustmesh-lab"
  
  // Kubernetes Identity Details
  serviceAccount: string; // e.g., "payment-service-sa"
  serviceAccountUid: string;
  podNames: string[]; // e.g., ["payment-service-7f884b655b-4k8xm"]
  authMethod: WorkloadAuthMethod;
  automountServiceAccountToken: boolean;
  
  // Zero-Trust Status & Enforcement
  status: IdentityVerificationStatus;
  statusReason: string; // Detailed human/engineer readable audit explanation
  lastVerified: string; // ISO timestamp
  
  // Least-privilege communication boundary definitions
  allowedIngressSources: string[]; // e.g., ["frontend-proxy.web", "order-api.orders"]
  allowedEgressDestinations: string[]; // e.g., ["database-cluster.payments", "audit-collector.security"]
  assignedPolicyNames: string[]; // e.g., ["k8s-netpol-payment-isolation", "strict-workload-identity"]
  
  // Integration with Phase 1 Findings
  linkedFindingId?: string; // If attention_required or rejected, points to Finding ID
  isLabFixture: boolean; // Honestly declares if simulated fixture or live discovered
}

export interface VerificationEventRecord {
  id: string;
  timestamp: string;
  sourceWorkload: string;
  sourceServiceAccount: string;
  sourceNamespace: string;
  targetService: string;
  targetNamespace: string;
  authMethod: WorkloadAuthMethod;
  decision: 'ALLOW' | 'DENY';
  reason: string;
  linkedPolicy: string;
}

export interface IdentityModuleSummary {
  totalWorkloads: number;
  verifiedCount: number;
  attentionCount: number;
  rejectedCount: number;
  verificationRatePercent: number;
}

export interface VerificationScenario {
  id: string;
  title: string;
  sourceWorkload: string;
  sourceSA: string;
  sourceNamespace: string;
  targetService: string;
  targetNamespace: string;
  method: WorkloadAuthMethod;
  expectedDecision: 'ALLOW' | 'DENY';
  decisionBadge: 'ALLOW' | 'DENY';
  auditReason: string;
  explanation: string;
}

