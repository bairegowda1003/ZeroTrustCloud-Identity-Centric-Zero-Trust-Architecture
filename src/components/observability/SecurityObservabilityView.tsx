import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Check, ChevronRight, HelpCircle, Fingerprint, FolderOpen, Layers,
  LockKeyhole, Network, RefreshCw, Search, Server, Shield, X } from 'lucide-react';
import { useSource, type Observation } from '../../hooks/useCommandSources';
import { requestSecurityVerification, snapshotAgeReason, type LiveSecurityVerificationResponse,
  type VerificationCheck, type VerificationStatus } from '../../utils/securityVerification';
import { SnapshotTime } from '../SnapshotTime';
import { VerificationInspector } from '../verification/VerificationInspector';
import { caption, contextOf, domains, domainOf } from '../verification/verificationDomains';

const symbols = [Server,Shield,Network,LockKeyhole,Fingerprint,Layers];
const states: VerificationStatus[] = ['PASS','FAIL','UNKNOWN'];
const markers = {PASS:Check, FAIL:X, UNKNOWN:HelpCircle};

export function SecurityObservabilityView() {
  const observation=useSource(requestSecurityVerification,snapshotAgeReason);
  return <VerificationStudio observation={observation}/>;
}

export function VerificationStudio({observation}: {observation: Observation<LiveSecurityVerificationResponse>}) {
  const {data,isLoading,staleReason,error,refresh}=observation;
  const checks=data?.checks ?? [];
  const [id,setId]=useState<string|null>(null);
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('All');
  const heading=useRef<HTMLHeadingElement>(null);
  const origin=useRef<HTMLButtonElement|null>(null);
  const refreshButton=useRef<HTMLButtonElement>(null);
  const index=checks.findIndex(check=>check.id===id);
  const selected=checks[index];
  const close=useCallback(()=>{
    setId(null);
    (origin.current?.isConnected ? origin.current : refreshButton.current)?.focus();
  },[]);
  useEffect(()=>{
    if(!id) return;
    if(!selected){close();return;}
    heading.current?.focus({preventScroll:true});
    heading.current?.scrollIntoView({block:'nearest'});
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close();}};
    document.addEventListener('keydown',escape);
    return ()=>document.removeEventListener('keydown',escape);
  },[id,selected?.id,close]);
  function inspect(check:VerificationCheck,button:HTMLButtonElement){
    origin.current=button;
    if(id===check.id) heading.current?.focus();
    else setId(check.id);
  }
  const past=(c:VerificationCheck)=>Boolean(staleReason || snapshotAgeReason(c.observedAt));
  const contexts=[...new Set(checks.map(c=>contextOf(c.source)).filter(Boolean))];
  const freshness = !data ? (isLoading ? 'Collecting' : 'Unavailable') :
    error ? 'Last-known snapshot · refresh failed' :
    isLoading ? 'Last-known snapshot · refreshing' : staleReason || 'Current snapshot';
  const term=query.trim().toLowerCase();
  const filtered=checks.filter(c=>(filter==='All'||filter===c.status) &&
    [c.id,c.control,c.source,c.reason,domainOf(c.id),caption(c)].some(v=>v.toLowerCase().includes(term)));
  const empty=data?'Collection returned no checks.':isLoading?'Collecting verification evidence…':'Verification evidence unavailable.';
  function result(c:VerificationCheck) {
    const Marker=markers[c.status];
    return <span className="vs-result" data-result={c.status} data-age={past(c)?'past':'current'}><Marker size={13} aria-hidden="true"/>{c.status}{!staleReason && past(c) && <small>last observed</small>}</span>;
  }
  return <div className="vs-studio">
    <header className="vs-heading">
      <div><h1>Security Verification</h1><p className="vs-contexts"><Server size={14} aria-label="Cluster contexts"/>{contexts.join(' · ') || 'Cluster contexts unreported'}</p></div>
      <div className="vs-collection"><span>{data ? checks.length+' checks' : 'Awaiting collection'}</span>
        <span><Clock size={13}/><SnapshotTime value={data?.collectedAt}/></span></div>
      <button className="vs-refresh" ref={refreshButton} disabled={isLoading} onClick={refresh}><RefreshCw size={15}/>{isLoading?'Verifying…':'Re-verify'}</button>
    </header>
    <section className={'vs-surface'+(selected?' vs-docked':'')} aria-labelledby="vs-matrix-title" data-loading={isLoading}>
      <div className="vs-matrix">
        <div className="vs-grid-heading"><div className="vs-section-title"><h2 id="vs-matrix-title">Zero Trust Verification Grid</h2></div>
          <span className="vs-freshness" id="vs-freshness" role="status" data-retained={!!staleReason} title={error || staleReason || undefined}>{freshness}</span>
          {data && <div className="vs-legend" aria-label="Reported result counts">{states.map(state=><span key={state} data-result={state}>{checks.filter(c=>c.status===state).length} {state}</span>)}</div>}
        </div>
        {error && <p className="vs-notice">{error}</p>}
        {!checks.length && <p className="vs-empty" role="status">{empty}</p>}
        {domains.map((domain,i)=>{
          const group=checks.filter(c=>domainOf(c.id)===domain);
          if(!group.length)return null;
          const Icon=symbols[i];
          return <section className="vs-lane" key={domain} aria-label={domain} data-domain={domain}>
            <h3><span className="vs-emblem"><Icon size={18}/></span>{domain}</h3><div className="vs-cells">{group.map(c=>
              <button key={c.id} title={c.control} aria-describedby="vs-freshness" aria-pressed={c.id===id} data-check={c.id} onClick={e=>inspect(c,e.currentTarget)}>
                <span className="vs-pin" aria-hidden="true"/><b>{caption(c)}</b>{result(c)}</button>)}</div></section>;
        })}
      </div>
      {selected && <VerificationInspector check={selected} lastKnown={past(selected)} headingRef={heading} close={close}
        previous={index>0?()=>setId(checks[index-1].id):undefined} next={index<checks.length-1?()=>setId(checks[index+1].id):undefined}/>}
    </section>
    <section className="vs-register" aria-labelledby="vs-register-title"><div className="vs-tools">
      <div className="vs-section-title"><h2 id="vs-register-title">Verification register</h2>{data && <span>{filtered.length} of {checks.length}</span>}</div>
      <label className="vs-search"><Search size={15}/><input aria-label="Search verification checks" type="search" placeholder="Search checks or sources" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <select aria-label="Filter by reported result" value={filter} onChange={e=>setFilter(e.target.value)}><option value="All">All results</option>{states.map(s=><option key={s}>{s}</option>)}</select>
    </div>
    <div className="vs-columns" aria-hidden="true"><span>Control</span><span>Domain</span><span>{staleReason?'Last-known result':'Result'}</span><span>Inspect</span></div>
    {filtered.map(c=><button className="vs-row" aria-describedby="vs-freshness" key={c.id} aria-pressed={c.id===id} data-check={c.id} onClick={e=>inspect(c,e.currentTarget)}>
      <b>{c.control}</b><span>{domainOf(c.id)}</span>{result(c)}<ChevronRight size={15}/></button>)}
    {!filtered.length && <p>{checks.length?'No checks match these filters.':empty}</p>}</section>
    <details className="vs-history"><summary><FolderOpen size={16}/> HISTORICAL EXPERIMENT / DEMONSTRATION — NOT LIVE TELEMETRY</summary>
      <p>The authored policy scenario compares compliant and privileged pod specifications. An observed admission decision requires an execution record.</p>
      <code>k8s/policies/tests/run-policy-tests.ps1</code>
      <p>Saved Trivy and Cosign files are historical artifact evidence. Current deployment verification uses the Kubernetes observations above.</p></details>
  </div>;
}
