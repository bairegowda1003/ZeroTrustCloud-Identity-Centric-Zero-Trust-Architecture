import React, { useState } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Cpu, 
  BarChart3, 
  Layers, 
  Search, 
  Database,
  CheckCircle2
} from 'lucide-react';
import { ObservabilitySummaryCards } from './ObservabilitySummaryCards';
import { ObservabilityTelemetryHero } from './ObservabilityTelemetryHero';
import { SecurityEventExplorerTable } from './SecurityEventExplorerTable';
import { EventDetailDrawer } from './EventDetailDrawer';
import { ZeroTrustScorecardMatrix } from './ZeroTrustScorecardMatrix';
import { TelemetryHealthMonitor } from './TelemetryHealthMonitor';
import { 
  INITIAL_OBSERVABILITY_SUMMARY, 
  CORRELATED_SECURITY_EVENTS 
} from '../../data/demoObservability';
import { NormalizedSecurityEvent } from '../../types/observability';

interface SecurityObservabilityViewProps {
  onNavigateToFinding?: (findingId: string) => void;
}

export const SecurityObservabilityView: React.FC<SecurityObservabilityViewProps> = ({
  onNavigateToFinding
}) => {
  const [selectedEvent, setSelectedEvent] = useState<NormalizedSecurityEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'SCORECARD' | 'HEALTH'>('EVENTS');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');

  return (
    <div className="security-observability-container">
      {/* 1. Tooling Status Banner */}
      <div className="observability-banner">
        <div className="obs-banner-left">
          <div className="obs-banner-badges">
            <span className="obs-badge">AUDIT & OBSERVABILITY</span>
            <span className="obs-badge evaluating">EVALUATING</span>
          </div>
          <h1 className="obs-banner-title">
            <Activity className="w-5 h-5" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#818cf8' }} />
            Centralized Security Observability & Evaluation
          </h1>
          <p className="obs-banner-desc">
            Centralized telemetry aggregation, event normalization, and mathematical evaluation across all Zero Trust layers.
          </p>
        </div>

        {/* Engine Version Pills */}
        <div className="obs-banner-right">
          <div className="obs-engine-pill">
            <span className="w-2 h-2 rounded-full" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
            <span>OTel: <strong>{INITIAL_OBSERVABILITY_SUMMARY.pipelineEngineStatus.otelVersion}</strong></span>
          </div>
          <div className="obs-engine-pill">
            <span className="w-2 h-2 rounded-full" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>Prometheus: <strong>{INITIAL_OBSERVABILITY_SUMMARY.pipelineEngineStatus.prometheusVersion}</strong></span>
          </div>
          <div className="obs-engine-pill">
            <span className="w-2 h-2 rounded-full" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }} />
            <span>Loki: <strong>{INITIAL_OBSERVABILITY_SUMMARY.pipelineEngineStatus.lokiVersion}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <ObservabilitySummaryCards
        summary={INITIAL_OBSERVABILITY_SUMMARY}
        onFilterDomain={(dom) => {
          if (dom === 'HEALTH') {
            setActiveTab('HEALTH');
          } else {
            setDomainFilter(dom);
            setActiveTab('EVENTS');
          }
        }}
      />

      {/* 3. Interactive Telemetry Conduit Hero */}
      <ObservabilityTelemetryHero
        onSelectEvent={(evt) => setSelectedEvent(evt)}
        onNavigateToFinding={onNavigateToFinding}
      />

      {/* 4. Subview Tabs */}
      <div className="obs-tabs-bar">
        <button
          onClick={() => setActiveTab('EVENTS')}
          className={`obs-tab-btn ${activeTab === 'EVENTS' ? 'active' : ''}`}
        >
          <Activity className="w-4 h-4" />
          <span>Unified Security Events ({CORRELATED_SECURITY_EVENTS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SCORECARD')}
          className={`obs-tab-btn ${activeTab === 'SCORECARD' ? 'active' : ''}`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Trust Evaluation Scorecard (Mathematical Proofs)</span>
        </button>

        <button
          onClick={() => setActiveTab('HEALTH')}
          className={`obs-tab-btn ${activeTab === 'HEALTH' ? 'active' : ''}`}
        >
          <Cpu className="w-4 h-4" />
          <span>Telemetry Scraper Health</span>
        </button>
      </div>

      {/* 5. Subview Content */}
      {activeTab === 'EVENTS' ? (
        <SecurityEventExplorerTable
          events={CORRELATED_SECURITY_EVENTS}
          onSelectEvent={(evt) => setSelectedEvent(evt)}
          domainFilter={domainFilter}
        />
      ) : activeTab === 'SCORECARD' ? (
        <ZeroTrustScorecardMatrix />
      ) : (
        <TelemetryHealthMonitor />
      )}

      {/* 6. Event Detail Drawer */}
      <EventDetailDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onNavigateToFinding={onNavigateToFinding}
      />
    </div>
  );
};

