export type SecurityDomain = 
  | 'IDENTITY' 
  | 'ADMISSION_POLICY' 
  | 'NETWORK_MTLS' 
  | 'AUTHORIZATION' 
  | 'SUPPLY_CHAIN';

export type SecuritySeverity = 
  | 'CRITICAL' 
  | 'HIGH' 
  | 'MEDIUM' 
  | 'LOW' 
  | 'INFORMATIONAL';

export type EventOutcome = 
  | 'ALLOWED' 
  | 'DENIED' 
  | 'CONNECTION_RESET' 
  | 'ALERT' 
  | 'AUDIT';

export type DataProvenance = 
  | 'LIVE_COLLECTOR' 
  | 'TESTBED_AUDIT' 
  | 'LAB_FIXTURE';

export interface NormalizedSecurityEvent {
  eventId: string; // "EVT-2026-8910"
  correlationId: string; // "CORR-ORD-4819"
  sourceTimestamp: string; // Timestamp at origin component
  collectionTimestamp: string; // Timestamp ingested by OpenTelemetry collector
  sourceComponent: 'GATEKEEPER' | 'ISTIO_ENVOY' | 'SPIRE_AGENT' | 'AQUA_TRIVY' | 'COSIGN_PROVIDER' | 'KUBE_API';
  domain: SecurityDomain;
  severity: SecuritySeverity;
  affectedResource: string; // e.g. "deployment/order-api"
  workloadName: string; // "order-api"
  namespace: string; // "orders"
  outcome: EventOutcome;
  ruleId: string; // "RULE-SUPPLY-COSIGN-01", "K8sAllowedUsers", etc.
  description: string;
  findingRef?: 'TM-SEC-101' | 'TM-SEC-102' | 'TM-SEC-103' | 'TM-SEC-104' | 'TM-SEC-105' | 'TM-SEC-106';
  evidenceReference: string; // File path, digest, or cluster resource
  evidencePayload: Record<string, any>;
  dataProvenance: DataProvenance;
  collectorStatus: 'HEALTHY' | 'BUFFERED' | 'STANDALONE';
}

export interface ZeroTrustEvaluationControl {
  id: string; // "CTL-01"
  controlName: string;
  category: SecurityDomain;
  mathematicalFormula: string;
  numeratorLabel: string;
  numeratorValue: number;
  denominatorLabel: string;
  denominatorValue: number;
  calculatedScore: number; // e.g. 80.0
  targetThreshold: number; // e.g. 80.0
  passStatus: 'PASSED' | 'FAILED' | 'WARNING';
  observationWindow: string; // "Continuous" | "Rolling 1h" | "Testbed Audit"
  dataSource: string; // "SPIRE Agent API" | "Envoy /stats" | "Gatekeeper Audit"
  evidenceCitation: string;
  dataProvenance: DataProvenance;
}

export interface TelemetryScraperHealth {
  service: string; // "OpenTelemetry Collector" | "Prometheus" | "Loki" | "Grafana"
  version: string;
  role: string;
  endpoint: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  lastScraped: string;
  recordsIngested: number;
}

export interface ObservabilitySummary {
  totalEventsMonitored: number;
  activeAlertsCount: number;
  evaluatedZeroTrustScore: number; // Weighted percentage (e.g. 88.5%)
  violationsPreventedCount: number;
  collectorAvailabilityPercent: number; // 100.0%
  transitFreshnessMs: number; // 1240 ms p95
  pipelineEngineStatus: {
    otelVersion: string;
    prometheusVersion: string;
    lokiVersion: string;
    grafanaVersion: string;
  };
}

