export type VulnerabilitySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ContainerVulnerability {
  cveId: string; // e.g. "CVE-2024-21508"
  severity: VulnerabilitySeverity;
  pkgName: string; // "mysql2"
  installedVersion: string; // "3.9.2"
  fixedVersion: string; // "3.9.4"
  title: string;
  description: string;
  cvssScore: number; // e.g. 8.8
  primaryUrl: string;
}

export type SignatureVerificationStatus = 'VERIFIED' | 'UNSIGNED' | 'DIGEST_MISMATCH';

export interface CosignSignatureRecord {
  isSigned: boolean;
  signatureDigest: string; // "sha256:4f8a..."
  signerIdentity: string; // "cosign.pub [Key ID: 0x8F4A1B9C]"
  signedAt: string;
  verificationStatus: SignatureVerificationStatus;
  algorithm: string; // "ECDSA_P256_SHA256"
  rawPayload: string;
  rekorLogIndex?: number;
}

export interface SbomSummary {
  format: 'SPDX-2.3' | 'CycloneDX-1.5';
  totalComponents: number;
  packageManagers: string[];
  topPackages: Array<{ name: string; version: string; license: string }>;
}

export type AdmissionDecision = 'ADMITTED' | 'BLOCKED';

export interface ContainerImageRecord {
  id: string; // "IMG-01"
  repository: string; // "trustmesh/order-api"
  tag: string; // "v1.2"
  digest: string; // "sha256:7b129c54e0821dfa..."
  workloadName: string; // "order-api"
  namespace: string; // "orders"
  scanStatus: 'CLEAN' | 'VULNERABLE' | 'PENDING';
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  vulnerabilities: ContainerVulnerability[];
  cosignSignature: CosignSignatureRecord;
  sbomSummary: SbomSummary;
  admissionStatus: AdmissionDecision;
  blockedReason?: string;
  linkedFindingId?: 'TM-SEC-101' | 'TM-SEC-105';
  isLabFixture: boolean; // Provenance transparency: true if testbed fixture, false if live
  scannedAt: string;
}

export interface PipelineStep {
  stepNumber: number;
  id: 'build' | 'trivy_scan' | 'cosign_sign' | 'gatekeeper_admission';
  label: string;
  tool: string;
  version: string;
  status: 'passed' | 'failed' | 'skipped' | 'blocked';
  summary: string;
  details: string;
}

export interface PipelineScenario {
  id: 'compliant' | 'unsigned' | 'tampered' | 'vulnerable';
  title: string;
  targetImage: string;
  targetWorkload: string;
  description: string;
  expectedOutcome: AdmissionDecision;
  findingRef?: string;
  steps: PipelineStep[];
}

export interface SupplyChainSummary {
  totalScannedImages: number;
  signedImagesCount: number;
  signedPercentage: number;
  criticalCveCount: number;
  highCveCount: number;
  blockedDeploymentsCount: number;
  trivyVersion: string;
  cosignVersion: string;
  gatekeeperProvider: string;
  policyThreshold: {
    criticalMax: number;
    highMax: number;
    enforcementMode: 'FAIL_CLOSED' | 'AUDIT';
  };
}

