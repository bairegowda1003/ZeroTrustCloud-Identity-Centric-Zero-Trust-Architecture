import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Database, GitBranch, Layers3, RefreshCw, Shield, X } from 'lucide-react';
import { useSource, type Observation } from '../../hooks/useCommandSources';
import { requestGatekeeperPolicies, snapshotAgeReason, type LiveGatekeeperConstraint as Constraint } from '../../utils/gatekeeperPolicies';
import * as verification from '../../utils/securityVerification';
import { SnapshotTime } from '../SnapshotTime';
import { PolicyRelationships } from './PolicyRelationships';
import { GatekeeperCore, PolicyObject } from './PolicyMaterials';
import { guardian, scope, summary, webhook } from './policyPresentation';

const policyApi = '/api/policies/gatekeeper';
const verifyApi = '/api/security/verification';

async function availablePolicies(signal: AbortSignal) {
  const response = await requestGatekeeperPolicies(signal);
  if (!response.available) throw new Error(response.error || 'Gatekeeper inventory unavailable');
  return response;
}
function freshness(source: Observation<unknown>) {
  if (source.staleReason) return 'Last-known snapshot';
  if (source.isLoading) return 'Collecting';
  return source.error ? 'Unavailable' : 'Current snapshot';
}
function CheckRows({checks, state}: {checks:verification.VerificationCheck[]; state:string}) {
  return <>{checks.map(check=><details key={check.id} className="ps-check">
    <summary><b className="ps-result" data-state={state==='Current snapshot' && !verification.snapshotAgeReason(check.observedAt) ? check.status : 'past'}>
      {state!=='Current snapshot' || verification.snapshotAgeReason(check.observedAt) ? 'Last observed · ' : ''}{check.status}</b><span>{check.control}</span><ChevronRight size={14}/></summary>
    <p>{check.reason}</p><small>{check.source} · <SnapshotTime value={check.observedAt}/></small>
    <details className="ps-raw"><summary>Observed evidence</summary><pre tabIndex={0}>{JSON.stringify(check.evidence,null,2)}</pre></details>
  </details>)}</>;
}
function Inspector({row, state, collected, checks, verificationState, navigate, close}: {
  row:Constraint; state:string; collected:string; checks:verification.VerificationCheck[]; verificationState:string; navigate:(direction:number)=>void; close:()=>void
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(()=>{closeButton.current?.focus();},[]);
  const target=scope(row);
  const related=checks.filter(check=>Object.hasOwnProperty.call(check.evidence,row.name) ||
    Object.values(check.evidence).some(value=>Array.isArray(value) ? value.includes(row.name) :
      value && typeof value==='object' && Object.hasOwnProperty.call(value,row.name)));
  return <aside className="ps-inspector" aria-label="Constraint evidence inspector">
    <header><div><span className="ps-label">Constraint evidence</span>
      <h3>{row.name}</h3><code>{row.kind}</code></div>
      <nav aria-label="Browse constraints">
        <button onClick={()=>navigate(-1)} aria-label="Previous constraint"><ChevronLeft size={15}/></button>
        <button onClick={()=>navigate(1)} aria-label="Next constraint"><ChevronRight size={15}/></button>
        <button ref={closeButton} onClick={close} aria-label="Close evidence inspector"><X size={17}/></button>
      </nav>
    </header>
    <dl className="ps-primary">
      <dt>Configured action</dt><dd>{row.enforcementAction ?? 'Unknown'}</dd>
      <dt>Resource</dt><dd>{target.resources}</dd>
      <dt>Namespace</dt><dd>{target.namespaces}</dd>
      <dt>Webhook</dt><dd>{webhook(row.webhookEnforced)}</dd>
      <dt>Audit violations</dt><dd>{row.audit.totalViolations ?? 'Unknown'}</dd>
      <dt>Audit time</dt><dd><SnapshotTime value={row.audit.auditTimestamp ?? undefined}/></dd>
    </dl>
    <div className="ps-inspect-body" key={row.name} aria-label="Technical evidence">
      <details><summary>Associated verification ({related.length})</summary><small>Group checks referencing this constraint ? {verificationState}</small>
        <CheckRows checks={related} state={verificationState}/></details>
      <details><summary>Match selectors</summary><pre tabIndex={0}>{JSON.stringify(row.match,null,2)}</pre></details>
      <details><summary>Raw constraint evidence</summary><small>{state} ? <SnapshotTime value={collected}/></small>
        <code>{policyApi}</code><p>Audit counts describe the resources observed during an audit. Individual admission outcomes require separate evidence.</p><pre tabIndex={0}>{JSON.stringify(row,null,2)}</pre></details>
    </div>
  </aside>;
}

export function LiveGatekeeperStatus() {
  const policy=useSource(availablePolicies,snapshotAgeReason);
  const verified=useSource(verification.requestSecurityVerification,verification.snapshotAgeReason);
  const [selection,select]=useState<string|null>(null);
  const [traceRun, replayTrace] = useState(0);
  const [preview, setPreview] = useState<string|null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!stage.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const trigger=useRef<HTMLButtonElement|null>(null);
  const rows=policy.data?.constraints ?? [];
  const selected=rows.find(row=>row.name===selection);
  const checks=verified.data?.checks.filter(c=>c.id.startsWith('gatekeeper-')) ?? [];
  const status=freshness(policy), verifyStatus=freshness(verified);
  const report=summary(rows);
  function close() { select(null); trigger.current?.focus(); }
  useEffect(()=>{
    if (!selected) return;
    function escape(event:KeyboardEvent) { if(event.key==='Escape') close(); }
    document.addEventListener('keydown',escape);
    return ()=>document.removeEventListener('keydown',escape);
  },[selected]);
  useEffect(()=>{if(selection && !selected) select(null);},[selected,selection]);
  function inspect(row:Constraint, button:HTMLButtonElement) {
    trigger.current = button;
    select(row.name);
    replayTrace(run=>run+1);
    if (selected) stage.current?.querySelector<HTMLButtonElement>('[aria-label="Close evidence inspector"]')?.focus();
  }
  const notice = [policy.staleReason, policy.error].filter(Boolean).join(' ? ');
  const emphasized = rows.find(row=>row.name===preview) ?? selected;
  const diagnosticRows=rows.flatMap(row=>row.enforcementPoints.map((point,i)=><div key={row.name+i}><strong>{row.name}</strong><p>{point.name} · {point.state ?? 'Unknown'} · {point.message ?? 'No message'}</p></div>));
  return <>
    <header className="ps-head"><div><h1>Policy Enforcement Studio</h1>
      <small>{policy.data?.cluster ?? 'Lab target ? kind-trustmesh-lab'}{policy.data && <> ? <SnapshotTime value={policy.data.collectedAt}/></>}</small></div>
      <div className="ps-tools"><div aria-live="polite" aria-atomic="true">
        {notice ? <details className="ps-freshness"><summary className="ps-status">{status}</summary>
          <p className="ps-notice">{notice}</p></details> : <span className="ps-status">{status}</span>}</div>
        <button onClick={()=>{policy.refresh();verified.refresh();}} disabled={policy.isLoading || verified.isLoading}><RefreshCw size={14}/> Refresh</button></div>
    </header>
    <section className="ps-atlas" aria-label="Gatekeeper admission architecture">
      <div className="ps-atlas-head"><h2><GitBranch size={17}/> Admission architecture</h2></div>
      <div ref={stage} data-visible={visible} className={'ps-stage'+(selected?' inspecting':'')}><div className="ps-scene">
        <PolicyRelationships inventory={JSON.stringify(rows.map(row=>row.name))} selected={selected?.name} preview={preview} run={traceRun}/>
        <div className="ps-guardians"><span className="ps-label">Policy constraints</span>
        {rows.map(row=>{const [label,material]=guardian(row.name);return <button key={row.name} data-constraint={row.name} data-material={material} aria-pressed={row.name===selection} className="ps-guardian"
          onPointerEnter={()=>setPreview(row.name)} onPointerLeave={()=>setPreview(null)}
          onFocus={()=>setPreview(row.name)} onBlur={()=>setPreview(null)} onClick={e=>inspect(row,e.currentTarget)}>
          <PolicyObject material={material}/><span>{label}<small>{row.kind}</small></span><ChevronRight size={13}/><em>{row.enforcementAction ?? 'Unknown'} · {webhook(row.webhookEnforced)}</em>
        </button>;})}
        {!rows.length && <p>{policy.isLoading?'Collecting inventory…':policy.data?'No constraints returned':'Inventory unavailable'}</p>}</div>
        <div className="ps-core" data-material={emphasized ? guardian(emphasized.name)[1] : undefined}><GatekeeperCore/><h3>OPA Gatekeeper</h3><small>{rows.length?'Configured admission enforcement':'Admission control architecture'}</small></div>
        <div className="ps-scope" data-material="scope"><span className="ps-label">Deployment scope</span><PolicyObject material="scope"/><h3>{report.scope.resources}</h3><small>{report.scope.namespaces}</small></div>
      </div>{selected && <Inspector row={selected} collected={policy.data!.collectedAt} checks={checks} state={status} verificationState={verifyStatus}
        navigate={direction=>select(rows[(rows.indexOf(selected)+direction+rows.length)%rows.length].name)} close={close}/>}</div>
      <div className="ps-legend"><i/>Configured policy relationships — not observed admission traffic</div>
      <div className="ps-band">{[['Configured constraints',policy.data?rows.length:'Unknown'],['Configured deny',policy.data?rows.filter(c=>c.enforcementAction==='deny').length:'Unknown'],['Webhook status',report.webhook],['Audit violations',report.violations]].map(([label,value])=><div key={label}><span className="ps-label">{label}</span><strong>{value}</strong></div>)}</div>
      <footer className="ps-source"><Database size={12}/><code>{policyApi}</code>{policy.staleReason && <span>Last-known configuration and audit</span>}</footer>
    </section>
    <div className="ps-lower"><section><h2><Layers3 size={18}/>Policy explorer</h2><small>{status} · constraint configuration</small>
      <div className="ps-table"><div className="ps-columns ps-label"><span>Constraint</span><span>Action</span><span>Audit</span></div>
      {rows.map(row=><button className="ps-columns" key={row.name} aria-pressed={row.name===selection} onClick={e=>inspect(row,e.currentTarget)}>
        <span>{row.name}<small>{scope(row).namespaces} / {scope(row).resources}</small></span><code>{row.enforcementAction ?? 'Unknown'}</code><span>{row.audit.totalViolations ?? 'Unknown'} <ArrowUpRight size={12}/></span></button>)}
      {!rows.length && <p>No constraint records to inspect.</p>}</div>
      <details className="ps-diag"><summary>Gatekeeper diagnostics <span>{policy.data ? diagnosticRows.length+' reported' : 'Unavailable'}</span></summary><p>The vap.k8s.io native-validation engine is reported by audit. Webhook enforcement has its own controller-manager status.</p>{diagnosticRows.length ? diagnosticRows : <small>{policy.data?'No enforcement-point diagnostics returned.':'Diagnostic evidence unavailable.'}</small>}</details>
    </section><section><h2><Shield size={18}/>Security verification</h2><small>{verifyStatus} · <SnapshotTime value={verified.data?.collectedAt}/></small>
      {(verified.error || verified.staleReason) && <p className="ps-notice">{[verified.staleReason,verified.error].filter(Boolean).join(' · ')}</p>}
      <CheckRows checks={checks} state={verifyStatus}/>{!checks.length && <p>{verified.isLoading?'Collecting verification…':'No Gatekeeper check results available.'}</p>}
      <footer><code>{verifyApi}</code></footer></section></div>
  </>;
}
