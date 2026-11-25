import React, { useEffect, useRef, useState } from 'react';
import { Fingerprint, GitBranch } from 'lucide-react';
import type { LiveSecurityNetworkResponse as Snapshot, LiveSecurityNetworkWorkload as Pod } from '../../utils/securityNetwork';
import { labels, podTitle } from './NetworkEvidence';
import { BoundaryMaterial } from './BoundaryMaterial';

export function serverScope(data: Snapshot | null) {
  const pods = data?.available && data.workloadsAvailable ? data.workloads : [];
  const targets = pods.filter(p => podTitle(p) === 'Integration server');
  const matchesTarget = (selector: Record<string,string>) =>
    targets.some(p => Object.entries(selector).every(([k,v]) => p.labels[k] === v));
  const policies = data?.available && data.networkPoliciesAvailable ? data.networkPolicies.filter(p =>
    p.policyTypes.includes('Ingress') && matchesTarget(p.podSelector.matchLabels)) : [];
  const auth = data?.available && data.peerAuthenticationsAvailable ? data.peerAuthentications.filter(p =>
    matchesTarget(p.selector.matchLabels)) : [];
  const ports = [...new Set(policies.flatMap(p => p.ingress.flatMap(r => r.ports.map(v => v.protocol+'/'+(v.port ?? 'any')))))];
  // Namespace labels and IP blocks are outside the network snapshot.
  function matchesSource(pod: Pod): boolean | null {
    if (!policies.length) return null;
    let unresolved = false;
    for (const policy of policies) {
      for (const rule of policy.ingress) {
        if (!rule.from.length) return true;
        for (const peer of rule.from) {
          const sourceLabels = peer.podSelector?.matchLabels ?? {};
          if (!Object.entries(sourceLabels).every(([k,v]) => pod.labels[k] === v)) continue;
          if (peer.namespaceSelector && Object.keys(peer.namespaceSelector.matchLabels ?? {}).length) {
            unresolved = true;
          } else if (peer.podSelector || peer.namespaceSelector) {
            return true;
          } else {
            unresolved = true;
          }
        }
      }
    }
    return unresolved ? null : false;
  }
  return { pods, targets, policies, auth, ports, matchesSource };
}

function OriginMaterial() {
  return <svg viewBox="0 0 64 56" aria-hidden="true">
    <path d="m3 35 24-12 33 10-23 14Z" fill="#395368" opacity=".5"/>
    {[25,17].map(y=><g key={y} transform={`translate(5 ${y})`}>
      <path d="m0 0 20-10 31 8-20 11Z" fill="#8ba4b4" stroke="#c5d3d9" strokeWidth=".7"/>
      <path d="m0 0 31 9v7L0 8Z" fill="#526c7c"/><path d="m31 9 20-11v8L31 16Z" fill="#2d4558"/>
      <path d="m5 5 13 4" stroke="#b1c8d0"/><path d="m24 10 3 1" stroke="#9cd4c9"/>
    </g>)}
  </svg>;
}

type SceneProps = { data: Snapshot|null; selected: string|null; inspect: (key:string, el:HTMLButtonElement)=>void };

export function ArchitectureScene({data, selected, inspect}: SceneProps) {
  const { pods, targets, policies, auth, ports, matchesSource } = serverScope(data);
  const clients = pods.filter(p => !['Integration server','SPIFFE verifier'].includes(podTitle(p)))
    .sort((a,b) => podTitle(a).localeCompare(podTitle(b)));
  const verifiers = pods.filter(p => podTitle(p) === 'SPIFFE verifier');
  const stage = useRef<HTMLDivElement>(null);
  function relationship(pod: Pod) {
    const match = matchesSource(pod);
    if (match === null) return undefined;
    if (!match) return 'unmatched';
    return podTitle(pod) === 'Plaintext client' ? 'plaintext' : 'matched';
  }
  const [paths,setPaths] = useState<{key:string; kind:string; d:string; endX:number; endY:number}[]>([]);
  useEffect(() => {
    const map = stage.current;
    if (!map) return;
    function draw() {
      const material = map?.querySelector('.ns-material');
      if (!map || !material) return;
      const bounds = map.getBoundingClientRect();
      const art = material.getBoundingClientRect();
      const endX = art.x - bounds.x + art.width*118/650;
      const lines = Array.from(map.querySelectorAll<HTMLButtonElement>('[data-relationship]')).flatMap(el => {
        const kind = el.dataset.relationship!;
        // Separate contact points on the near-left face of the Calico perimeter.
        const contactY = kind === 'unmatched' ? 232 : kind === 'plaintext' ? 220 : 208;
        const endY = art.y - bounds.y + art.height*contactY/330;
        const row = el.getBoundingClientRect();
        const x = row.right - bounds.x, y = row.y + row.height*.5 - bounds.y;
        return endX > x ? [{key:el.dataset.node!,kind,endX,endY,d:`M${x} ${y} C${(x+endX)/2} ${y},${(x+endX)/2} ${endY},${endX} ${endY}`}] : [];
      });
      setPaths(lines);
    }
    const observer = new ResizeObserver(draw);
    observer.observe(map);
    draw();
    return () => observer.disconnect();
  }, [data]);

  const props = (key:string) => ({
    'data-node':key, 'aria-pressed':selected===key, 'aria-controls':selected===key?'ns-dock':undefined,
    onClick:(e:React.MouseEvent<HTMLButtonElement>) => inspect(key,e.currentTarget)
  });
  function activate(id:string) {
    const btn = Array.from(stage.current?.querySelectorAll<HTMLButtonElement>('[data-node]') ?? []).find(b=>b.dataset.node===id);
    if(btn) inspect(id,btn);
  }
  return <section className="ns-scene" aria-labelledby="ns-diagram">
    <h2 id="ns-diagram">Zero Trust workload boundary</h2>
    <div className="ns-map" ref={stage}>
      <svg className="ns-links" aria-hidden="true">{paths.map(p => {
        const active = selected === p.key || selected === 'calico';
        return <g key={p.key} data-client={p.key} className={'ns-path-'+p.kind}><path d={p.d} className={active ? 'ns-lit' : undefined}/>
          {p.kind === 'unmatched' && <circle className={active?'ns-contact active':'ns-contact'} cx={p.endX} cy={p.endY} r={active ? 3 : 2}/>}
          {active && p.kind !== 'unmatched' && <path key={selected} d={p.d} pathLength="1" className="ns-fiber"/>}
        </g>;
      })}</svg>
      <div className="ns-origins"><h3>Workload origins</h3>
        {clients.map(p=><button className="ns-origin" key={p.name} data-relationship={relationship(p)} {...props(p.name)}>
          <OriginMaterial/><span><b>{podTitle(p)}</b><small>{p.sidecar.present?'Istio sidecar':'No sidecar'}</small></span>
        </button>)}
        {!clients.length && <small>No clients reported</small>}
      </div>
      <div className="ns-island">
        <BoundaryMaterial ingress={!!policies.length} mtls={!!auth.length} server={!!targets.length}
          serverName={targets[0]?.name} selected={selected} activate={activate}/>
        <button className="ns-callout ns-calico" {...props('calico')}><b>Calico ingress</b>
          <small>{policies.length ? policies.length+' policies · '+(ports.join(', ') || 'see rules') : 'Scope unconfirmed'}</small></button>
        <button className="ns-callout ns-istio" {...props('istio')}><b>Istio mTLS</b>
          <small>{auth.length ? [...new Set(auth.map(p=>p.mode))].join(', ') : 'Scope unconfirmed'}</small>
          {auth.length>0 && <code>{[...new Set(auth.map(p=>labels(p.selector.matchLabels)||'Namespace scope'))].join(' / ')}</code>}</button>
        <div className="ns-target">{targets.map(p=><button key={p.name} className="ns-callout" {...props(p.name)}>
          <b>Integration server</b><small>{p.phase} · {p.sidecar.present?'sidecar present':'no sidecar'}</small></button>)}
          {!targets.length && <small>No server reported</small>}</div>
      </div>
    </div>
    <footer><span><GitBranch size={14}/> Connections illustrate configured architecture, not observed network traffic.</span>
      {verifiers.map(p=><button key={p.name} {...props(p.name)}><Fingerprint size={15}/> SPIFFE verifier · {p.phase}</button>)}</footer>
  </section>;
}
