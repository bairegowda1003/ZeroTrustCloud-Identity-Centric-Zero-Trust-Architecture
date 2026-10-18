import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, Server } from 'lucide-react';
import { SecurityFinding } from '../types/security';

interface TelemetryMetricCardsProps {
  findings: SecurityFinding[];
  onViewAllFindings?: () => void;
}

export const TelemetryMetricCards: React.FC<TelemetryMetricCardsProps> = ({
  findings,
  onViewAllFindings,
}) => {
  const totalFindings = findings.length;
  const activeFindings = findings.filter((f) => f.status !== 'resolved' && f.status !== 'suppressed').length;
  const resolvedFindings = findings.filter((f) => f.status === 'resolved').length;

  const metrics = [
    {
      id: 'findings',
      title: 'Total Findings',
      value: totalFindings,
      trend: '+20%',
      trendDir: 'up',
      subtitle: `${activeFindings} active · ${resolvedFindings} resolved`,
      label: 'Demo Testbed Findings',
      icon: AlertTriangle,
      color: '#f59e0b',
      // SVG sparkline path coordinates (x,y in 100x32 box)
      sparkline: 'M0,24 Q25,28 45,18 T75,10 T100,6',
      fillPath: 'M0,24 Q25,28 45,18 T75,10 T100,6 L100,32 L0,32 Z',
      onClick: onViewAllFindings,
    },
    {
      id: 'blocked',
      title: 'Blocked Requests',
      value: 37,
      trend: '+6%',
      trendDir: 'up',
      subtitle: 'Simulated Admission Webhooks',
      label: 'Gatekeeper Rejections',
      icon: ShieldCheck,
      color: '#ef4444',
      sparkline: 'M0,26 Q20,20 40,22 T70,14 T100,8',
      fillPath: 'M0,26 Q20,20 40,22 T70,14 T100,8 L100,32 L0,32 Z',
    },
    {
      id: 'workloads',
      title: 'Verified Workloads',
      value: 86,
      trend: '+18%',
      trendDir: 'up',
      subtitle: 'Testbed Enclave Pods',
      label: '74 compliant · 12 non-compliant',
      icon: Server,
      color: '#00d4aa',
      sparkline: 'M0,28 Q30,22 55,16 T80,12 T100,4',
      fillPath: 'M0,28 Q30,22 55,16 T80,12 T100,4 L100,32 L0,32 Z',
    },
  ];

  return (
    <div className="telemetry-metrics-grid" aria-label="Zero-Trust Operational Telemetry">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.id}
            className={`telemetry-card ${m.onClick ? 'telemetry-card--clickable' : ''}`}
            onClick={m.onClick}
            role={m.onClick ? 'button' : undefined}
            tabIndex={m.onClick ? 0 : undefined}
          >
            <div className="telemetry-card-top">
              <span className="telemetry-card-title">{m.title}</span>
              <span
                className="telemetry-trend-pill"
                style={{ color: m.color, backgroundColor: `${m.color}18` }}
              >
                <TrendingUp size={11} />
                <span>{m.trend}</span>
              </span>
            </div>

            <div className="telemetry-card-main">
              <div className="telemetry-number-group">
                <span className="telemetry-big-number">{m.value}</span>
                <span className="telemetry-subtitle">{m.subtitle}</span>
              </div>

              {/* Vector SVG Sparkline */}
              <div className="telemetry-sparkline-box">
                <svg
                  viewBox="0 0 100 32"
                  preserveAspectRatio="none"
                  className="sparkline-svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id={`sparkFill-${m.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={m.color} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={m.color} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={m.fillPath} fill={`url(#sparkFill-${m.id})`} />
                  <path
                    d={m.sparkline}
                    fill="none"
                    stroke={m.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <div className="telemetry-card-footer">
              <span className="telemetry-honest-tag">{m.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
