import React from 'react';
import {
  FileText,
  AlertOctagon,
  CheckCircle2,
  Lock,
  Info,
  ShieldAlert,
  ShieldCheck,
  FileCode,
  Tag,
  Hash,
} from 'lucide-react';
import { loadHistoricalSupplyChainEvidence } from '../../utils/supplyChainEvidence';

export const HistoricalSupplyChainEvidence: React.FC = () => {
  const evidence = loadHistoricalSupplyChainEvidence();
  const { artifactA_vuln, artifactB_clean, artifactC_cosign } = evidence;

  return (
    <section
      className="supply-chain-evidence-container"
      aria-label="Historical Supply Chain Security Evidence"
    >
      {/* 1. Provenance Banner Header */}
      <div className="evidence-header-row">
        <div className="header-left-group">
          <span className="provenance-badge-unconfirmed">
            <AlertOctagon size={13} className="text-amber-400" />
            <span>HISTORICAL ARTIFACT — EXECUTION PROVENANCE UNCONFIRMED</span>
          </span>
          <span className="evidence-subtitle">
            Saved Offline Experiment Records (Static Files)
          </span>
        </div>
        <div className="header-meta-tag">
          <FileText size={12} className="text-muted" />
          <span>3 Local Evaluation Artifacts</span>
        </div>
      </div>

      {/* 2. Explanatory Context Box */}
      <div className="evidence-disclaimer-box">
        <div className="disclaimer-line">
          <Info size={13} className="text-cyan-400 flex-shrink-0" />
          <span>
            {evidence.disclaimer}
          </span>
        </div>
        <div className="disclaimer-line">
          <ShieldAlert size={13} className="text-amber-400 flex-shrink-0" />
          <span>
            <strong>Gatekeeper Scope Clarification:</strong> {evidence.gatekeeperEnforcementNotice}
          </span>
        </div>
      </div>

      {/* 3. Three Evidence Artifact Cards */}
      <div className="evidence-cards-grid">
        {/* Card A: Trivy Vulnerability Report */}
        <div className="evidence-artifact-card vuln">
          <div className="card-top-line">
            <span className="card-artifact-type">
              <FileCode size={12} />
              <span>Artifact A: Trivy Scan Report</span>
            </span>
            <span className="finding-status-badge critical">
              1 CRITICAL CVE
            </span>
          </div>

          <div className="image-identity-row">
            <span className="identity-label">Actual Image Identity:</span>
            <code className="image-name-code">{artifactA_vuln.artifactName}</code>
          </div>

          <div className="card-note-box">
            <AlertOctagon size={12} className="text-amber-400 flex-shrink-0" />
            <span>{artifactA_vuln.note}</span>
          </div>

          <div className="vulnerabilities-detail-list">
            {artifactA_vuln.vulnerabilities.map((v) => (
              <div key={v.cveId} className="vuln-entry-item">
                <div className="vuln-entry-header">
                  <span className="cve-id-bold">{v.cveId}</span>
                  <span className="cvss-score-chip">CVSS {v.cvssScore} ({v.severity})</span>
                </div>
                <div className="vuln-package-row">
                  <span>Package: <code>{v.pkgName}</code></span>
                  <span className="meta-sep">•</span>
                  <span>Installed: <code>{v.installedVersion}</code></span>
                  <span className="meta-sep">•</span>
                  <span>Fixed: <code className="fixed-code">{v.fixedVersion}</code></span>
                </div>
                <div className="vuln-title-text">{v.title}</div>
              </div>
            ))}
          </div>

          <div className="card-footer-provenance">
            <span className="source-file-label">Source File:</span>
            <code className="file-path-code">{artifactA_vuln.filePath}</code>
          </div>
        </div>

        {/* Card B: Trivy Clean Report */}
        <div className="evidence-artifact-card clean">
          <div className="card-top-line">
            <span className="card-artifact-type">
              <FileCode size={12} />
              <span>Artifact B: Trivy Scan Report</span>
            </span>
            <span className="finding-status-badge clean">
              0 Recorded Findings
            </span>
          </div>

          <div className="image-identity-row">
            <span className="identity-label">Actual Image Identity:</span>
            <code className="image-name-code">{artifactB_clean.artifactName}</code>
          </div>

          <div className="card-note-box">
            <Info size={12} className="text-cyan-400 flex-shrink-0" />
            <span>{artifactB_clean.note}</span>
          </div>

          <div className="clean-summary-box">
            <div className="clean-lead-row">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>Recorded vulnerability count: 0 (No findings in package-lock.json).</span>
            </div>
            <div className="clean-packages-row">
              <span>Audited Packages:</span>
              <code className="pkg-tag">mysql2@3.9.4</code>
              <code className="pkg-tag">express@4.19.2</code>
            </div>
            <div className="digest-row">
              <span className="digest-label">Image Digest:</span>
              <code className="digest-code-truncate" title={artifactB_clean.imageId}>
                {artifactB_clean.imageId}
              </code>
            </div>
          </div>

          <div className="card-footer-provenance">
            <span className="source-file-label">Source File:</span>
            <code className="file-path-code">{artifactB_clean.filePath}</code>
          </div>
        </div>

        {/* Card C: Cosign Signature Record */}
        <div className="evidence-artifact-card cosign">
          <div className="card-top-line">
            <span className="card-artifact-type">
              <Lock size={12} />
              <span>Artifact C: Cosign Signature Record</span>
            </span>
            <span className="finding-status-badge unconfirmed">
              Verification Unconfirmed
            </span>
          </div>

          <div className="image-identity-row">
            <span className="identity-label">Target Reference:</span>
            <code className="image-name-code">{artifactC_cosign.dockerReference}</code>
          </div>

          {/* Mandatory Critical Notice */}
          <div className="unconfirmed-notice-banner">
            <AlertOctagon size={14} className="text-amber-400 flex-shrink-0" />
            <strong className="notice-text">
              {artifactC_cosign.verificationNotice}
            </strong>
          </div>

          <div className="cosign-details-box">
            <div className="cosign-digest-match-row">
              {artifactC_cosign.digestMatchesCleanReport ? (
                <div className="match-pill green">
                  <CheckCircle2 size={12} />
                  <span>Digest matches saved order-api:v1.2 Trivy report</span>
                </div>
              ) : (
                <div className="match-pill amber">
                  <Info size={12} />
                  <span>Digest does not match saved report</span>
                </div>
              )}
            </div>

            <div className="cosign-meta-row">
              <span className="meta-label">Manifest Digest:</span>
              <code className="digest-code-truncate" title={artifactC_cosign.manifestDigest}>
                {artifactC_cosign.manifestDigest}
              </code>
            </div>

            <div className="cosign-meta-row">
              <span className="meta-label">Claimed Signer:</span>
              <code className="signer-code">{artifactC_cosign.signer}</code>
            </div>

            <div className="cosign-meta-row">
              <span className="meta-label">Rekor Log Index:</span>
              <code className="rekor-code">{artifactC_cosign.rekorLogIndex}</code>
              <span className="meta-sep">•</span>
              <span className="meta-label">Timestamp:</span>
              <span className="time-val">{artifactC_cosign.signedEntryTimestamp}</span>
            </div>

            <div className="cosign-caveat-text">
              {artifactC_cosign.note}
            </div>
          </div>

          <div className="card-footer-provenance">
            <span className="source-file-label">Source File:</span>
            <code className="file-path-code">{artifactC_cosign.filePath}</code>
          </div>
        </div>
      </div>
    </section>
  );
};
