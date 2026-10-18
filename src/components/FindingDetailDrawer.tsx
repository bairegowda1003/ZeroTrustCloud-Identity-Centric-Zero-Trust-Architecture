import React, { useState } from 'react';
import { X, Clock, Hash, Tag, Copy, Check, Globe, Shield, Server, Zap, AlertTriangle } from 'lucide-react';
import { SecurityFinding, FindingStatus } from '../types/security';

interface FindingDetailDrawerProps {
  finding: SecurityFinding | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (findingId: string, status: FindingStatus) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
};

const DOMAIN_LABELS: Record<string, string> = {
  identity: 'Identity Security',
  policy: 'Policy Compliance',
  service_mesh: 'Service Mesh',
  supply_chain: 'Supply Chain',
  workload_runtime: 'Workload Runtime',
};

type TabId = 'overview' | 'evidence' | 'remediation';

export const FindingDetailDrawer: React.FC<FindingDetailDrawerProps> = ({
  finding,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [copied, setCopied] = useState(false);

  if (!finding) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'remediation', label: 'Remediation' },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`drawer-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Panel */}
      <div
        className={`drawer-panel ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="drawer-header">
          <span className={`drawer-severity-badge ${finding.severity}`}>
            {finding.severity.charAt(0).toUpperCase()}
          </span>
          <div className="drawer-header-info">
            <div className="drawer-header-meta">
              <span><Hash size={10} /> {finding.id}</span>
              <span><Tag size={10} /> {finding.cveOrRuleId}</span>
              <span><Clock size={10} /> {finding.firstDetected}</span>
            </div>
            <h2 id="drawer-title" className="drawer-finding-title">{finding.title}</h2>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="drawer-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`drawer-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="drawer-body">
          {activeTab === 'overview' && (
            <>
              {/* Description */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">Description</h3>
                <p className="drawer-text">{finding.description}</p>
              </div>

              {/* Impact */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">Threat Impact</h3>
                <p className="drawer-text">{finding.threatImpact}</p>
              </div>

              {/* Zero Trust Principle */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">Zero Trust Principle Violated</h3>
                <p className="drawer-text" style={{ color: 'var(--severity-high)' }}>
                  {finding.zeroTrustPrincipleViolated}
                </p>
              </div>

              {/* Detail Grid */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">Details</h3>
                <div className="drawer-detail-grid">
                  <span className="drawer-detail-label">Status</span>
                  <span className="drawer-detail-value">
                    <select
                      className="drawer-status-select"
                      value={finding.status}
                      onChange={(e) => onStatusChange(finding.id, e.target.value as FindingStatus)}
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="suppressed">Suppressed</option>
                    </select>
                  </span>

                  <span className="drawer-detail-label">Risk Score</span>
                  <span className="drawer-detail-value">
                    <span className={`cc-finding-score ${finding.severity}`}>
                      {finding.riskScore}
                    </span>
                  </span>

                  <span className="drawer-detail-label">Severity</span>
                  <span className="drawer-detail-value" style={{ color: SEVERITY_COLORS[finding.severity], textTransform: 'capitalize', fontWeight: 600 }}>
                    {finding.severity}
                  </span>

                  <span className="drawer-detail-label">Domain</span>
                  <span className="drawer-detail-value">{DOMAIN_LABELS[finding.domain]}</span>

                  <span className="drawer-detail-label">Affected Asset</span>
                  <span className="drawer-detail-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.785rem' }}>
                    {finding.affectedAsset}
                  </span>

                  <span className="drawer-detail-label">Cluster</span>
                  <span className="drawer-detail-value">{finding.cluster}</span>

                  <span className="drawer-detail-label">Namespace</span>
                  <span className="drawer-detail-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.785rem' }}>
                    {finding.namespace}
                  </span>

                  <span className="drawer-detail-label">First Detected</span>
                  <span className="drawer-detail-value">{finding.firstDetected}</span>

                  <span className="drawer-detail-label">Last Observed</span>
                  <span className="drawer-detail-value">{finding.lastObserved}</span>
                </div>
              </div>

              {/* Attack Path Visualization */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">Attack Path</h3>
                <div className="drawer-attack-path">
                  {finding.attackPath.map((step, i) => (
                    <AttackPathStepNode
                      key={step.step}
                      icon={getAttackPathIcon(step.type)}
                      label={step.label}
                      detail={step.details}
                      type={step.type}
                      showConnector={i < finding.attackPath.length - 1}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'evidence' && (
            <div className="drawer-section">
              <h3 className="drawer-section-title">Evidence</h3>

              {finding.regoOrConfigSnippet && (
                <>
                  <p className="drawer-text" style={{ marginBottom: '12px' }}>
                    Policy rule or configuration snippet associated with this finding:
                  </p>
                  <div className="drawer-code-block" style={{ marginBottom: '20px' }}>
                    <div className="drawer-code-header">
                      <span className="drawer-code-lang">rego / yaml</span>
                      <button
                        className="drawer-copy-btn"
                        onClick={() => handleCopy(finding.regoOrConfigSnippet || '')}
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="drawer-code-content">{finding.regoOrConfigSnippet}</pre>
                  </div>
                </>
              )}

              <p className="drawer-text" style={{ marginBottom: '12px' }}>
                Finding metadata (demo data — tagged per project integrity rules):
              </p>
              <div className="drawer-code-block">
                <div className="drawer-code-header">
                  <span className="drawer-code-lang">json</span>
                  <button
                    className="drawer-copy-btn"
                    onClick={() => handleCopy(JSON.stringify({
                      findingId: finding.id,
                      cveOrRuleId: finding.cveOrRuleId,
                      severity: finding.severity,
                      riskScore: finding.riskScore,
                      domain: finding.domain,
                      status: finding.status,
                      affectedAsset: finding.affectedAsset,
                      cluster: finding.cluster,
                      namespace: finding.namespace,
                      isDemoData: finding.isDemoData,
                    }, null, 2))}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="drawer-code-content">
                  {JSON.stringify({
                    findingId: finding.id,
                    cveOrRuleId: finding.cveOrRuleId,
                    severity: finding.severity,
                    riskScore: finding.riskScore,
                    domain: finding.domain,
                    status: finding.status,
                    affectedAsset: finding.affectedAsset,
                    cluster: finding.cluster,
                    namespace: finding.namespace,
                    isDemoData: finding.isDemoData,
                  }, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'remediation' && (
            <div className="drawer-section">
              <h3 className="drawer-section-title">Remediation Guidance</h3>
              <p className="drawer-text" style={{ marginBottom: '16px' }}>
                {finding.remediationGuidance}
              </p>

              {finding.regoOrConfigSnippet && (
                <div className="drawer-code-block" style={{ marginBottom: '16px' }}>
                  <div className="drawer-code-header">
                    <span className="drawer-code-lang">fix</span>
                    <button
                      className="drawer-copy-btn"
                      onClick={() => handleCopy(finding.regoOrConfigSnippet || '')}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="drawer-code-content">{finding.regoOrConfigSnippet}</pre>
                </div>
              )}

              <div className="drawer-code-block">
                <div className="drawer-code-header">
                  <span className="drawer-code-lang">CLI</span>
                  <button
                    className="drawer-copy-btn"
                    onClick={() => handleCopy(`trustmesh remediate --finding ${finding.id} --auto`)}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="drawer-code-content">
{`# TrustMesh Remediation (Demo)
trustmesh remediate --finding ${finding.id} --auto

# View detailed report
trustmesh inspect ${finding.id} --verbose`}
                </pre>
              </div>

              <div style={{
                marginTop: '20px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.15)',
                fontSize: '0.785rem',
                color: '#eab308',
              }}>
                ⚠ Demo Mode — Remediation commands are illustrative only. No actual cloud modifications will occur.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* Helper to get icon for attack path step type */
function getAttackPathIcon(type: string): React.ReactNode {
  switch (type) {
    case 'attacker': return <Globe size={18} />;
    case 'ingress': return <Shield size={18} />;
    case 'workload': return <Server size={18} />;
    case 'exploit': return <Zap size={18} />;
    case 'impact': return <AlertTriangle size={18} />;
    default: return <Server size={18} />;
  }
}

/* Attack Path Step */
const AttackPathStepNode: React.FC<{
  icon: React.ReactNode;
  label: string;
  detail: string;
  type: string;
  showConnector: boolean;
}> = ({ icon, label, detail, type, showConnector }) => {
  // Map type to CSS class — default to 'workload' for unknown types
  const cssType = ['attacker', 'ingress', 'workload', 'exploit', 'impact'].includes(type) ? type : 'workload';
  
  return (
    <div className="attack-path-step">
      <div className={`attack-path-node ${cssType}`}>
        {icon}
      </div>
      <div className="attack-path-label">{label}</div>
      <div className="attack-path-detail">{detail}</div>
      {showConnector && <div className="attack-path-connector" />}
    </div>
  );
};
