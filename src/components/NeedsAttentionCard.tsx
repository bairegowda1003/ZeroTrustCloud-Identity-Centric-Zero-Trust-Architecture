import React, { useState } from 'react';
import {
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  Server,
  Layers,
  MoreHorizontal,
} from 'lucide-react';
import { SecurityFinding } from '../types/security';

interface NeedsAttentionCardProps {
  findings: SecurityFinding[];
  onFindingClick: (finding: SecurityFinding) => void;
}

export const NeedsAttentionCard: React.FC<NeedsAttentionCardProps> = ({
  findings,
  onFindingClick,
}) => {
  // Sort findings by severity (critical first) then riskScore
  const criticalFindings = findings
    .filter((f) => f.severity === 'critical')
    .sort((a, b) => b.riskScore - a.riskScore);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback if no critical findings
  const currentFinding = criticalFindings[currentIndex] || findings[0];

  if (!currentFinding) return null;

  const totalCritical = criticalFindings.length;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalCritical - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalCritical - 1 ? prev + 1 : 0));
  };

  // Determine decision outcome label
  const decisionOutcome =
    currentFinding.cveOrRuleId.includes('PRIVILEGED') || currentFinding.cveOrRuleId.includes('COSIGN')
      ? { label: 'BLOCKED', color: '#ef4444', desc: 'Admission Webhook Denied' }
      : { label: 'ALERTED', color: '#f59e0b', desc: 'Zero-Trust Gate Triggered' };

  return (
    <article className="needs-attention-card" aria-label="Highest Priority Security Finding">
      {/* Top Meta Bar */}
      <div className="needs-attention-header">
        <div className="attention-badge-group">
          <span className="attention-pulse-dot" />
          <AlertOctagon size={14} className="attention-alert-icon" />
          <span className="attention-header-title">Needs Attention</span>
        </div>

        {totalCritical > 1 && (
          <div className="attention-pagination-controls">
            <button
              type="button"
              className="pagination-arrow-btn"
              onClick={handlePrev}
              title="Previous critical finding"
              aria-label="Previous finding"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="pagination-count-label">
              {currentIndex + 1} / {totalCritical}
            </span>
            <button
              type="button"
              className="pagination-arrow-btn"
              onClick={handleNext}
              title="Next critical finding"
              aria-label="Next finding"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout: Text Column Left, Isometric Graphic Right */}
      <div className="attention-body-grid">
        <div className="attention-info-column">
          <div className="attention-asset-pills">
            <span className="asset-pill asset-pill--workload" title="Affected Workload">
              <Server size={11} />
              <span>{currentFinding.affectedAsset.replace(/^k8s-[a-z]+:\s*/, '')}</span>
            </span>
            <span className="asset-pill asset-pill--ns" title="Kubernetes Namespace">
              {currentFinding.namespace}
            </span>
          </div>

          <h3 className="attention-finding-title">{currentFinding.title}</h3>

          <div className="attention-status-row">
            <span
              className="decision-outcome-pill"
              style={{ backgroundColor: `${decisionOutcome.color}1f`, color: decisionOutcome.color, borderColor: `${decisionOutcome.color}40` }}
            >
              {decisionOutcome.label}
            </span>
            <span className="attention-risk-score">
              Risk Score <strong className="risk-score-val">{currentFinding.riskScore}</strong>
            </span>
            <span className="attention-rule-id">{currentFinding.cveOrRuleId}</span>
          </div>

          <p className="attention-desc">
            {currentFinding.threatImpact}
          </p>

          <div className="attention-actions-row">
            <button
              type="button"
              className="view-evidence-btn"
              onClick={() => onFindingClick(currentFinding)}
            >
              <span>View evidence</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              className="attention-options-btn"
              onClick={() => onFindingClick(currentFinding)}
              title="Inspect details and remediation"
              aria-label="Inspect details"
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Custom SVG Isometric Workload Illustration */}
        <div className="attention-isometric-stage" aria-hidden="true">
          <svg
            viewBox="0 0 240 200"
            className="isometric-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Radial gradient glow for the highlighted violation pod */}
              <radialGradient id="violationGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>

              {/* Linear gradients for cube faces */}
              <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff4d4d" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#b91c1c" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
              <linearGradient id="cubeRight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>

              {/* Slate cubes (normal nodes) */}
              <linearGradient id="normalTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="normalLeft" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#0a0f1d" />
              </linearGradient>
              <linearGradient id="normalRight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Base grid platform lines */}
            <g className="iso-grid-lines" stroke="#334155" strokeWidth="0.75" opacity="0.35">
              <line x1="20" y1="120" x2="120" y2="175" />
              <line x1="120" y1="175" x2="220" y2="120" />
              <line x1="220" y1="120" x2="120" y2="65" />
              <line x1="120" y1="65" x2="20" y2="120" />
              {/* Internal grid subdivs */}
              <line x1="70" y1="92" x2="170" y2="148" />
              <line x1="70" y1="148" x2="170" y2="92" />
            </g>

            {/* Background / Neighbor Normal Pod 1 (Left) */}
            <g transform="translate(48, 98)" opacity="0.75">
              {/* Top face */}
              <polygon points="26,0 52,15 26,30 0,15" fill="url(#normalTop)" stroke="#475569" strokeWidth="0.8" />
              {/* Left face */}
              <polygon points="0,15 26,30 26,52 0,37" fill="url(#normalLeft)" stroke="#334155" strokeWidth="0.8" />
              {/* Right face */}
              <polygon points="26,30 52,15 52,37 26,52" fill="url(#normalRight)" stroke="#334155" strokeWidth="0.8" />
            </g>

            {/* Background / Neighbor Normal Pod 2 (Right) */}
            <g transform="translate(138, 98)" opacity="0.75">
              <polygon points="26,0 52,15 26,30 0,15" fill="url(#normalTop)" stroke="#475569" strokeWidth="0.8" />
              <polygon points="0,15 26,30 26,52 0,37" fill="url(#normalLeft)" stroke="#334155" strokeWidth="0.8" />
              <polygon points="26,30 52,15 52,37 26,52" fill="url(#normalRight)" stroke="#334155" strokeWidth="0.8" />
            </g>

            {/* Foreground / Neighbor Normal Pod 3 (Front) */}
            <g transform="translate(93, 122)" opacity="0.6">
              <polygon points="26,0 52,15 26,30 0,15" fill="url(#normalTop)" stroke="#475569" strokeWidth="0.8" />
              <polygon points="0,15 26,30 26,45 0,30" fill="url(#normalLeft)" stroke="#334155" strokeWidth="0.8" />
              <polygon points="26,30 52,15 52,30 26,45" fill="url(#normalRight)" stroke="#334155" strokeWidth="0.8" />
            </g>

            {/* Central Elevated Violation Workload Pod (Crimson Glow + Red Isometric Cube) */}
            <g transform="translate(92, 45)">
              {/* Ground shadow / warning beacon on platform */}
              <ellipse cx="28" cy="88" rx="42" ry="18" fill="url(#violationGlow)" />
              <ellipse cx="28" cy="88" rx="26" ry="11" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />

              {/* Pulsing elevation ray lines */}
              <line x1="28" y1="46" x2="28" y2="88" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />

              {/* Elevated Pod Cube */}
              {/* Top Face */}
              <polygon
                points="28,0 56,16 28,32 0,16"
                fill="url(#cubeTop)"
                stroke="#fca5a5"
                strokeWidth="1.2"
              />
              {/* Left Face */}
              <polygon
                points="0,16 28,32 28,60 0,44"
                fill="url(#cubeLeft)"
                stroke="#b91c1c"
                strokeWidth="1"
              />
              {/* Right Face */}
              <polygon
                points="28,32 56,16 56,44 28,60"
                fill="url(#cubeRight)"
                stroke="#b91c1c"
                strokeWidth="1"
              />

              {/* Subtle Lock / Violation glyph on top face */}
              <circle cx="28" cy="16" r="5" fill="#ffffff" opacity="0.9" />
              <path d="M28 13 L28 16 M28 18 L28 19" stroke="#991b1b" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </div>
    </article>
  );
};
