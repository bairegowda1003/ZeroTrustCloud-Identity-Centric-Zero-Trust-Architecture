import React, { useState } from 'react';
import { Box, UserCheck, ShieldCheck, Link2 } from 'lucide-react';
import { SecurityFinding } from '../types/security';
import { calculateTrustScore } from '../utils/trustScore';

interface TrustConduitVisualizerProps {
  findings: SecurityFinding[];
  onSelectDomain?: (domain: string) => void;
  onOpenFindings?: () => void;
}

interface DomainNode {
  id: 'workloads' | 'identities' | 'policies' | 'services';
  title: string;
  metric: string;
  statusLabel: string;
  icon: React.ReactNode;
  side: 'left' | 'right';
  x: number;
  y: number;
  iconBoxClass: string;
  color: string;
  gradientId: string;
  details: {
    verified: string;
    status: string;
    ruleRef: string;
  };
}

export const TrustConduitVisualizer: React.FC<TrustConduitVisualizerProps> = ({
  findings,
  onSelectDomain,
  onOpenFindings,
}) => {
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const posture = calculateTrustScore(findings);

  // Exact 700x350 Coordinate System
  const stageWidth = 700;
  const stageHeight = 350;
  const coreX = 350;
  const coreY = 175;
  const coreRadius = 96;

  // 4 Core Security Domains with 1:1 Matched Color Grading
  const DOMAINS: DomainNode[] = [
    {
      id: 'workloads',
      title: 'Workloads',
      metric: '12',
      statusLabel: 'Monitored',
      icon: <Box size={18} className="text-indigo-400" />,
      side: 'left',
      x: 105,
      y: 80,
      iconBoxClass: 'box-workloads',
      color: '#818CF8', // Indigo / Violet
      gradientId: 'workloadArcGrad',
      details: {
        verified: '9 Pods Attested · 3 At Risk',
        status: 'Privileged Container Detected',
        ruleRef: 'RULE-POL-PRIVILEGED-04',
      },
    },
    {
      id: 'identities',
      title: 'Identities',
      metric: '24',
      statusLabel: 'Verified',
      icon: <UserCheck size={18} className="text-sky-400" />,
      side: 'right',
      x: 595,
      y: 80,
      iconBoxClass: 'box-identities',
      color: '#38BDF8', // Sky / Azure Blue
      gradientId: 'identityArcGrad',
      details: {
        verified: '23 SVIDs Issued · 1 Missing',
        status: 'SPIFFE/SPIRE Attestation Active',
        ruleRef: 'RULE-ID-SPIFFE-ATTEST-02',
      },
    },
    {
      id: 'policies',
      title: 'Policies',
      metric: '8',
      statusLabel: 'Active',
      icon: <ShieldCheck size={18} className="text-cyan-400" />,
      side: 'left',
      x: 105,
      y: 270,
      iconBoxClass: 'box-policies',
      color: '#22D3EE', // Cyan / Teal
      gradientId: 'policyArcGrad',
      details: {
        verified: '7 Enforcing · 1 Permissive',
        status: 'OPA Gatekeeper Admission Webhook',
        ruleRef: 'RULE-NET-DEFAULT-DENY-01',
      },
    },
    {
      id: 'services',
      title: 'Services',
      metric: '6',
      statusLabel: 'Healthy',
      icon: <Link2 size={18} className="text-emerald-400" />,
      side: 'right',
      x: 595,
      y: 270,
      iconBoxClass: 'box-services',
      color: '#20D6A2', // Mint / Emerald Green
      gradientId: 'serviceArcGrad',
      details: {
        verified: '5 STRICT mTLS · 1 Permissive',
        status: 'Istio Mutual TLS Mesh Boundary',
        ruleRef: 'RULE-MESH-MTLS-PERMISSIVE-02',
      },
    },
  ];

  // 4 Quadrant Arcs matching the 4 domains in position & color
  // Circumference = 2 * PI * 96 = 603.2px. 4 segments with 14px gap = 137px arc length.
  const arcSegments = [
    {
      id: 'workloads',
      rotation: 185, // Top-Left quadrant (185° to 265°)
      color: '#818CF8',
      gradientId: 'workloadArcGrad',
      accentAngle: 225, // Mid-point of quadrant
    },
    {
      id: 'identities',
      rotation: 275, // Top-Right quadrant (275° to 355°)
      color: '#38BDF8',
      gradientId: 'identityArcGrad',
      accentAngle: 315, // Mid-point of quadrant
    },
    {
      id: 'services',
      rotation: 5, // Bottom-Right quadrant (5° to 85°)
      color: '#20D6A2',
      gradientId: 'serviceArcGrad',
      accentAngle: 45, // Mid-point of quadrant
    },
    {
      id: 'policies',
      rotation: 95, // Bottom-Left quadrant (95° to 175°)
      color: '#22D3EE',
      gradientId: 'policyArcGrad',
      accentAngle: 135, // Mid-point of quadrant
    },
  ];

  // Conduits connecting directly into each quadrant of the central ring
  const conduits = [
    {
      id: 'workloads',
      path: 'M 190 80 C 235 80, 240 120, 270 130',
      color: '#818CF8',
      reverse: false,
    },
    {
      id: 'policies',
      path: 'M 190 270 C 235 270, 240 230, 270 220',
      color: '#22D3EE',
      reverse: false,
    },
    {
      id: 'identities',
      path: 'M 510 80 C 465 80, 460 120, 430 130',
      color: '#38BDF8',
      reverse: true,
    },
    {
      id: 'services',
      path: 'M 510 270 C 465 270, 460 230, 430 220',
      color: '#20D6A2',
      reverse: true,
    },
  ];

  const activeNode = DOMAINS.find((d) => d.id === hoveredDomain);

  return (
    <div className="security-command-center-card">
      {/* Top Header */}
      <div className="scc-header">
        <div>
          <h2 className="scc-title">Security Command Center</h2>
          <p className="scc-subtitle">Real-time view of your system's security posture</p>
        </div>
        <div className="scc-meta">
          <span className="live-status-dot" />
          <span className="scc-last-updated">Last updated Oct 24, 2026 10:42 AM</span>
        </div>
      </div>

      {/* Centered Mathematical Stage */}
      <div className="trust-stage-outer">
        <div className="trust-conduit-stage" style={{ width: `${stageWidth}px`, height: `${stageHeight}px` }}>
          {/* SVG Conduit Paths & Matched 4-Quadrant Ring */}
          <svg
            viewBox={`0 0 ${stageWidth} ${stageHeight}`}
            className="trust-conduit-svg"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Dynamic Glow Filters */}
              <filter id="ambient-ring-blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="18" result="blur" />
              </filter>
              <filter id="arc-laser-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="particle-laser-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* 4 Quadrant Arc Gradients matching domain nodes */}
              <linearGradient id="workloadArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A5B4FC" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>

              <linearGradient id="identityArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>

              <linearGradient id="policyArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67E8F9" />
                <stop offset="100%" stopColor="#0891B2" />
              </linearGradient>

              <linearGradient id="serviceArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6EE7B7" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>

            {/* Ambient Aura */}
            <circle
              cx={coreX}
              cy={coreY}
              r="110"
              fill={activeNode ? activeNode.color : 'rgba(22, 217, 232, 0.05)'}
              opacity={activeNode ? 0.12 : 0.05}
              filter="url(#ambient-ring-blur)"
              style={{ transition: 'all 0.3s ease' }}
            />

            {/* Connecting Conduits with Animated Particles */}
            {conduits.map((c) => {
              const isHovered = hoveredDomain === c.id;
              const isDimmed = hoveredDomain !== null && !isHovered;

              return (
                <g key={c.id}>
                  {/* Conduit Path with matching color */}
                  <path
                    d={c.path}
                    fill="none"
                    stroke={c.color}
                    strokeWidth={isHovered ? 2.8 : 1.4}
                    strokeOpacity={isHovered ? 1.0 : isDimmed ? 0.08 : 0.35}
                    filter={isHovered ? 'url(#arc-laser-glow)' : undefined}
                    style={{ transition: 'stroke-opacity 0.22s ease, stroke-width 0.22s ease' }}
                  />

                  {/* Node Anchor Point */}
                  <circle
                    cx={c.id === 'workloads' || c.id === 'policies' ? 190 : 510}
                    cy={c.id === 'workloads' || c.id === 'identities' ? 80 : 270}
                    r={isHovered ? 4 : 2.5}
                    fill={c.color}
                    opacity={isDimmed ? 0.15 : 0.9}
                  />

                  {/* Traveling Particle along conduit */}
                  <circle
                    r={isHovered ? 4.5 : 2.8}
                    fill={c.color}
                    filter="url(#particle-laser-glow)"
                    opacity={isDimmed ? 0.15 : 0.95}
                  >
                    <animateMotion
                      dur={isHovered ? '1.2s' : '2.8s'}
                      repeatCount="indefinite"
                      path={c.path}
                      keyPoints={c.reverse ? '1;0' : '0;1'}
                      keyTimes="0;1"
                    />
                  </circle>
                </g>
              );
            })}

            {/* Central Ring: 4 Quadrants matching the 4 Domains */}
            <g>
              {/* Outer Subtle Concentric Dotted Guide Ring */}
              <circle
                cx={coreX}
                cy={coreY}
                r={coreRadius + 14}
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1.2"
                strokeDasharray="4 6"
              />

              {/* Inner Base Track */}
              <circle
                cx={coreX}
                cy={coreY}
                r={coreRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="6"
              />

              {/* The 4 Quadrant Segments (Workloads, Identities, Services, Policies) */}
              {arcSegments.map((seg) => {
                const isHovered = hoveredDomain === seg.id;
                const isDimmed = hoveredDomain !== null && !isHovered;

                return (
                  <g key={seg.id}>
                    {/* Quadrant Segment Arc */}
                    <circle
                      cx={coreX}
                      cy={coreY}
                      r={coreRadius}
                      fill="none"
                      stroke={`url(#${seg.gradientId})`}
                      strokeWidth={isHovered ? 8 : 6}
                      strokeLinecap="round"
                      strokeDasharray="137 466.2"
                      transform={`rotate(${seg.rotation} ${coreX} ${coreY})`}
                      filter="url(#arc-laser-glow)"
                      opacity={isHovered ? 1.0 : isDimmed ? 0.22 : 0.88}
                      style={{ transition: 'opacity 0.22s ease, stroke-width 0.22s ease' }}
                    />

                    {/* Quadrant Center Glowing Marker Dot */}
                    <circle
                      cx={coreX + coreRadius * Math.cos((seg.accentAngle * Math.PI) / 180)}
                      cy={coreY + coreRadius * Math.sin((seg.accentAngle * Math.PI) / 180)}
                      r={isHovered ? 4.5 : 3.2}
                      fill={seg.color}
                      filter="url(#particle-laser-glow)"
                      opacity={isHovered ? 1.0 : isDimmed ? 0.2 : 0.85}
                      style={{ transition: 'all 0.22s ease' }}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Central Readout Disc with Matched Dynamic Telemetry */}
          <div
            className="central-trust-core"
            style={{
              left: `${coreX}px`,
              top: `${coreY}px`,
              borderColor: activeNode ? activeNode.color : 'rgba(22, 217, 232, 0.25)',
              boxShadow: activeNode
                ? `0 0 36px ${activeNode.color}25, inset 0 0 16px ${activeNode.color}15`
                : '0 0 32px rgba(22, 217, 232, 0.12), inset 0 0 16px rgba(22, 217, 232, 0.06)',
            }}
          >
            {activeNode ? (
              <div className="core-telemetry-focused animate-fade-in-quick">
                <span className="core-label-kicker" style={{ color: activeNode.color }}>
                  {activeNode.title.toUpperCase()}
                </span>
                <div className="core-score-num" style={{ color: activeNode.color }}>
                  {activeNode.metric}
                </div>
                <span className="core-score-denom text-muted">{activeNode.statusLabel.toUpperCase()}</span>
                <div
                  className="core-reconciled-pill"
                  style={{
                    borderColor: activeNode.color,
                    color: activeNode.color,
                    background: `${activeNode.color}18`,
                  }}
                  title={activeNode.details.status}
                >
                  <span className="reconciled-dot" style={{ backgroundColor: activeNode.color, boxShadow: `0 0 6px ${activeNode.color}` }} />
                  <span>ATTESTED</span>
                </div>
              </div>
            ) : (
              <div className="core-telemetry-default">
                <span className="core-label-kicker">Trust Score</span>
                <div className="core-score-num">{posture.overallScore}</div>
                <span className="core-score-denom">/ 100</span>
                <div
                  className="core-reconciled-pill"
                  onClick={onOpenFindings}
                  role="button"
                  tabIndex={0}
                  title="Status: Reconciled. Click to inspect zero-trust findings"
                >
                  <span className="reconciled-dot" />
                  <span>RECONCILED</span>
                </div>
              </div>
            )}
          </div>

          {/* 4 Interactive Domain Node Cards */}
          {DOMAINS.map((domain) => {
            const isHovered = hoveredDomain === domain.id;

            return (
              <div
                key={domain.id}
                className={`domain-node-card ${domain.side} ${domain.id} ${isHovered ? 'active-focus' : ''}`}
                style={{
                  left: `${domain.x}px`,
                  top: `${domain.y}px`,
                  borderColor: isHovered ? domain.color : undefined,
                }}
                onMouseEnter={() => setHoveredDomain(domain.id)}
                onMouseLeave={() => setHoveredDomain(null)}
                onClick={() => onSelectDomain?.(domain.id)}
                role="button"
                tabIndex={0}
              >
                {/* HUD Corner Brackets on Hover */}
                {isHovered && (
                  <>
                    <span className="hud-bracket top-left" style={{ borderColor: domain.color }} />
                    <span className="hud-bracket top-right" style={{ borderColor: domain.color }} />
                    <span className="hud-bracket bottom-left" style={{ borderColor: domain.color }} />
                    <span className="hud-bracket bottom-right" style={{ borderColor: domain.color }} />
                  </>
                )}

                {/* Color-Matched Icon Box */}
                <div className={`domain-icon-box ${domain.iconBoxClass}`}>{domain.icon}</div>

                {/* Content */}
                <div className="domain-content">
                  <div className="domain-header-row">
                    <span className="domain-title">{domain.title}</span>
                    <span className="domain-status-dot" style={{ backgroundColor: domain.color, boxShadow: `0 0 6px ${domain.color}` }} />
                  </div>
                  <div className="domain-metric-row">
                    <span className="domain-metric-val">{domain.metric}</span>
                    <span className="domain-status-label">{domain.statusLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
