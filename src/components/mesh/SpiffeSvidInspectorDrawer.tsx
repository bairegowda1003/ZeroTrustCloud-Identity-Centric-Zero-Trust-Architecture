import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Clock,
  ExternalLink,
  Lock,
  Layers,
} from 'lucide-react';
import { SpiffeSvidRecord } from '../../types/mesh';

interface SpiffeSvidInspectorDrawerProps {
  svid: SpiffeSvidRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToFinding?: (findingId: string) => void;
}

export const SpiffeSvidInspectorDrawer: React.FC<SpiffeSvidInspectorDrawerProps> = ({
  svid,
  isOpen,
  onClose,
  onNavigateToFinding,
}) => {
  const [copiedPem, setCopiedPem] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !svid) return null;

  const isAttested = svid.status === 'attested';

  const handleCopyPem = () => {
    navigator.clipboard.writeText(svid.rawPem);
    setCopiedPem(true);
    setTimeout(() => setCopiedPem(false), 2000);
  };

  return (
    <div className="svid-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="svid-drawer-sheet"
        onClick={(e) => e.stopPropagation()}
        aria-label={`SVID details for ${svid.workloadName}`}
      >
        {/* Header */}
        <div className="svid-drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-title-row">
              <span className="drawer-svid-icon">
                <KeyRound size={18} />
              </span>
              <h3 className="drawer-title">{svid.workloadName}</h3>
              <span className="drawer-ns-badge">ns: {svid.namespace}</span>
            </div>
            <div className="drawer-subtitle-row">
              <span className={`drawer-status-pill ${isAttested ? 'attested' : 'unattested'}`}>
                {isAttested ? (
                  <>
                    <ShieldCheck size={12} />
                    <span>SPIRE Attested (Valid X.509 SVID)</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={12} />
                    <span>Attestation Failed (No Identity)</span>
                  </>
                )}
              </span>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close Drawer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="svid-drawer-body">
          {/* Section 1: SPIFFE ID URI */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">Cryptographic SPIFFE Identifier</h4>
            <div className="spiffe-id-display-box">
              <span className="spiffe-id-text">{svid.spiffeId}</span>
            </div>
          </div>

          {/* Section 2: X.509 Certificate Fields */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">X.509 Certificate Attributes</h4>
            <div className="drawer-info-grid">
              <div className="info-cell">
                <span className="info-key">Serial Number</span>
                <span className="info-val code-badge">{svid.serialNumber}</span>
              </div>
              <div className="info-cell">
                <span className="info-key">Key Algorithm</span>
                <span className="info-val code-badge">{svid.keyAlgorithm}</span>
              </div>
              <div className="info-cell">
                <span className="info-key">Issuer CA</span>
                <span className="info-val">{svid.issuer}</span>
              </div>
              <div className="info-cell">
                <span className="info-key">Service Account</span>
                <span className="info-val code-badge">{svid.serviceAccount}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Lifetime & Auto-Renewal */}
          {isAttested && (
            <div className="drawer-section">
              <h4 className="drawer-section-title">Short-Lived Ephemeral Validity (1h TTL)</h4>
              <div className="validity-card">
                <div className="validity-row">
                  <span className="validity-key">Issued At</span>
                  <span className="validity-val">{new Date(svid.issuedAt).toLocaleTimeString()}</span>
                </div>
                <div className="validity-row">
                  <span className="validity-key">Expires At</span>
                  <span className="validity-val">{new Date(svid.expiresAt).toLocaleTimeString()}</span>
                </div>
                <div className="validity-row">
                  <span className="validity-key">Auto-Rotate In</span>
                  <span className="validity-val text-cyan">{Math.round(svid.ttlRemainingSeconds / 60)} minutes remaining</span>
                </div>
                <div className="ttl-bar-track">
                  <div className="ttl-bar-fill" style={{ width: `${Math.round((svid.ttlRemainingSeconds / 3600) * 100)}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Raw PEM Certificate */}
          <div className="drawer-section">
            <div className="pem-header-row">
              <h4 className="drawer-section-title">X.509 SVID Certificate (PEM)</h4>
              <button className="copy-code-btn" onClick={handleCopyPem}>
                {copiedPem ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedPem ? 'Copied' : 'Copy PEM'}</span>
              </button>
            </div>
            <div className="pem-code-block">
              <pre>
                <code>{svid.rawPem}</code>
              </pre>
            </div>
          </div>

          {/* Section 5: Unattested Warning & Finding link */}
          {!isAttested && (
            <div className="drawer-section">
              <div className="unattested-warning-banner">
                <div className="warning-top">
                  <ShieldAlert size={18} className="warning-icon" />
                  <div className="warning-text">
                    <h5>Attestation Drift Detected</h5>
                    <p>
                      Workload lacks SPIRE registration or failed Kubernetes UID validation. Workload API denied SVID issuance.
                    </p>
                  </div>
                </div>
                {onNavigateToFinding && (
                  <button
                    className="view-finding-btn"
                    onClick={() => {
                      onNavigateToFinding('TM-SEC-106');
                      onClose();
                    }}
                  >
                    <span>Inspect Finding TM-SEC-106</span>
                    <ExternalLink size={13} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="svid-drawer-footer">
          <span className="footer-domain">Trust Domain: trustmesh.internal</span>
          <button className="footer-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

