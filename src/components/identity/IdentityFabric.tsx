import React, {useEffect, useRef, useState} from 'react';
import { ArrowUpRight, Boxes, Check, CircuitBoard, Diamond, Fingerprint, KeyRound, X } from 'lucide-react';
import type { LiveIdentityWorkloadsResponse } from '../../utils/identityWorkloads';
import { identityRelationships, registrationMatch, replicaReadiness } from '../../utils/identityFabric';
import type { VerificationCheck } from '../../utils/securityVerification';
import { CheckEvidence, EvidenceFields, RawEvidence } from './IdentityCheckEvidence';
import { IdentityChamber, RegistrationSeal } from './IdentityChamber';
import { SnapshotTime } from '../SnapshotTime';

export type FabricPick = {kind: 'pod' | 'account' | 'registration'; name: string};
interface Props {
  data: LiveIdentityWorkloadsResponse;
  freshness: string;
  checks: VerificationCheck[];
  sidecarCheck?: VerificationCheck;
  verificationState: string;
  verificationTime?: string;
  pick?: FabricPick|null;
  onPick?: (pick: FabricPick|null)=>void;
}

export function IdentityFabric({data, freshness, checks, sidecarCheck, verificationState, verificationTime, pick=null, onPick}: Props) {
  const {pods,accounts,selectedPods} = identityRelationships(data);
  const reg = data.spireRegistration;
  const pod = pick?.kind==='pod' ? pods.find(p=>p.name===pick.name) : undefined;
  const account = pick?.kind==='account' ? accounts.find(a=>a.name===pick.name) : undefined;
  const isReg = pick?.kind==='registration' && reg.available && pick.name===reg.name;
  const hasSelection = !!(pod || account || isReg);
  const [lastAccount,setLastAccount] = useState('');
  const requested = account?.name ?? pod?.serviceAccountName;
  useEffect(()=>{ if(requested) setLastAccount(requested) },[requested]);
  const focal = accounts.find(a=>a.name===(requested ?? lastAccount)) ??
    accounts.reduce<typeof accounts[number]|undefined>((best,a)=>!best || a.pods.length>best.pods.length ? a : best,undefined);
  const trigger = useRef<HTMLElement|null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const close = ()=>{onPick?.(null);const origin=trigger.current;
    const target=origin?.isConnected ? origin : origin?.dataset.name ? document.querySelector<HTMLElement>('.studio-fleet [data-name="'+CSS.escape(origin.dataset.name)+'"]') : null;
    target?.focus({preventScroll:true})};
  useEffect(()=>{
    if(!hasSelection) return;
    if(document.activeElement instanceof HTMLButtonElement && document.activeElement!==closeButton.current) trigger.current=document.activeElement;
    closeButton.current?.focus({preventScroll:true});
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape') close()};
    document.addEventListener('keydown',escape);
    return ()=>document.removeEventListener('keydown',escape);
  },[pick,hasSelection,onPick]);
  const related=checks.filter(c=>isReg ? c.id.startsWith('spire-') : account ? c.id==='workload-service-accounts' :
    c.id==='workload-lifecycle-and-identity' || (pod && registrationMatch(data,pod) && c.id==='spire-workload-registration'));
  const prefix=data.namespace.split('-').slice(0,-1).join('-')+'-';
  const short=(name:string)=>prefix.length>1 && name.startsWith(prefix)?name.slice(prefix.length):name;
  const focused=isReg ? selectedPods : focal?.pods ?? [];
  const remaining=pods.filter(p=>!focused.includes(p));
  function scope(p: typeof pods[number]) {
    const match=registrationMatch(data,p);
    return match===undefined ? 'SPIRE scope unknown' : match ? 'SPIRE selector match' : 'Outside SPIRE selector';
  }
  const inventoryRecord=account ? data.serviceAccounts.find(a=>a.name===account.name) : undefined;
  const roleCheck=account && account.pods.length>1 ? sidecarCheck : undefined;
  const sidecarRoles=Object.entries(roleCheck?.evidence ?? {}).flatMap(([role,record])=>{
    if(!record || typeof record!=='object' || !('present' in record) || typeof record.present!=='boolean') return [];
    return [{role,present:record.present}];
  });
  const inspectorChecks=roleCheck ? [...related,roleCheck] : related;
  const scene=useRef<HTMLDivElement>(null);
  const [routes,setRoutes]=useState<Record<string,string>>({});
  useEffect(()=>{
    const stage=scene.current;
    if(!stage) return;
    const destination=stage.querySelector('.studio-port');
    if(!destination) {setRoutes({});return}
    const buttons=stage.querySelectorAll<HTMLButtonElement>('.studio-fleet button');
    const measure=()=>{
      const bounds=stage.getBoundingClientRect();
      const port=destination.getBoundingClientRect();
      const x=port.left-bounds.left, y=port.top+port.height/2-bounds.top;
      const paths:Record<string,string>={};
      buttons.forEach(button=>{
        const box=(button.querySelector('.studio-label') ?? button).getBoundingClientRect();
        const start=box.right-3-bounds.left, top=box.top+box.height/2-bounds.top;
        const bend=(x-start)*.48;
        paths[button.dataset.name!]=`M ${start} ${top} C ${start+bend} ${top}, ${x-bend} ${y}, ${x} ${y}`;
      });
      setRoutes(paths);
    };
    const observer=new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(destination);
    buttons.forEach(button=>observer.observe(button));
    stage.addEventListener('animationend',measure);
    measure();
    return ()=>{observer.disconnect(); stage.removeEventListener('animationend',measure)};
  },[data,isReg,focal?.name,hasSelection]);
  function workload(p: typeof pods[number], active:boolean) {
    const match=selectedPods.includes(p);
    return <button key={p.name} title={p.name} aria-label={p.name+', '+p.phase+' · '+p.readyContainers+'/'+p.totalContainers+' ready, '+p.serviceAccountName}
                data-name={p.name} data-active={active} aria-pressed={pod?.name===p.name}
                onClick={e=>{trigger.current=e.currentTarget;onPick?.({kind:'pod',name:p.name})}}>
                <span className="studio-cartridge" aria-hidden="true">{p.phase==='Succeeded'?<Check/>:<CircuitBoard/>}<i>{p.totalContainers}</i></span>
                <span className="studio-label"><strong>{short(p.name)}</strong><small>{p.phase} · {p.readyContainers}/{p.totalContainers} ready</small>
                  <span><KeyRound size={10}/>{short(p.serviceAccountName)} {match && <Diamond className="studio-match" size={10} aria-label="Configured selector match"/>}</span></span>
              </button>;
  }
  return <section className="if-stage studio" data-registration={isReg} aria-label="Identity Access Studio">
    <div className="studio-layout" data-inspecting={hasSelection}>
      <div className="studio-workspace">
        <header className="studio-bar"><span><Boxes size={16}/> Workload fleet</span>
          {reg.available ? <button className="studio-reg" aria-pressed={isReg} onClick={()=>onPick?.({kind:'registration',name:reg.name})}><Diamond size={13}/> SPIRE registration <b>{selectedPods.length} matched</b><ArrowUpRight size={13}/></button> : <small>Registration unavailable</small>}</header>
        <div className="studio-scene" ref={scene}>
          <svg className="studio-routes" aria-hidden="true">
            {focused.map(p=><g key={p.name} opacity={pod && pod.name!==p.name ? .36 : 1}>
              <path className="studio-route-bed" d={routes[p.name]}/>
              <path className={isReg?'studio-selector':'if-binding active'}
              data-binding={isReg?undefined:p.name} data-account={isReg?undefined:p.serviceAccountName}
              data-selector={isReg?p.name:undefined}
              d={routes[p.name]}/></g>)}
          </svg>
          <div className="studio-fleet">
            {focused.map(p=>workload(p,true))}
            {!focused.length && <p className="studio-no-assignments"><b>0</b><span>{isReg?'Confirmed selector matches':'No reported workload assignments'}</span></p>}
          </div>
          <div className="studio-chamber">
            {isReg ? <div className="studio-register"><RegistrationSeal/><small>Configured registration</small><strong>{short(reg.name)}</strong><span>{selectedPods.length} selector {selectedPods.length===1?'match':'matches'}</span></div> : focal ? <button className="studio-credential" onClick={()=>onPick?.({kind:'account',name:focal.name})} title={'Inspect '+focal.name}>
              <IdentityChamber key={focal.name} count={focal.pods.length}/><div className="studio-caption"><small>Selected ServiceAccount</small><strong>{short(focal.name)}</strong>
              <span>{focal.pods.length>1?'Shared identity · ':''}{focal.pods.length} assigned {focal.pods.length===1?'workload':'workloads'} <ArrowUpRight size={13}/></span></div>
            </button>:<p>No ServiceAccount reported.</p>}
          </div>
        </div>
        {remaining.length>0 && <section className="studio-shelf"><h3>Other workloads</h3><div className="studio-fleet">{remaining.map(p=>workload(p,false))}</div></section>}
        <nav className="studio-accounts" aria-label="Select ServiceAccount"><h3><Fingerprint size={15}/> ServiceAccounts</h3><div>
          {accounts.map(a=><button key={a.name} title={a.name} aria-label={a.name+', '+(a.isDefault?'Default':'Named')+' · '+a.pods.length+' assigned'}
            aria-pressed={!isReg && a===focal} data-name={a.name} onClick={()=>onPick?.({kind:'account',name:a.name})}><KeyRound size={12}/>{short(a.name)} <b>{a.pods.length}</b></button>)}</div></nav>
      </div>
      {hasSelection && <aside className="if-inspector" role="dialog" aria-labelledby="if-resource">
        <header><span>{pod?'Kubernetes workload':account?'ServiceAccount':'ClusterSPIFFEID'}</span><button ref={closeButton} aria-label="Close identity inspector" onClick={close}><X size={16}/></button></header>
        <div key={pick?.kind+'/'+pick?.name} className="if-inspect-body">
          <h3 id="if-resource">{pick?.name}</h3><small className="studio-ns">{data.namespace}</small>
          {account && <>
            <p className="studio-summary">{account.pods.length>1?'Shared ServiceAccount':account.pods.length?'Single workload assignment':'Unassigned ServiceAccount'} · {account.discovered?'Discovered':'Referenced only'}</p>
            <h4>Assigned workloads · {account.pods.length}</h4>
            {account.pods.length ? <ul className="studio-members">{account.pods.map(p=>
              <li key={p.name}><b>{p.name}</b><small>{p.phase} · {p.readyContainers}/{p.totalContainers} ready · {scope(p)}</small></li>)}</ul>
              : <p>No reported assignments in this namespace.</p>}
          </>}
          {pod && <>
            <h4>Assigned ServiceAccount</h4><strong className="studio-assigned">{pod.serviceAccountName}</strong>
            <p className="studio-summary">{pod.phase} · {pod.readyContainers}/{pod.totalContainers} containers ready</p>
            <p>{scope(pod)}</p>
            <details><summary>Workload labels</summary><EvidenceFields value={pod.labels}/></details>
          </>}
          {isReg && <>
            <h4>Configured selector matches · {selectedPods.length}</h4>
            <ul className="studio-members">{selectedPods.map(p=><li key={p.name}>{p.name}</li>)}</ul>
            {pods.some(p=>registrationMatch(data,p)===undefined) && <p>Some selector conditions cannot be evaluated from this snapshot.</p>}
            <h4>SPIFFE ID template</h4><code className="studio-template">{reg.spiffeIDTemplate ?? 'Unavailable'}</code>
            <details><summary>Selectors and infrastructure</summary>
              <EvidenceFields value={{namespaceSelector:reg.namespaceSelector,podSelector:reg.podSelector,statistics:reg.statistics}}/>
              {data.spireComponents.map(c=><p key={c.name}>{c.name} · {replicaReadiness(c)}</p>)}</details>
          </>}
          <p className="studio-interpretation">{isReg?'Selector matches describe configured registration. Current SVID validity requires separate evidence.':
            account && account.pods.length>1?'These workloads share a Kubernetes assignment. Network permissions require separate evidence.':
            'Kubernetes reports the workload assignment. Authorization requires separate evidence.'}</p>
          <details><summary>Automated verification · {inspectorChecks.length} {inspectorChecks.length===1?'check':'checks'}</summary>
            <code>/api/security/verification</code><p>{verificationState} · <SnapshotTime value={verificationTime}/></p>
            {roleCheck && <><h4>Reported sidecars by workload role</h4>
              {sidecarRoles.length ? <dl>{sidecarRoles.map(row=><React.Fragment key={row.role}><dt>{row.role}</dt><dd>{row.present?'Present':'Absent'}</dd></React.Fragment>)}</dl> : <p>Role-level sidecar status unavailable.</p>}</>}
            <CheckEvidence checks={inspectorChecks}/>{!inspectorChecks.length && <p>No related check reported.</p>}</details>
          <details><summary>Source and raw evidence</summary>
            <p>{data.cluster}</p><code>/api/identity/workloads</code><p>{freshness} · <SnapshotTime value={data.collectedAt}/></p>
            <RawEvidence value={isReg?reg:pod ?? {serviceAccount:inventoryRecord ?? null,workloads:account?.pods}}/>
          </details>
        </div>
        <button className="if-jump" onClick={()=>{
          const section=document.getElementById(isReg?'if-spire-section':'if-explorer');
          const detail=pod?section?.querySelector<HTMLDetailsElement>('.if-row[data-selected=true]'):account?section?.querySelector<HTMLDetailsElement>('.if-disclosure'):null;
          if(detail) detail.open=true;
          section?.focus({preventScroll:true});
          (detail ?? section)?.scrollIntoView({block:'start'});
        }}>View {isReg?'SPIRE infrastructure':'identity explorer'} ↗</button>
      </aside>}
    </div></section>;
}
