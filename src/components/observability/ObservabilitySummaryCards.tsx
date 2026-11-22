import React from 'react';
import { Activity, ShieldCheck, ShieldAlert, Cpu, CheckCircle2, Clock } from 'lucide-react';
import { ObservabilitySummary } from '../../types/observability';

interface ObservabilitySummaryCardsProps {
  summary: ObservabilitySummary;
  onFilterDomain?: (domain: string) => void;
  activeFilter?: string;
}

export const ObservabilitySummaryCards: React.FC<ObservabilitySummaryCardsProps> = ({
  summary,
  onFilterDomain,
  activeFilter = 'ALL',
}) => {
  // Arc length for R=60 semi-circle is Math.PI * 60 ~= 188.5
  const arcLength = Math.PI * 60;

  return (
    <div className="obs-gauge-grid" role="region" aria-label="Observability & Posture Gauges">
      {/* 1. Zero Trust Evaluation Index (Matching Image 4 Speedometer Gauge) */}
      <div 
        onClick={() => onFilterDomain && onFilterDomain('ALL')}
        className={`obs-gauge-card ${activeFilter === 'ALL' ? 'active-gauge-card' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterDomain?.('ALL');
          }
        }}
        title="View unified security events across all domains"
      >
        <div className="obs-gauge-top">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span className="obs-gauge-framework-tag">ZERO TRUST POSTURE (ILLUSTRATIVE)</span>
        </div>

        {/* Semi-Circular Speedometer / Tachometer Gauge (Direct from Image 4) */}
        <div className="obs-gauge-speedometer-wrap">
          <svg className="obs-gauge-svg" viewBox="0 0 160 95">
            {/* Background Arch Track */}
            <path
              className="obs-gauge-track"
              d="M 20,85 A 60,60 0 0,1 140,85"
            />
            {/* Dynamic Progress Arch */}
            <path
              className="obs-gauge-fill emerald"
              d="M 20,85 A 60,60 0 0,1 140,85"
              strokeDasharray={arcLength}
              strokeDashoffset={arcLength * (1 - summary.evaluatedZeroTrustScore / 100)}
            />
          </svg>
          <div className="obs-gauge-center-content">
            <span className="obs-gauge-score text-emerald-400">{summary.evaluatedZeroTrustScore}%</span>
            <span className="obs-gauge-label">ZeroTrust Index (Illustrative)</span>
          </div>
        </div>

        <div className="obs-gauge-footer">
          <span>6 Quantitative Control Gates</span>
          <span className="obs-gauge-status-tag emerald">Illustrative Score</span>
        </div>
      </div>

      {/* 2. Correlated Security Events (Matching Image 4 Speedometer Gauge) */}
      <div 
        onClick={() => onFilterDomain && onFilterDomain('ALL')}
        className="obs-gauge-card"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterDomain?.('ALL');
          }
        }}
        title="Filter by correlated security events"
      >
        <div className="obs-gauge-top">
          <Activity size={16} className="text-cyan-400" />
          <span className="obs-gauge-framework-tag">SECURITY EVENTS (SIMULATED)</span>
        </div>

        <div className="obs-gauge-speedometer-wrap">
          <svg className="obs-gauge-svg" viewBox="0 0 160 95">
            <path
              className="obs-gauge-track"
              d="M 20,85 A 60,60 0 0,1 140,85"
            />
            <path
              className="obs-gauge-fill cyan"
              d="M 20,85 A 60,60 0 0,1 140,85"
              strokeDasharray={arcLength}
              strokeDashoffset={arcLength * (1 - Math.min(100, (summary.totalEventsMonitored / 10) * 100) / 100)}
            />
          </svg>
          <div className="obs-gauge-center-content">
            <span className="obs-gauge-score text-cyan-400">{summary.totalEventsMonitored}</span>
            <span className="obs-gauge-label">Incidents (Simulated)</span>
          </div>
        </div>

        <div className="obs-gauge-footer">
          <span>Across 5 Security Layers</span>
          <span className="obs-gauge-status-tag cyan">Simulated Scenarios</span>
        </div>
      </div>

      {/* 3. Boundary Violations Prevented (Matching Image 4 Speedometer Gauge) */}
      <div 
        onClick={() => onFilterDomain && onFilterDomain('ADMISSION_POLICY')}
        className={`obs-gauge-card ${activeFilter === 'ADMISSION_POLICY' ? 'active-gauge-card' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterDomain?.('ADMISSION_POLICY');
          }
        }}
        title="Filter by admission policy boundary violations"
      >
        <div className="obs-gauge-top">
          <ShieldAlert size={16} className="text-rose-400" />
          <span className="obs-gauge-framework-tag">BOUNDARY DEFENSE (SIMULATED)</span>
        </div>

        <div className="obs-gauge-speedometer-wrap">
          <svg className="obs-gauge-svg" viewBox="0 0 160 95">
            <path
              className="obs-gauge-track"
              d="M 20,85 A 60,60 0 0,1 140,85"
            />
            <path
              className="obs-gauge-fill rose"
              d="M 20,85 A 60,60 0 0,1 140,85"
              strokeDasharray={arcLength}
              strokeDashoffset={arcLength * (1 - Math.min(100, (summary.violationsPreventedCount / 6) * 100) / 100)}
            />
          </svg>
          <div className="obs-gauge-center-content">
            <span className="obs-gauge-score text-rose-400">{summary.violationsPreventedCount}</span>
            <span className="obs-gauge-label">Example Blocks (Simulated)</span>
          </div>
        </div>

        <div className="obs-gauge-footer">
          <span>Example Boundaries</span>
          <span className="obs-gauge-status-tag rose">Simulated Blocks</span>
        </div>
      </div>

      {/* 4. Ingestion Health & Freshness (Matching Image 4 Speedometer Gauge) */}
      <div 
        onClick={() => onFilterDomain && onFilterDomain('HEALTH')}
        className={`obs-gauge-card ${activeFilter === 'HEALTH' ? 'active-gauge-card' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterDomain?.('HEALTH');
          }
        }}
        title="View telemetry pipeline collection health and transit latency"
      >
        <div className="obs-gauge-top">
          <Cpu size={16} className="text-indigo-400" />
          <span className="obs-gauge-framework-tag">TELEMETRY PIPELINE (SIMULATED)</span>
        </div>

        <div className="obs-gauge-speedometer-wrap">
          <svg className="obs-gauge-svg" viewBox="0 0 160 95">
            <path
              className="obs-gauge-track"
              d="M 20,85 A 60,60 0 0,1 140,85"
            />
            <path
              className="obs-gauge-fill indigo"
              d="M 20,85 A 60,60 0 0,1 140,85"
              strokeDasharray={arcLength}
              strokeDashoffset={arcLength * (1 - summary.collectorAvailabilityPercent / 100)}
            />
          </svg>
          <div className="obs-gauge-center-content">
            <span className="obs-gauge-score text-indigo-400">{summary.collectorAvailabilityPercent}%</span>
            <span className="obs-gauge-label">Availability (Simulated)</span>
          </div>
        </div>

        <div className="obs-gauge-footer">
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-indigo-400 inline" />
            <span>Simulated transit: {summary.transitFreshnessMs} ms</span>
          </div>
          <span className="obs-gauge-status-tag indigo">Simulated Metric</span>
        </div>
      </div>
    </div>
  );
};

