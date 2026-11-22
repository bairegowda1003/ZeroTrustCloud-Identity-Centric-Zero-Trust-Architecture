import { DemoNotice } from '../DemoNotice';
import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  Server, 
  Cpu, 
  Terminal 
} from 'lucide-react';
import { NormalizedSecurityEvent } from '../../types/observability';

interface EventDetailDrawerProps {
  event: NormalizedSecurityEvent | null;
  onClose: () => void;
  onNavigateToFinding?: (findingId: string) => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  event,
  onClose,
  onNavigateToFinding
}) => {
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!event) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(event.evidencePayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="sc-drawer-overlay" onClick={onClose}>
      <div 
        className="sc-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sc-drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', fontWeight: 600 }}>
                Scenario: {event.eventId}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                ref: {event.correlationId}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                fontWeight: 600
              }}>
                SIMULATED SCENARIO
              </span>
            </div>
            <h2 className="sc-drawer-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
              {event.ruleId}
            </h2>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', margin: '4px 0 0 0' }}>
              {event.affectedResource} • ns: {event.namespace}
            </p>
          </div>
          <button
            onClick={onClose}
            className="sc-drawer-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Strip */}
        <div className="sc-drawer-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>MODELED SOURCE</span>
              <span style={{ fontWeight: 600, fontSize: '0.78rem' }}>
                {event.sourceComponent}
              </span>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>SECURITY DOMAIN</span>
              <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                {event.domain}
              </span>
            </div>
          </div>

          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem', textAlign: 'right' }}>MODELED OUTCOME</span>
            <span className={`obs-outcome-badge ${event.outcome === 'ALLOWED' ? 'allowed' : 'denied'}`}>
              {event.outcome}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="sc-drawer-body">
          <DemoNotice />
          {/* Description */}
          <div className="sc-drawer-card">
            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, margin: '0 0 8px 0' }}>
              Scenario Description &amp; Modeled Context:
            </h4>
            <p style={{ fontSize: '0.75rem', lineHeight: '1.5', margin: 0, color: 'inherit', opacity: 0.9 }}>
              {event.description}
            </p>
          </div>

          {/* Trace Timestamps */}
          <div className="sc-drawer-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock className="w-3.5 h-3.5" />
                Authored Scenario Timestamp (Static):
              </span>
              <span style={{ fontWeight: 600 }}>
                {event.sourceTimestamp}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
                Simulated Ingestion Timestamp (Fixture):
              </span>
              <span style={{ fontWeight: 600 }}>
                {event.collectionTimestamp}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid rgba(148, 163, 184, 0.15)', fontSize: '0.68rem' }}>
              <span style={{ color: '#94a3b8' }}>Simulated Transit Benchmark:</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>1,240 ms</span>
            </div>
          </div>

          {/* Evidence Citation */}
          <div className="sc-drawer-card">
            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, margin: '0 0 4px 0' }}>
              Scenario Definition (Repository Path — Not Execution Evidence):
            </h4>
            <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0 0 8px 0' }}>
              The path below references an authored YAML manifest or test specification, not an active admission log or live execution trace.
            </p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#818cf8' }}>
              {event.evidenceReference}
            </div>
          </div>

          {/* Finding Bridge */}
          {event.findingRef && (
            <div className="sc-drawer-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldAlert className="w-4 h-4" style={{ color: '#ef4444' }} />
                <h4 style={{ fontSize: '0.78rem', fontWeight: 700, margin: 0, color: '#ef4444' }}>
                  Correlated Finding: {event.findingRef}
                </h4>
              </div>
              <p style={{ fontSize: '0.75rem', margin: '0 0 12px 0', color: 'inherit', opacity: 0.9 }}>
                This demonstration scenario models the security condition tracked in Command Center finding <strong>{event.findingRef}</strong>.
              </p>
              {onNavigateToFinding && (
                <button
                  onClick={() => onNavigateToFinding(event.findingRef!)}
                  className="sc-action-btn delete"
                  style={{ width: '100%', justifyContent: 'center', padding: '8px 14px', fontSize: '0.75rem' }}
                >
                  <span>Open Finding in Security Command Center</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Raw Telemetry JSON Viewer */}
          <div className="sc-drawer-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                Illustrative Scenario Payload (Not Live Telemetry)
              </span>
              <button
                onClick={handleCopyPayload}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#818cf8', fontFamily: 'var(--font-mono)' }}
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre style={{
              margin: 0,
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(10, 15, 30, 0.8)',
              color: '#cbd5e1',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              overflowX: 'auto',
              maxHeight: '240px',
              border: '1px solid rgba(148, 163, 184, 0.15)'
            }}>
              {JSON.stringify(event.evidencePayload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

