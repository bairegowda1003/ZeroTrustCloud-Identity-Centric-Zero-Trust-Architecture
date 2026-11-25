import { useState } from 'react';
import { fixedContexts, technologies, type Technology } from '../utils/labEvidence';

type Station = {id: Technology; x: number};
const policyStations: Station[] = [{id:'gatekeeper',x:85}];
const networkZones: {name:string; stations:Station[]}[] = [
  {name:'Network controls', stations:[{id:'calico',x:77},{id:'istio',x:163}]},
  {name:'Identity infrastructure', stations:[{id:'spire',x:298},{id:'workloads',x:384}]},
];
const helm = 'M0-5a5 5 0 1 1 0 10 5 5 0 1 1 0-10ZM0-7v7l5.5-4.4M0 0l6.8 1.6M0 0l3 6.3M0 0l-3 6.3M0 0l-6.8 1.6M0 0l-5.5-4.4';
// Equal-length plan axes at ±30 degrees; height travels straight up.
const axisX = 26, axisY = 15;
function point(u:number,v:number,z:number) { return [(u-v)*axisX,(u+v)*axisY-z]; }
function corners(u:number,v:number,w:number,d:number,z:number) {
  return [point(u,v,z),point(u+w,v,z),point(u+w,v+d,z),point(u,v+d,z)];
}
const points = (vertices:number[][]) => vertices.map(p=>p.join(',')).join(' ');
function Solid({u,v,w,d,z,h,part}: {u:number;v:number;w:number;d:number;z:number;h:number;part:string}) {
  const base=corners(u,v,w,d,z), top=corners(u,v,w,d,z+h);
  return <g className={part}><polygon className="face-left" points={points([top[3],top[2],base[2],base[3]])}/>
    <polygon className="face-right" points={points([top[2],top[1],base[1],base[2]])}/>
    <polygon className="face-top" points={points(top)}/></g>;
}

// All dimensions below are in the same plan coordinates as the deck.
function Machine({id}: {id: Technology}) {
  const block = (u:number,v:number,w:number,d:number,z:number,h:number) =>
    <Solid u={u} v={v} w={w} d={d} z={z} h={h} part="instrument"/>;
  switch (id) {
    case 'gatekeeper':
      return <>{block(-.42,-.17,.19,.34,3,19)}{block(.23,-.17,.19,.34,3,19)}
        {block(-.46,-.21,.92,.42,22,4)}</>;
    case 'istio': {
      const mast=point(.15,0,30), foot=point(.15,0,3);
      return <g className="instrument"><polygon className="face-left" points={points([mast,foot,point(-.48,0,3)])}/>
        <polygon className="face-top" points={points([mast,point(.19,0,6),point(.48,0,6)])}/></g>;
    }
    case 'calico':
      return <>{block(-.4,-.35,.24,.7,3,15)}{block(-.08,-.35,.24,.7,3,11)}{block(.24,-.35,.19,.7,3,7)}</>;
    case 'spire': {
      const base=corners(-.28,-.28,.56,.56,10), peak=point(0,0,33);
      return <g className="instrument">{block(-.28,-.28,.56,.56,3,7)}
        <polygon className="face-left" points={points([base[3],base[2],peak])}/>
        <polygon className="face-top" points={points([base[2],base[1],peak])}/></g>;
    }
    case 'workloads':
      return <>{block(-.40,-.28,.7,.22,3,16)}{block(-.26,.10,.7,.20,3,12)}
        <path className="credential-lines" d={'M'+point(-.17,.30,11)+'l8 4.6m-8-1.6 5 2.9'}/></>;
    default: return null;
  }
}

// A horizontal section through the isometric plan gives a long front fascia.
function Terrace({x,width,y,halfDepth,height,part}: {
  x:number; width:number; y:number; halfDepth:number; height:number; part:string;
}) {
  const rise=halfDepth*axisY/axisX;
  const rim=[[x,y],[x+halfDepth,y-rise],[x+width-halfDepth,y-rise],[x+width,y],
    [x+width-halfDepth,y+rise],[x+halfDepth,y+rise]];
  const lowered=(p:number[])=>[p[0],p[1]+height];
  return <g className={part}>
    {([[5,0,'face-left'],[4,5,'fascia'],[3,4,'face-right']] as const).map(([a,b,face])=>{
      const first=rim[a],second=rim[b];
      return <polygon key={face} className={face} points={points([first,second,lowered(second),lowered(first)])}/>;
    })}
    <polygon className="face-top" points={points(rim)}/>
  </g>;
}

export function LabBoundary({index, selected, onSelect, observation, constraints}: {
  index:0|1; selected:Technology; onSelect:(id:Technology)=>void; observation:(id:Technology)=>string;
  constraints?: number;
}) {
  const [focused,setFocused]=useState<Technology|null>(null);
  const width=index ? 460 : 280, height=174;
  const foundation:Technology=index?'networkNodes':'policyNodes';
  const modules=index?networkZones.flatMap(zone=>zone.stations):policyStations;
  const visibleLayers=Math.min(constraints ?? 0,6);
  function renderModule({id,x}:Station) {
    return <g key={id} className="lab-machine" data-technology={id} data-station={id}
      data-selected={selected===id} data-focus={focused===id} onClick={()=>onSelect(id)}
      transform={`translate(${x} 67) scale(${id==='gatekeeper'?1.32:1})`}>
      <Solid u={-.48} v={-.48} w={.96} d={.96} z={0} h={3} part="socket"/>
      <Machine id={id}/>
    </g>;
  }
  return <section className={'lab-boundary '+(index?'network-lab':'policy-lab')} aria-labelledby={'lab-name-'+index}>
    <h2 id={'lab-name-'+index}>{index?'Network & Identity Laboratory':'Policy Laboratory'}</h2>
    <p className="lab-purpose">{index?'Network isolation, mutual TLS, and workload identity.':'Admission policies and Kubernetes workload configuration.'}</p>
    <div className="lab-drawing">
      <code className="foundation-context">{fixedContexts[index]}</code>
      <svg className="lab-deck" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <g className="cluster-foundation" data-technology={foundation} data-selected={selected===foundation}
          data-focus={focused===foundation} onClick={()=>onSelect(foundation)}>
          <Terrace x={3} width={width-6} y={114} halfDepth={20} height={39} part="foundation"/>
          <g className="lab-machine" data-station={foundation} transform="translate(36 145)">
            <path className="foundation-helm" d={helm}/>
          </g>
        </g>
        {index ? networkZones.map((zone,i)=><g key={zone.name} className={'architecture-zone zone-'+i}>
          <text className="zone-name" x={i*221+119} y={15}>{zone.name}</text>
          <Terrace x={9+i*221} width={221} y={67} halfDepth={26} height={36} part="zone-deck"/>
          {zone.stations.map(renderModule)}
        </g>) : <g className="admission-zone">
          <text className="zone-name" x={85} y={14}>Admission control</text>
          <text className="zone-name" x={201} y={14}>Constraint inventory</text>
          <Terrace x={10} width={260} y={67} halfDepth={34} height={32} part="zone-deck"/>
          {policyStations.map(renderModule)}
          <g transform="translate(202 67)" data-technology="gatekeeper" onClick={()=>onSelect('gatekeeper')}>
            <title>{constraints===undefined?'Inventory unavailable':`Showing ${visibleLayers} of ${constraints} reported constraints`}</title>
            {Array.from({length:visibleLayers},(_,i)=><Solid key={i} u={-.52+i*.025} v={-.31-i*.025} w={1.04} d={.62} z={i*4} h={4} part="inventory-layer"/>)}
          </g>
        </g>}
        {modules.map(({id,x})=><text key={id} className="compact-engraving" x={x} y={104}>{technologies[id].name}</text>)}
        <text className="compact-engraving" x={95} y={149}>Kubernetes</text>
      </svg>
      <div className="station-selector">
        {[...modules,{id:foundation,x:53}].map(({id,x})=><button type="button" className={'lab-station '+(id===foundation?'foundation-label':'')}
          style={{left:(id==='gatekeeper'?width/2:x)/width*100+'%',top:(id===foundation?145:100)/height*100+'%'}}
          id={'station-'+id} key={id} data-technology={id} aria-pressed={selected===id} aria-controls="lab-inspector"
          aria-describedby={'observation-'+id} aria-label={technologies[id].name+' in '+fixedContexts[index]}
          onFocus={()=>setFocused(id)} onBlur={()=>setFocused(null)} onClick={()=>onSelect(id)}>
          <span>{technologies[id].name}</span><small id={'observation-'+id}>{observation(id)}</small>
        </button>)}
      </div>
    </div>
  </section>;
}
