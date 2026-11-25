import React, { useId } from 'react';
import { Layers3, Shield } from 'lucide-react';

export function GatekeeperCore() {
  const id = useId();
  const paint = (name: string) => 'url(#' + id + name + ')';
  const chamber = 'M63 45a57 15 0 0 1 114 0v112a57 16 0 0 1 -114 0Z';
  function cuff(y: number, radius: number, height: number) {
    return <g transform={`translate(0 ${y})`}>
      <path d={`M${120-radius} 0a${radius} 17 0 0 1 ${2*radius} 0v${height}a${radius} 17 0 0 1 -${2*radius} 0Z`} fill={paint('metal')} stroke="#5d839b"/>
      <ellipse cx="120" rx={radius} ry="17" fill={paint('lid')} stroke="#83abbc"/>
      <ellipse cx="120" rx={radius*.79} ry="12" fill="#102e40" stroke="#5397ae"/>
      <path d={`M${123-radius} 5a${radius} 17 0 0 0 ${2*radius-6} 0`} fill="none" stroke="#a3deee" opacity=".6"/>
    </g>;
  }
  return <svg viewBox="0 0 240 218" role="img" aria-label="Gatekeeper admission chamber">
    <defs>
      <linearGradient id={id+'metal'}><stop stopColor="#101e32"/><stop offset=".13" stopColor="#698798"/><stop offset=".23" stopColor="#263e52"/><stop offset=".56" stopColor="#0a192a"/><stop offset=".82" stopColor="#436477"/><stop offset="1" stopColor="#102236"/></linearGradient>
      <linearGradient id={id+'lid'} x2=".85" y2="1"><stop stopColor="#7f9cad"/><stop offset=".4" stopColor="#36596c"/><stop offset="1" stopColor="#162d40"/></linearGradient>
      <clipPath id={id+'wall'}><path d={chamber}/></clipPath>
      <linearGradient id={id+'reflection'} x2="1" y2=".15">
        <stop stopColor="#c4faff" stopOpacity="0"/><stop offset=".48" stopColor="#e0fcff" stopOpacity=".38"/>
        <stop offset=".54" stopColor="#d4f9ff" stopOpacity=".07"/><stop offset="1" stopColor="#b1e5ff" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id={id+'depth'} x1="0" y1="0" x2=".3" y2="1">
        <stop stopColor="#101b57" stopOpacity=".65"/><stop offset=".48" stopColor="#2b9dab" stopOpacity=".08"/>
        <stop offset="1" stopColor="#081359" stopOpacity=".78"/>
      </linearGradient>
      <radialGradient id={id+'contact'}><stop stopColor="#030715" stopOpacity=".86"/><stop offset="1" stopColor="#030715" stopOpacity="0"/></radialGradient>
      <linearGradient id={id+'glass'}><stop stopColor="#8ae9ff" stopOpacity=".78"/><stop offset=".09" stopColor="#124762" stopOpacity=".94"/><stop offset=".2" stopColor="#76edff" stopOpacity=".53"/><stop offset=".26" stopColor="#134460" stopOpacity=".9"/><stop offset=".65" stopColor="var(--core-glass,#073a59)"/><stop offset=".87" stopColor="#287f98"/><stop offset="1" stopColor="#a4edff"/></linearGradient>
      <radialGradient id={id+'light'}><stop className="ps-light-tint" stopColor="#3ce4fb" stopOpacity=".7"/><stop offset="1" stopColor="#18cfff" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="120" cy="192" rx="112" ry="17" fill={paint('contact')}/>
    <ellipse className="ps-base-light" cx="120" cy="190" rx="114" ry="23" fill={paint('light')} opacity=".47"/>
    <ellipse className="ps-energy-arc" cx="120" cy="185" rx="105" ry="16" pathLength="100"
      fill="none" strokeWidth="1.5" strokeDasharray="21 9 9 61" strokeLinecap="round"/>
    {cuff(175,91,9)}{cuff(163,78,8)}
    <path d={chamber} fill={paint('glass')} stroke="#7ed0e7"/>
    <g clipPath={paint('wall')}>
      <path d={chamber} fill={paint('depth')}/>
      <ellipse cx="120" cy="151" rx="42" ry="10" fill="#0b2344" stroke="#60d4df" strokeOpacity=".66"/>
      <ellipse cx="120" cy="149" rx="30" ry="6" fill="#187b98" stroke="#9dfbff" strokeWidth=".6"/>
      <path d="M88 58v85m4-84v88m62-88v83" fill="none" stroke="#beeeff" opacity=".22"/>
      <ellipse className="ps-core-energy" cx="119" cy="108" rx="45" ry="31" fill={paint('light')}/>
      <path className="ps-reflection" d="M48 42h27l40 132H86Z" fill={paint('reflection')}/>
    </g>
    <ellipse className="ps-illumination" cx="119" cy="111" rx="58" ry="64" fill={paint('light')}/>
    {[66,144].map(y=><path key={y} d={`M64 ${y}a56 15 0 0 0 112 0`} fill="none" stroke="#97efff" opacity=".42"/>)}
    <path d="M74 56v91m5-87v42m85-45v92" stroke="#b7faff" strokeWidth="2" opacity=".44"/>
    <g transform="translate(98 77)"><path d="M22 0L44 10v20Q42 47 22 58Q2 46 0 30V10Z" fill="#12445e" stroke="#a3faff" strokeWidth="2"/>
    <path d="M9 16l13-6 13 6v18l-13 12-13-12Z" fill="#29bfd3"/><path d="M22 10v36L9 34V16Z" fill="#bbfaff" opacity=".67"/></g>
    <path d="M65 56q2 44 1 90m106-88v86" stroke="#d5faff" opacity=".66" fill="none"/>
    <path d="M70 153q36 24 94 5" fill="none" stroke="#9bf5ff" strokeWidth="1.2"/>
    {cuff(42,65,8)}{cuff(33,59,6)}
    <ellipse cx="120" cy="33" rx="40" ry="8" fill="var(--core-lamp,#3fb4cb)" stroke="#b5faff"/>
    <ellipse cx="120" cy="33" rx="29" ry="5" fill="#093349" stroke="#57cfe3"/>
    <path d="M47 179q14 13 58 16m28-1q37-2 56-12M78 32q13-8 38-9" fill="none" stroke="#d5effe" opacity=".78"/>
    {[0,1,2,3,4].map(i=><path key={i} d={`M${91+i*12} 185v4`} stroke="#83effa" strokeWidth="3"/>)}
  </svg>;
}

export function PolicyObject({material}: {material:string}) {
  const id = useId();
  const paint = 'url(#'+id+')';
  const slab = 'M7 31L39 16L72 29L40 45Z';
  return <svg viewBox="0 0 80 76" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2=".84" y2="1"><stop stopColor="#e1faff"/><stop offset=".3" stopColor="var(--facet)"/><stop offset=".7" stopColor="var(--deep)"/><stop offset="1" stopColor="var(--facet)"/></linearGradient>
      <radialGradient id={id+'facet'} cx=".32" cy=".28" r=".78"><stop stopColor="#dff6ff"/><stop offset=".34" stopColor="var(--facet)"/><stop offset=".86" stopColor="var(--deep)"/><stop offset="1" stopColor="var(--facet)"/></radialGradient>
      <radialGradient id={id+'shadow'}><stop stopColor="var(--deep)" stopOpacity=".68"/><stop offset="1" stopColor="var(--deep)" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="40" cy="65" rx="33" ry="7" fill={'url(#'+id+'shadow)'}/>
    {material==='key' ? <g transform="rotate(31 40 35)">
      <path d="M31 34v30l9 5 9-6v-6h-6v-6h6V33Z" fill={paint} stroke="var(--facet)"/>
      <path fillRule="evenodd" d="M40 5l18 10v20L40 46 22 35V15ZM40 17l-8 5v8l8 5 8-5v-8Z" fill={paint} stroke="var(--facet)"/>
      <path d="M40 5l18 10-10 7-8-5Z" fill="#b7f5eb" opacity=".72"/>
      <path d="M22 34l10-6 8 7v10Z" fill="#056e72"/><path d="M39 46v21l5-3V44Z" fill="#80e9d1" opacity=".7"/>
      <path d="M24 16l16-9 15 9M35 44v18" fill="none" stroke="#c7ffff"/></g>
    : material==='shield' ? <g><path d="M13 19L39 8 64 16v19Q62 51 41 66Q16 58 13 40Z" fill={paint} stroke="var(--facet)"/>
      <path d="M19 23l21-9 17 6-16 19Z" fill={paint}/><path d="M19 23l22 16v19Q23 51 19 38Z" fill={'url(#'+id+'facet)'}/><path d="M41 39l16-19v16q-2 12-16 22Z" fill={paint}/>
      <path d="M20 23l21 16 15-18M41 39v19" fill="none" stroke="#d9f5ff" strokeOpacity=".8" strokeWidth=".9"/></g>
    : material==='scope' ? <g>
      <path d="M3 52l35-14 39 13v7L42 73 3 59Z" fill="var(--deep)" stroke="#708fa8"/>
      <path d="M3 52l35-14 39 13-35 16Z" fill={paint} stroke="var(--facet)"/>
      <path d="M16 27l26 10 23-11v25L42 62 16 52Z" fill={paint} stroke="#8db8d4"/>
      <path d="M42 37l23-11v25L42 62Z" fill="var(--deep)" stroke="#7495a8"/>
      <path d="M16 27l24-11 25 10-23 11Z" fill={paint} stroke="#b8e4f6"/>
      <path d="M21 34l15 6m-15-2 15 6m-15-2 9 4M48 38v11m4-13v11m4-13v11" stroke="#aedcf0" opacity=".74"/>
      <path d="M20 21l20-9 22 8-20 10Z" fill={paint} stroke="#c7ebfa"/>
      <path d="M21 21v4l21 9 20-10v-4l-20 10Z" fill="#315771" stroke="#86b3cb" strokeWidth=".6"/>
      <path d="M17 27l8 3v24l-8-3Z" fill="#ebf7ff" opacity=".17"/>
      <path d="M22 21l19-8 14 5-18 8Z" fill="#e3fbff" opacity=".32"/>
      <path d="M5 55l35 13m8-1 19-8" stroke="#b1d5e3" fill="none" opacity=".8"/>
      <path d="M34 20l6-3 7 2-6 3Z" fill="#d1efff"/>
    </g>
    : <>{[19,9,0].map(y=><g key={y} transform={'translate(0 '+y+')'}><path d="M7 31l33 14 32-16v7L40 52 7 38Z" fill="var(--deep)" stroke="var(--facet)"/><path d={slab} fill={paint} stroke="var(--facet)"/>
      <path d="M9 31l29-14 11 4-27 15Z" fill="#efe5ff" opacity=".28"/>
      <path d="M9 33l30 13 28-13" fill="none" stroke="#dfc9ff" opacity=".73"/>
      <path d="M47 44l16-7" stroke="#352450" strokeWidth="1.3"/></g>)}
      <g transform="matrix(1 .38 -.8 .43 36 21)">{material==='layers'?<Layers3 size={22} stroke="#f2eaff"/>:<Shield size={22}/>}</g></>}
  </svg>;
}
