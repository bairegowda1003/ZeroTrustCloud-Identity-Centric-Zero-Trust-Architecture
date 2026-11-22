import React, {useState} from 'react';
import { RefreshCw, Network, Fingerprint, Boxes, KeyRound } from 'lucide-react';
import { useSource, type Observation } from '../../hooks/useCommandSources';
import * as identity from '../../utils/identityWorkloads';
import * as verification from '../../utils/securityVerification';
import { identityRelationships, registrationMatch, replicaReadiness } from '../../utils/identityFabric';
import { CheckEvidence, EvidenceFields, RawEvidence } from './IdentityCheckEvidence';
import { IdentityFabric, type FabricPick } from './IdentityFabric';
import { SnapshotTime } from '../SnapshotTime';

function state<T extends object>(feed: Observation<T>) {
  if (feed.staleReason) return 'Last known · '+feed.staleReason;
  if (feed.isLoading) return 'Collecting';
  if (feed.error || !feed.data || ('available' in feed.data && feed.data.available === false)) return 'Unavailable';
  return 'Collected';
}

export function LiveIdentityStatus() {
  const inventory=useSource(identity.requestIdentityWorkloads,identity.snapshotAgeReason);
  const verificationFeed=useSource(verification.requestSecurityVerification,verification.snapshotAgeReason);
  return <IdentityEvidence inventory={inventory} verificationFeed={verificationFeed}/>;
}

export function IdentityEvidence({inventory, verificationFeed}: {
  inventory: Observation<identity.LiveIdentityWorkloadsResponse>;
  verificationFeed: Observation<verification.LiveSecurityVerificationResponse>;
}) {
  const [pick,setPick]=useState<FabricPick|null>(null);
  const data=inventory.data;
  const observed=data?.available;
  const {pods,accounts}=data?identityRelationships(data):{pods:[],accounts:[]};
  const checks=verificationFeed.data?.checks.filter(c=>(c.id.startsWith('spire-') || c.id.startsWith('workload-')) && c.source.split(' / ')[0]===data?.cluster) ?? [];
  const verificationState=state(verificationFeed);
  const reg=data?.spireRegistration;
  return <article className="identity-fabric">
    <header className="if-heading">
      <div className="if-heading-title"><h1>Workload Identity</h1><span className="if-eyebrow">Identity Access Studio</span></div>
      <div className="if-context"><Network size={15}/><strong>{data?.cluster ?? 'Kubernetes identity API'}</strong>{data && <span>{data.namespace}</span>}
        {observed && <><span>{pods.length} workloads</span><span>{accounts.filter(a=>a.discovered).length} discovered ServiceAccounts</span></>}
        <span role="status">{state(inventory)}</span></div>
      <button className="if-refresh" disabled={inventory.isLoading||verificationFeed.isLoading} onClick={()=>{inventory.refresh();verificationFeed.refresh()}}><RefreshCw size={14}/> Refresh evidence</button>
    </header>
    {(inventory.error || data?.error) && <p className="if-error" role="alert">{inventory.error || data?.error}</p>}
    {data && observed ? <IdentityFabric pick={pick} onPick={setPick} data={data} freshness={state(inventory)} checks={checks} sidecarCheck={verificationFeed.data?.checks.find(c=>c.id==='istio-sidecar-injection-posture' && c.source.split(' / ')[0]===data.cluster)} verificationState={verificationState} verificationTime={verificationFeed.data?.collectedAt}/> :
      <section className="if-empty">{inventory.isLoading?'Collecting workload and ServiceAccount evidence…':'Identity inventory unavailable. Refresh to retry.'}</section>}
    <p className="if-provenance">Kubernetes reports the assignments. SPIRE selectors describe configured registration. Configured registration does not prove an issued SVID is currently valid. SPIRE is independent of Istio's configured certificate authority.</p>
    {data && <>
      {observed && <section className="if-section" id="if-explorer" tabIndex={-1}><h2><Boxes/> Workload Identity Explorer</h2><small>/api/identity/workloads · {state(inventory)} · <SnapshotTime value={data.collectedAt}/></small>
      <div className="if-table-head"><span>Workload</span><span>Assigned ServiceAccount</span><span>Lifecycle</span><span>Containers</span><span>SPIRE scope</span></div>
      {pods.map(p=>{const match=registrationMatch(data,p);
        return <details className="if-row" key={p.name} data-selected={pick?.kind==='pod' && pick.name===p.name}><summary><strong>{p.name}</strong>
          <span>{p.serviceAccountName}</span><span>{p.phase}</span><span>{p.readyContainers}/{p.totalContainers} ready</span><span>{match===undefined?'Unknown':match?'Matched':'Outside scope'}</span></summary>
          <dl><dt>Namespace</dt><dd>{data.namespace}</dd><dt>Reported labels</dt><dd><EvidenceFields value={p.labels}/></dd><dt>Source</dt><dd>/api/identity/workloads · <SnapshotTime value={data.collectedAt}/></dd></dl>
          <button className="if-jump" onClick={()=>{setPick({kind:'pod',name:p.name});document.querySelector('.if-stage')?.scrollIntoView({block:'center'})}}>Inspect workload in studio ↗</button></details>})}
      {!pods.length && <p>No workloads reported in this namespace.</p>}
      <details className="if-disclosure"><summary><KeyRound size={15}/> ServiceAccount inventory</summary>
        {accounts.map(a=><div key={a.name} className="if-account-row" data-selected={pick?.kind==='account' && pick.name===a.name}><button className="if-account-link" onClick={()=>{
          setPick({kind:'account',name:a.name});
          document.querySelector('.if-stage')?.scrollIntoView({block:'center'});
        }}>{a.name}</button><span>{a.isDefault?'Default':'Named'} · {a.discovered?'Discovered':'Referenced only'}</span>
        <small>{a.pods.map(p=>p.name).join(', ') || 'No reported assignments'}</small></div>)}{!accounts.length&&<p>No accounts reported.</p>}</details></section>}
      <section className="if-section" aria-label="SPIRE evidence" id="if-spire-section" tabIndex={-1}><h2><Fingerprint/> SPIRE infrastructure</h2>
        <small>/api/identity/workloads · {state(inventory)} · <SnapshotTime value={data.collectedAt}/></small>
        <div className="if-spire"><div><h3>ClusterSPIFFEID registration</h3><p>{reg?.available?reg.name:reg?.error || 'Registration unavailable'}</p>
        {reg?.available && <details><summary>Template, scope and statistics</summary><code>{reg.spiffeIDTemplate ?? 'Template unavailable'}</code><EvidenceFields value={{namespaceSelector:reg.namespaceSelector,podSelector:reg.podSelector,statistics:reg.statistics}}/><RawEvidence value={reg}/></details>}</div>
        <div><h3>Infrastructure readiness</h3>{data.spireComponents.map(c=><div className="if-component" key={c.name}><Boxes size={16} aria-hidden="true"/><span>{c.name}<small>{c.kind}</small></span><strong>{replicaReadiness(c)}</strong>{c.error&&<small>{c.error}</small>}</div>)}{!data.spireComponents.length && <p>No components reported.</p>}</div></div></section>
    </>}
    <section className="if-section if-verification"><h2>Identity verification</h2><small>/api/security/verification · {verificationState} · <SnapshotTime value={verificationFeed.data?.collectedAt}/></small>
      {verificationFeed.error && <p role="alert">{verificationFeed.error}</p>}<CheckEvidence checks={checks}/>{!checks.length && <p>No identity checks available for this cluster.</p>}</section>
  </article>;
}
