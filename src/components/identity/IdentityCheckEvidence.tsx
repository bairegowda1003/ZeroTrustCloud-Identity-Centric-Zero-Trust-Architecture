import React from 'react';
import { SnapshotTime } from '../SnapshotTime';
import type { VerificationCheck } from '../../utils/securityVerification';

export function RawEvidence({value}: {value: unknown}) {
  return <details className="if-raw"><summary>Inspect raw evidence</summary><pre tabIndex={0}>{JSON.stringify(value,null,2)}</pre></details>;
}

function record(value:unknown): value is Record<string,unknown> {
  return !!value && typeof value==='object' && !Array.isArray(value);
}
export function EvidenceFields({value}: {value: unknown}) {
  if (Array.isArray(value)) return value.length ? <ul className="if-values">{value.map((v,i)=><li key={i}><EvidenceFields value={v}/></li>)}</ul> : <>None reported</>;
  if (record(value)) return <dl className="if-fields">{Object.entries(value).map(([key,v])=><React.Fragment key={key}><dt>{key.replace(/([a-z])([A-Z])/g,'$1 $2')}</dt><dd><EvidenceFields value={v}/></dd></React.Fragment>)}</dl>;
  return <>{value==null?'Unknown':String(value)}</>;
}

function CheckSummary({check}: {check:VerificationCheck}) {
  const components=check.evidence.components;
  if(check.id==='spire-control-plane-components' && Array.isArray(components) && components.every(record))
    return <div className="if-component-list">{components.map((c,i)=><div className="if-component" key={i}><span>{String(c.name ?? 'Unknown component')}<small>{String(c.kind ?? 'Unknown type')}</small></span>
      <strong>{c.available===false?'Unavailable':typeof c.readyReplicas==='number' && typeof c.desiredReplicas==='number' && c.readyReplicas<=c.desiredReplicas?c.readyReplicas+'/'+c.desiredReplicas+' replicas ready':'Unknown'}</strong></div>)}</div>;
  return <EvidenceFields value={check.evidence}/>;
}
export function CheckEvidence({checks}: {checks:VerificationCheck[]}) {
  return <>{checks.map(check=><details key={check.id} className="if-check" open={check.status==='FAIL'||undefined}>
    <summary><b data-outcome={check.status}>{check.status}</b><strong>{check.control}</strong></summary>
    <p>{check.reason}</p><small><code>{check.source}</code> · <SnapshotTime value={check.observedAt}/></small>
    <CheckSummary check={check}/><RawEvidence value={check.evidence}/>
  </details>)}</>;
}
