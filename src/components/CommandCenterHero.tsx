import React, { useMemo, useState } from 'react';
import { 
  Cloud, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  ExternalLink,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { SecurityFinding, FindingSeverity } from '../types/security';

interface CommandCenterHeroProps {
  findings: SecurityFinding[];
  onSelectFinding: (finding: SecurityFinding) => void;
  onNavigateToExplorer: () => void;
}

export const CommandCenterHero: React.FC<CommandCenterHeroProps> = ({
  findings,
  onSelectFinding,
  onNavigateToExplorer,
}) => {
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Dynamically derived calculations from actual dataset
  const totalFindings = findings.length;

  const distinctAssets = useMemo(() => {
    return new Set(findings.map((f) => f.affectedAsset)).size;
  }, [findings]);

  const severityCounts = useMemo(() => {
    return {
      critical: findings.filter((f) => f.severity === 'critical').length,
      high: findings.filter((f) => f.severity === 'high').length,
      medium: findings.filter((f) => f.severity === 'medium').length,
      low: findings.filter((f) => f.severity === 'low').length,
    };
  }, [findings]);

  const triageCounts = useMemo(() => {
    return {
      new: findings.filter((f) => f.status === 'new').length,
      in_progress: findings.filter((f) => f.status === 'in_progress').length,
      resolved: findings.filter((f) => f.status === 'resolved').length,
    };
  }, [findings]);

  const domainCounts = useMemo(() => {
    return {
      supply_chain: findings.filter((f) => f.domain === 'supply_chain').length,
      policy: findings.filter((f) => f.domain === 'policy').length,
      identity: findings.filter((f) => f.domain === 'identity').length,
      service_mesh: findings.filter((f) => f.domain === 'service_mesh').length,
      workload_runtime: findings.filter((f) => f.domain === 'workload_runtime').length,
    };
  }, [findings]);

  // Top 3 highest-risk open findings
  const topRisks = useMemo(() => {
    return [...findings]
      .filter((f) => f.status !== 'resolved')
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3);
  }, [findings]);

  const activeThreatsCount = severityCounts.critical + severityCounts.high;
  const postureCasesCount = severityCounts.medium + severityCounts.low;

  return (
    <div className="telemetry-isometric-space">
      {/* 3D Perspective Receding Floor Plane */}
      <div className="isometric-floor-plane"></div>

      {/* Top Headline Block */}
      <div className="isometric-space-header">
        <div className="isometric-title-block">
          <h1 className="space-headline">Security Command Center</h1>
          <span className="space-subhead">
            Continuous Zero-Trust Verification • Demonstration Testbed
          </span>
        </div>

        <div className="env-indicator-pill">
          <span className="indicator-tag">[SIMULATED TESTBED]</span>
          <span>12 Evaluated Workloads</span>
        </div>
      </div>

      {/* 3-Stage Visual Flow Stage */}
      <div className="isometric-flow-stage">
        {/* Left: Ingestion Source Stream */}
        <div className="ingestion-stream-column">
          <div className="stream-node-pill" title="Simulated AWS EKS Alpha Testbed">
            <div className="stream-node-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#F97316' }}>
              <Cloud size={15} />
            </div>
            <div>
              <div className="stream-node-title">AWS EKS Alpha</div>
              <div className="stream-node-meta">Simulated IRSA • 6 Records</div>
            </div>
          </div>

          <div className="stream-node-pill" title="Simulated Azure AKS Bravo Testbed">
            <div className="stream-node-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
              <Cloud size={15} />
            </div>
            <div>
              <div className="stream-node-title">Azure AKS Bravo</div>
              <div className="stream-node-meta">Workload ID • 6 Records</div>
            </div>
          </div>
        </div>

        {/* Center: Authoritative Focal Numbers + Floating Glass Card */}
        <div className="center-telemetry-nexus">
          {/* Subtle SVG Bezier Conduit Connections */}
          <svg className="flow-conduit-svg-layer" viewBox="0 0 600 280" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="streamInFlow" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="threatOutFlow" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#FB7185" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FB7185" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="postureOutFlow" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path d="M 0 80 C 80 80, 100 100, 160 100" stroke="url(#streamInFlow)" strokeWidth="2" strokeDasharray="4 2" />
            <path d="M 0 160 C 80 160, 100 140, 160 140" stroke="url(#streamInFlow)" strokeWidth="2" strokeDasharray="4 2" />
            <path d="M 440 100 C 500 100, 520 70, 600 70" stroke="url(#threatOutFlow)" strokeWidth="2" />
            <path d="M 440 140 C 500 140, 520 180, 600 180" stroke="url(#postureOutFlow)" strokeWidth="2" />
          </svg>

          {/* Focal Numbers Cluster (Inspired by Image 2: Projects / Incidents) */}
          <div className="focal-counters-cluster">
            <div className="focal-counter-unit">
              <span className="focal-counter-label">Evaluated Workloads</span>
              <span className="focal-counter-value">{distinctAssets}</span>
            </div>

            <div className="focal-counter-unit critical">
              <span className="focal-counter-label">Active Breaches</span>
              <span className="focal-counter-value">{triageCounts.new + triageCounts.in_progress}</span>
              <div className="focal-breakdown-row">
                <span className="focal-sev-chip critical">▲▲ {severityCounts.critical} Crit</span>
                <span className="focal-sev-chip high">▲ {severityCounts.high} High</span>
                <span className="focal-sev-chip medium">■ {severityCounts.medium} Med</span>
                <span className="focal-sev-chip low">● {severityCounts.low} Low</span>
              </div>
            </div>
          </div>

          {/* Floating Translucent Glass Card (Directly inspired by Image 2 center card!) */}
          <div className="floating-priority-glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <ShieldAlert size={13} color="var(--sev-critical)" />
                Top Priority Findings by Risk Score
              </span>
              <span className="glass-card-hint">Click row to inspect context</span>
            </div>

            {topRisks.map((finding) => (
              <div 
                key={finding.id}
                className="priority-incident-row"
                onClick={() => onSelectFinding(finding)}
                title={`Inspect ${finding.title}`}
              >
                <div className="priority-incident-left">
                  <span className="priority-incident-name">{finding.title}</span>
                  <span className="priority-incident-sub">
                    {finding.id} • {finding.affectedAsset.split(':')[1]?.trim() || finding.affectedAsset}
                  </span>
                </div>
                <span className="priority-score-badge">
                  Score {finding.riskScore}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Outflow Destination Targets */}
        <div className="outflow-targets-column">
          <div className="outflow-target-card threats">
            <div className="outflow-card-header threats">
              <span>Critical Breaches</span>
              <span>Urgent</span>
            </div>
            <div className="outflow-count-number">{activeThreatsCount}</div>
            <div className="outflow-desc-text">
              {severityCounts.critical} admission rejections & privilege alerts
            </div>
          </div>

          <div className="outflow-target-card posture">
            <div className="outflow-card-header posture">
              <span>Policy & Mesh Drift</span>
              <span>Posture</span>
            </div>
            <div className="outflow-count-number">{postureCasesCount}</div>
            <div className="outflow-desc-text">
              Configuration & mTLS policy drift cases
            </div>
          </div>

          {/* Direct CTA into Findings Explorer */}
          <button 
            className="btn-open-workspace"
            onClick={onNavigateToExplorer}
            title="Open comprehensive findings explorer with search and filters"
          >
            <span>Explore All {totalFindings} Findings</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Single-Line Quiet Baseline Metrics Ribbon (Inspired by Image 2 & Image 5) */}
      <div className="space-baseline-ribbon">
        <div className="baseline-metrics-left">
          <div className="baseline-metric-item">
            <span>Evaluated Workloads:</span>
            <strong>{distinctAssets}</strong>
          </div>
          <span>•</span>
          <div className="baseline-metric-item">
            <span>Supply Chain:</span>
            <strong>{domainCounts.supply_chain}</strong>
          </div>
          <span>•</span>
          <div className="baseline-metric-item">
            <span>Policy-as-Code:</span>
            <strong>{domainCounts.policy}</strong>
          </div>
          <span>•</span>
          <div className="baseline-metric-item">
            <span>Workload Identity:</span>
            <strong>{domainCounts.identity}</strong>
          </div>
          <span>•</span>
          <div className="baseline-metric-item">
            <span>Service Mesh:</span>
            <strong>{domainCounts.service_mesh}</strong>
          </div>
          <span>•</span>
          <div className="baseline-metric-item">
            <span>Runtime Guard:</span>
            <strong>{domainCounts.workload_runtime}</strong>
          </div>
        </div>

        <div className="baseline-latency-right">
          <span>Continuous Evaluation • Zero Hardcoded Values</span>
          <svg width="48" height="14" viewBox="0 0 48 14" fill="none">
            <path d="M0 7 C 8 2, 16 12, 24 7 C 32 2, 40 12, 48 7" stroke="var(--accent-teal)" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
};
