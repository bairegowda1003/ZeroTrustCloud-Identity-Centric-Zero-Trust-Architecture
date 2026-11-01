import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Server,
  KeyRound,
  Network,
  CheckCircle2,
  XCircle,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  VERIFICATION_SCENARIOS,
  LIVE_VERIFICATION_EVENTS,
} from '../../data/demoIdentities';
import { VerificationScenario } from '../../types/identity';

export const VerificationPipelineHero: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    VERIFICATION_SCENARIOS[0].id
  );
  const [showLiveLog, setShowLiveLog] = useState<boolean>(false);

  const activeScenario: VerificationScenario =
    VERIFICATION_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
    VERIFICATION_SCENARIOS[0];

  const isAllow = activeScenario.expectedDecision === 'ALLOW';

  return (
    <section className="verification-pipeline-container" aria-label="Verification Pipeline">
      {/* Header & Scenario Selection */}
      <div className="pipeline-header">
        <div className="pipeline-title-group">
          <div className="pipeline-badge">
            <Activity size={14} className="pulse-icon" />
            <span>LIVE DECISION ENGINE</span>
          </div>
          <h2 className="pipeline-title">Zero-Trust Workload Verification Pipeline</h2>
          <p className="pipeline-description">
            Cryptographic identity verification step-by-step: Evaluating Kubernetes ServiceAccount token projections against namespace boundary policies.
          </p>
        </div>

        {/* Interactive Scenario Buttons */}
        <div className="scenario-pills-bar" role="tablist" aria-label="Verification Scenarios">
          {VERIFICATION_SCENARIOS.map((scen) => {
            const isSelected = scen.id === activeScenario.id;
            const scenIsAllow = scen.expectedDecision === 'ALLOW';
            return (
              <button
                key={scen.id}
                role="tab"
                aria-selected={isSelected}
                className={`scenario-pill ${isSelected ? 'active' : ''} ${scenIsAllow ? 'allow' : 'deny'}`}
                onClick={() => setSelectedScenarioId(scen.id)}
              >
                <span className={`scenario-indicator ${scenIsAllow ? 'allow' : 'deny'}`} />
                <span className="scenario-name">{scen.title}</span>
                <span className={`scenario-outcome ${scenIsAllow ? 'allow' : 'deny'}`}>
                  {scen.expectedDecision}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-Step Decision Flowchart */}
      <div className="pipeline-flow-grid">
        {/* Step 1: Requesting Pod */}
        <div className="pipeline-node-card">
          <div className="node-step-index">STEP 01</div>
          <div className="node-icon-header">
            <div className="node-icon-circle blue">
              <Server size={18} />
            </div>
            <div className="node-label-group">
              <span className="node-category">CALLER POD</span>
              <h4 className="node-title">{activeScenario.sourceWorkload}</h4>
            </div>
          </div>
          <div className="node-meta-box">
            <div className="node-meta-row">
              <span className="node-meta-key">Namespace</span>
              <span className="node-meta-val code-badge namespace">{activeScenario.sourceNamespace}</span>
            </div>
            <div className="node-meta-row">
              <span className="node-meta-key">Cluster</span>
              <span className="node-meta-val">kind-trustmesh-lab</span>
            </div>
          </div>
        </div>

        {/* Pipeline Flow Connector 1 */}
        <div className="pipeline-connector" aria-hidden="true">
          <div className="connector-line">
            <span className="connector-pulse-dot" />
          </div>
          <ArrowRight size={16} className="connector-arrow" />
        </div>

        {/* Step 2: ServiceAccount & Projected Token */}
        <div className="pipeline-node-card">
          <div className="node-step-index">STEP 02</div>
          <div className="node-icon-header">
            <div className="node-icon-circle amber">
              <KeyRound size={18} />
            </div>
            <div className="node-label-group">
              <span className="node-category">IDENTITY PROJECTION</span>
              <h4 className="node-title">{activeScenario.sourceSA}</h4>
            </div>
          </div>
          <div className="node-meta-box">
            <div className="node-meta-row">
              <span className="node-meta-key">Auth Method</span>
              <span className={`node-meta-val code-badge ${activeScenario.method === 'projected_sa_token' ? 'verified' : 'unbound'}`}>
                {activeScenario.method === 'projected_sa_token'
                  ? 'Projected Token'
                  : 'Default (Unbound)'}
              </span>
            </div>
            <div className="node-meta-row">
              <span className="node-meta-key">Audience</span>
              <span className="node-meta-val code-badge">trustmesh.internal</span>
            </div>
          </div>
        </div>

        {/* Pipeline Flow Connector 2 */}
        <div className="pipeline-connector" aria-hidden="true">
          <div className="connector-line">
            <span className="connector-pulse-dot" />
          </div>
          <ArrowRight size={16} className="connector-arrow" />
        </div>

        {/* Step 3: Boundary Evaluation */}
        <div className="pipeline-node-card">
          <div className="node-step-index">STEP 03</div>
          <div className="node-icon-header">
            <div className="node-icon-circle purple">
              <Network size={18} />
            </div>
            <div className="node-label-group">
              <span className="node-category">BOUNDARY POLICY</span>
              <h4 className="node-title">{activeScenario.targetService}</h4>
            </div>
          </div>
          <div className="node-meta-box">
            <div className="node-meta-row">
              <span className="node-meta-key">Target NS</span>
              <span className="node-meta-val code-badge namespace">{activeScenario.targetNamespace}</span>
            </div>
            <div className="node-meta-row">
              <span className="node-meta-key">Ingress Check</span>
              <span className={`node-meta-val ${isAllow ? 'text-allow' : 'text-deny'}`}>
                {isAllow ? 'Explicitly Authorized' : 'Deny by Default'}
              </span>
            </div>
          </div>
        </div>

        {/* Pipeline Flow Connector 3 */}
        <div className="pipeline-connector" aria-hidden="true">
          <div className="connector-line">
            <span className="connector-pulse-dot" />
          </div>
          <ArrowRight size={16} className="connector-arrow" />
        </div>

        {/* Step 4: Access Decision */}
        <div className={`pipeline-node-card decision-node ${isAllow ? 'decision-allow' : 'decision-deny'}`}>
          <div className="node-step-index">STEP 04</div>
          <div className="node-icon-header">
            <div className={`node-icon-circle ${isAllow ? 'green' : 'red'}`}>
              {isAllow ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            </div>
            <div className="node-label-group">
              <span className="node-category">FINAL ENFORCEMENT</span>
              <h4 className={`node-title ${isAllow ? 'text-allow' : 'text-deny'}`}>
                {activeScenario.expectedDecision}
              </h4>
            </div>
          </div>
          <div className="node-meta-box decision-summary-box">
            <p className="decision-audit-text">{activeScenario.auditReason}</p>
          </div>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className={`pipeline-explanation-banner ${isAllow ? 'allow' : 'deny'}`}>
        <div className="explanation-icon">
          {isAllow ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
        </div>
        <div className="explanation-content">
          <div className="explanation-title">
            {isAllow
              ? 'Policy Enforcement: Identity Verified & Ingress Granted'
              : 'Zero-Trust Defense: Unauthorized Cross-Namespace Flow Blocked'}
          </div>
          <p className="explanation-text">{activeScenario.explanation}</p>
        </div>
      </div>

      {/* Live Event Telemetry Stream Collapsible */}
      <div className="pipeline-telemetry-toggle-wrap">
        <button
          className="pipeline-telemetry-toggle"
          onClick={() => setShowLiveLog((prev) => !prev)}
          aria-expanded={showLiveLog}
        >
          <div className="toggle-left">
            <span className="live-pulsing-dot" />
            <span>Simulated Telemetry Events ({LIVE_VERIFICATION_EVENTS.length})</span>
          </div>
          <div className="toggle-right">
            <span>{showLiveLog ? 'Hide Log' : 'Inspect Stream'}</span>
            {showLiveLog ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showLiveLog && (
          <div className="pipeline-telemetry-drawer">
            <div className="telemetry-table-header">
              <span>TIME</span>
              <span>SOURCE CALLER</span>
              <span>TARGET SERVICE</span>
              <span>METHOD</span>
              <span>DECISION</span>
              <span>REASON / POLICY</span>
            </div>
            <div className="telemetry-table-body">
              {LIVE_VERIFICATION_EVENTS.map((evt) => (
                <div key={evt.id} className="telemetry-row">
                  <span className="telemetry-time">{evt.timestamp}</span>
                  <span className="telemetry-source">
                    <code>{evt.sourceWorkload}</code>
                    <small>({evt.sourceNamespace})</small>
                  </span>
                  <span className="telemetry-target">
                    <code>{evt.targetService}</code>
                    <small>({evt.targetNamespace})</small>
                  </span>
                  <span className="telemetry-method">
                    <span className={`method-badge ${evt.authMethod}`}>
                      {evt.authMethod === 'projected_sa_token' ? 'Projected SA' : 'Default SA'}
                    </span>
                  </span>
                  <span className="telemetry-decision">
                    <span className={`decision-badge ${evt.decision.toLowerCase()}`}>
                      {evt.decision}
                    </span>
                  </span>
                  <span className="telemetry-reason" title={evt.reason}>
                    {evt.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

