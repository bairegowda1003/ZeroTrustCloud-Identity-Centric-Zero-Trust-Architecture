import React from 'react';
import { Cpu, Server, Database, AlertTriangle, FileCode } from 'lucide-react';
import { SCRAPER_HEALTH_RECORDS } from '../../data/demoObservability';
import { TelemetryScraperHealth } from '../../types/observability';

export const TelemetryHealthMonitor: React.FC = () => {
  return (
    <div className="obs-table-card">
      {/* Header */}
      <div className="sc-table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu className="w-4 h-4" style={{ color: '#818cf8' }} />
          <div>
            <h3 className="sc-table-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>PROPOSED TELEMETRY ARCHITECTURE — NOT DEPLOYED</span>
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.68rem', color: '#94a3b8' }}>
              Configurations authored in k8s/observability/ — services are uninstantiated architectural specifications
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
          <span className="obs-outcome-badge denied">
            NOT DEPLOYED
          </span>
        </div>
      </div>

      {/* Grid of 4 Collectors */}
      <div className="obs-health-grid">
        {SCRAPER_HEALTH_RECORDS.map((scraper) => (
          <div 
            key={scraper.service}
            className="obs-health-item"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
                  Spec: {scraper.version}
                </span>
                <span className="obs-outcome-badge denied" style={{ fontSize: '0.65rem' }}>
                  NOT RUNNING (MANIFEST ONLY)
                </span>
              </div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                {scraper.service}
              </h4>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
                {scraper.role}
              </p>
            </div>

            <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.15)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Manifest Target:</span>
                <span style={{ maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {scraper.endpoint}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Simulated Benchmark:</span>
                <span style={{ color: '#818cf8', fontWeight: 700 }}>{scraper.latencyMs} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Illustrative Volume:</span>
                <span style={{ fontWeight: 600, color: '#94a3b8' }}>
                  {scraper.recordsIngested.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

