import {
  NormalizedSecurityEvent,
  ZeroTrustEvaluationControl,
  TelemetryScraperHealth,
  ObservabilitySummary
} from '../types/observability';

export const INITIAL_OBSERVABILITY_SUMMARY: ObservabilitySummary = {
  totalEventsMonitored: 8,
  activeAlertsCount: 5,
  evaluatedZeroTrustScore: 88.5,
  violationsPreventedCount: 5,
  collectorAvailabilityPercent: 100.0,
  transitFreshnessMs: 1240,
  pipelineEngineStatus: {
    otelVersion: 'v0.105.0',
    prometheusVersion: 'v2.54.1',
    lokiVersion: 'v3.0.0',
    grafanaVersion: 'v11.1.0'
  }
};

export const SCRAPER_HEALTH_RECORDS: TelemetryScraperHealth[] = [
  {
    service: 'OpenTelemetry Collector',
    version: 'v0.105.0',
    role: 'Central Telemetry Ingestion & Normalization',
    endpoint: 'otel-collector.observability:4317',
    status: 'ONLINE',
    latencyMs: 12,
    lastScraped: 'Just now (15s ago)',
    recordsIngested: 84192
  },
  {
    service: 'Prometheus TSDB',
    version: 'v2.54.1',
    role: 'Time-Series Security Metrics & Alert Rules',
    endpoint: 'prometheus.observability:9090',
    status: 'ONLINE',
    latencyMs: 18,
    lastScraped: 'Just now (15s ago)',
    recordsIngested: 312040
  },
  {
    service: 'Grafana Loki',
    version: 'v3.0.0',
    role: 'Structured Security Audit Log Storage',
    endpoint: 'loki.observability:3100',
    status: 'ONLINE',
    latencyMs: 25,
    lastScraped: 'Just now (15s ago)',
    recordsIngested: 154800
  },
  {
    service: 'Grafana Visualizer',
    version: 'v11.1.0',
    role: 'Zero Trust Posture & Audit Dashboards',
    endpoint: 'grafana.observability:3000',
    status: 'ONLINE',
    latencyMs: 8,
    lastScraped: 'Just now (30s ago)',
    recordsIngested: 12
  }
];

export const ZERO_TRUST_EVALUATION_CONTROLS: ZeroTrustEvaluationControl[] = [
  {
    id: 'CTL-01',
    controlName: 'Workload Cryptographic Attestation Rate',
    category: 'IDENTITY',
    mathematicalFormula: '(Active Verified SVIDs / Total Monitored Workloads) * 100',
    numeratorLabel: 'Active SVIDs (trustmesh.internal)',
    numeratorValue: 4,
    denominatorLabel: 'Monitored Workloads',
    denominatorValue: 5,
    calculatedScore: 80.0,
    targetThreshold: 80.0,
    passStatus: 'PASSED',
    observationWindow: '1-hour renewal cycle',
    dataSource: 'SPIRE Agent Workload API & Server Registration',
    evidenceCitation: 'k8s/spire/04-workload-registrations.yaml',
    dataProvenance: 'TESTBED_AUDIT'
  },
  {
    id: 'CTL-02',
    controlName: 'Zero-Plaintext Service Mesh mTLS Compliance',
    category: 'NETWORK_MTLS',
    mathematicalFormula: '(TLS 1.3 Negotiated Handshakes / Total Inbound Handshakes) * 100',
    numeratorLabel: 'Strict TLS 1.3 Handshakes',
    numeratorValue: 1240,
    denominatorLabel: 'Inter-Service Inbound Requests',
    denominatorValue: 1240,
    calculatedScore: 100.0,
    targetThreshold: 100.0,
    passStatus: 'PASSED',
    observationWindow: 'Rolling 1-hour window',
    dataSource: 'Istio Envoy Connection Security Telemetry',
    evidenceCitation: 'k8s/istio/01-peer-authentication-strict.yaml',
    dataProvenance: 'TESTBED_AUDIT'
  },
  {
    id: 'CTL-03',
    controlName: 'Policy Admission Enforcement Rate',
    category: 'ADMISSION_POLICY',
    mathematicalFormula: '(Blocked Non-Compliant Requests / Total Non-Compliant Attempts) * 100',
    numeratorLabel: 'Enforced 403 Rejections',
    numeratorValue: 4,
    denominatorLabel: 'Non-Compliant Manifest Submissions',
    denominatorValue: 4,
    calculatedScore: 100.0,
    targetThreshold: 100.0,
    passStatus: 'PASSED',
    observationWindow: 'Testbed Execution Suite',
    dataSource: 'OPA Gatekeeper Validating Webhook Decision Logs',
    evidenceCitation: 'k8s/policies/tests/run-all-tests.ps1',
    dataProvenance: 'TESTBED_AUDIT'
  },
  {
    id: 'CTL-04',
    controlName: 'Software Supply Chain Signature Verification Rate',
    category: 'SUPPLY_CHAIN',
    mathematicalFormula: '(Verified Image Manifest Digests / Total Container Images) * 100',
    numeratorLabel: 'Verified Cosign Signatures',
    numeratorValue: 4,
    denominatorLabel: 'Evaluated Container Images',
    denominatorValue: 5,
    calculatedScore: 80.0,
    targetThreshold: 80.0,
    passStatus: 'PASSED',
    observationWindow: 'Continuous Ingestion',
    dataSource: 'Gatekeeper Cosign External Data Provider',
    evidenceCitation: 'k8s/supply-chain/cosign/signatures/verified-signatures.json',
    dataProvenance: 'TESTBED_AUDIT'
  },
  {
    id: 'CTL-05',
    controlName: 'Critical Vulnerability Quarantining Rate',
    category: 'SUPPLY_CHAIN',
    mathematicalFormula: '(Blocked Critical CVE Deployments / Total Critical CVE Deployments) * 100',
    numeratorLabel: 'Quarantined CVE Deployments',
    numeratorValue: 1,
    denominatorLabel: 'Attempted Critical CVE Images',
    denominatorValue: 1,
    calculatedScore: 100.0,
    targetThreshold: 100.0,
    passStatus: 'PASSED',
    observationWindow: 'Pre-deployment Gate',
    dataSource: 'Aqua Trivy Vulnerability Threshold Policy',
    evidenceCitation: 'k8s/supply-chain/trivy/reports/order-api-v1.1-vuln.json',
    dataProvenance: 'TESTBED_AUDIT'
  },
  {
    id: 'CTL-06',
    controlName: 'Telemetry Scraper Endpoint Availability',
    category: 'AUTHORIZATION',
    mathematicalFormula: '(Active Health Endpoints / Configured Scraper Endpoints) * 100',
    numeratorLabel: 'Healthy Scraper Endpoints',
    numeratorValue: 4,
    denominatorLabel: 'Configured Telemetry Collectors',
    denominatorValue: 4,
    calculatedScore: 100.0,
    targetThreshold: 100.0,
    passStatus: 'PASSED',
    observationWindow: '30-second Health Probe',
    dataSource: 'OpenTelemetry & Prometheus Collector Probes',
    evidenceCitation: 'k8s/observability/otel/01-otel-collector-config.yaml',
    dataProvenance: 'TESTBED_AUDIT'
  }
];

export const CORRELATED_SECURITY_EVENTS: NormalizedSecurityEvent[] = [
  {
    eventId: 'EVT-2026-001',
    correlationId: 'CORR-ORD-4819',
    sourceTimestamp: '2026-11-01T14:22:00Z',
    collectionTimestamp: '2026-11-01T14:22:01.240Z',
    sourceComponent: 'SPIRE_AGENT',
    domain: 'IDENTITY',
    severity: 'INFORMATIONAL',
    affectedResource: 'pod/order-api-7b89f4c89-2xz9l',
    workloadName: 'order-api',
    namespace: 'orders',
    outcome: 'ALLOWED',
    ruleId: 'SPIRE-WORKLOAD-ATTESTATION',
    description: 'Kernel and cgroup attestation verified. Short-lived X.509 SVID credential issued for spiffe://trustmesh.internal/ns/orders/sa/order-api-sa.',
    evidenceReference: 'k8s/spire/04-workload-registrations.yaml',
    evidencePayload: {
      spiffeId: 'spiffe://trustmesh.internal/ns/orders/sa/order-api-sa',
      trustDomain: 'trustmesh.internal',
      ttlSeconds: 3600,
      issuer: 'spire-server.spire-system.svc.cluster.local'
    },
    dataProvenance: 'TESTBED_AUDIT',
    collectorStatus: 'HEALTHY'
  },
  {
    eventId: 'EVT-2026-002',
    correlationId: 'CORR-ID-9921',
    sourceTimestamp: '2026-11-01T13:45:10Z',
    collectionTimestamp: '2026-11-01T13:45:11.190Z',
    sourceComponent: 'SPIRE_AGENT',
    domain: 'IDENTITY',
    severity: 'HIGH',
    affectedResource: 'pod/customer-reporting-cron-88a',
    workloadName: 'customer-reporting-cron',
    namespace: 'analytics-jobs',
    outcome: 'DENIED',
    ruleId: 'RULE-ID-SPIFFE-ATTEST-02',
    description: 'Workload attestation failed: pod binary hash does not match registered SPIRE selectors. SVID issuance denied.',
    findingRef: 'TM-SEC-106',
    evidenceReference: 'spire-agent socket /run/spire/sockets/workload_api.sock',
    evidencePayload: {
      selectorMismatch: 'k8s:sa:default',
      attestationVerdict: 'UNREGISTERED_BINARY',
      action: 'DENY_SVID_ISSUANCE'
    },
    dataProvenance: 'TESTBED_AUDIT',
    collectorStatus: 'HEALTHY'
  },
  {
    eventId: 'EVT-2026-003',
    correlationId: 'CORR-GATE-1044',
    sourceTimestamp: '2026-11-01T14:20:15Z',
    collectionTimestamp: '2026-11-01T14:20:16.310Z',
    sourceComponent: 'GATEKEEPER',
    domain: 'ADMISSION_POLICY',
    severity: 'INFORMATIONAL',
    affectedResource: 'deployment/order-api-v1-2-compliant',
    workloadName: 'order-api',
    namespace: 'orders',
    outcome: 'ALLOWED',
    ruleId: 'K8sSecurityBaseline',
    description: 'Validating admission review passed: Workload conforms to non-root execution, read-only rootfs, and token projection constraints.',
    evidenceReference: 'k8s/supply-chain/tests/01-compliant-signed-workload.yaml',
    evidencePayload: {
      reviewStatus: 'ALLOWED',
      evaluatedConstraints: ['K8sAllowedUsers', 'K8sReadOnlyRootFilesystem', 'K8sRequireServiceAccountTokenProjection'],
      httpCode: 201
    },
    dataProvenance: 'TESTBED_AUDIT',
    collectorStatus: 'HEALTHY'
  },
  {
    eventId: 'EVT-2026-004',
    correlationId: 'CORR-POL-3021',
    sourceTimestamp: '2026-11-01T12:10:45Z',
    collectionTimestamp: '2026-11-01T12:10:46.850Z',
    sourceComponent: 'GATEKEEPER',
    domain: 'ADMISSION_POLICY',
    severity: 'CRITICAL',
    affectedResource: 'daemonset/legacy-node-exporter',
    workloadName: 'legacy-node-exporter',
    namespace: 'monitoring-system',
    outcome: 'DENIED',
    ruleId: 'RULE-POL-PRIVILEGED-04',
    description: 'Admission rejected: Workload specification requested privileged securityContext (runAsUser: 0 / root execution prohibited).',
    findingRef: 'TM-SEC-102',
    evidenceReference: 'k8s/policies/tests/negative-tests/01-privileged-pod.yaml',
    evidencePayload: {
      deniedBy: 'K8sAllowedUsers',
      violationField: 'spec.containers[0].securityContext.runAsUser',
      violationValue: 0,
      admissionVerdict: 'DENIED_403_FORBIDDEN'
    },
    dataProvenance: 'TESTBED_AUDIT',
    collectorStatus: 'HEALTHY'
  },
  {
    eventId: 'EVT-2026-005',
    correlationId: 'CORR-MESH-7714',
    sourceTimestamp: '2026-11-01T11:30:00Z',
    collectionTimestamp: '2026-11-01T11:30:01.420Z',
    sourceComponent: 'ISTIO_ENVOY',
    domain: 'NETWORK_MTLS',
    severity: 'CRITICAL',
    affectedResource: 'service/internal-ledger.finance-core:8080',
    workloadName: 'internal-ledger',
    namespace: 'finance-core',
    outcome: 'CONNECTION_RESET',
    ruleId: 'RULE-MESH-MTLS-PERMISSIVE-02',
    description: 'Inbound TCP connection reset: Client attempted plaintext communication on port 8080 without mTLS handshake. Terminated by STRICT PeerAuthentication policy.',
    findingRef: 'TM-SEC-103',
    evidenceReference: 'k8s/istio/01-peer-authentication-strict.yaml',
    evidencePayload: {
      protocol: 'TCP_PLAINTEXT',
      tlsNegotiation: 'NONE (Client offered no certificate)',
      terminationReason: 'PEER_AUTHENTICATION_STRICT_FAILED',
      socketAction: 'ECONNRESET'
    },
    dataProvenance: 'TESTBED_AUDIT',
    collectorStatus: 'HEALTHY'
  },
  {
    eventId: 'EVT-2026-006',
    correlationId: 'CORR-SUP-1102',
    sourceTimestamp: '2026-11-01T14:21:40Z',
    collectionTimestamp: '2026-11-01T14:21:41.050Z',
    sourceComponent: 'COSIGN_PROVIDER',
    domain: 'SUPPLY_CHAIN',
    severity: 'INFORMATIONAL',
    affectedResource: 'image/trustmesh/order-api:v1.2',
    workloadName: 'order-api',
    namespace: 'orders',
    outcome: 'ALLOWED',
    ruleId: 'RULE-SUPPLY-COSIGN-01',
    description: 'Cosign External Data Provider successfully verified cryptographic signature for digest sha256:7b129c... against cosign.pub [Key ID: 0x8F4A1B9C].',
    evidenceReference: 'k8s/supply-chain/cosign/signatures/verified-signatures.json',
    evidencePayload: {
      imageDigest: 'sha256:7b129c54e0821dfa92918bc3251ee2d744f456108e427d1421008064953bfcb4',
      signer: 'cosign.pub [Key ID: 0x8F4A1B9C]',
      rekorIndex: 842109,
      verificationStatus: 'VERIFIED'
    },
    dataProvenance: 'TESTBED_AUDIT',
    collectorStatus: 'HEALTHY'
  },
  {
    eventId: 'EVT-2026-007',
    correlationId: 'CORR-SUP-5582',
    sourceTimestamp: '2026-11-01T10:45:00Z',
    collectionTimestamp: '2026-11-01T10:45:01.320Z',
    sourceComponent: 'COSIGN_PROVIDER',
    domain: 'SUPPLY_CHAIN',
    severity: 'CRITICAL',
    affectedResource: 'image/docker.io/commerce/checkout-gateway:v2.1',
    workloadName: 'checkout-gateway',
    namespace: 'prod-commerce',
    outcome: 'DENIED',
    ruleId: 'RULE-SUPPLY-COSIGN-01',
    description: 'Admission rejected: Container image lacks required Sigstore Cosign digital signature. Blocked by Gatekeeper External Data webhook under fail-closed policy.',
    findingRef: 'TM-SEC-101',
    evidenceReference: 'k8s/supply-chain/tests/02-unsigned-image-workload.yaml',
    evidencePayload: {
      providerError: 'no_signatures_found',
      admissionVerdict: 'DENIED_403_FORBIDDEN',
      targetImage: 'docker.io/commerce/checkout-gateway:v2.1'
    },
    dataProvenance: 'TESTBED_AUDIT',
    collectorStatus: 'HEALTHY'
  },
  {
    eventId: 'EVT-2026-008',
    correlationId: 'CORR-TRIVY-8841',
    sourceTimestamp: '2026-11-01T08:14:22Z',
    collectionTimestamp: '2026-11-01T08:14:23.410Z',
    sourceComponent: 'AQUA_TRIVY',
    domain: 'SUPPLY_CHAIN',
    severity: 'CRITICAL',
    affectedResource: 'image/trustmesh/mysql-proxy:cache',
    workloadName: 'mysql-proxy-cache',
    namespace: 'database-tier',
    outcome: 'DENIED',
    ruleId: 'CVE-2024-21508',
    description: 'Promotion quarantined: Aqua Trivy static scan identified 1 CRITICAL CVE (CVE-2024-21508 in mysql2@3.9.2, CVSS 8.8) exceeding vulnerability policy threshold.',
    findingRef: 'TM-SEC-105',
    evidenceReference: 'k8s/supply-chain/trivy/reports/order-api-v1.1-vuln.json',
    evidencePayload: {
      cveId: 'CVE-2024-21508',
      pkgName: 'mysql2',
      installedVersion: '3.9.2',
      fixedVersion: '3.9.4',
      cvssScore: 8.8,
      policyAction: 'IMMEDIATE_QUARANTINE'
    },
    dataProvenance: 'TESTBED_AUDIT',
    collectorStatus: 'HEALTHY'
  }
];

