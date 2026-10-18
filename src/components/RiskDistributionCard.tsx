import React from 'react';
import { PieChart, Filter } from 'lucide-react';
import { SecurityFinding } from '../types/security';

interface RiskDistributionCardProps {
  findings: SecurityFinding[];
  onSelectSeverityFilter?: (severity: string) => void;
}

export const RiskDistributionCard: React.FC<RiskDistributionCardProps> = ({
  findings,
  onSelectSeverityFilter,
}) => {
  const total = findings.length || 1;
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;
  const mediumCount = findings.filter((f) => f.severity === 'medium').length;
  const lowCount = findings.filter((f) => f.severity === 'low').length;

  const segments = [
    {
      key: 'critical',
      label: 'Critical',
      count: criticalCount,
      color: '#ef4444',
      pct: Math.round((criticalCount / total) * 100),
    },
    {
      key: 'high',
      label: 'High',
      count: highCount,
      color: '#f97316',
      pct: Math.round((highCount / total) * 100),
    },
    {
      key: 'medium',
      label: 'Medium',
      count: mediumCount,
      color: '#f59e0b',
      pct: Math.round((mediumCount / total) * 100),
    },
    {
      key: 'low',
      label: 'Low',
      count: lowCount,
      color: '#38bdf8',
      pct: Math.round((lowCount / total) * 100),
    },
  ];

  // SVG Donut Math
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  let accumulatedLength = 0;

  const donutSlices = segments.map((seg) => {
    const sliceLength = (seg.count / total) * circumference;
    const dashArray = `${sliceLength} ${circumference - sliceLength}`;
    const dashOffset = -accumulatedLength;
    accumulatedLength += sliceLength;

    return {
      ...seg,
      dashArray,
      dashOffset,
    };
  });

  return (
    <div className="risk-distribution-card" aria-label="Risk Distribution by Severity">
      <div className="risk-distribution-header">
        <div className="risk-title-group">
          <h3 className="risk-card-title">Risk Distribution</h3>
          <span className="risk-sub-badge">12 Active Gaps</span>
        </div>
        <div className="risk-header-action">
          <span className="risk-domain-filter-pill">
            <span>All Domains</span>
          </span>
        </div>
      </div>

      <div className="risk-distribution-body">
        {/* Compact SVG Donut */}
        <div className="donut-chart-container">
          <svg
            viewBox="0 0 120 120"
            className="donut-svg"
            role="img"
            aria-label={`Donut chart showing risk distribution: ${criticalCount} Critical, ${highCount} High, ${mediumCount} Medium, ${lowCount} Low`}
          >
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              opacity="0.08"
            />
            {donutSlices.map((slice) => (
              <circle
                key={slice.key}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth="14"
                strokeDasharray={slice.dashArray}
                strokeDashoffset={slice.dashOffset}
                transform="rotate(-90 60 60)"
                className="donut-slice-arc"
              />
            ))}
          </svg>

          {/* Donut Center Count */}
          <div className="donut-center-label">
            <span className="donut-total-number">{findings.length}</span>
            <span className="donut-total-text">Total Risks</span>
          </div>
        </div>

        {/* Legend Breakdown Table */}
        <div className="risk-legend-table">
          {segments.map((seg) => (
            <div
              key={seg.key}
              className="risk-legend-row"
              onClick={() => onSelectSeverityFilter?.(seg.key)}
              role="button"
              tabIndex={0}
              title={`Filter by ${seg.label} severity`}
            >
              <div className="legend-indicator-col">
                <span
                  className="legend-color-dot"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="legend-severity-name">{seg.label}</span>
              </div>
              <div className="legend-count-col">
                <span className="legend-count-val">{seg.count}</span>
              </div>
              <div className="legend-pct-col">
                <span className="legend-pct-val">{seg.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
