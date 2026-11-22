import React, { useState, useRef, useEffect, useLayoutEffect, useSyncExternalStore } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import type { TopologyNode } from '../utils/commandTopology';

const layout = [
  { id:'admission', x:300, y:240, r:74 }, { id:'fabric', x:727, y:245, r:100 },
  { id:'gate', x:105, y:120, r:34 }, { id:'calico', x:495, y:97, r:30 },
  { id:'istio', x:986, y:107, r:36 }, { id:'spire', x:1200, y:248, r:38 },
  { id:'pods', x:849, y:361, r:42 }, { id:'sidecars', x:488, y:350, r:30 },
];
const lines = [
  'M105 120v17q0 8 12 15l183 88','M495 97v18q0 8 14 16l218 114',
  'M986 107v15q0 9-15 17L727 245','M1200 248l-86 40q-12 5-29 2L727 245',
  'M849 361l-122-116','M488 350l239-105',
];
const tabletLayout = layout.map(node=>({...node,x:node.x*.72,y:node.y*1.06}));
const narrowLayout = [
  {id:'admission',x:93,y:234,r:34},{id:'fabric',x:263,y:244,r:42},
  {id:'gate',x:68,y:110,r:21},{id:'calico',x:190,y:86,r:18},
  {id:'istio',x:314,y:91,r:20},{id:'spire',x:352,y:326,r:18},
  {id:'pods',x:222,y:407,r:24},{id:'sidecars',x:87,y:351,r:18},
];
const narrowLines = ['M68 110v36l25 14v74','M190 86v46l73 42v70','M314 91v61l-51 30v62',
  'M352 326v-34l-89 -48','M222 407v-91l41 -23v-49','M87 351l96 -54 80 -53'];
function watchWidth(update:()=>void) {
  const query = window.matchMedia('(max-width:600px)');
  query.addEventListener('change',update);
  return () => query.removeEventListener('change',update);
}
function watchTablet(update:()=>void) {
  const query=window.matchMedia('(max-width:1000px)');
  query.addEventListener('change',update);
  return ()=>query.removeEventListener('change',update);
}
const seq = (n: number) => Array.from({length:n}, (_, i) => i);
function point(radius: number, angle: number, elevation: number) {
  return [radius * Math.cos(angle), radius * .43 * Math.sin(angle) - elevation];
}
function ring(radius: number, elevation: number, sides = 6, twist = 0) {
  return seq(sides).map(i => point(radius, i * Math.PI * 2 / sides + twist, elevation).join(',')).join(' ');
}

// Paint servers inherit their domain palette here, independently of the shapes referencing them.
function DomainPaint({id}: {id:string}) {
  return <g data-palette={id}>
    <linearGradient id={`tm-cap-${id}`} x2=".85" y2="1">
      <stop stopColor="var(--accent)"/><stop offset=".24" stopColor="var(--mid)"/>
      <stop offset=".68" stopColor="var(--deep)"/><stop offset="1" stopColor="var(--mid)"/>
    </linearGradient>
    <linearGradient id={`tm-side-${id}`} x2=".12" y2="1">
      <stop stopColor="var(--mid)"/><stop offset=".32" stopColor="var(--deep)"/>
      <stop offset=".78" stopColor="var(--mid)"/><stop offset="1" stopColor="var(--accent)"/>
    </linearGradient>
    <linearGradient id={`tm-edge-${id}`} x2=".9" y2=".5">
      <stop stopColor="var(--accent)"/><stop offset=".23" stopColor="var(--glint)"/>
      <stop offset=".57" stopColor="var(--accent)"/><stop offset=".82" stopColor="var(--mid)"/>
      <stop offset="1" stopColor="var(--glint)"/>
    </linearGradient>
    <linearGradient id={`tm-glass-${id}`} x2=".93" y2=".72">
      <stop stopColor="var(--glint)"/><stop offset=".28" stopColor="var(--accent)"/>
      <stop offset=".66" stopColor="var(--mid)"/><stop offset="1" stopColor="var(--accent)"/>
    </linearGradient>
    <radialGradient id={`tm-pool-${id}`}>
      <stop stopColor="var(--mid)"/><stop offset=".69" stopColor="var(--deep)"/>
      <stop offset=".89" stopColor="var(--mid)"/><stop offset="1" stopColor="var(--deep)"/>
    </radialGradient>
    <radialGradient id={`tm-spill-${id}`}>
      <stop stopColor="var(--accent)" stopOpacity=".52"/><stop offset=".52" stopColor="var(--accent)" stopOpacity=".26"/>
      <stop offset="1" stopColor="var(--accent)" stopOpacity="0"/>
    </radialGradient>
  </g>;
}

// A faceted drum with a lit upper rim. Side faces share vertices with the cap.
function Drum({ r, z, height, sides = 6 }: { r:number; z:number; height:number; sides?:number }) {
  return <g>{seq(sides).map(i => {
    const a = i * 2 * Math.PI / sides, b = (i + 1) * 2 * Math.PI / sides;
    return <polygon key={i} points={[point(r,a,z),point(r,b,z),point(r,b,z+height),point(r,a,z+height)].map(v=>v.join(',')).join(' ')}
      fill={i % 2 ? 'var(--deep)' : 'var(--side)'} stroke="var(--mid)" strokeWidth=".7"/>;
  })}<polygon points={ring(r,z+height,sides)} fill="var(--cap)" stroke="var(--edge)" strokeWidth="1"/></g>;
}

// Each domain has a distinct cut-glass profile on the shared architectural base.
function DomainGlass({ variant }: { variant: string }) {
  switch (variant) {
    case 'gate': return <g><path d="M-18 0v-25l17-8 18 8v25l-8 3v-22l-10-4-10 5v21z" fill="var(--glass)" stroke="var(--glint)"/><path d="M-18-25l8 5 10-5 9 4 8-4" fill="none" stroke="var(--glint)"/></g>;
    case 'calico': return <g>{[-10,0,10].map(x=><path key={x} transform={'translate('+x+',0)'} d="M-5-1v-23l10-6v24z" fill="var(--glass)" stroke="var(--glint)"/>)}</g>;
    case 'istio': return <g><path d="M-16 0L7-42 2-6z" fill="var(--glass)" stroke="var(--glint)"/><path d="M5-5l5-29 10 38z" fill="var(--glass)" stroke="var(--glint)"/></g>;
    case 'spire': return <g><path d="M0-43l12 26L0 1l-12-18z" fill="var(--glass)" stroke="var(--glint)"/><path d="M0-43v44l12-18z" fill="#550b76" opacity=".58"/><ellipse cy="-14" rx="19" ry="7" fill="none" stroke="var(--glint)"/></g>;
    default: return <g>{[-8,8].map((x,i)=><g key={x} transform={'translate('+x+','+(i*3)+')'}><Drum r={9} z={0} height={i?13:22} sides={4}/></g>)}</g>;
  }
}

function FabricLens({r}:{r:number}) {
  return <g transform={'scale('+r/83+')'}>
    <ellipse cy="-25" rx="74" ry="29" fill="var(--pool)"/>
    <path d="M-48-42v-36a48 19 0 0 1 96 0v36a48 19 0 0 1-96 0" fill="url(#tm-wall)" stroke="var(--edge)"/>
    <ellipse className="tm-cylinder-rim" cy="-78" rx="48" ry="19" fill="url(#tm-wall)" stroke="#b4f5ff" strokeWidth="1.4"/>
    <ellipse cy="-78" rx="41" ry="15" fill="none" stroke="#4388ad"/>
    <path d="M-38-69v26m4-24v16m66-18v25" fill="none" stroke="#e1ffff" opacity=".48"/>
    <path d="M-16-53l16-31 16 31-16 15z" fill="var(--glass)" stroke="#cdfaf4"/>
    <path d="M0-84v46l16-15z" fill="#0065ba" opacity=".65"/>
    <ellipse className="tm-lens-reflection" cy="-39" rx="53" ry="21" fill="none" stroke="#a0ffff" strokeDasharray="64 182" strokeWidth="2"/>
  </g>;
}

function Assembly({ r, hub, variant }: {r:number; hub:boolean; variant:string}) {
  return <g className="tm-assembly">
    <ellipse className="tm-contact-shadow" cy="11" rx={r*1.64} ry={r*.60} cx={r*.08} fill="url(#tm-shadow)"/>
    <ellipse cy="5" rx={r*1.23} ry={r*.55} fill="var(--pool)" stroke="var(--edge)"/>
    <ellipse cy="5" rx={r*1.4} ry={r*.62} fill="none" stroke="var(--accent)" strokeOpacity=".68" strokeWidth=".7" strokeDasharray="3 7"/>
    <Drum r={r} z={0} height={6}/>
    <Drum r={r*.87} z={8} height={5}/>
    {hub ? <>
      <ellipse cy={-17} rx={r*.71} ry={r*.30} fill="none" stroke="var(--edge)" strokeWidth="1.4"/>
      {seq(32).map(i => <line key={i} x1={point(r*.71,i*Math.PI/16,17)[0]} y1={point(r*.71,i*Math.PI/16,17)[1]}
        x2={point(r*.77,i*Math.PI/16,17)[0]} y2={point(r*.77,i*Math.PI/16,17)[1]} stroke="var(--accent)"/>)}
      {seq(5).map(i=><Drum key={i} r={r*(.47-i*.032)} z={17+i*8} height={5} sides={variant==='fabric'?8:4}/>)}
      {variant==='fabric' ? <FabricLens r={r}/> : <g transform="translate(0,-61)">
        <polygon points={ring(r*.32,0,4)} fill="#183e4c" stroke="var(--glint)"/>
        {seq(4).map(i=><path key={i} d={'M'+point(r*.32,Math.PI*i/2,0).join(' ')+' L0 '+(-r*.5)+' L'+point(r*.32,Math.PI*(i+1)/2,0).join(' ')}
          fill={['#537afa','#293eac','#93b5ff','#cfddff'][i]} stroke="var(--glint)" strokeWidth=".65"/>)}
      </g>}
    </> : variant==='pods' ? [[-.42,0],[0,-5],[.42,0],[-.2,5],[.22,5]].map(([v,y],i)=><g key={i} transform={'translate('+r*v+','+ y+')'}><Drum r={r*.16} z={13} height={11}/></g>)
    : <g transform={'translate(0,-13) scale('+r/30+')'}><DomainGlass variant={variant}/></g>}
  </g>;
}

export function SecurityTopology({nodes,selected,onSelect,onReset}: {nodes:TopologyNode[];selected:string;onSelect:(id:string)=>void;onReset:()=>void}) {
  const [zoom,setZoom] = useState(1);
  const [hover,setHover] = useState<string | null>(null);
  const tip = nodes.find(n=>n.id===hover);
  const scene=useRef<HTMLElement>(null);
  const preview=useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = scene.current;
    if (!stage) return;
    const map = stage.querySelector('svg.tm-map') as SVGSVGElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const update = () => {
      const running = visible && !document.hidden && !reducedMotion.matches;
      stage.dataset.motion = running ? 'running' : 'paused';
      if (running) map.unpauseAnimations?.();
      else map.pauseAnimations?.();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    update();
    observer.observe(stage);
    reducedMotion.addEventListener('change',update);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change',update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  useLayoutEffect(()=>{
    const stage=scene.current, bubble=preview.current;
    const anchor=stage?.querySelector<SVGGElement>('[data-resource="'+hover+'"]');
    if(!stage || !bubble || !anchor) return;
    const place=()=>{
      const box=anchor.getBoundingClientRect(), bounds=stage.getBoundingClientRect();
      const inset = bounds.width >= 600 ? 22 : 6;
      const x=Math.max(inset,Math.min(bounds.width-bubble.offsetWidth-inset,box.left-bounds.left+(box.width-bubble.offsetWidth)/2));
      const above=box.top-bounds.top-bubble.offsetHeight-8;
      bubble.style.left=x+'px';
      bubble.style.top=(above >= inset || (above >= 4 && box.bottom+8+bubble.offsetHeight > bounds.bottom-inset) ? above : box.bottom-bounds.top+8)+'px';
    };
    place();
    const observer=new ResizeObserver(place);
    observer.observe(stage);
    observer.observe(bubble);
    stage.addEventListener('transitionend',place);
    return ()=>{observer.disconnect();stage.removeEventListener('transitionend',place)};
  },[hover,zoom]);
  const narrow=useSyncExternalStore(watchWidth,()=>window.matchMedia('(max-width:600px)').matches,()=>false);
  const tablet=useSyncExternalStore(watchTablet,()=>window.matchMedia('(max-width:1000px)').matches,()=>false) && !narrow;
  const positions=narrow?narrowLayout:tablet?tabletLayout:layout;
  const target = positions.find(p=>p.id===selected) ?? layout[1];
  return <section ref={scene} className="tm-scene" aria-label="Interactive security topology">
    <header><h2 className="tm-scene-title">Security topology</h2>
      <div className="tm-camera"><button aria-label="Zoom out" disabled={zoom<=1} onClick={()=>setZoom(1)}><Minus/></button>
      <button aria-label="Zoom toward selected resource" disabled={zoom>=1.45} onClick={()=>setZoom(1.45)}><Plus/></button>
      <button aria-label="Reset topology view" onClick={()=>{setZoom(1);onReset()}}><RotateCcw/></button></div></header>
    <svg className="tm-map" viewBox={narrow?'0 0 410 466':tablet?'0 0 944 470':'0 15 1310 420'} aria-label="Documented cluster and control relationships">
      <defs>
        {['cyan','violet'].map(tint=><React.Fragment key={tint}>
          <linearGradient id={'tm-tail-'+tint} className={'tm-signal-paint '+tint}>
            <stop stopOpacity="0"/><stop offset=".56" stopOpacity=".45"/>
            <stop offset=".9"/><stop offset="1" stopOpacity="0"/>
          </linearGradient>
          <radialGradient id={'tm-halo-'+tint} className={'tm-signal-paint '+tint}>
            <stop stopOpacity=".85"/><stop offset=".48" stopOpacity=".38"/><stop offset="1" stopOpacity="0"/>
          </radialGradient>
        </React.Fragment>)}
        <radialGradient id="tm-ice-light">
          <stop stopColor="#ffffff" stopOpacity=".95"/><stop offset=".46" stopColor="#dbfbff" stopOpacity=".67"/>
          <stop offset="1" stopColor="#c8eefa" stopOpacity="0"/>
        </radialGradient>
        {layout.map(({id}) => <DomainPaint key={id} id={id}/>)}
        <linearGradient id="tm-wall">
          <stop stopColor="#05cfff" stopOpacity=".86"/><stop offset=".1" stopColor="#a3f5ff" stopOpacity=".73"/>
          <stop offset=".21" stopColor="#238dd8" stopOpacity=".42"/><stop offset=".52" stopColor="#063361" stopOpacity=".24"/>
          <stop offset=".83" stopColor="#0a52a2" stopOpacity=".46"/><stop offset="1" stopColor="#2adfff" stopOpacity=".84"/>
        </linearGradient>
        <radialGradient id="tm-shadow"><stop stopColor="#020711" stopOpacity=".96"/><stop offset="1" stopColor="#020711" stopOpacity="0"/></radialGradient>
        <radialGradient id="tm-light"><stop stopColor="#13668d" stopOpacity=".42"/><stop offset="1" stopColor="#081827" stopOpacity="0"/></radialGradient>
        <radialGradient id="tm-fade"><stop offset=".35" stopColor="white"/><stop offset="1" stopColor="black"/></radialGradient>
        <mask id="tm-floor-fade"><rect width={narrow?410:1310} height="485" fill="url(#tm-fade)"/></mask>
        <pattern id="tm-grid" width="62" height="34" patternUnits="userSpaceOnUse"><path d="M0 0L62 34M62 0L0 34" fill="none" stroke="#467995" strokeOpacity=".17" strokeWidth=".7"/></pattern></defs>
      <g className="tm-camera-plane" style={{transform: 'translate('+((1-zoom)*target.x)+'px,'+((1-zoom)*target.y)+'px) scale('+zoom+')'}}>
        <ellipse cx={narrow?240:730} cy="245" rx={narrow?270:720} ry="227" fill="url(#tm-light)"/>
        <ellipse className="tm-ice-light" cx={positions[1].x} cy={positions[1].y-30}
          rx={positions[1].r*3.5} ry={positions[1].r*1.65} fill="url(#tm-ice-light)"/>
        <rect width={narrow?410:1310} height="485" fill="url(#tm-grid)" mask="url(#tm-floor-fade)"/>
        {(narrow ? narrowLines : lines).map((d,index) => {
          const resource = layout[index+2].id;
          const hub = resource === 'gate' ? 'admission' : 'fabric';
          const active = hover ?? selected;
          const pathId = 'tm-architecture-'+resource;
          const tint = hub === 'admission' ? 'violet' : 'cyan';
          return <g key={resource} className="tm-connection" data-domain={hub}
            data-related={active === resource || active === hub} aria-hidden="true"
            transform={tablet ? 'scale(.72 1.06)' : undefined}>
            <path d={d} className="tm-connection-bed" />
            <path id={pathId} d={d} className="tm-connection-line" />
            <g className="tm-route-signal">
              <ellipse cx="-8" rx="12" ry="2.2" fill={'url(#tm-tail-'+tint+')'}/>
              <circle r="7.5" fill={'url(#tm-halo-'+tint+')'}/>
              <circle className="tm-signal-core" r="2.7"/>
              <animateMotion dur="7s" begin={(-index*1.13-1.6)+'s'} rotate="auto"
                calcMode="linear" keyPoints="0;1;1" keyTimes="0;.74;1" repeatCount="indefinite">
                <mpath href={'#'+pathId}/>
              </animateMotion>
            </g>
          </g>;
        })}
        {positions.map(({id,x,y,r},idx)=>{
          const n=nodes.find(n=>n.id===id)!;
          return <g key={id} transform={'translate('+x+','+y+')'} data-resource={id} className={'tm-object '+(id===selected?'is-selected':'')} tabIndex={0} role="button"
            aria-describedby={tip?.id===id?'tm-resource-preview':undefined} aria-label={n.label+', '+n.state} aria-pressed={id===selected} onClick={e=>{e.currentTarget.focus();onSelect(id)}} onPointerEnter={()=>setHover(id)} onPointerLeave={()=>setHover(null)}
            onFocus={()=>setHover(id)} onBlur={()=>setHover(null)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(id)}}}>

            <ellipse className="tm-selection"  rx={r*1.48} ry={r*.66} cy="5"/>
            <g className="tm-material" data-palette={id} style={{
              '--cap':`url(#tm-cap-${id})`, '--edge':`url(#tm-edge-${id})`,
              '--side':`url(#tm-side-${id})`, '--glass':`url(#tm-glass-${id})`, '--pool':`url(#tm-pool-${id})`,
            } as React.CSSProperties}><ellipse className="tm-reflected-light" cy="3" rx={r*2.15} ry={r*.87} fill={`url(#tm-spill-${id})`} pointerEvents="none"/><Assembly r={r} hub={idx<2} variant={id}/></g>
            <text textAnchor="middle" y={r*.58+21}>{n.label}</text>
            <text className="tm-node-state" textAnchor="middle" y={r*.58+36}>{[n.state === 'Stale' ? 'Last known' : n.state, n.verdict].filter(Boolean).join(' \u00b7 ')}</text>
          </g>
        })}
      </g>
    </svg>
    {tip && <div className="tm-resource-preview" role="tooltip" id="tm-resource-preview" ref={preview}>
      <strong>{tip.label}</strong><span>{tip.securityFunction}</span>
      <small>{tip.state==='Stale'?'Last known':tip.state}{tip.verdict && ' / '+tip.verdict}</small>
    </div>}
    <div className="tm-caption">Connections illustrate documented security architecture, not observed network traffic.</div>
    <label className="tm-picker">Inspect resource <select value={selected} onChange={e=>onSelect(e.target.value)}>{nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label>
  </section>;
}
