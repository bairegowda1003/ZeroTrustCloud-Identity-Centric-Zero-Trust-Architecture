import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, RefreshCw, X } from 'lucide-react';
import { LiveKubernetesStatus } from './LiveKubernetesStatus';
import { LiveVerificationCard } from './verification/LiveVerificationCard';
import { DemoNotice } from './DemoNotice';
import { SnapshotTime } from './SnapshotTime';
import { SecurityTopology } from './SecurityTopology';
import { useCommandSources } from '../hooks/useCommandSources';
import { positionResourceInspector } from '../utils/positionResourceInspector';
import { topologyNodes } from '../utils/commandTopology';
import type { ActiveModule } from '../types/security';

const routeName: Partial<Record<ActiveModule,string>> = {
  service_mesh:'Trust Architecture', policy_governance:'Policies', workload_identity:'Identity', experiments:'Audit & Observability',
};
const documented: Record<string,string> = {
  gate:'Expected constraints: trustmesh-container-security, trustmesh-require-dedicated-sa and trustmesh-workload-hardening.',
  pods:'Expected roles: authorized client, unauthorized client, server, plaintext negative-test client and SPIFFE verifier.',
  spire:'Registration describes the workload selector and identity template. Certificate validity requires separate evidence.',
  istio:'PeerAuthentication describes configured mTLS scope. Traffic test results require separate evidence.',
};
export function CommandCenterHero({onViewAllFindings,onNavigate}: {onViewAllFindings:()=>void;onNavigate:(route:ActiveModule)=>void}) {
  const sources=useCommandSources();
  const nodes=topologyNodes(sources);
  const [selected,setSelected]=useState('fabric');
  const [inspecting,setInspecting]=useState(false);
  const inspector=useRef<HTMLDialogElement>(null);
  const trigger=useRef<HTMLElement | SVGElement | null>(null);
  function inspect(id:string) {
    trigger.current=document.activeElement as HTMLElement | SVGElement;
    setSelected(id);
    setInspecting(true);
  }
  useEffect(()=>{
    if (!inspecting) return;
    const panel=inspector.current;
    if (!panel || !panel.parentElement) return;
    const stage = panel.parentElement;
    panel.show();
    const position = () => positionResourceInspector(panel, selected);
    position();
    const resized = new ResizeObserver(position);
    resized.observe(stage);
    const map=stage.querySelector('.tm-map');
    if(map) resized.observe(map);
    document.addEventListener('scroll',position,true);
    stage.addEventListener('transitionend',position);
    window.addEventListener('resize',position);

    panel?.querySelector('button')?.focus({preventScroll:true});
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape') setInspecting(false)};
    document.addEventListener('keydown',escape);
    return ()=>{
      resized.disconnect();
      document.removeEventListener('scroll',position,true);
      stage.removeEventListener('transitionend',position);
      window.removeEventListener('resize',position);
      document.removeEventListener('keydown',escape);
      panel?.close();
      if(trigger.current?.isConnected) trigger.current.focus({preventScroll:true});
    };
  },[inspecting,selected]);
  const current=nodes.find(n=>n.id===selected)!;
  const feeds=Object.values(sources);
  const loading=feeds.some(s=>s.isLoading);
  const freshness=feeds.some(s=>s.staleReason)?'Last known snapshots':loading?'Collecting snapshots':
    feeds.every(s=>!s.data || ('available' in s.data && !s.data.available))?'Sources unavailable':feeds.some(s=>!s.data || ('available' in s.data && !s.data.available))?'Partial coverage':'Currently reported';
  const verification=sources.verification;
  const outcomes = (['PASS','FAIL','UNKNOWN'] as const)
    .map(status => ({status, count:current.checks.filter(check => check.status === status).length}))
    .filter(outcome => outcome.count > 0)
    .map(({count,status}) => count+' '+status)
    .join(' / ');
  return <article className="command-overview tm-console">
    <div className="tm-first-screen">
    <header className="tm-command-head"><div className="tm-title-lockup"><h1>Zero Trust Command Center</h1></div>
      <div className="tm-refresh"><details className="tm-sources"><summary aria-label={'Data freshness: '+freshness} title="Data freshness"><span>{freshness}</span></summary>
        <dl>{Object.entries(sources).map(([name,feed])=><React.Fragment key={name}><dt>{name}</dt><dd><SnapshotTime value={feed.data?.collectedAt} fallback="No snapshot"/><small>{[feed.staleReason, feed.error || (feed.data && 'error' in feed.data && feed.data.error)].filter(Boolean).join(' / ')}</small></dd></React.Fragment>)}</dl>
      </details><button disabled={loading} onClick={()=>feeds.forEach(s=>s.refresh())}><RefreshCw size={14}/> Refresh</button></div>
      <div className="tm-instruments" aria-label="Environment observations">{nodes.slice(0,2).map(n=>{
          const cluster=sources.cluster.data?.clusters.find(c=>c.context===n.context);
          const readiness=!cluster?n.state:!cluster.connected?'Unreachable':cluster.nodes.length===0?'Unknown':
            cluster.nodes.every(node=>node.ready)?'Ready':'Not ready';
          return <button className="tm-cluster" data-readiness={n.state==='Stale'?'Last known':readiness} key={n.id} onClick={()=>inspect(n.id)}>
            <b>{n.id==='admission'?'Gatekeeper cluster':'Network cluster'}</b><span>{n.state==='Stale'?'Last known / ':''}{readiness}</span></button>;
        })}
        <div className="tm-verdict-instrument"><small>{verification.staleReason?'Last known verification':verification.isLoading?'Collecting checks':verification.error?'Verification unavailable':'Verification'}</small>
          <div className="tm-totals">{(['PASS','FAIL','UNKNOWN'] as const).map(status=><div key={status}><strong>{verification.data?.checks.filter(c=>c.status===status).length ?? '—'}</strong><span>{status}</span></div>)}</div>
        </div>
      </div>
    </header>
    <div className="tm-composition tm-panorama">
      <SecurityTopology nodes={nodes} selected={selected} onSelect={inspect} onReset={()=>{setSelected('fabric');setInspecting(false)}}/>

      <dialog className="tm-inspect tm-floating-inspector" ref={inspector} aria-labelledby="tm-resource-name">
          <button className="tm-dismiss" aria-label="Close resource inspector" onClick={()=>setInspecting(false)}><X size={16}/></button>
          <div className="tm-resource-identity"><h3 id="tm-resource-name">{current.label}</h3>
          <p>{current.securityFunction}</p><b>{current.state==='Stale'?'Last known':current.state}</b></div>
          <div className="tm-resource-body" key={current.id}>
            <div className="tm-overview-summary">
              <p className="tm-security-summary">{current.summary}</p>
              {outcomes && <p className="tm-resource-outcomes">
                {verification.staleReason?'Last known verification':'Verification'} &middot; {outcomes}
              </p>}
            </div>
            <details className="tm-related"><summary>Detailed evidence</summary>
              <h4>Resource evidence</h4>
              <p>{current.context}</p><code>{current.source}</code><SnapshotTime value={current.time} fallback="No collection timestamp"/>
              {current.reason && <p>{current.reason}</p>}
              <ul>{current.evidence.map((line,i)=><li key={i}>{line}</li>)}</ul>
              {current.records != null && <details><summary>Exact API values</summary><pre>{JSON.stringify(current.records,null,2)}</pre></details>}
              {documented[current.id] && <p>Architecture reference &middot; {documented[current.id]}</p>}
              {current.checks.length>0 && <details className="tm-related"><summary>Related checks ({current.checks.length})</summary>
                <code>/api/security/verification</code><SnapshotTime value={verification.data?.collectedAt}/><p>{verification.staleReason}</p>
                {current.checks.map(check=><div key={check.id} className="tm-check-record"><strong>{check.status} &middot; {check.control}</strong><p>{check.reason}</p><code>{check.source}</code><SnapshotTime value={check.observedAt}/><pre>{JSON.stringify(check.evidence,null,2)}</pre></div>)}
              </details>}
            </details>
          </div><button className="tm-resource-nav" onClick={()=>onNavigate(current.route)}>Open {routeName[current.route]} <ArrowUpRight size={14}/></button>
      </dialog>
    </div>
    </div>
    <div className="tm-evidence tm-explorers"><section aria-label="Workload explorer">
      <LiveKubernetesStatus source={sources.cluster} identity={sources.identity} network={sources.network}/></section>
      <section aria-label="Verification explorer"><LiveVerificationCard source={verification}/>
      <button className="tm-audit-link" onClick={()=>onNavigate('experiments')}>Audit &amp; Observability <ArrowUpRight size={14}/></button></section></div>
    <details className="tm-examples"><summary>Demonstration workspace</summary><DemoNotice>Findings in this workspace are examples.</DemoNotice><button onClick={onViewAllFindings}>Explore demo findings <ArrowUpRight size={14}/></button></details>
  </article>;
}
