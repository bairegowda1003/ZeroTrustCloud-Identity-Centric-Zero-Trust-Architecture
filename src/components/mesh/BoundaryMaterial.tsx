import React from 'react';

type Props = {
  ingress: boolean;
  mtls: boolean;
  server: boolean;
  selected: string | null;
  serverName?: string;
  activate: (key: string) => void;
};

const footprint = '118,205 241,139 393,139 498,195 498,226 367,293 234,293 118,234';

export function BoundaryMaterial({ ingress, mtls, server, selected, serverName, activate }: Props) {
  const edge = 'var(--perimeter-edge)';
  const back = 'M118 205 241 139H393L498 195V167L393 111H241L118 177Z';
  const front = 'M118 234 234 293H367L498 226V198L367 265H234L118 206Z';
  return <svg className="ns-material" viewBox="0 0 650 330" aria-hidden="true">
    <defs>
      <linearGradient id="nb-top" x2=".8" y2="1"><stop stopColor="#eaf3f8"/><stop offset=".27" stopColor="#acbfcc"/><stop offset=".58" stopColor="#6c89a3"/><stop offset="1" stopColor="#cadce7"/></linearGradient>
      <linearGradient id="nb-front" x2=".8" y2=".6"><stop stopColor="#91a2b0"/><stop offset=".22" stopColor="#485d6f"/><stop offset=".78" stopColor="#263947"/><stop offset="1" stopColor="#698295"/></linearGradient>
      <linearGradient id="nb-side" x2="1" y2="1"><stop stopColor="#546e82"/><stop offset=".5" stopColor="#1e303e"/><stop offset="1" stopColor="#3a5265"/></linearGradient>
      <linearGradient id="nb-wall" x1="0" y1="1" x2=".85" y2="0">
        <stop stopColor="var(--glass-deep)" stopOpacity=".91"/><stop offset=".32" stopColor="var(--glass-teal)" stopOpacity=".52"/>
        <stop offset=".55" stopColor="var(--glass-teal)" stopOpacity=".24"/><stop offset=".66" stopColor="var(--glass-pearl)" stopOpacity=".45"/>
        <stop offset=".75" stopColor="var(--glass-teal)" stopOpacity=".35"/><stop offset="1" stopColor="var(--glass-deep)" stopOpacity=".73"/>
      </linearGradient>
      <radialGradient id="nb-field" cx=".37" cy=".29" r=".78">
        <stop stopColor="var(--field-pearl)" stopOpacity=".28"/><stop offset=".32" stopColor="var(--field-blue)" stopOpacity=".09"/>
        <stop offset=".72" stopColor="var(--field-blue)" stopOpacity=".22"/><stop offset="1" stopColor="var(--field-deep)" stopOpacity=".62"/>
      </radialGradient>
      <linearGradient id="nb-glint" x2=".94" y2=".32"><stop stopColor="var(--field-pearl)" stopOpacity="0"/><stop offset=".52" stopColor="var(--field-pearl)" stopOpacity=".42"/><stop offset="1" stopColor="var(--field-pearl)" stopOpacity="0"/></linearGradient>
      <radialGradient id="nb-contact"><stop stopColor="#06151c" stopOpacity=".75"/><stop offset=".7" stopColor="#071a20" stopOpacity=".28"/><stop offset="1" stopColor="#071a20" stopOpacity="0"/></radialGradient>
      <radialGradient id="nb-base"><stop stopColor="#84b6ee" stopOpacity=".55"/><stop offset=".65" stopColor="#5286c8" stopOpacity=".22"/><stop offset="1" stopColor="#407692" stopOpacity="0"/></radialGradient>
      <radialGradient id="nb-floor-reflection"><stop stopColor="var(--glass-teal)" stopOpacity=".16"/><stop offset="1" stopColor="var(--glass-teal)" stopOpacity="0"/></radialGradient>
      <pattern id="nb-grid" width="34" height="18" patternUnits="userSpaceOnUse"><path d="m0 0 34 18m0-18L0 18" fill="none" stroke="var(--ground)" strokeWidth=".84"/></pattern>
      <radialGradient id="nb-fade"><stop offset=".4" stopColor="white"/><stop offset=".78" stopColor="#888"/><stop offset="1" stopColor="black"/></radialGradient>
      <mask id="nb-ground-mask"><ellipse cx="312" cy="220" rx="322" ry="107" fill="url(#nb-fade)"/></mask>
    </defs>
    {ingress && <ellipse cx="312" cy="236" rx="270" ry="89" fill="url(#nb-floor-reflection)"/>}
    <rect x="0" y="100" width="635" height="230" fill="url(#nb-grid)" mask="url(#nb-ground-mask)" className="ns-ground"/>
    <ellipse cx="312" cy="244" rx="216" ry="68" fill="url(#nb-contact)" opacity={ingress ? .65 : .12}/>
    <g opacity={ingress ? 1 : .16} className={selected==='calico'?'ns-emphasis':''} onClick={()=>activate('calico')}>
      <polygon points={footprint} className="ns-deck" stroke={edge} strokeOpacity=".55"/>
      <polygon points={footprint} fill="url(#nb-grid)" className="ns-deck-grid"/>
      <path d={back} fill="url(#nb-wall)" stroke={edge} strokeWidth="1.1"/>
      <path d="m118 177 123-66h152l105 56" fill="none" stroke={edge} strokeWidth="2" className="ns-perimeter-light"/>
      <path d="M118 177v29l4 2v-29ZM494 170v29l4-2v-30Z" fill={edge} opacity=".48"/>
    </g>
    {server && <ellipse cx="312" cy="221" rx="123" ry="45" fill="url(#nb-base)" className="ns-base-light"/>}
    {mtls && <g className={selected==='istio'?'ns-field ns-emphasis':'ns-field'} onClick={()=>activate('istio')}>
      <path d="M188 204C190 121 242 57 312 55c70 0 121 65 124 149a124 34 0 0 1-248 0Z" fill="url(#nb-field)"/>
      <path d="M188 204C190 121 242 57 312 55c70 0 121 65 124 149" fill="none" stroke="var(--field-edge)" strokeWidth="1.45"/>
      <path d="M204 147c16-48 51-79 91-86-30 13-62 43-91 86Z" fill="url(#nb-glint)" className="ns-shimmer"/>
      <path d="M347 65c37 13 64 45 77 87-18-38-42-68-77-87Z" fill="url(#nb-glint)" opacity=".76"/>
    </g>}
    {server && <g onClick={()=>serverName && activate(serverName)} className={selected===serverName?'ns-emphasis':''}>
      <path d="m232 199 64-31 99 25v8l-65 34-98-27z" fill="url(#nb-side)" stroke="#738e9b" strokeWidth=".9"/>
      <path d="m232 199 64-31 99 25-65 34z" fill="url(#nb-front)" stroke="#92aab9" strokeWidth=".9"/>
      {[184,164,144,124].map(y=><g key={y} transform={`translate(242 ${y})`}>
        <path d="M0 0 55-28 142-6 87 23Z" fill="url(#nb-top)" stroke="#cadbe7" strokeWidth=".9"/>
        <path d="m0 0 87 23v17L0 17Z" fill="url(#nb-front)" stroke="#6f8593" strokeWidth=".7"/>
        <path d="m87 23 55-29v16L87 40Z" fill="url(#nb-side)" stroke="#8396a6" strokeWidth=".65"/>
        <path d="m5 4 77 20M4 15l79 21" fill="none" stroke="#b8cddb" strokeWidth=".65"/>
        {Array.from({length:12},(_,i)=><path key={i} d={`m${10+i*4.1} ${7+i*1.08} .3 6`} stroke="#162b39" strokeWidth="2"/>)}
        <path d="m66 23 9 2.2" stroke="#b2dfde" strokeWidth="2.3"/>
        {[0,1,2,3,4,5].map(i=><path key={i} d={`m${96+i*6.8} ${23-i*3.55}v7`} stroke="#101f30" strokeWidth="2.3"/>)}
      </g>)}
      <path d="m261 123 37-19 67 17-37 19Z" fill="none" stroke="#6d8496"/>
      <path d="m287 122 16-8 35 9-15 8Z" fill="#698295" opacity=".6"/>
    </g>}
    {mtls && <path d="M188 204a124 34 0 0 0 248 0c-3 21-59 37-124 37s-121-16-124-37Z" fill="var(--field-edge)" opacity=".85" pointerEvents="none"/>}
    <g opacity={ingress ? 1 : .16} onClick={()=>activate('calico')}>
      <path d={front} fill="url(#nb-wall)" stroke={edge}/>
      <path d="M118 177v29l116 59h133l131-67v-31l-4 2v26l-128 66H235l-113-57v-25Z" fill="var(--glass-pearl)" opacity=".62"/>
      <path d="M118 206v28l116 59h133l131-67v-28" fill="none" stroke="var(--glass-deep)" strokeWidth="2.6"/>
      <path d="M234 265v27m133-27v27" stroke={edge} opacity=".42"/>
    </g>
    <g className="ns-leaders" fill="none" strokeWidth="1">
      <path d="M173 152 144 88H54"/><circle cx="173" cy="152" r="2"/>
      <path d="m389 83 28-34h67"/><circle cx="389" cy="83" r="2"/>
      {server && <><path d="m374 164 65-4h53"/><circle cx="374" cy="164" r="2"/></>}
    </g>
  </svg>;
}
