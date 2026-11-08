import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Package, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { ContainerImageRecord } from '../../types/supplyChain';

interface ImageDetailDrawerProps {
  image: ContainerImageRecord | null;
  onClose: () => void;
  onNavigateToFinding?: (findingId: string) => void;
}

export const ImageDetailDrawer: React.FC<ImageDetailDrawerProps> = ({
  image,
  onClose,
  onNavigateToFinding
}) => {
  const [activeTab, setActiveTab] = useState<'VULNS' | 'SIGNATURE' | 'SBOM' | 'FINDING'>('VULNS');
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!image) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(image.cosignSignature.rawPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="sc-drawer-overlay" onClick={onClose}>
      <div className="sc-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sc-drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="sc-badge trivy">{image.id}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary, #64748b)', fontFamily: 'var(--font-mono, monospace)' }}>
                ns: {image.namespace}
              </span>
              {image.isLabFixture ? (
                <span className="sc-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  LAB TESTBED FIXTURE
                </span>
              ) : (
                <span className="sc-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  LIVE CLUSTER ARTIFACT
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)', margin: 0, wordBreak: 'break-all' }}>
              {image.repository}:{image.tag}
            </h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary, #64748b)', fontFamily: 'var(--font-mono, monospace)', margin: '4px 0 0 0' }}>
              {image.digest}
            </p>
          </div>
          <button onClick={onClose} className="sc-drawer-close">
            <X size={20} />
          </button>
        </div>

        {/* Status Strip */}
        <div className="sc-drawer-strip">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <span style={{ color: 'var(--text-tertiary, #64748b)', fontSize: '0.68rem', display: 'block' }}>SIGNATURE</span>
              {image.cosignSignature.verificationStatus === 'VERIFIED' ? (
                <span style={{ color: '#34d399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} /> Verified
                </span>
              ) : (
                <span style={{ color: '#f87171', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={13} /> Unsigned
                </span>
              )}
            </div>

            <div>
              <span style={{ color: 'var(--text-tertiary, #64748b)', fontSize: '0.68rem', display: 'block' }}>VULNERABILITIES</span>
              {image.criticalCount > 0 ? (
                <span style={{ color: '#f87171', fontWeight: 700 }}>
                  {image.criticalCount} Critical
                </span>
              ) : (
                <span style={{ color: '#34d399', fontWeight: 700 }}>
                  0 Critical
                </span>
              )}
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--text-tertiary, #64748b)', fontSize: '0.68rem', display: 'block', textAlign: 'right' }}>ADMISSION</span>
            {image.admissionStatus === 'ADMITTED' ? (
              <span className="sc-status-pill admitted">ALLOW (201)</span>
            ) : (
              <span className="sc-status-pill blocked">BLOCKED (403)</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="sc-drawer-tabs">
          <button
            onClick={() => setActiveTab('VULNS')}
            className={`sc-drawer-tab ${activeTab === 'VULNS' ? 'active' : ''}`}
          >
            Trivy Vulnerabilities ({image.vulnerabilities.length})
          </button>
          <button
            onClick={() => setActiveTab('SIGNATURE')}
            className={`sc-drawer-tab ${activeTab === 'SIGNATURE' ? 'active' : ''}`}
          >
            Cosign Signature
          </button>
          <button
            onClick={() => setActiveTab('SBOM')}
            className={`sc-drawer-tab ${activeTab === 'SBOM' ? 'active' : ''}`}
          >
            SBOM ({image.sbomSummary.totalComponents})
          </button>
          {image.linkedFindingId && (
            <button
              onClick={() => setActiveTab('FINDING')}
              className={`sc-drawer-tab ${activeTab === 'FINDING' ? 'active' : ''}`}
              style={{ color: '#f87171' }}
            >
              Finding {image.linkedFindingId}
            </button>
          )}
        </div>

        {/* Drawer Content */}
        <div className="sc-drawer-body">
          {activeTab === 'VULNS' && (
            <div>
              {image.vulnerabilities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(30, 41, 59, 0.2)', borderRadius: '12px' }}>
                  <ShieldCheck size={36} color="#34d399" style={{ margin: '0 auto 8px auto' }} />
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary, #f8fafc)' }}>Zero Vulnerabilities Detected</h4>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    Aqua Trivy scanned 42 package components. All dependencies comply with the zero-trust threshold.
                  </p>
                </div>
              ) : (
                image.vulnerabilities.map((v) => (
                  <div key={v.cveId} className="sc-vuln-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 800, color: '#f87171', fontSize: '0.86rem' }}>
                            {v.cveId}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#ef4444', color: '#fff' }}>
                            {v.severity} (CVSS {v.cvssScore})
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.78rem', fontWeight: 700, margin: '6px 0 0 0', color: 'var(--text-primary, #f8fafc)' }}>
                          {v.title}
                        </h4>
                      </div>
                      <a href={v.primaryUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>
                        <ExternalLink size={15} />
                      </a>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '8px', 
                      background: 'rgba(15, 23, 42, 0.6)', 
                      padding: '10px 12px', 
                      borderRadius: '8px', 
                      fontFamily: 'var(--font-mono, monospace)', 
                      fontSize: '0.72rem' 
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-tertiary, #64748b)', fontSize: '0.65rem', display: 'block' }}>PACKAGE</span>
                        <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>{v.pkgName}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-tertiary, #64748b)', fontSize: '0.65rem', display: 'block' }}>INSTALLED</span>
                        <span style={{ color: '#f87171', fontWeight: 700 }}>{v.installedVersion}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-tertiary, #64748b)', fontSize: '0.65rem', display: 'block' }}>FIXED IN</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>{v.fixedVersion}</span>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.45 }}>
                      {v.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'SIGNATURE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(148, 163, 184, 0.1)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem', fontFamily: 'var(--font-mono, monospace)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                  <span style={{ color: 'var(--text-tertiary, #64748b)' }}>Signer Identity:</span>
                  <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>{image.cosignSignature.signerIdentity}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                  <span style={{ color: 'var(--text-tertiary, #64748b)' }}>Signature Digest:</span>
                  <span style={{ color: 'var(--text-primary, #f8fafc)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {image.cosignSignature.signatureDigest}
                  </span>
                </div>
                {image.cosignSignature.rekorLogIndex && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                    <span style={{ color: 'var(--text-tertiary, #64748b)' }}>Rekor Log Index:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>#{image.cosignSignature.rekorLogIndex}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary, #64748b)' }}>Signed Timestamp:</span>
                  <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>{image.cosignSignature.signedAt}</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>Raw Attestation Payload</span>
                  <button onClick={handleCopyPayload} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#38bdf8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    {copiedPayload ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="sc-code-box">{image.cosignSignature.rawPayload}</pre>
              </div>
            </div>
          )}

          {activeTab === 'SBOM' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(148, 163, 184, 0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.76rem' }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary, #64748b)', display: 'block', fontSize: '0.68rem' }}>FORMAT</span>
                  <span className="sc-badge trivy">{image.sbomSummary.format}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary, #64748b)', display: 'block', fontSize: '0.68rem' }}>TOTAL COMPONENTS</span>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary, #f8fafc)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {image.sbomSummary.totalComponents} packages
                  </strong>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', display: 'block', marginBottom: '8px' }}>
                  Top Components & Licenses:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {image.sbomSummary.topPackages.map((pkg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)', fontSize: '0.74rem', fontFamily: 'var(--font-mono, monospace)' }}>
                      <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>{pkg.name}</strong>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-tertiary, #64748b)' }}>v{pkg.version}</span>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.1)', fontSize: '0.68rem' }}>{pkg.license}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'FINDING' && image.linkedFindingId && (
            <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#ef4444" />
                <h4 style={{ margin: 0, color: '#f87171', fontSize: '0.86rem' }}>
                  Direct Command Center Link: Finding {image.linkedFindingId}
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.45 }}>
                {image.blockedReason}
              </p>
              {onNavigateToFinding && (
                <button
                  onClick={() => onNavigateToFinding(image.linkedFindingId!)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Open Finding in Security Command Center</span>
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
