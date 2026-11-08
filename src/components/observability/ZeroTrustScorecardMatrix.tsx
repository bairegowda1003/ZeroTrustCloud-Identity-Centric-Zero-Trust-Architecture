import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, HelpCircle } from 'lucide-react';
import { ZERO_TRUST_EVALUATION_CONTROLS } from '../../data/demoObservability';
import { ZeroTrustEvaluationControl } from '../../types/observability';

export const ZeroTrustScorecardMatrix: React.FC = () => {
  return (
    <div className="obs-scorecard-card">
      {/* Header */}
      <div className="sc-table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck className="w-4 h-4" style={{ color: '#10b981' }} />
          <h3 className="sc-table-title">
            Zero Trust Control Effectiveness Scorecard (Mathematical Evaluation)
          </h3>
        </div>
        <span className="sc-count-badge" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)' }}>
          6/6 Controls Verified
        </span>
      </div>

      {/* Table */}
      <div className="sc-table-scroll">
        <table className="sc-table">
          <thead>
            <tr>
              <th className="sc-th">Control Name / Category</th>
              <th className="sc-th">Mathematical Formula</th>
              <th className="sc-th">Evidence (Num / Denom)</th>
              <th className="sc-th">Evaluated Score</th>
              <th className="sc-th">Status</th>
              <th className="sc-th">Data Source</th>
            </tr>
          </thead>
          <tbody>
            {ZERO_TRUST_EVALUATION_CONTROLS.map((ctl) => (
              <tr key={ctl.id} className="sc-tr">
                {/* Control Name */}
                <td className="sc-td">
                  <div style={{ fontWeight: 600 }}>
                    {ctl.controlName}
                  </div>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#818cf8', marginTop: '2px' }}>
                    {ctl.id} • {ctl.category}
                  </div>
                </td>

                {/* Formula */}
                <td className="sc-td">
                  <code className="obs-formula-code">
                    {ctl.mathematicalFormula}
                  </code>
                </td>

                {/* Num / Denom */}
                <td className="sc-td" style={{ fontFamily: 'var(--font-mono)' }}>
                  <div style={{ fontWeight: 700 }}>
                    {ctl.numeratorValue} / {ctl.denominatorValue}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {ctl.numeratorLabel}
                  </div>
                </td>

                {/* Evaluated Score */}
                <td className="sc-td">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>
                      {ctl.calculatedScore}%
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      (target ≥ {ctl.targetThreshold}%)
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="sc-td">
                  <span className="obs-outcome-badge allowed">
                    <CheckCircle2 className="w-3 h-3" style={{ marginRight: '4px' }} /> PASSED
                  </span>
                </td>

                {/* Data Source */}
                <td className="sc-td" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <div style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ctl.dataSource}</div>
                  <div style={{ fontSize: '0.68rem', color: '#818cf8' }}>{ctl.observationWindow}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

