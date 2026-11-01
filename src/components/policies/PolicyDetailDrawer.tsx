import React, { useState, useEffect } from 'react';
import {
  X,
  FileCode,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Terminal,
} from 'lucide-react';
import { GatekeeperPolicyRecord } from '../../types/policy';

interface PolicyDetailDrawerProps {
  policy: GatekeeperPolicyRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToFinding?: (findingId: string) => void;
}

export const PolicyDetailDrawer: React.FC<PolicyDetailDrawerProps> = ({
  policy,
  isOpen,
  onClose,
  onNavigateToFinding,
}) => {
  const [activeTab, setActiveTab] = useState<'rego' | 'objective' | 'remediation'>('rego');
  const [copiedRego, setCopiedRego] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !policy) return null;

  const handleCopyRego = () => {
    navigator.clipboard.writeText(policy.regoSource);
    setCopiedRego(true);
    setTimeout(() => setCopiedRego(false), 2000);
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(policy.remediationSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="policy-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="policy-drawer-sheet"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Details for policy ${policy.name}`}
      >
        {/* Drawer Header */}
        <div className="policy-drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-title-row">
              <span className="drawer-policy-icon">
                <FileCode size={18} />
              </span>
              <h3 className="drawer-title">{policy.name}</h3>
              <span className="drawer-id-badge">{policy.id}</span>
            </div>
            <div className="drawer-subtitle-row">
              <span className="drawer-category-pill">{policy.category}</span>
              <span className="drawer-mode-pill enforce">
                <ShieldCheck size={12} />
                <span>Enforce (Deny on Admission)</span>
              </span>
            </div>
          </div>
          <button
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close Policy Details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="policy-drawer-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'rego'}
            className={`drawer-tab-btn ${activeTab === 'rego' ? 'active' : ''}`}
            onClick={() => setActiveTab('rego')}
          >
            <Terminal size={14} />
            <span>Rego Logic</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'objective'}
            className={`drawer-tab-btn ${activeTab === 'objective' ? 'active' : ''}`}
            onClick={() => setActiveTab('objective')}
          >
            <Shield size={14} />
            <span>Security Objective</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'remediation'}
            className={`drawer-tab-btn ${activeTab === 'remediation' ? 'active' : ''}`}
            onClick={() => setActiveTab('remediation')}
          >
            <Layers size={14} />
            <span>Remediation & Findings</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="policy-drawer-body">
          {activeTab === 'rego' && (
            <div className="drawer-tab-pane">
              {/* Policy Meta Grid */}
              <div className="drawer-section">
                <h4 className="drawer-section-title">Constraint Template Architecture</h4>
                <div className="drawer-info-grid">
                  <div className="info-cell">
                    <span className="info-key">Template Kind</span>
                    <span className="info-val code-badge">{policy.templateKind}</span>
                  </div>
                  <div className="info-cell">
                    <span className="info-key">Constraint Name</span>
                    <span className="info-val code-badge">{policy.constraintName}</span>
                  </div>
                  <div className="info-cell">
                    <span className="info-key">Evaluated Targets</span>
                    <span className="info-val">
                      {policy.targetKinds.join(', ')}
                    </span>
                  </div>
                  <div className="info-cell">
                    <span className="info-key">Excluded Namespaces</span>
                    <span className="info-val code-badge namespace">
                      {policy.excludedNamespaces.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rego Code Viewer */}
              <div className="drawer-section">
                <div className="rego-header-row">
                  <h4 className="drawer-section-title">Rego Policy Implementation</h4>
                  <button className="copy-code-btn" onClick={handleCopyRego}>
                    {copiedRego ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedRego ? 'Copied' : 'Copy Rego'}</span>
                  </button>
                </div>
                <div className="rego-code-block">
                  <pre>
                    <code>{policy.regoSource}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'objective' && (
            <div className="drawer-tab-pane">
              <div className="drawer-section">
                <h4 className="drawer-section-title">Threat Model & Rationale</h4>
                <div className="objective-card">
                  <p className="objective-text">{policy.securityObjective}</p>
                </div>
              </div>

              <div className="drawer-section">
                <h4 className="drawer-section-title">Enforcement Policy Description</h4>
                <p className="description-text">{policy.description}</p>
              </div>

              <div className="drawer-section">
                <h4 className="drawer-section-title">Standard Webhook Denial Message</h4>
                <div className="denial-message-box">
                  <code>{policy.violationTemplateMessage}</code>
                </div>
              </div>

              <div className="drawer-section">
                <h4 className="drawer-section-title">Enforcement Metrics</h4>
                <div className="policy-metrics-pill-grid">
                  <div className="metric-pill">
                    <span className="metric-label">Active Audit Violations</span>
                    <span className="metric-val text-amber">{policy.activeViolationsCount}</span>
                  </div>
                  <div className="metric-pill">
                    <span className="metric-label">Blocked Admission Attempts</span>
                    <span className="metric-val text-cyan">{policy.blockedAdmissionsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'remediation' && (
            <div className="drawer-tab-pane">
              <div className="drawer-section">
                <h4 className="drawer-section-title">Remediation Guidance</h4>
                <p className="remediation-guide-text">{policy.remediationGuidance}</p>
              </div>

              <div className="drawer-section">
                <div className="rego-header-row">
                  <h4 className="drawer-section-title">Compliant Kubernetes YAML Spec</h4>
                  <button className="copy-code-btn" onClick={handleCopySnippet}>
                    {copiedSnippet ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedSnippet ? 'Copied' : 'Copy Snippet'}</span>
                  </button>
                </div>
                <div className="remediation-snippet-block">
                  <pre>
                    <code>{policy.remediationSnippet}</code>
                  </pre>
                </div>
              </div>

              {policy.linkedFindingId && (
                <div className="drawer-section">
                  <div className="linked-finding-banner">
                    <div className="finding-banner-top">
                      <AlertTriangle size={18} className="warning-icon" />
                      <div className="finding-banner-text">
                        <h5>Linked Command Center Finding</h5>
                        <p>
                          Violations of this policy map directly to an active security threat finding.
                        </p>
                      </div>
                    </div>
                    <div className="finding-banner-actions">
                      <span className="finding-id-tag">{policy.linkedFindingId}</span>
                      {onNavigateToFinding && (
                        <button
                          className="view-finding-btn"
                          onClick={() => {
                            onNavigateToFinding(policy.linkedFindingId);
                            onClose();
                          }}
                        >
                          <span>Inspect Finding</span>
                          <ExternalLink size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="policy-drawer-footer">
          <div className="footer-left">
            <span className="footer-id">Template: {policy.templateKind}</span>
          </div>
          <button className="footer-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

