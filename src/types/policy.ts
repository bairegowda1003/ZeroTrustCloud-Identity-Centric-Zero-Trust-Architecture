export type DataSourceType = 'DEMO' | 'LIVE CLUSTER' | 'AUDIT';

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
  sourceType: DataSourceType; // "DEMO" | "LIVE CLUSTER" | "AUDIT"
  linkedFindingId?: string;
}
