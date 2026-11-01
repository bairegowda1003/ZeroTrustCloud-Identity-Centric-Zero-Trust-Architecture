import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Server,
  KeyRound,
  Network,
  ExternalLink,
  Clock,
  Layers,
  ArrowRight,
  Shield,
  FileCode,
} from 'lucide-react';
import { WorkloadIdentityRecord } from '../../types/identity';

interface WorkloadDetailDrawerProps {
  workload: WorkloadIdentityRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToFinding?: (findingId: string) => void;
}

export const WorkloadDetailDrawer: React.FC<WorkloadDetailDrawerProps> = ({
  workload,
  isOpen,
  onClose,
  onNavigateToFinding,
}) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'boundaries' | 'audit'>('identity');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !workload) return null;

  const isVerified = workload.status === 'verified';
  const isAttention = workload.status === 'attention_required';
  const isRejected = workload.status === 'rejected';

  return (
    <div className="workload-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="workload-drawer-sheet"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Details for ${workload.name}`}
      >
        {/* Drawer Header */}
        <div className="workload-drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-title-row">
              <span className="drawer-workload-icon">
                <Server size={18} />
              </span>
              <h3 className="drawer-title">{workload.name}</h3>
              <span className="drawer-kind-badge">{workload.workloadType}</span>
            </div>
            <div className="drawer-subtitle-row">
              <span className="drawer-ns-pill">ns: {workload.namespace}</span>
              <span className="drawer-cluster-pill">{workload.cluster}</span>
              <span
                className={`drawer-status-pill ${
                  isVerified ? 'verified' : isAttention ? 'attention' : 'rejected'
                }`}
              >
                {isVerified ? (
                  <>
                    <ShieldCheck size={12} /> Verified Identity
                  </>
                ) : isAttention ? (
                  <>
                    <AlertTriangle size={12} /> Drift / Attention
                  </>
                ) : (
                  <>
                    <ShieldAlert size={12} /> Access Rejected
                  </>
                )}
              </span>
            </div>
          </div>
          <button
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close Workload Details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Tab Navigation */}
        <div className="workload-drawer-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'identity'}
            className={`drawer-tab-btn ${activeTab === 'identity' ? 'active' : ''}`}
            onClick={() => setActiveTab('identity')}
          >
            <KeyRound size={14} />
            <span>Identity & Token</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'boundaries'}
            className={`drawer-tab-btn ${activeTab === 'boundaries' ? 'active' : ''}`}
            onClick={() => setActiveTab('boundaries')}
          >
            <Network size={14} />
            <span>Boundaries</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'audit'}
            className={`drawer-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <Shield size={14} />
            <span>Security Audit</span>
            {workload.linkedFindingId && <span className="tab-alert-badge">!</span>}
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="workload-drawer-body">
          {activeTab === 'identity' && (
            <div className="drawer-tab-pane">
              <div className="drawer-section">
                <h4 className="drawer-section-title">Kubernetes Service Account</h4>
                <div className="drawer-info-grid">
                  <div className="info-cell">
                    <span className="info-key">Service Account</span>
                    <span className="info-val code-badge">{workload.serviceAccount}</span>
                  </div>
                  <div className="info-cell">
                    <span className="info-key">SA UID</span>
                    <span className="info-val code-badge">{workload.serviceAccountUid}</span>
                  </div>
                  <div className="info-cell">
                    <span className="info-key">Default Token Automount</span>
                    <span
                      className={`info-val ${
                        !workload.automountServiceAccountToken ? 'text-allow' : 'text-deny'
                      }`}
                    >
                      {!workload.automountServiceAccountToken
                        ? 'Disabled (Best Practice)'
                        : 'Enabled (High Risk: Root secret mounted)'}
                    </span>
                  </div>
                  <div className="info-cell">
                    <span className="info-key">Authentication Model</span>
                    <span className="info-val">
                      {workload.authMethod === 'projected_sa_token'
                        ? 'Projected Ephemeral Token'
                        : workload.authMethod === 'k8s_service_account'
                        ? 'Static Service Account Secret'
                        : 'Shared Default Service Account'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="drawer-section">
                <h4 className="drawer-section-title">Token Projection Configuration</h4>
                <div className="token-spec-card">
                  <div className="token-spec-row">
                    <span className="token-spec-key">Intended Audience</span>
                    <span className="token-spec-val code-badge">trustmesh.internal</span>
                  </div>
                  <div className="token-spec-row">
                    <span className="token-spec-key">Token Expiration</span>
                    <span className="token-spec-val">3600 seconds (ephemeral rotating)</span>
                  </div>
                  <div className="token-spec-row">
                    <span className="token-spec-key">Projected Mount Path</span>
                    <span className="token-spec-val code-badge">/var/run/secrets/tokens/trustmesh-token</span>
                  </div>
                  <div className="token-spec-row">
                    <span className="token-spec-key">Cryptographic Signer</span>
                    <span className="token-spec-val">kube-apiserver (service-account-issuer)</span>
                  </div>
                </div>
              </div>

              <div className="drawer-section">
                <h4 className="drawer-section-title">
                  Active Pod Replicas ({workload.podNames.length})
                </h4>
                <div className="pod-instances-list">
                  {workload.podNames.map((pod) => (
                    <div key={pod} className="pod-instance-pill">
                      <span className="pod-dot" />
                      <code>{pod}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'boundaries' && (
            <div className="drawer-tab-pane">
              <div className="drawer-section">
                <h4 className="drawer-section-title">Allowed Ingress Sources</h4>
                <p className="drawer-section-desc">
                  Microservices permitted to initiate incoming RPC or HTTP sessions to this workload.
                </p>
                {workload.allowedIngressSources.length === 0 ? (
                  <div className="empty-boundary-card">
                    <ShieldAlert size={16} />
                    <span>No ingress permitted (isolated backend storage or batch executor)</span>
                  </div>
                ) : (
                  <div className="boundary-tags-list">
                    {workload.allowedIngressSources.map((source) => (
                      <span key={source} className="boundary-tag ingress">
                        <ArrowRight size={12} className="tag-arrow" />
                        <code>{source}</code>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="drawer-section">
                <h4 className="drawer-section-title">Allowed Egress Destinations</h4>
                <p className="drawer-section-desc">
                  Outbound endpoints this workload is cryptographically permitted to communicate with.
                </p>
                {workload.allowedEgressDestinations.length === 0 ? (
                  <div className="empty-boundary-card">
                    <ShieldCheck size={16} />
                    <span>Zero outbound egress permitted (Strict zero-egress perimeter)</span>
                  </div>
                ) : (
                  <div className="boundary-tags-list">
                    {workload.allowedEgressDestinations.map((dest) => (
                      <span key={dest} className="boundary-tag egress">
                        <ArrowRight size={12} className="tag-arrow" />
                        <code>{dest}</code>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="drawer-section">
                <h4 className="drawer-section-title">Enforced Network & Identity Policies</h4>
                <div className="policies-pills-list">
                  {workload.assignedPolicyNames.length === 0 ? (
                    <div className="policy-pill-empty">
                      <AlertTriangle size={14} />
                      <span>No explicit policies attached. Workload relies on default namespace rules.</span>
                    </div>
                  ) : (
                    workload.assignedPolicyNames.map((pol) => (
                      <div key={pol} className="policy-pill-item">
                        <ShieldCheck size={14} className="policy-icon" />
                        <span className="policy-name">{pol}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="drawer-tab-pane">
              <div className="drawer-section">
                <h4 className="drawer-section-title">Zero-Trust Verification Audit</h4>
                <div className="audit-reason-card">
                  <div className="audit-reason-header">
                    <span className="audit-reason-label">EVALUATION AUDIT LOG</span>
                    <span className="audit-timestamp">
                      <Clock size={12} /> {new Date(workload.lastVerified).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="audit-reason-text">{workload.statusReason}</p>
                </div>
              </div>

              {workload.linkedFindingId && (
                <div className="drawer-section">
                  <div className="linked-finding-banner">
                    <div className="finding-banner-top">
                      <AlertTriangle size={18} className="warning-icon" />
                      <div className="finding-banner-text">
                        <h5>Linked Security Finding Detected</h5>
                        <p>
                          This workload has triggered an active threat surface finding in the TrustMesh Security Command Center.
                        </p>
                      </div>
                    </div>
                    <div className="finding-banner-actions">
                      <span className="finding-id-tag">{workload.linkedFindingId}</span>
                      {onNavigateToFinding && (
                        <button
                          className="view-finding-btn"
                          onClick={() => {
                            onNavigateToFinding(workload.linkedFindingId!);
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

              <div className="drawer-section">
                <h4 className="drawer-section-title">Manifest Provenance</h4>
                <div className="provenance-box">
                  <FileCode size={16} />
                  <span>
                    Introspected from local Kubernetes manifest: <code>k8s/microservices/02-workloads.yaml</code>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="workload-drawer-footer">
          <div className="footer-left">
            <span className="footer-id">ID: {workload.id}</span>
          </div>
          <button className="footer-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

