import vulnReportRaw from '../../k8s/supply-chain/trivy/reports/order-api-v1.1-vuln.json';
import cleanReportRaw from '../../k8s/supply-chain/trivy/reports/order-api-v1.2-clean.json';
import cosignRecordRaw from '../../k8s/supply-chain/cosign/signatures/verified-signatures.json';

export interface HistoricalVulnerability {
  cveId: string;
  severity: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion: string;
  title: string;
  cvssScore: number;
}

export interface HistoricalTrivyReport {
  filePath: string;
  artifactName: string;
  artifactType: string;
  imageId: string;
  vulnerabilities: HistoricalVulnerability[];
  recordedFindingCount: number;
  note: string;
}

export interface HistoricalCosignRecord {
  filePath: string;
  dockerReference: string;
  manifestDigest: string;
  digestMatchesCleanReport: boolean;
  signer: string;
  signedEntryTimestamp: string;
  rekorLogIndex: number;
  verificationNotice: string;
  provenanceLabel: string;
  note: string;
}

export interface HistoricalSupplyChainEvidence {
  provenanceLabel: string;
  disclaimer: string;
  gatekeeperEnforcementNotice: string;
  artifactA_vuln: HistoricalTrivyReport;
  artifactB_clean: HistoricalTrivyReport;
  artifactC_cosign: HistoricalCosignRecord;
}

export function loadHistoricalSupplyChainEvidence(): HistoricalSupplyChainEvidence {
  // Validate and parse Artifact A (Trivy vulnerable report)
  const vulnResults = Array.isArray(vulnReportRaw.Results) ? vulnReportRaw.Results : [];
  const rawVulns = vulnResults.length > 0 && Array.isArray(vulnResults[0].Vulnerabilities)
    ? vulnResults[0].Vulnerabilities
    : [];

  const parsedVulns: HistoricalVulnerability[] = rawVulns.map((v) => ({
    cveId: v.VulnerabilityID || 'Unknown CVE',
    severity: v.Severity || 'UNKNOWN',
    pkgName: v.PkgName || 'Unknown Package',
    installedVersion: v.InstalledVersion || 'Unknown',
    fixedVersion: v.FixedVersion || 'None',
    title: v.Title || '',
    cvssScore: v.CVSS?.nvd?.V3Score ?? 0,
  }));

  const artifactA_vuln: HistoricalTrivyReport = {
    filePath: 'k8s/supply-chain/trivy/reports/order-api-v1.1-vuln.json',
    artifactName: vulnReportRaw.ArtifactName || 'trustmesh/mysql-proxy:cache',
    artifactType: vulnReportRaw.ArtifactType || 'container_image',
    imageId: vulnReportRaw.Metadata?.ImageID || '',
    vulnerabilities: parsedVulns,
    recordedFindingCount: parsedVulns.length,
    note: 'Filename references order-api, but the JSON payload identifies mysql-proxy:cache. Displaying actual image identity from JSON.',
  };

  // Validate and parse Artifact B (Trivy clean report)
  const cleanResults = Array.isArray(cleanReportRaw.Results) ? cleanReportRaw.Results : [];
  const cleanVulns = cleanResults.length > 0 && Array.isArray(cleanResults[0].Vulnerabilities)
    ? cleanResults[0].Vulnerabilities
    : [];

  const artifactB_clean: HistoricalTrivyReport = {
    filePath: 'k8s/supply-chain/trivy/reports/order-api-v1.2-clean.json',
    artifactName: cleanReportRaw.ArtifactName || 'trustmesh/order-api:v1.2',
    artifactType: cleanReportRaw.ArtifactType || 'container_image',
    imageId: cleanReportRaw.Metadata?.ImageID || '',
    vulnerabilities: cleanVulns,
    recordedFindingCount: cleanVulns.length,
    note: 'Saved report records 0 findings. This does not claim universal security or remediation of mysql-proxy (they are distinct image identities).',
  };

  // Validate and parse Artifact C (Cosign signature record)
  const dockerRef = cosignRecordRaw.critical?.identity?.['docker-reference'] || 'trustmesh/order-api';
  const manifestDigest = cosignRecordRaw.critical?.image?.['docker-manifest-digest'] || '';
  const signer = cosignRecordRaw.optional?.Signer || 'cosign.pub [Key ID: 0x8F4A1B9C]';
  const signedEntryTimestamp = cosignRecordRaw.optional?.Bundle?.SignedEntryTimestamp || '2026-11-01T14:22:00Z';
  const rekorLogIndex = cosignRecordRaw.optional?.Bundle?.Body?.RekorLogIndex || 842109;

  const digestMatchesCleanReport = Boolean(
    manifestDigest &&
    artifactB_clean.imageId &&
    manifestDigest === artifactB_clean.imageId
  );

  const artifactC_cosign: HistoricalCosignRecord = {
    filePath: 'k8s/supply-chain/cosign/signatures/verified-signatures.json',
    dockerReference: dockerRef,
    manifestDigest,
    digestMatchesCleanReport,
    signer,
    signedEntryTimestamp,
    rekorLogIndex,
    verificationNotice: 'Signature record available — cryptographic verification unconfirmed.',
    provenanceLabel: 'HISTORICAL ARTIFACT — EXECUTION PROVENANCE UNCONFIRMED',
    note: 'Static signature payload record. Cryptographic verification against a live registry or key infrastructure has not been independently confirmed.',
  };

  return {
    provenanceLabel: 'HISTORICAL ARTIFACT — EXECUTION PROVENANCE UNCONFIRMED',
    disclaimer: 'These records are saved static repository evaluation artifacts from offline lab exercises, not live CI/CD pipeline scans or real-time admission checks. Execution timestamps are not inferred from Git commit dates.',
    gatekeeperEnforcementNotice: 'Deployed laboratory Gatekeeper constraints (kind-trustmesh-lab) enforce container security, required dedicated service accounts, and workload hardening. They do not enforce Cosign signature verification.',
    artifactA_vuln,
    artifactB_clean,
    artifactC_cosign,
  };
}
