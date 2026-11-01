import React from 'react';
import { SecurityFinding, FindingStatus } from '../types/security';
import { TrustConduitVisualizer } from './TrustConduitVisualizer';
import { PriorityFindingsCard } from './PriorityFindingsCard';
import { TelemetryMetricCards } from './TelemetryMetricCards';
import { RecentActivityCard } from './RecentActivityCard';
import { SystemStatusCard } from './SystemStatusCard';
import { FooterStatusBar } from './FooterStatusBar';

interface CommandCenterHeroProps {
  findings: SecurityFinding[];
  onFindingClick: (finding: SecurityFinding) => void;
  onStatusChange?: (id: string, status: FindingStatus) => void;
  onOpenIntegrations?: () => void;
  onViewAllFindings?: () => void;
}

export const CommandCenterHero: React.FC<CommandCenterHeroProps> = ({
  findings,
  onFindingClick,
  onOpenIntegrations,
  onViewAllFindings,
}) => {
  return (
    <div className="security-command-center-stage" role="region" aria-label="TrustMesh Security Command Center">
      {/* 1. Primary Focal Row: Command Center Hero (Left, 65%) & Priority Findings (Right, 35%) */}
      <section className="stage-row row-focal" aria-label="Central Posture and Priority Findings">
        <div className="stage-col-left">
          <TrustConduitVisualizer
            findings={findings}
            onOpenFindings={onViewAllFindings}
            onSelectDomain={(_domain) => onViewAllFindings?.()}
          />
        </div>
        <div className="stage-col-right">
          <PriorityFindingsCard
            findings={findings}
            onFindingClick={onFindingClick}
            onViewAllFindings={onViewAllFindings}
          />
        </div>
      </section>

      {/* 2. Middle Row: 4 Telemetry Metric Cards */}
      <section className="stage-row row-metrics" aria-label="Security Metrics and Posture Telemetry">
        <TelemetryMetricCards findings={findings} onViewAllFindings={onViewAllFindings} />
      </section>

      {/* 3. Bottom Row: Recent Zero-Trust Activity (Left, 65%) & System Status (Right, 35%) */}
      <section className="stage-row row-bottom" aria-label="Recent Decisions and System Status">
        <div className="stage-col-left">
          <RecentActivityCard onViewAll={onViewAllFindings} />
        </div>
        <div className="stage-col-right">
          <SystemStatusCard onViewDetails={onOpenIntegrations} />
        </div>
      </section>

      {/* 4. Bottom Footer Bar */}
      <FooterStatusBar />
    </div>
  );
};
