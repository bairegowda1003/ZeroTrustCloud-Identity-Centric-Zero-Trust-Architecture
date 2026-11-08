import {
  ContainerImageRecord,
  PipelineScenario,
  SupplyChainSummary
} from '../types/supplyChain';

export const INITIAL_SUPPLY_CHAIN_SUMMARY: SupplyChainSummary = {
  totalScannedImages: 5,
  signedImagesCount: 4,
  signedPercentage: 80,
  criticalCveCount: 1,
  highCveCount: 0,
  blockedDeploymentsCount: 2,
  trivyVersion: 'v0.58.2',
  cosignVersion: 'v2.4.1',
  gatekeeperProvider: 'cosign-provider.gatekeeper.sh (External Data)',
  policyThreshold: {
    criticalMax: 0,
    highMax: 0,
    enforcementMode: 'FAIL_CLOSED'
  }
};

export const DEMO_CONTAINER_IMAGES: ContainerImageRecord[] = [
  {
    id: 'IMG-01',
    repository: 'trustmesh/order-api',
    tag: 'v1.2',
    digest: 'sha256:7b129c54e0821dfa92918bc3251ee2d744f456108e427d1421008064953bfcb4',
    workloadName: 'order-api',
    namespace: 'orders',
    scanStatus: 'CLEAN',
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    vulnerabilities: [],
    cosignSignature: {
      isSigned: true,
      signatureDigest: 'sha256:4f8a11b2c45e9a0d810239cf2e89104b901237a89bc2145e6790a12b34c567e8',
      signerIdentity: 'cosign.pub [Key ID: 0x8F4A1B9C]',
      signedAt: '2026-11-01T14:22:00Z',
      verificationStatus: 'VERIFIED',
      algorithm: 'ECDSA_P256_SHA256',
      rawPayload: JSON.stringify(
        {
          critical: {
            identity: { "docker-reference": "trustmesh/order-api" },
            image: { "docker-manifest-digest": "sha256:7b129c54e0821dfa92918bc3251ee2d744f456108e427d1421008064953bfcb4" },
            type: "cosign container image signature"
          },
          optional: {
            Bundle: { SignedEntryTimestamp: "2026-11-01T14:22:00Z", Body: { RekorLogIndex: 842109 } },
            Signer: "cosign.pub [Key ID: 0x8F4A1B9C]",
            Issuer: "https://accounts.trustmesh.security"
          }
        },
        null,
        2
      ),
      rekorLogIndex: 842109
    },
    sbomSummary: {
      format: 'SPDX-2.3',
      totalComponents: 42,
      packageManagers: ['npm', 'debian'],
      topPackages: [
        { name: 'mysql2', version: '3.9.4', license: 'MIT' },
        { name: 'express', version: '4.19.2', license: 'MIT' },
        { name: 'dotenv', version: '16.4.5', license: 'BSD-2-Clause' }
      ]
    },
    admissionStatus: 'ADMITTED',
    isLabFixture: false,
    scannedAt: '2026-11-01T14:20:15Z'
  },
  {
    id: 'IMG-02',
    repository: 'trustmesh/payment-service',
    tag: 'v1.0',
    digest: 'sha256:3a910ec871409ab4519fec2b7190014a0988bc1104e7681944510b9911ef74a1',
    workloadName: 'payment-service',
    namespace: 'payments',
    scanStatus: 'CLEAN',
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 1,
    vulnerabilities: [
      {
        cveId: 'CVE-2023-45853',
        severity: 'LOW',
        pkgName: 'zlib',
        installedVersion: '1.2.13-1',
        fixedVersion: '1.2.13-2',
        title: 'MiniZip integer overflow in zipOpenNewFileInZip4_64',
        description: 'MiniZip in zlib allows an integer overflow and resultant buffer overflow during zip compression with long filenames.',
        cvssScore: 3.3,
        primaryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2023-45853'
      }
    ],
    cosignSignature: {
      isSigned: true,
      signatureDigest: 'sha256:88bc4190fa7e1124ac33989bbd801e0a2938171092fe8a910b274c56e01a92bf',
      signerIdentity: 'cosign.pub [Key ID: 0x8F4A1B9C]',
      signedAt: '2026-11-01T12:05:10Z',
      verificationStatus: 'VERIFIED',
      algorithm: 'ECDSA_P256_SHA256',
      rawPayload: JSON.stringify(
        {
          critical: {
            identity: { "docker-reference": "trustmesh/payment-service" },
            image: { "docker-manifest-digest": "sha256:3a910ec871409ab4519fec2b7190014a0988bc1104e7681944510b9911ef74a1" },
            type: "cosign container image signature"
          },
          optional: {
            Bundle: { SignedEntryTimestamp: "2026-11-01T12:05:10Z", Body: { RekorLogIndex: 841982 } },
            Signer: "cosign.pub [Key ID: 0x8F4A1B9C]"
          }
        },
        null,
        2
      ),
      rekorLogIndex: 841982
    },
    sbomSummary: {
      format: 'SPDX-2.3',
      totalComponents: 38,
      packageManagers: ['npm', 'debian'],
      topPackages: [
        { name: 'stripe', version: '14.19.0', license: 'Apache-2.0' },
        { name: 'jsonwebtoken', version: '9.0.2', license: 'MIT' }
      ]
    },
    admissionStatus: 'ADMITTED',
    isLabFixture: false,
    scannedAt: '2026-11-01T12:03:00Z'
  },
  {
    id: 'IMG-03',
    repository: 'trustmesh/frontend-proxy',
    tag: 'v1.3',
    digest: 'sha256:59f011ba24ec41098bbd7810aa112e87361928374619a0bc45781923048591ef',
    workloadName: 'frontend-proxy',
    namespace: 'ingress-edge',
    scanStatus: 'CLEAN',
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    vulnerabilities: [],
    cosignSignature: {
      isSigned: true,
      signatureDigest: 'sha256:1198ae470129bcfe746392019ab921c84710184b840192ecbd765410928374a1',
      signerIdentity: 'cosign.pub [Key ID: 0x8F4A1B9C]',
      signedAt: '2026-11-01T09:15:30Z',
      verificationStatus: 'VERIFIED',
      algorithm: 'ECDSA_P256_SHA256',
      rawPayload: JSON.stringify(
        {
          critical: {
            identity: { "docker-reference": "trustmesh/frontend-proxy" },
            image: { "docker-manifest-digest": "sha256:59f011ba24ec41098bbd7810aa112e87361928374619a0bc45781923048591ef" },
            type: "cosign container image signature"
          },
          optional: {
            Bundle: { SignedEntryTimestamp: "2026-11-01T09:15:30Z", Body: { RekorLogIndex: 841502 } },
            Signer: "cosign.pub [Key ID: 0x8F4A1B9C]"
          }
        },
        null,
        2
      ),
      rekorLogIndex: 841502
    },
    sbomSummary: {
      format: 'CycloneDX-1.5',
      totalComponents: 19,
      packageManagers: ['debian'],
      topPackages: [
        { name: 'nginx-light', version: '1.24.0-2', license: 'BSD-2-Clause' },
        { name: 'openssl', version: '3.0.13-1~deb12u1', license: 'Apache-2.0' }
      ]
    },
    admissionStatus: 'ADMITTED',
    isLabFixture: false,
    scannedAt: '2026-11-01T09:12:00Z'
  },
  {
    id: 'IMG-04',
    repository: 'docker.io/commerce/checkout-gateway',
    tag: 'v2.1',
    digest: 'sha256:91ab847291040857193bca48719284719001bcae884192bc7190029348109384',
    workloadName: 'checkout-gateway',
    namespace: 'orders',
    scanStatus: 'CLEAN',
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    vulnerabilities: [],
    cosignSignature: {
      isSigned: false,
      signatureDigest: 'UNSIGNED',
      signerIdentity: 'NONE (No digital signature found)',
      signedAt: 'NEVER',
      verificationStatus: 'UNSIGNED',
      algorithm: 'NONE',
      rawPayload: '{\n  "error": "no_signatures_found",\n  "message": "no signatures found for image manifest: docker.io/commerce/checkout-gateway@sha256:91ab847..."\n}'
    },
    sbomSummary: {
      format: 'SPDX-2.3',
      totalComponents: 56,
      packageManagers: ['npm'],
      topPackages: [
        { name: 'express', version: '4.18.2', license: 'MIT' },
        { name: 'axios', version: '1.6.0', license: 'MIT' }
      ]
    },
    admissionStatus: 'BLOCKED',
    blockedReason: 'OPA Gatekeeper admission rejection: Image lacks required Cosign digital signature (RULE-SUPPLY-COSIGN-01).',
    linkedFindingId: 'TM-SEC-101',
    isLabFixture: true,
    scannedAt: '2026-11-01T10:45:00Z'
  },
  {
    id: 'IMG-05',
    repository: 'trustmesh/mysql-proxy',
    tag: 'cache',
    digest: 'sha256:1a84f3e198b92b67cc1d9e29088510f27cda608c0ef01a74d28430f8c2b7c419',
    workloadName: 'mysql-proxy-cache',
    namespace: 'database',
    scanStatus: 'VULNERABLE',
    criticalCount: 1,
    highCount: 0,
    mediumCount: 1,
    lowCount: 2,
    vulnerabilities: [
      {
        cveId: 'CVE-2024-21508',
        severity: 'CRITICAL',
        pkgName: 'mysql2',
        installedVersion: '3.9.2',
        fixedVersion: '3.9.4',
        title: 'mysql2: Prototype Pollution via parsePacket function leading to RCE',
        description: 'Versions of mysql2 before 3.9.4 are vulnerable to Prototype Pollution via parsePacket function. Attackers can pollute JavaScript object prototypes via malicious MySQL packets leading to remote code execution.',
        cvssScore: 8.8,
        primaryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2024-21508'
      },
      {
        cveId: 'CVE-2023-45853',
        severity: 'MEDIUM',
        pkgName: 'zlib',
        installedVersion: '1.2.11',
        fixedVersion: '1.2.13',
        title: 'Buffer overflow in MiniZip',
        description: 'MiniZip integer overflow and heap-based buffer overflow during decompression of maliciously constructed headers.',
        cvssScore: 5.5,
        primaryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2023-45853'
      }
    ],
    cosignSignature: {
      isSigned: true,
      signatureDigest: 'sha256:6109ae4819401bfd908471928471920194819028471920192847192019284719',
      signerIdentity: 'cosign.pub [Key ID: 0x8F4A1B9C]',
      signedAt: '2026-10-31T20:10:00Z',
      verificationStatus: 'VERIFIED',
      algorithm: 'ECDSA_P256_SHA256',
      rawPayload: JSON.stringify(
        {
          critical: {
            identity: { "docker-reference": "trustmesh/mysql-proxy" },
            image: { "docker-manifest-digest": "sha256:1a84f3e198b92b67cc1d9e29088510f27cda608c0ef01a74d28430f8c2b7c419" },
            type: "cosign container image signature"
          },
          optional: {
            Bundle: { SignedEntryTimestamp: "2026-10-31T20:10:00Z", Body: { RekorLogIndex: 840112 } },
            Signer: "cosign.pub [Key ID: 0x8F4A1B9C]"
          }
        },
        null,
        2
      ),
      rekorLogIndex: 840112
    },
    sbomSummary: {
      format: 'SPDX-2.3',
      totalComponents: 47,
      packageManagers: ['npm', 'debian'],
      topPackages: [
        { name: 'mysql2', version: '3.9.2 (VULNERABLE)', license: 'MIT' },
        { name: 'redis', version: '4.6.13', license: 'MIT' }
      ]
    },
    admissionStatus: 'BLOCKED',
    blockedReason: 'Vulnerability Threshold Violation: 1 CRITICAL CVE detected (CVE-2024-21508 in mysql2@3.9.2, CVSS 8.8). Policy requires CRITICAL == 0.',
    linkedFindingId: 'TM-SEC-105',
    isLabFixture: true,
    scannedAt: '2026-11-01T08:14:22Z'
  }
];

export const PIPELINE_SCENARIOS: PipelineScenario[] = [
  {
    id: 'compliant',
    title: 'Compliant Release (order-api:v1.2)',
    targetImage: 'trustmesh/order-api:v1.2',
    targetWorkload: 'order-api (namespace: orders)',
    description: 'Fully zero-trust compliant workload. Vulnerability-free (mysql2@3.9.4) and signed by trusted cosign.pub key.',
    expectedOutcome: 'ADMITTED',
    steps: [
      {
        stepNumber: 1,
        id: 'build',
        label: 'OCI Build & Tag',
        tool: 'Docker Engine',
        version: 'v25.0',
        status: 'passed',
        summary: 'OCI image built cleanly',
        details: 'Digest: sha256:7b129c54e0821dfa... Base layer: debian:12-slim'
      },
      {
        stepNumber: 2,
        id: 'trivy_scan',
        label: 'Aqua Trivy Scan',
        tool: 'Aqua Trivy',
        version: 'v0.58.2',
        status: 'passed',
        summary: '0 Critical, 0 High CVEs',
        details: 'Target: package-lock.json (mysql2@3.9.4). Policy threshold: Critical <= 0 (PASSED).'
      },
      {
        stepNumber: 3,
        id: 'cosign_sign',
        label: 'Cosign Signing',
        tool: 'Sigstore Cosign',
        version: 'v2.4.1',
        status: 'passed',
        summary: 'Cryptographic Signature Generated',
        details: 'Signed with cosign.pub [0x8F4A1B9C]. Rekor transparency log index: 842109.'
      },
      {
        stepNumber: 4,
        id: 'gatekeeper_admission',
        label: 'Gatekeeper Admission',
        tool: 'OPA Gatekeeper + Provider',
        version: 'v3.15.0',
        status: 'passed',
        summary: 'ALLOW (201 Created)',
        details: 'Cosign-provider verified ECDSA signature and digest integrity. Pod scheduled.'
      }
    ]
  },
  {
    id: 'unsigned',
    title: 'Unsigned Image (checkout-gateway:v2.1)',
    targetImage: 'docker.io/commerce/checkout-gateway:v2.1',
    targetWorkload: 'checkout-gateway (namespace: orders)',
    description: 'Workload image produced outside approved CI/CD pipeline without cryptographic signature.',
    expectedOutcome: 'BLOCKED',
    findingRef: 'TM-SEC-101',
    steps: [
      {
        stepNumber: 1,
        id: 'build',
        label: 'OCI Build & Tag',
        tool: 'External CI',
        version: 'v24.0',
        status: 'passed',
        summary: 'Built without trustmesh signing keys',
        details: 'Digest: sha256:91ab847291040857...'
      },
      {
        stepNumber: 2,
        id: 'trivy_scan',
        label: 'Aqua Trivy Scan',
        tool: 'Aqua Trivy',
        version: 'v0.58.2',
        status: 'passed',
        summary: 'No critical CVEs detected',
        details: 'Scanned 56 dependencies.'
      },
      {
        stepNumber: 3,
        id: 'cosign_sign',
        label: 'Cosign Signing',
        tool: 'Sigstore Cosign',
        version: 'v2.4.1',
        status: 'skipped',
        summary: 'Step Omitted (Unsigned Artifact)',
        details: 'Artifact was pushed directly to registry without CI signing key authorization.'
      },
      {
        stepNumber: 4,
        id: 'gatekeeper_admission',
        label: 'Gatekeeper Admission',
        tool: 'OPA Gatekeeper + Provider',
        version: 'v3.15.0',
        status: 'failed',
        summary: 'DENY 403 (RULE-SUPPLY-COSIGN-01)',
        details: 'Admission blocked! External cosign-provider returned "no_signatures_found". Bridges to Finding TM-SEC-101.'
      }
    ]
  },
  {
    id: 'vulnerable',
    title: 'Vulnerable Dependency (CVE-2024-21508)',
    targetImage: 'trustmesh/mysql-proxy:cache',
    targetWorkload: 'mysql-proxy-cache (namespace: database)',
    description: 'Image bundle containing vulnerable mysql2@3.9.2 with critical prototype pollution / RCE vulnerability.',
    expectedOutcome: 'BLOCKED',
    findingRef: 'TM-SEC-105',
    steps: [
      {
        stepNumber: 1,
        id: 'build',
        label: 'OCI Build & Tag',
        tool: 'Docker Engine',
        version: 'v25.0',
        status: 'passed',
        summary: 'Built with package-lock.json',
        details: 'mysql2@3.9.2 bundled into runtime layer.'
      },
      {
        stepNumber: 2,
        id: 'trivy_scan',
        label: 'Aqua Trivy Scan',
        tool: 'Aqua Trivy',
        version: 'v0.58.2',
        status: 'failed',
        summary: 'BLOCKED: 1 CRITICAL CVE Found',
        details: 'CVE-2024-21508 (CVSS 8.8) detected in mysql2@3.9.2. Threshold (Critical == 0) violated. Promotion rejected.'
      },
      {
        stepNumber: 3,
        id: 'cosign_sign',
        label: 'Cosign Signing',
        tool: 'Sigstore Cosign',
        version: 'v2.4.1',
        status: 'blocked',
        summary: 'Signing Aborted',
        details: 'Pipeline halted at vulnerability gate; signing pipeline prevented from executing.'
      },
      {
        stepNumber: 4,
        id: 'gatekeeper_admission',
        label: 'Gatekeeper Admission',
        tool: 'OPA Gatekeeper + Provider',
        version: 'v3.15.0',
        status: 'blocked',
        summary: 'Admission Prevented',
        details: 'Vulnerable artifact quarantined before cluster deployment. Bridges to Finding TM-SEC-105.'
      }
    ]
  },
  {
    id: 'tampered',
    title: 'Digest Mismatch (Tampered Image)',
    targetImage: 'trustmesh/order-api:tampered',
    targetWorkload: 'order-api (namespace: orders)',
    description: 'Image payload modified after Cosign signature was generated, creating a cryptographic hash mismatch.',
    expectedOutcome: 'BLOCKED',
    steps: [
      {
        stepNumber: 1,
        id: 'build',
        label: 'OCI Build & Tag',
        tool: 'Docker Engine',
        version: 'v25.0',
        status: 'passed',
        summary: 'Original image built and signed',
        details: 'Original digest: sha256:7b129c54...'
      },
      {
        stepNumber: 2,
        id: 'trivy_scan',
        label: 'Aqua Trivy Scan',
        tool: 'Aqua Trivy',
        version: 'v0.58.2',
        status: 'passed',
        summary: 'Pre-tampering scan clean',
        details: '0 Critical CVEs.'
      },
      {
        stepNumber: 3,
        id: 'cosign_sign',
        label: 'Cosign Signing',
        tool: 'Sigstore Cosign',
        version: 'v2.4.1',
        status: 'passed',
        summary: 'Original Manifest Signed',
        details: 'Signature recorded for original digest.'
      },
      {
        stepNumber: 4,
        id: 'gatekeeper_admission',
        label: 'Gatekeeper Admission',
        tool: 'OPA Gatekeeper + Provider',
        version: 'v3.15.0',
        status: 'failed',
        summary: 'DENY 403 (Digest Mismatch)',
        details: 'Cosign-provider computed digest sha256:000000... did not match signed manifest sha256:7b129c... Tampering blocked!'
      }
    ]
  }
];

