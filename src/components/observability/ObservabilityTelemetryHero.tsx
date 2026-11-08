import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  Layers, 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  Server, 
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { CORRELATED_SECURITY_EVENTS } from '../../data/demoObservability';
import { NormalizedSecurityEvent } from '../../types/observability';

interface ObservabilityTelemetryHeroProps {
  onSelectEvent: (event: NormalizedSecurityEvent) => void;
  onNavigateToFinding?: (findingId: string) => void;
}

export const ObservabilityTelemetryHero: React.FC<ObservabilityTelemetryHeroProps> = ({
  onSelectEvent,
  onNavigateToFinding
}) => {
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const activeEvent = CORRELATED_SECURITY_EVENTS[selectedEventIndex];

  return (
    <div className="obs-telemetry-hero">
      {/* Header */}
      <div className="obs-hero-top">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="obs-hero-tag">Centralized Pipeline</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              Phases 1–5 Telemetry Ingestion & Correlation
            </span>
          </div>
          <h2 className="obs-hero-title">
            Zero Trust Telemetry & Evaluation Conduit
          </h2>
        </div>

        {/* Quick event scenario buttons */}
        <div className="obs-events-row">
          {CORRELATED_SECURITY_EVENTS.map((evt, idx) => {
            const isSelected = selectedEventIndex === idx;
            const isDenied = evt.outcome === 'DENIED' || evt.outcome === 'CONNECTION_RESET';
            return (
              <button
                key={evt.eventId}
                onClick={() => {
                  setSelectedEventIndex(idx);
                  onSelectEvent(evt);
                }}
                className={`obs-event-btn ${isSelected ? (isDenied ? 'active denied' : 'active') : ''}`}
              >
                {evt.eventId}: {evt.sourceComponent}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-Stage Visual Ingestion Conduit */}
      <div className="obs-stages-grid">
        {/* Stage 1: Security Domain Sources */}
        <div className="obs-stage-card">
          <div className="obs-stage-header">
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', fontWeight: 600 }}>Stage 01</span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>6 Engines</span>
          </div>
          <div className="obs-stage-title">
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 700, margin: 0, color: 'inherit' }}>Security Sources</h4>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0, fontFamily: 'var(--font-mono)' }}>Distributed Cluster Layers</p>
            </div>
          </div>
          <div className="obs-stage-body">
            Source: <strong>{activeEvent.sourceComponent}</strong><br/>
            Domain: {activeEvent.domain}
          </div>
        </div>

        {/* Stage 2: OpenTelemetry Collector */}
        <div className="obs-stage-card">
          <div className="obs-stage-header">
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', fontWeight: 600 }}>Stage 02</span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#818cf8', background: 'rgba(129, 140, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>OTel v0.105</span>
          </div>
          <div className="obs-stage-title">
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 700, margin: 0, color: 'inherit' }}>OTel Collector</h4>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0, fontFamily: 'var(--font-mono)' }}>Normalization & Trace Link</p>
            </div>
          </div>
          <div className="obs-stage-body">
            Correlation: <strong>{activeEvent.correlationId}</strong><br/>
            Transit: 1,240 ms (p95)
          </div>
        </div>

        {/* Stage 3: Prometheus & Loki Sinks */}
        <div className="obs-stage-card">
          <div className="obs-stage-header">
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', fontWeight: 600 }}>Stage 03</span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Prom & Loki</span>
          </div>
          <div className="obs-stage-title">
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 700, margin: 0, color: 'inherit' }}>Storage Sinks</h4>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0, fontFamily: 'var(--font-mono)' }}>Metrics TSDB & Audit Log</p>
            </div>
          </div>
          <div className="obs-stage-body">
            Prometheus: Port 9090<br/>
            Loki Storage: Port 3100
          </div>
        </div>

        {/* Stage 4: TrustMesh Evaluation Engine */}
        <div className="obs-stage-card stage4">
          <div className="obs-stage-header">
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', fontWeight: 600 }}>Stage 04</span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
              {activeEvent.outcome}
            </span>
          </div>
          <div className="obs-stage-title">
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 700, margin: 0, color: 'inherit' }}>TrustMesh Evaluator</h4>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0, fontFamily: 'var(--font-mono)' }}>Quantitative Verification</p>
            </div>
          </div>
          <div className="obs-stage-body">
            Rule: <strong>{activeEvent.ruleId}</strong><br/>
            Decision: {activeEvent.outcome}
          </div>
        </div>
      </div>

      {/* Selected Event Live Inspector Strip */}
      <div className="obs-inspector-strip">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {activeEvent.eventId}
            </span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{activeEvent.affectedResource} (ns: {activeEvent.namespace})</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#06b6d4', fontFamily: 'var(--font-mono)' }}>Ref: {activeEvent.evidenceReference}</span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: 'inherit', opacity: 0.9 }}>
            {activeEvent.description}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {activeEvent.findingRef && onNavigateToFinding && (
            <button
              onClick={() => onNavigateToFinding(activeEvent.findingRef!)}
              className="sc-action-btn delete"
              style={{ padding: '6px 12px', fontSize: '0.72rem' }}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Bridge to Finding {activeEvent.findingRef}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => onSelectEvent(activeEvent)}
            className="sc-action-btn view"
            style={{ padding: '6px 12px', fontSize: '0.72rem' }}
          >
            <span>Inspect Payload</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

