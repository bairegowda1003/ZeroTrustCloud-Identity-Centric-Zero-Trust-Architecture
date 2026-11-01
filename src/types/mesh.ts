/**
 * TrustMesh Phase 4: Service Mesh & SPIFFE/SPIRE Workload Attestation Types
 * Supports SPIFFE SVIDs, Istio STRICT mTLS, L7 AuthorizationPolicy, and dynamically discovered ciphers.
 */

export type AttestationStatus = 'attested' | 'unattested' | 'expired' | 'failed';

export type MTLSMode = 'STRICT' | 'PERMISSIVE' | 'DISABLED';

export interface SpiffeSvidRecord {
  workloadId: string;
  workloadName: string;
  namespace: string;
  serviceAccount: string;
  spiffeId: string; // "spiffe://trustmesh.internal/ns/{namespace}/sa/{serviceAccount}"
  serialNumber: string; // e.g. "0x4F:8A:BC:12:9E:33:D5:B1"
  issuer: string; // "CN=SPIRE Intermediate CA 01, O=TrustMesh Internal"
  issuedAt: string; // ISO string
  expiresAt: string; // ISO string
  ttlRemainingSeconds: number;
  status: AttestationStatus;
  sanUri: string;
  keyAlgorithm: string; // "ECDSA P-256"
  rawPem: string; // Formatted PEM cert
  isLabFixture: boolean;
}

export interface MeshServiceRoute {
  id: string; // "ROUTE-01"
  sourceService: string; // "order-api"
  sourceNamespace: string; // "orders"
  targetService: string; // "payment-service"
  targetNamespace: string; // "payments"
  protocol: string; // "HTTP/2 (mTLS)"
  mtlsMode: MTLSMode;
  tlsVersion: string; // "TLSv1.3"
  cipherSuite: string; // "TLS_AES_256_GCM_SHA384"
  authzStatus: 'ALLOWED' | 'DENIED';
  policyName: string; // "payment-service-authz"
  trafficRate: string; // "48 req/s"
  linkedFindingId?: string;
}

export interface MeshTrafficEvent {
  id: string; // "EVT-MESH-01"
  timestamp: string; // "11:32:05 UTC"
  source: string;
  sourceNamespace: string;
  destination: string;
  destinationNamespace: string;
  method: string;
  path: string;
  tlsVersion: string;
  cipherSuite: string;
  verdict: 'ALLOW' | 'DENY';
  httpStatus: number;
  reason: string;
  linkedFindingId?: string;
}

export interface MeshMetricSummary {
  totalWorkloadsInMesh: number;
  attestedSvidCount: number;
  strictMtlsRoutesCount: number;
  blockedIncursionsCount: number;
  mtlsCoveragePercent: number;
}

