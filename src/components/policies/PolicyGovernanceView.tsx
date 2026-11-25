import React from 'react';
import { ADMISSION_DECISIONS } from '../../data/demoPolicies';
import { AdmissionDecisionsFeed } from './AdmissionDecisionsFeed';
import { LiveGatekeeperStatus } from './LiveGatekeeperStatus';

export function PolicyGovernanceView({onNavigateToFinding}: {onNavigateToFinding?: (id:string)=>void}) {
  return <div className="policy-studio">
    <LiveGatekeeperStatus/>
    <details className="ps-demo"><summary>Historical Experiments &amp; Demonstration Scenarios</summary>
      <p>DEMONSTRATION / SIMULATED — NOT LIVE SECURITY TELEMETRY</p>
      <AdmissionDecisionsFeed decisions={ADMISSION_DECISIONS} onNavigateToFinding={onNavigateToFinding}/>
    </details>
  </div>;
}
