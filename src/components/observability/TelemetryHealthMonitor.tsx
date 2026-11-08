import React from 'react';
import { Cpu, Server, Database, CheckCircle2, RefreshCw } from 'lucide-react';
import { SCRAPER_HEALTH_RECORDS } from '../../data/demoObservability';
import { TelemetryScraperHealth } from '../../types/observability';

export const TelemetryHealthMonitor: React.FC = () => {
  return (
    <div className="obs-table-card">
      {/* Header */}
      <div className="sc-table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu className="w-4 h-4" style={{ color: '#818cf8' }} />
          <h3 className="sc-table-title">
            Telemetry Ingestion Engine & Collector Health
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
          <span className="w-2 h-2 rounded-full" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span>Scraping Active (15s interval)</span>
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
                  {scraper.version}
                </span>
                <span className="obs-outcome-badge allowed">
                  <CheckCircle2 className="w-3 h-3" style={{ marginRight: '4px' }} /> {scraper.status}
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
                <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Endpoint:</span>
                <span style={{ maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {scraper.endpoint}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Transit Latency:</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{scraper.latencyMs} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Ingested Records:</span>
                <span style={{ fontWeight: 600 }}>
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

