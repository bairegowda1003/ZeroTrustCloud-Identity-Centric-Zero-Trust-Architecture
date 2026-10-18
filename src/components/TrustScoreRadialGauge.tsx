import React, { useState } from 'react';
import {
  Fingerprint,
  Shield,
  CheckCircle2,
  Network,
  Info,
  Check,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { SecurityFinding } from '../types/security';
import { calculateTrustScore, DomainScore } from '../utils/trustScore';

interface TrustScoreRadialGaugeProps {
  findings: SecurityFinding[];
  onSelectDomainFilter?: (domain: string) => void;
}

export const TrustScoreRadialGauge: React.FC<TrustScoreRadialGaugeProps> = ({
  findings,
  onSelectDomainFilter,
}) => {
  const posture = calculateTrustScore(findings);
  const [selectedDomainKey, setSelectedDomainKey] = useState<string | null>(null);

  // Gauge parameters
  const size = 500;
  const cx = 250;
  const cy = 185;
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  // Score percentage fill
  const strokeDashoffset = circumference - (posture.overallScore / 100) * circumference;

  const domains = [
    {
      key: 'identity',
      data: posture.domains.identity,
      icon: Fingerprint,
      x: 90,
      y: 75,
      color: '#a855f7', // Purple
      lineStart: { x: 190, y: 140 },
      lineEnd: { x: 130, y: 95 },
    },
    {
      key: 'policy',
      data: posture.domains.policy,
      icon: Shield,
      x: 410,
      y: 75,
      color: '#f59e0b', // Amber/gold
      lineStart: { x: 310, y: 140 },
      lineEnd: { x: 370, y: 95 },
    },
    {
      key: 'workload_integrity',
      data: posture.domains.workloadIntegrity,
      icon: CheckCircle2,
      x: 90,
      y: 295,
      color: '#38bdf8', // Sky Blue
      lineStart: { x: 190, y: 230 },
      lineEnd: { x: 130, y: 275 },
    },
    {
      key: 'service_trust',
      data: posture.domains.serviceTrust,
      icon: Network,
      x: 410,
      y: 295,
      color: '#00d4aa', // Mint/teal
      lineStart: { x: 310, y: 230 },
      lineEnd: { x: 370, y: 275 },
    },
  ];

  const activeDomain = domains.find((d) => d.key === selectedDomainKey);

  return (
    <div className="trust-radial-card" aria-label="TrustMesh Central Trust Score Evaluation">
      <div className="trust-radial-header">
        <div className="trust-radial-title-group">
          <span className="card-kicker">CENTRAL TRUST EVALUATION</span>
          <h2 className="card-headline">Zero-Trust Command Core</h2>
        </div>
        <div className="trust-radial-badge" title={posture.scoringMethodology}>
          <Info size={12} className="info-icon" />
          <span>Dynamic Score · 12 Findings</span>
        </div>
      </div>

      <div className="trust-radial-stage-container">
        <svg
          viewBox={`0 0 ${size} 370`}
          className="trust-radial-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Trust Score ${posture.overallScore} out of 100`}
        >
          <defs>
            {/* Primary gradient for progress ring */}
            <linearGradient id="trustGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4aa" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            {/* Core radial glow */}
            <radialGradient id="centerCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.12" />
              <stop offset="70%" stopColor="#00d4aa" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
            </radialGradient>

            {/* Subtle drop shadow */}
            <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00d4aa" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Central background glow */}
          <circle cx={cx} cy={cy} r={radius * 1.55} fill="url(#centerCoreGlow)" />

          {/* Restrained concentric guide rings */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + 22}
            className="guide-ring-outer"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.15"
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius - 16}
            className="guide-ring-inner"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.1"
          />

          {/* Connecting geometry lines to 4 domains */}
          {domains.map((dom) => (
            <g key={`connector-${dom.key}`} className="connector-group">
              <line
                x1={dom.lineStart.x}
                y1={dom.lineStart.y}
                x2={dom.lineEnd.x}
                y2={dom.lineEnd.y}
                stroke={dom.color}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity={selectedDomainKey === dom.key ? '0.8' : '0.28'}
              />
              <circle
                cx={dom.lineStart.x}
                cy={dom.lineStart.y}
                r="2.5"
                fill={dom.color}
                opacity={selectedDomainKey === dom.key ? '1' : '0.5'}
              />
              <circle
                cx={dom.lineEnd.x}
                cy={dom.lineEnd.y}
                r="2.5"
                fill={dom.color}
                opacity={selectedDomainKey === dom.key ? '1' : '0.5'}
              />
            </g>
          ))}

          {/* Gauge Background Track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            className="gauge-track-bg"
            stroke="currentColor"
            strokeWidth="8"
            opacity="0.08"
          />

          {/* Gauge Active Progress Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="url(#trustGaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            filter="url(#gaugeShadow)"
            className="gauge-progress-arc"
          />

          {/* Center Text Group */}
          <g className="gauge-center-text">
            <text
              x={cx}
              y={cy - 12}
              textAnchor="middle"
              className="gauge-score-value"
              fill="currentColor"
            >
              {posture.overallScore}
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              className="gauge-score-denominator"
              fill="currentColor"
              opacity="0.45"
            >
              / 100
            </text>
            <text
              x={cx}
              y={cy + 30}
              textAnchor="middle"
              className="gauge-score-label"
              fill="#00d4aa"
            >
              TRUST SCORE
            </text>
          </g>
        </svg>

        {/* 4 Orbiting Domain Satellites (HTML Overlays for absolute crispness and full accessibility) */}
        <div className="domain-satellites-overlay">
          {domains.map((dom) => {
            const Icon = dom.icon;
            const isSelected = selectedDomainKey === dom.key;
            return (
              <div
                key={dom.key}
                className={`domain-satellite-node domain-node--${dom.key} ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${(dom.x / size) * 100}%`,
                  top: `${(dom.y / 370) * 100}%`,
                }}
                onClick={() => setSelectedDomainKey(isSelected ? null : dom.key)}
                onMouseEnter={() => setSelectedDomainKey(dom.key)}
                tabIndex={0}
                role="button"
                aria-label={`${dom.data.name} Domain. Score: ${dom.data.score}. Click to inspect.`}
              >
                <div className="satellite-icon-box" style={{ borderColor: `${dom.color}40` }}>
                  <Icon size={14} style={{ color: dom.color }} />
                </div>
                <div className="satellite-info">
                  <span className="satellite-name">{dom.data.name}</span>
                  <div className="satellite-score-row">
                    <span className="satellite-score-number" style={{ color: dom.color }}>
                      {dom.data.score}
                    </span>
                    <span className="satellite-score-scale">/100</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progressive Disclosure: Compact Contextual Domain Drawer or Status Strip */}
      <div className="trust-radial-footer">
        {activeDomain ? (
          <div className="domain-context-panel animate-fade-in">
            <div className="domain-context-left">
              <span className="domain-badge" style={{ color: activeDomain.color, borderColor: `${activeDomain.color}40` }}>
                {activeDomain.data.name} Domain
              </span>
              <span className="domain-engine-tag">Engine: {activeDomain.data.engine}</span>
              <p className="domain-context-desc">{activeDomain.data.description}</p>
            </div>
            <div className="domain-context-right">
              <span className="domain-findings-count">
                {activeDomain.data.unresolvedCount} Active Finding{activeDomain.data.unresolvedCount === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                className="domain-filter-btn"
                onClick={() => onSelectDomainFilter?.(activeDomain.key)}
              >
                Filter Findings →
              </button>
            </div>
          </div>
        ) : (
          <div className="trust-posture-summary-strip">
            <div className="strip-item">
              <span className="strip-label">Total Findings</span>
              <span className="strip-value">{posture.totalActiveFindings + posture.totalResolvedFindings}</span>
            </div>
            <div className="strip-divider" />
            <div className="strip-item">
              <span className="strip-label">Active Gaps</span>
              <span className="strip-value strip-value--warn">{posture.totalActiveFindings}</span>
            </div>
            <div className="strip-divider" />
            <div className="strip-item">
              <span className="strip-label">Resolved</span>
              <span className="strip-value strip-value--good">{posture.totalResolvedFindings}</span>
            </div>
            <div className="strip-divider" />
            <div className="strip-item">
              <span className="strip-label">Hover node for domain diagnostics</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
