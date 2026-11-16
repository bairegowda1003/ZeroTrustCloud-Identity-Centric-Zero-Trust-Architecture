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
      {/* 1. Official Domain Header */}
      <div className="domain-page-header">
        <div className="domain-header-left">
          <div className="domain-title-row">
            <div className="domain-icon-squircle obs" aria-hidden="true">
              <Activity size={18} />
            </div>
            <h1 className="domain-page-title">Security Observability & Telemetry</h1>
            <span className="domain-live-badge obs">
              <span className="live-pip indigo" />
              Pipeline Normalizing
            </span>
          </div>
          <div className="domain-meta-subrow">
            <span className="domain-meta-crumb">
              Collector: <strong>OTel {INITIAL_OBSERVABILITY_SUMMARY.pipelineEngineStatus.otelVersion}</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Metrics: <strong>Prometheus {INITIAL_OBSERVABILITY_SUMMARY.pipelineEngineStatus.prometheusVersion}</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Logs: <strong>Loki {INITIAL_OBSERVABILITY_SUMMARY.pipelineEngineStatus.lokiVersion}</strong>
            </span>
          </div>
        </div>

        <div className="domain-header-right">
          <div className="domain-header-status-pill">
            <BarChart3 size={13} className="text-indigo-400" />
            <span>Zero-Trust Normalization Active</span>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <ObservabilitySummaryCards
        summary={INITIAL_OBSERVABILITY_SUMMARY}
        activeFilter={activeTab === 'HEALTH' ? 'HEALTH' : domainFilter}
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

