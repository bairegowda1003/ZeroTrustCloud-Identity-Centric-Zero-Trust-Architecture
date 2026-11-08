import React from 'react';
import { Activity, ShieldCheck, ShieldAlert, Cpu, CheckCircle2, Clock } from 'lucide-react';
import { ObservabilitySummary } from '../../types/observability';

interface ObservabilitySummaryCardsProps {
  summary: ObservabilitySummary;
  onFilterDomain?: (domain: string) => void;
}

export const ObservabilitySummaryCards: React.FC<ObservabilitySummaryCardsProps> = ({
  summary,
  onFilterDomain
}) => {
  return (
    <div className="obs-kpi-grid">
      {/* 1. Total Correlated Events */}
      <div 
        onClick={() => onFilterDomain && onFilterDomain('ALL')}
        className="obs-kpi-card"
      >
        <div className="obs-kpi-header">
          <span className="obs-kpi-title">Correlated Events</span>
          <div className="obs-kpi-icon-wrap cyan">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="obs-kpi-val">
          <span className="val">{summary.totalEventsMonitored}</span>
          <span className="unit">Recorded Incidents</span>
        </div>
        <div className="obs-kpi-subtext">
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#06b6d4', display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
          <span>Across 5 Security Layers</span>
        </div>
      </div>

      {/* 2. Zero Trust Compliance Index */}
      <div 
        onClick={() => onFilterDomain && onFilterDomain('ALL')}
        className="obs-kpi-card"
      >
        <div className="obs-kpi-header">
          <span className="obs-kpi-title">Zero Trust Score</span>
          <div className="obs-kpi-icon-wrap emerald">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="obs-kpi-val">
          <span className="val" style={{ color: '#10b981' }}>{summary.evaluatedZeroTrustScore}%</span>
          <span className="unit">Mathematically Verified</span>
        </div>
        <div className="obs-kpi-subtext">
          <span>6 Quantitative Control Gates</span>
        </div>
      </div>

      {/* 3. Boundary Violations Prevented */}
      <div 
        onClick={() => onFilterDomain && onFilterDomain('ADMISSION_POLICY')}
        className="obs-kpi-card"
      >
        <div className="obs-kpi-header">
          <span className="obs-kpi-title">Enforced Blocks</span>
          <div className="obs-kpi-icon-wrap red">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="obs-kpi-val">
          <span className="val" style={{ color: '#ef4444' }}>{summary.violationsPreventedCount}</span>
          <span className="unit">Violations Quarantined</span>
        </div>
        <div className="obs-kpi-subtext">
          <span>Fail-Closed Boundaries</span>
        </div>
      </div>

      {/* 4. Ingestion Health & Freshness */}
      <div 
        onClick={() => onFilterDomain && onFilterDomain('HEALTH')}
        className="obs-kpi-card"
      >
        <div className="obs-kpi-header">
          <span className="obs-kpi-title">Telemetry Pipeline</span>
          <div className="obs-kpi-icon-wrap indigo">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="obs-kpi-val">
          <span className="val" style={{ color: '#818cf8' }}>{summary.collectorAvailabilityPercent}%</span>
          <span className="unit">Collectors Healthy</span>
        </div>
        <div className="obs-kpi-subtext">
          <Clock className="w-3.5 h-3.5" style={{ color: '#818cf8', display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
          <span>p95 Transit: {summary.transitFreshnessMs} ms</span>
        </div>
      </div>
    </div>
  );
};

