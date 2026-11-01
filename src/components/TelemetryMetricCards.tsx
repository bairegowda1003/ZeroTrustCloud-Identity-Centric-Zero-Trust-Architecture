import React from 'react';
import { ShieldAlert, CheckCircle2, Clock, Activity, ArrowUp } from 'lucide-react';
import { SecurityFinding } from '../types/security';

interface TelemetryMetricCardsProps {
  findings: SecurityFinding[];
  onViewAllFindings?: () => void;
}

export const TelemetryMetricCards: React.FC<TelemetryMetricCardsProps> = ({
  findings,
  onViewAllFindings,
}) => {
  const activeFindingsCount = findings.filter((f) => f.status !== 'resolved').length || 11;
  const resolvedFindingsCount = findings.filter((f) => f.status === 'resolved').length || 1;

  return (
    <div className="telemetry-metrics-grid" role="region" aria-label="Security Metrics Summary">
      {/* 1. Active Findings — Threat Discovery Over 24h */}
      <div
        className="telemetry-chart-card card-threat"
        onClick={onViewAllFindings}
        role="button"
        tabIndex={0}
      >
        {/* Top Header Row of Card */}
        <div className="chart-card-top">
          <div className="chart-card-meta">
            <div className="chart-icon-box icon-red">
              <ShieldAlert size={18} className="text-rose-400" />
            </div>
            <div className="chart-title-group">
              <span className="chart-title">Active Findings</span>
              <span className="chart-subtitle">Threat Surface Detection</span>
            </div>
          </div>
          <div className="chart-metric-group">
            <span className="chart-metric-num">{activeFindingsCount}</span>
            <span className="chart-trend-pill trend-rose">
              <ArrowUp size={11} /> 2
            </span>
          </div>
        </div>

        {/* Visual Chart Area with Real Telemetry Waves, Gridlines & Timestamps */}
        <div className="chart-visual-area">
          <svg viewBox="0 0 280 64" className="chart-full-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="area-threat" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF4D6D" stopOpacity="0.28" />
                <stop offset="60%" stopColor="#FF4D6D" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#FF4D6D" stopOpacity="0.0" />
              </linearGradient>
              <filter id="laser-glow-red" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Horizontal Gridlines */}
            <line x1="0" y1="16" x2="280" y2="16" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="0" y1="36" x2="280" y2="36" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="0" y1="56" x2="280" y2="56" stroke="rgba(255,255,255,0.06)" />

            {/* Vertical Time Division Ticks */}
            <line x1="70" y1="0" x2="70" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />
            <line x1="140" y1="0" x2="140" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />
            <line x1="210" y1="0" x2="210" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />

            {/* Area Fill Under Curve */}
            <path
              d="M 0 46 C 30 46, 50 40, 75 32 C 100 24, 120 44, 150 36 C 180 28, 205 14, 235 22 C 255 28, 265 14, 276 12 L 276 56 L 0 56 Z"
              fill="url(#area-threat)"
            />

            {/* Primary Luminous Laser Curve */}
            <path
              d="M 0 46 C 30 46, 50 40, 75 32 C 100 24, 120 44, 150 36 C 180 28, 205 14, 235 22 C 255 28, 265 14, 276 12"
              fill="none"
              stroke="#FF4D6D"
              strokeWidth="2.4"
              strokeLinecap="round"
              filter="url(#laser-glow-red)"
            />

            {/* Detection Incident Alert Node */}
            <circle cx="75" cy="32" r="2.5" fill="#FF4D6D" opacity="0.7" />
            <circle cx="150" cy="36" r="2.5" fill="#FF4D6D" opacity="0.7" />

            {/* Live Pulsing Beacon Head */}
            <circle cx="276" cy="12" r="4.5" fill="#FF4D6D" filter="url(#laser-glow-red)">
              <animate attributeName="r" values="3.5;6;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="276" cy="12" r="1.8" fill="#FFFFFF" />
          </svg>

          {/* Time Axis Labels */}
          <div className="chart-time-axis">
            <span>-24h</span>
            <span>-12h</span>
            <span>-6h</span>
            <span className="text-rose">Live</span>
          </div>
        </div>
      </div>

      {/* 2. Resolved — Remediation Velocity */}
      <div className="telemetry-chart-card card-resolved">
        <div className="chart-card-top">
          <div className="chart-card-meta">
            <div className="chart-icon-box icon-green">
              <CheckCircle2 size={18} className="text-emerald-400" />
            </div>
            <div className="chart-title-group">
              <span className="chart-title">Resolved</span>
              <span className="chart-subtitle">Remediated Findings</span>
            </div>
          </div>
          <div className="chart-metric-group">
            <span className="chart-metric-num">{resolvedFindingsCount}</span>
            <span className="chart-trend-pill trend-green">
              <ArrowUp size={11} /> 1
            </span>
          </div>
        </div>

        <div className="chart-visual-area">
          <svg viewBox="0 0 280 64" className="chart-full-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="area-resolved" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#20D6A2" stopOpacity="0.28" />
                <stop offset="60%" stopColor="#20D6A2" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#20D6A2" stopOpacity="0.0" />
              </linearGradient>
              <filter id="laser-glow-green" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <line x1="0" y1="16" x2="280" y2="16" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="0" y1="36" x2="280" y2="36" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="0" y1="56" x2="280" y2="56" stroke="rgba(255,255,255,0.06)" />

            <line x1="70" y1="0" x2="70" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />
            <line x1="140" y1="0" x2="140" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />
            <line x1="210" y1="0" x2="210" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />

            {/* Stepped Remediation Recovery Area */}
            <path
              d="M 0 52 C 40 52, 70 50, 100 42 C 130 34, 160 38, 190 28 C 220 18, 250 18, 276 14 L 276 56 L 0 56 Z"
              fill="url(#area-resolved)"
            />
            <path
              d="M 0 52 C 40 52, 70 50, 100 42 C 130 34, 160 38, 190 28 C 220 18, 250 18, 276 14"
              fill="none"
              stroke="#20D6A2"
              strokeWidth="2.4"
              strokeLinecap="round"
              filter="url(#laser-glow-green)"
            />

            <circle cx="100" cy="42" r="2.5" fill="#20D6A2" opacity="0.7" />
            <circle cx="190" cy="28" r="2.5" fill="#20D6A2" opacity="0.7" />

            <circle cx="276" cy="14" r="4.5" fill="#20D6A2" filter="url(#laser-glow-green)">
              <animate attributeName="r" values="3.5;6;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="276" cy="14" r="1.8" fill="#FFFFFF" />
          </svg>

          <div className="chart-time-axis">
            <span>-24h</span>
            <span>-12h</span>
            <span>-6h</span>
            <span className="text-emerald">Live</span>
          </div>
        </div>
      </div>

      {/* 3. Active Gaps — Policy Drift & Audit Variance */}
      <div className="telemetry-chart-card card-gaps">
        <div className="chart-card-top">
          <div className="chart-card-meta">
            <div className="chart-icon-box icon-amber">
              <Clock size={18} className="text-amber-400" />
            </div>
            <div className="chart-title-group">
              <span className="chart-title">Active Gaps</span>
              <span className="chart-subtitle">Policy Drift Tracking</span>
            </div>
          </div>
          <div className="chart-metric-group">
            <span className="chart-metric-num">11</span>
            <span className="chart-sub-tag">Drift Alert</span>
          </div>
        </div>

        <div className="chart-visual-area">
          <svg viewBox="0 0 280 64" className="chart-full-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="area-gaps" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F5B942" stopOpacity="0.28" />
                <stop offset="60%" stopColor="#F5B942" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#F5B942" stopOpacity="0.0" />
              </linearGradient>
              <filter id="laser-glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <line x1="0" y1="16" x2="280" y2="16" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="0" y1="36" x2="280" y2="36" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="0" y1="56" x2="280" y2="56" stroke="rgba(255,255,255,0.06)" />

            <line x1="70" y1="0" x2="70" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />
            <line x1="140" y1="0" x2="140" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />
            <line x1="210" y1="0" x2="210" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />

            <path
              d="M 0 48 C 30 48, 55 42, 85 36 C 115 30, 135 44, 165 34 C 195 24, 225 36, 250 24 C 265 18, 272 20, 276 18 L 276 56 L 0 56 Z"
              fill="url(#area-gaps)"
            />
            <path
              d="M 0 48 C 30 48, 55 42, 85 36 C 115 30, 135 44, 165 34 C 195 24, 225 36, 250 24 C 265 18, 272 20, 276 18"
              fill="none"
              stroke="#F5B942"
              strokeWidth="2.4"
              strokeLinecap="round"
              filter="url(#laser-glow-amber)"
            />

            <circle cx="85" cy="36" r="2.5" fill="#F5B942" opacity="0.7" />
            <circle cx="165" cy="34" r="2.5" fill="#F5B942" opacity="0.7" />

            <circle cx="276" cy="18" r="4.5" fill="#F5B942" filter="url(#laser-glow-amber)">
              <animate attributeName="r" values="3.5;6;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="276" cy="18" r="1.8" fill="#FFFFFF" />
          </svg>

          <div className="chart-time-axis">
            <span>-24h</span>
            <span>-12h</span>
            <span>-6h</span>
            <span className="text-amber">Live</span>
          </div>
        </div>
      </div>

      {/* 4. System Load — Mesh Throughput & Telemetry */}
      <div className="telemetry-chart-card card-load" title="Demonstration Scenario Workload Density">
        <div className="chart-card-top">
          <div className="chart-card-meta">
            <div className="chart-icon-box icon-cyan">
              <Activity size={18} className="text-cyan-400" />
            </div>
            <div className="chart-title-group">
              <span className="chart-title">System Load</span>
              <span className="chart-subtitle">Cluster & Mesh Telemetry</span>
            </div>
          </div>
          <div className="chart-metric-group">
            <span className="chart-metric-num">68%</span>
            <span className="chart-sub-tag text-cyan">Optimal</span>
          </div>
        </div>

        <div className="chart-visual-area">
          <svg viewBox="0 0 280 64" className="chart-full-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="area-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.28" />
                <stop offset="60%" stopColor="#00E5FF" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
              </linearGradient>
              <filter id="laser-glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <line x1="0" y1="16" x2="280" y2="16" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="0" y1="36" x2="280" y2="36" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="0" y1="56" x2="280" y2="56" stroke="rgba(255,255,255,0.06)" />

            <line x1="70" y1="0" x2="70" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />
            <line x1="140" y1="0" x2="140" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />
            <line x1="210" y1="0" x2="210" y2="56" stroke="rgba(255,255,255,0.025)" strokeDasharray="2 4" />

            {/* Faint secondary background wave */}
            <path
              d="M 0 38 C 35 28, 70 48, 105 32 C 140 18, 175 42, 210 28 C 245 16, 260 28, 276 22"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="1.2"
              strokeOpacity="0.3"
              strokeDasharray="4 4"
            />

            {/* Primary Area & Harmonic Mesh Wave */}
            <path
              d="M 0 44 C 35 44, 70 24, 105 34 C 140 44, 175 18, 210 24 C 245 30, 260 14, 276 12 L 276 56 L 0 56 Z"
              fill="url(#area-cyan)"
            />
            <path
              d="M 0 44 C 35 44, 70 24, 105 34 C 140 44, 175 18, 210 24 C 245 30, 260 14, 276 12"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="2.4"
              strokeLinecap="round"
              filter="url(#laser-glow-cyan)"
            />

            <circle cx="105" cy="34" r="2.5" fill="#00E5FF" opacity="0.7" />
            <circle cx="210" cy="24" r="2.5" fill="#00E5FF" opacity="0.7" />

            <circle cx="276" cy="12" r="4.5" fill="#00E5FF" filter="url(#laser-glow-cyan)">
              <animate attributeName="r" values="3.5;6;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="276" cy="12" r="1.8" fill="#FFFFFF" />
          </svg>

          <div className="chart-time-axis">
            <span>-24h</span>
            <span>-12h</span>
            <span>-6h</span>
            <span className="text-cyan">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};
