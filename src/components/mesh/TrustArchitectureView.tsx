import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ChevronDown, CheckCircle2, Layers, Lock, RefreshCw, X } from 'lucide-react';
import { useSource } from '../../hooks/useCommandSources';
import { requestSecurityNetwork, snapshotAgeReason } from '../../utils/securityNetwork';
import { requestSecurityVerification } from '../../utils/securityVerification';
import { SnapshotTime } from '../SnapshotTime';
import { ArchitectureScene, serverScope } from './ArchitectureScene';
import { Checks, labels, MeshPolicies, networkEndpoint, PodEvidence, podTitle, Policies, verificationEndpoint } from './NetworkEvidence';

export function TrustArchitectureView() {
  const network = useSource(requestSecurityNetwork,snapshotAgeReason);
  const verification = useSource(requestSecurityVerification,snapshotAgeReason);
  const data = network.data;
  const { pods, policies, auth, ports, matchesSource } = serverScope(data);
  const checks = verification.data?.checks.filter(c => /^(calico|istio)-/.test(c.id)) ?? [];
  const [selected,setSelected] = useState<string|null>(null);
  const trigger = useRef<HTMLButtonElement|null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const refreshButton = useRef<HTMLButtonElement>(null);
  const evidence = useRef<HTMLDivElement>(null);
  const pod = pods.find(p => p.name===selected);
  const isCalico = selected==='calico', isIstio = selected==='istio';
  const isVerifier = pod && podTitle(pod)==='SPIFFE verifier';
  const related = (verification.data?.checks ?? []).filter(check => {
    if (isCalico) return check.id.startsWith('calico-');
    if (isIstio) return check.id.startsWith('istio-');
    if (!pod) return false;
    if (isVerifier) return ['spire-workload-registration','workload-lifecycle-and-identity'].includes(check.id);
    if (podTitle(pod)==='Integration server') return checks.includes(check);
    return check.id==='istio-sidecar-injection-posture';
  });
  function close() {
    setSelected(null);
    const target = trigger.current?.isConnected ? trigger.current : refreshButton.current;
    target?.focus();
  }
  useEffect(() => {
    if (!selected) return;
    closeButton.current?.focus();
    const escape = (event:KeyboardEvent) => { if (event.key==='Escape') close(); };
    document.addEventListener('keydown',escape);
    return () => document.removeEventListener('keydown',escape);
  }, [selected]);
  function openEvidence(id:string) {
    const section = evidence.current?.querySelector<HTMLDetailsElement>('#ns-'+id);
    if (!section) return;
    setSelected(null);
    section.open = true;
    section.querySelector('summary')?.focus();
    section.scrollIntoView({block:'start'});
  }
  const networkState = network.staleReason ?? (network.isLoading?'Collecting':network.error || !data?.available?'Unavailable':
    [data.workloadsAvailable,data.networkPoliciesAvailable,data.peerAuthenticationsAvailable,data.istiod.available,data.namespaceInjection.available].every(Boolean)?'Fresh snapshot':'Partial snapshot');
  const freshness = network.staleReason ? (network.isLoading ? 'Refreshing' : network.error ? 'Last-known' :
    network.staleReason.includes('stale') ? 'Stale' : network.staleReason.includes('aging') ? 'Aging' : 'Clock skew') : networkState;
  const verificationState = verification.staleReason ?? (verification.isLoading?'Collecting':verification.error?'Unavailable':'Collected');
  const inventory = data?.available && data.networkPoliciesAvailable;
  const selectors = [...new Set(policies.map(p=>labels(p.podSelector.matchLabels)||'All namespace Pods'))];
  const peerLabels = policies.flatMap(p => p.ingress.flatMap(rule => rule.from.flatMap(peer =>
    !peer.namespaceSelector && peer.podSelector ? [labels(peer.podSelector.matchLabels ?? {}) || 'All namespace Pods'] : [])));
  const sourceMatch = pod ? matchesSource(pod) : null;
  const facts: [string,string][] = isCalico ? [
    ['Server policies',inventory ? String(policies.length) : 'Unknown'],
    ['Target selector',selectors.join(' / ') || 'Scope unconfirmed'],
    ...(peerLabels.length ? [['Ingress source', [...new Set(peerLabels)].join(' OR ')]] as [string,string][] : []),
    ['Ingress ports',ports.join(', ') || 'See policy rules']
  ] : isIstio ? [
    ['Configured mode',auth.map(p=>p.mode).join(', ') || 'Unknown'],
    ['Target selector',auth.map(p=>labels(p.selector.matchLabels)||'Namespace scope').join(' / ') || 'Scope unconfirmed'],
    ['Control plane',data?.available && data.istiod.available ? data.istiod.ready?'Ready':'Not ready' : 'Unknown']
  ] : pod ? [
    ['Phase',pod.phase==='Succeeded'?'Succeeded · completed':pod.phase],
    ['Istio sidecar',pod.sidecar.present ? (pod.sidecar.ready?'Present · ready':'Present · not ready') : 'Absent'],
    ...(pod.labels.role ? [['Role',pod.labels.role],['Ingress source',sourceMatch === null ? 'Unknown' :
      sourceMatch ? 'Matches configured labels' : 'No matching ingress allowance.']] as [string,string][] : [])
  ] : [];
  const policyBody = <Policies items={data?.available ? data.networkPolicies : []} available={!!inventory}/>;
  const meshBody = <MeshPolicies data={data}/>;
  const groups = [
    {id:'isolation',icon:Layers,title:'Network isolation',summary:inventory ? data!.networkPolicies.length+' NetworkPolicies' : 'Unknown',
      body:<><p>Ingress allowances from all policies selecting a Pod are additive. An empty ingress list contributes no allowed sources.</p>
        {data?.networkPoliciesError && <p>{data.networkPoliciesError}</p>}{policyBody}</>},
    {id:'mtls',icon:Lock,title:'mTLS and sidecars',summary:data?.available && data.workloadsAvailable ?
      pods.filter(p=>p.sidecar.present).length+' of '+pods.length+' Pods report sidecars':'Unknown',
      body:<>{meshBody}<p>{data?.peerAuthenticationsError}</p>
        <p><strong>Istio control plane</strong> · {data?.available && data.istiod.available ?
          `${data.istiod.name} · ${data.istiod.ready?'ready':'not ready'} · ${data.istiod.readyReplicas ?? '?'}/${data.istiod.desiredReplicas ?? '?'} replicas in ${data.istioSystemNamespace}` : data?.istiod.error || 'Readiness unknown'}</p>
        <p>Namespace injection label · {data?.available && data.namespaceInjection.available ? data.namespaceInjection.labelValue ?? 'Unset':'Unknown'}</p>
        <div className="ns-pod-list">{pods.map(p=><details key={p.name}><summary>{podTitle(p)} <span>{p.phase} · {p.sidecar.present?'sidecar present':'no sidecar'}</span></summary><PodEvidence pod={p}/></details>)}</div>
        {!pods.length && <p>{data?.workloadsError || 'No Pod observations available.'}</p>}</>},
    {id:'verification',icon:CheckCircle2,title:'Automated verification',summary:checks.length ?
      ['PASS','FAIL','UNKNOWN'].map(s=>[checks.filter(c=>c.status===s).length,s]).filter(([n])=>n).map(v=>v.join(' ')).join(' · ') : 'Unknown',
      body:<>{verification.error && <p>{verification.error}</p>}<Checks items={checks}/></>}
  ];
  return <div className="network-studio">
    <header className="ns-heading">
      <div><h1>Trust Architecture</h1><p>Network Isolation &amp; Mutual TLS</p></div>
      <div className="ns-status" role="status">
        <span><small>Cluster</small>{data?.cluster ?? 'Awaiting evidence'}</span>
        <span><small>Namespace</small>{data?.namespace ?? 'Awaiting evidence'}</span>
        <span title={network.error || data?.error || undefined}><small>Collected · <em title={networkState} className={network.staleReason || !data?.available?'ns-aging':''}>{freshness}</em></small><SnapshotTime value={data?.collectedAt}/></span>
      </div>
      <button ref={refreshButton} onClick={()=>{network.refresh();verification.refresh();}} disabled={network.isLoading || verification.isLoading}><RefreshCw size={14}/> Refresh</button>
    </header>
    <div className={'ns-workspace'+(selected?' ns-docked':'')}>
      <ArchitectureScene data={data} selected={selected} inspect={(id,el)=>{trigger.current=el;setSelected(id);}}/>
      {selected && <aside id="ns-dock" className="ns-inspector" aria-labelledby="ns-resource-title">
        <header><div><small>{isCalico?'NetworkPolicy':isIstio?'PeerAuthentication':'Kubernetes Pod'}</small>
          <h2 id="ns-resource-title">{isCalico?'Calico ingress':isIstio?'Istio mTLS':pod?podTitle(pod):'Pod unavailable'}</h2></div>
          <button aria-label="Close inspector" ref={closeButton} onClick={close}><X size={16}/></button></header>
        <div className="ns-inspector-body" key={selected} tabIndex={0} role="region" aria-label="Resource facts and verification evidence">
          {pod && <code>{pod.name}</code>}
          <dl>{facts.map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
          <h3>Related verification</h3>
          {verificationState!=='Collected' && <small>{verificationState}</small>}
          <Checks items={related}/>
          <details className="ns-resource-detail"><summary>Resource evidence</summary>
            {isCalico?<Policies items={policies} available={!!inventory}/>:isIstio?meshBody:pod?<PodEvidence pod={pod}/>:<p>Pod absent from snapshot.</p>}
            {isVerifier && <p>SPIRE registration alone cannot establish current SVID validity.</p>}
          </details>
          <small>{networkEndpoint} · <SnapshotTime value={data?.collectedAt}/></small>

        </div>
        <button className="ns-detail-link" onClick={()=>openEvidence(isCalico?'isolation':'mtls')}>View detailed evidence <ArrowDownRight size={15}/></button>
      </aside>}
    </div>
    <div className="ns-evidence" ref={evidence}><h2>Security evidence</h2>
      {groups.map(g=><details key={g.id} id={'ns-'+g.id}><summary><g.icon size={17}/><b>{g.title}</b>
        <span>{g.id==='verification' && verification.staleReason?'Last-known · ':''}{g.summary}</span><ChevronDown size={15}/></summary>
        <div className="ns-detail">{g.body}<small>{g.id==='verification'?verificationEndpoint:networkEndpoint} · <SnapshotTime value={g.id==='verification'?verification.data?.collectedAt:data?.collectedAt}/> · {g.id==='verification'?verificationState:networkState}</small></div>
      </details>)}
    </div>
  </div>;
}
