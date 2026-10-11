import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  Shield, 
  FileCode, 
  Copy, 
  Check, 
  ChevronRight,
  ExternalLink,
  Terminal,
  Crosshair,
  Key,
  Globe,
  Server,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { SecurityFinding, FindingSeverity, FindingStatus } from '../types/security';

interface FindingDetailDrawerProps {
  finding: SecurityFinding | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: FindingStatus) => void;
}

type DrawerTab = 'overview' | 'lineage' | 'evidence' | 'remediation';

export const FindingDetailDrawer: React.FC<FindingDetailDrawerProps> = ({
  finding,
  onClose,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!finding) return null;

  const handleCopyCode = () => {
    if (finding.regoOrConfigSnippet) {
      navigator.clipboard.writeText(finding.regoOrConfigSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getRemediationCommand = () => {
    switch (finding.domain) {
      case 'supply_chain':
        return `cosign verify --key cosign.pub ${finding.affectedAsset.split(':')[1]?.trim() || 'target-image'}`;
      case 'policy':
        return `kubectl apply -f gatekeeper-constraint-${finding.cveOrRuleId.toLowerCase()}.yaml`;
      case 'service_mesh':
        return `kubectl apply -f istio-peer-authentication-strict.yaml -n ${finding.namespace}`;
      case 'identity':
        return `spire-agent api fetch x509 -socketPath /run/spire/sockets/agent.sock`;
      default:
        return `kubectl patch deployment ${finding.affectedAsset.split(':')[1]?.trim() || 'target'} -n ${finding.namespace} --type='json' -p='[{"op":"replace","path":"/spec/template/spec/securityContext/readOnlyRootFilesystem","value":true}]'`;
    }
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(getRemediationCommand());
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const renderSeverityBadge = (severity: FindingSeverity) => {
    switch (severity) {
      case 'critical':
        return <span className="sev-chevron-pill critical"><span>▲▲</span> Critical</span>;
      case 'high':
        return <span className="sev-chevron-pill high"><span>▲</span> High</span>;
      case 'medium':
        return <span className="sev-chevron-pill medium"><span>■</span> Medium</span>;
      case 'low':
        return <span className="sev-chevron-pill low"><span>●</span> Low</span>;
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'attacker':
        return <Crosshair size={16} />;
      case 'ingress':
        return <Globe size={16} />;
      case 'workload':
        return <Server size={16} />;
      case 'exploit':
      case 'impact':
        return <Zap size={16} />;
      default:
        return <ShieldAlert size={16} />;
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div 
        className="cortex-investigation-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner (Cortex Cloud Image 5 & 12) */}
        <div className="drawer-top-banner">
          <div className="drawer-banner-tags">
            <span className="drawer-id-tag">{finding.id}</span>
            {renderSeverityBadge(finding.severity)}
            <span className="domain-cell-pill">
              {finding.domain.toUpperCase().replace('_', ' ')}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {finding.cveOrRuleId}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              className="drawer-status-dropdown"
              value={finding.status}
              onChange={(e) => onUpdateStatus(finding.id, e.target.value as FindingStatus)}
              title="Update Triage Status"
            >
              <option value="new">◇ Status: New</option>
              <option value="in_progress">◓ Status: In Progress</option>
              <option value="resolved">✓ Status: Resolved</option>
            </select>

            <button 
              className="btn-close-drawer"
              onClick={onClose}
              title="Close Drawer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Headline Area */}
        <div className="drawer-headline-area">
          <h2 className="drawer-title-text">{finding.title}</h2>
          <div className="drawer-meta-ribbon">
            <span className="meta-ribbon-item">
              Risk Score: <strong>{finding.riskScore}/100</strong>
            </span>
            <span className="meta-ribbon-item">
              Target: <strong>{finding.affectedAsset}</strong>
            </span>
            <span className="meta-ribbon-item">
              Cluster: <strong>{finding.cluster.replace(' (Planned)', '')}</strong>
            </span>
            <span className="meta-ribbon-item">
              Namespace: <strong>{finding.namespace}</strong>
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Overview | Attack Lineage | Policy Evidence | Remediation) */}
        <div className="drawer-tabs-bar">
          <button 
            className={`drawer-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'lineage' ? 'active' : ''}`}
            onClick={() => setActiveTab('lineage')}
          >
            Attack Path Lineage ({finding.attackPath.length})
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
            onClick={() => setActiveTab('evidence')}
          >
            Policy & Evidence
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'remediation' ? 'active' : ''}`}
            onClick={() => setActiveTab('remediation')}
          >
            Remediation & Triage
          </button>
        </div>

        {/* Tab Viewport */}
        <div className="drawer-tab-viewport">
          {activeTab === 'overview' && (
            <>
              {/* Description Card */}
              <div className="drawer-section-card">
                <div className="drawer-section-title">
                  <ShieldAlert size={13} color="var(--accent-blue)" />
                  Security Finding Description
                </div>
                <p className="drawer-desc-text">
                  {finding.description}
                </p>
              </div>

              {/* Threat Impact Card */}
              <div className="drawer-section-card">
                <div className="drawer-section-title">
                  <Zap size={13} color="var(--sev-critical)" />
                  Threat Impact & Blast Radius
                </div>
                <p className="drawer-desc-text" style={{ color: '#FCA5A5' }}>
                  {finding.threatImpact}
                </p>
              </div>

              {/* Zero-Trust Principle Violated */}
              <div className="drawer-section-card">
                <div className="drawer-section-title">
                  <Shield size={13} color="var(--accent-cyan)" />
                  Zero-Trust Architecture Principle Violated
                </div>
                <p className="drawer-desc-text" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {finding.zeroTrustPrincipleViolated}
                </p>
              </div>

              {/* Temporal Record Metadata */}
              <div className="drawer-section-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>First Ingested</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {finding.firstDetected}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Last Attestation Check</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {finding.lastObserved}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'lineage' && (
            <div className="attack-lineage-canvas">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Reconstructed Attack Lineage Graph (Demonstration Verification Model)
              </div>

              {finding.attackPath.map((step) => (
                <div key={step.step} className="attack-step-node">
                  <div className={`attack-step-icon ${step.type}`}>
                    {getStepIcon(step.type)}
                  </div>
                  <div className="attack-step-content">
                    <div className="attack-step-label">
                      Step {step.step}: {step.label}
                    </div>
                    <div className="attack-step-details">
                      {step.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'evidence' && (
            <>
              {finding.regoOrConfigSnippet ? (
                <div className="code-snippet-box">
                  <div className="code-snippet-header">
                    <span>
                      {finding.domain === 'policy' || finding.domain === 'supply_chain'
                        ? 'rego / constraint-template.rego'
                        : 'kubernetes / security-manifest.yaml'}
                    </span>
                    <button 
                      className="btn-copy-code"
                      onClick={handleCopyCode}
                    >
                      {copiedCode ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="code-snippet-body">
                    {finding.regoOrConfigSnippet}
                  </div>
                </div>
              ) : (
                <div className="drawer-section-card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No declarative Rego rule or YAML snippet attached to this finding.
                </div>
              )}

              <div className="drawer-section-card">
                <div className="drawer-section-title">
                  <FileCode size={13} color="var(--accent-cyan)" />
                  Policy Enforcement Context
                </div>
                <p className="drawer-desc-text">
                  This finding violates the baseline Zero-Trust security profile enforced by TrustMesh. 
                  In Phase 4, OPA Gatekeeper ValidatingAdmissionWebhooks and Istio Layer-7 AuthorizationPolicies 
                  will automatically reject non-compliant deployments at admission time.
                </p>
              </div>
            </>
          )}

          {activeTab === 'remediation' && (
            <>
              {/* Guidance Box */}
              <div className="remediation-box">
                <div className="remediation-title">
                  ✓ Prescribed Remediation Plan
                </div>
                <div className="remediation-text">
                  {finding.remediationGuidance}
                </div>
              </div>

              {/* Actionable Command Box */}
              <div className="code-snippet-box">
                <div className="code-snippet-header">
                  <span>CLI Remediation Command</span>
                  <button 
                    className="btn-copy-code"
                    onClick={handleCopyCommand}
                  >
                    {copiedCmd ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                    <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="code-snippet-body" style={{ color: '#A7F3D0' }}>
                  {getRemediationCommand()}
                </div>
              </div>

              {/* Quick Triage Buttons */}
              <div className="drawer-section-card">
                <div className="drawer-section-title">
                  <CheckCircle2 size={13} color="var(--accent-blue)" />
                  Operational Triage Actions
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    className="btn-connectors"
                    style={{ borderColor: 'var(--status-in-progress)', color: 'var(--status-in-progress)' }}
                    onClick={() => onUpdateStatus(finding.id, 'in_progress')}
                  >
                    Mark as In Progress
                  </button>
                  <button
                    className="btn-connectors"
                    style={{ borderColor: 'var(--status-resolved)', color: 'var(--status-resolved)' }}
                    onClick={() => onUpdateStatus(finding.id, 'resolved')}
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
