import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { PIPELINE_SCENARIOS } from '../../data/demoSupplyChain';
import { PipelineScenario } from '../../types/supplyChain';

interface SupplyChainPipelineHeroProps {
  onNavigateToFinding?: (findingId: string) => void;
}

export const SupplyChainPipelineHero: React.FC<SupplyChainPipelineHeroProps> = ({
  onNavigateToFinding
}) => {
  const [selectedScenario, setSelectedScenario] = useState<PipelineScenario>(PIPELINE_SCENARIOS[0]);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);

  const activeStep = selectedScenario.steps[selectedStepIndex];

  const getStepIcon = (id: string) => {
    switch (id) {
      case 'build':
        return <Package size={18} />;
      case 'trivy_scan':
        return <Search size={18} />;
      case 'cosign_sign':
        return <KeyRound size={18} />;
      case 'gatekeeper_admission':
        return <ShieldCheck size={18} />;
      default:
        return <Package size={18} />;
    }
  };

  return (
    <div className="sc-pipeline-hero">
      {/* Header & Scenario Switcher */}
      <div className="sc-hero-top">
        <div className="sc-hero-title">
          <span className="sc-hero-tag">
            End-to-End Pipeline: Build ➔ Scan ➔ Sign ➔ Gatekeeper
          </span>
          <h2>Software Supply Chain Verification Conduit</h2>
        </div>

        {/* Interactive Scenario Buttons */}
        <div className="sc-scenarios-row">
          {PIPELINE_SCENARIOS.map((sc) => {
            const isSelected = selectedScenario.id === sc.id;
            const isAllowed = sc.expectedOutcome === 'ADMITTED';
            return (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenario(sc);
                  setSelectedStepIndex(0);
                }}
                className={`sc-scenario-btn ${isSelected ? `active ${isAllowed ? 'allowed' : 'denied'}` : ''}`}
              >
                {sc.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Workload Metadata Banner */}
      <div className="sc-target-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-tertiary, #64748b)' }}>Target Image:</span>
          <code style={{ 
            fontFamily: 'var(--font-mono, monospace)', 
            padding: '2px 8px', 
            borderRadius: '6px', 
            background: 'rgba(15, 23, 42, 0.6)', 
            border: '1px solid rgba(148, 163, 184, 0.15)',
            color: 'var(--text-primary, #f8fafc)'
          }}>
            {selectedScenario.targetImage}
          </code>
          <span style={{ color: 'var(--text-tertiary, #64748b)' }}>•</span>
          <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>{selectedScenario.targetWorkload}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-tertiary, #64748b)' }}>Verdict:</span>
          {selectedScenario.expectedOutcome === 'ADMITTED' ? (
            <span className="sc-status-pill admitted">
              <CheckCircle2 size={12} /> ALLOW (201 Created)
            </span>
          ) : (
            <span className="sc-status-pill blocked">
              <XCircle size={12} /> DENY (403 Admission Webhook)
            </span>
          )}

          {selectedScenario.findingRef && onNavigateToFinding && (
            <button
              onClick={() => onNavigateToFinding(selectedScenario.findingRef!)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#f87171',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                fontSize: '0.74rem',
                marginLeft: '6px'
              }}
            >
              <ShieldAlert size={14} />
              <span>Finding {selectedScenario.findingRef}</span>
              <ExternalLink size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 4-Step Visual Conduit Flow */}
      <div className="sc-pipeline-steps">
        {selectedScenario.steps.map((step, idx) => {
          const isSelected = selectedStepIndex === idx;

          return (
            <div
              key={step.id}
              onClick={() => setSelectedStepIndex(idx)}
              className={`sc-step-card ${isSelected ? 'active' : ''}`}
            >
              {/* Step indicator */}
              <div className="sc-step-header">
                <span className="sc-step-num">Step 0{step.stepNumber}</span>
                <span className={`sc-step-badge ${step.status}`}>
                  {step.status === 'passed' && <CheckCircle2 size={11} />}
                  {step.status === 'failed' && <XCircle size={11} />}
                  {step.status === 'skipped' && <AlertTriangle size={11} />}
                  {step.status === 'blocked' && <XCircle size={11} />}
                  <span>{step.status.toUpperCase()}</span>
                </span>
              </div>

              {/* Tool & Icon */}
              <div className="sc-step-content">
                <div 
                  className="sc-step-icon"
                  style={{
                    background: step.status === 'passed' ? 'rgba(16, 185, 129, 0.15)' : step.status === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: step.status === 'passed' ? '#34d399' : step.status === 'failed' ? '#f87171' : '#94a3b8'
                  }}
                >
                  {getStepIcon(step.id)}
                </div>
                <div>
                  <h4 className="sc-step-label">{step.label}</h4>
                  <p className="sc-step-tool">{step.tool} ({step.version})</p>
                </div>
              </div>

              {/* Summary */}
              <div className="sc-step-summary">{step.summary}</div>
            </div>
          );
        })}
      </div>

      {/* Active Step Inspector Panel */}
      {activeStep && (
        <div className="sc-active-inspector">
          <div className="sc-inspector-header">
            <span>Step 0{activeStep.stepNumber} Details: {activeStep.label}</span>
            <span className={`sc-step-badge ${activeStep.status}`}>
              {activeStep.status.toUpperCase()}
            </span>
          </div>
          <p className="sc-inspector-details">{activeStep.details}</p>
        </div>
      )}
    </div>
  );
};
