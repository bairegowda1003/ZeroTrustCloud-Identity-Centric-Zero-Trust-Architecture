import React from 'react';
import { SecurityFinding, FindingStatus } from '../types/security';
import { GreetingEngineBar } from './GreetingEngineBar';
import { TrustScoreRadialGauge } from './TrustScoreRadialGauge';
import { NeedsAttentionCard } from './NeedsAttentionCard';
import { TelemetryMetricCards } from './TelemetryMetricCards';
import { RecentDecisionsTimeline } from './RecentDecisionsTimeline';
import { RiskDistributionCard } from './RiskDistributionCard';

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
  onStatusChange,
  onOpenIntegrations,
  onViewAllFindings,
}) => {
  return (
    <div className="command-center-stage" role="region" aria-label="TrustMesh Security Command Center">
      {/* 1. Greeting & Security Engines Status Strip */}
      <GreetingEngineBar onOpenIntegrations={onOpenIntegrations} />

      {/* 2. Primary Focal Row: Central Trust Visual (Left) & Needs Attention (Right) */}
      <section className="command-center-focal-row" aria-label="Primary Security Posture and Alerts">
        <div className="focal-col-left">
          <TrustScoreRadialGauge findings={findings} onSelectDomainFilter={() => onViewAllFindings?.()} />
        </div>
        <div className="focal-col-right">
          <NeedsAttentionCard findings={findings} onFindingClick={onFindingClick} />
        </div>
      </section>

      {/* 3. Middle Telemetry Metric Cards (3 Cards) */}
      <section className="command-center-telemetry-row" aria-label="Zero-Trust Operational Telemetry">
        <TelemetryMetricCards findings={findings} onViewAllFindings={onViewAllFindings} />
      </section>

      {/* 4. Bottom Row: Recent Zero-Trust Decisions (Left) & Risk Distribution (Right) */}
      <section className="command-center-bottom-row" aria-label="Recent Decisions and Risk Distribution">
        <div className="bottom-col-left">
          <RecentDecisionsTimeline
            findings={findings}
            onFindingClick={onFindingClick}
            onViewAllFindings={onViewAllFindings}
          />
        </div>
        <div className="bottom-col-right">
          <RiskDistributionCard findings={findings} />
        </div>
      </section>
    </div>
  );
};
