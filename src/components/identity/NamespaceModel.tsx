import React, {useId} from 'react';

export function NamespaceModel({namespace}:{namespace:string}) {
  const id=useId(), paint=(name:string)=>'url(#'+id+name+')';
  return <figure className="if-namespace">
    <svg viewBox="0 0 240 150" aria-hidden="true">
      <defs>
        <linearGradient id={id+'wall'}><stop stopColor="#12394e"/><stop offset=".23" stopColor="#437f96"/><stop offset=".52" stopColor="#14364a"/><stop offset=".91" stopColor="#235c74"/><stop offset="1" stopColor="#76ccdc"/></linearGradient>
        <linearGradient id={id+'lid'} x2=".85" y2="1"><stop stopColor="#9deaf2"/><stop offset=".36" stopColor="#32596f"/><stop offset=".8" stopColor="#143d55"/><stop offset="1" stopColor="#74cfda"/></linearGradient>
        <radialGradient id={id+'light'}><stop stopColor="#69d5df" stopOpacity=".35"/><stop offset="1" stopColor="#49bcd3" stopOpacity="0"/></radialGradient>
      </defs>
      <ellipse cx="120" cy="112" rx="116" ry="34" fill={paint('light')}/>
      <g strokeLinejoin="round">{[0,1,2].map(i=><g key={i} transform={'translate(120,'+(107-i*10)+') scale('+(1-i*.14)+')'}>
        <path d="M-90 -4L-45 -24 45 -24 90 -4 90 4 45 25 -45 25 -90 4Z" fill={paint('wall')} stroke="#43849c"/>
        <path d="M-90 -4L-45 -24 45 -24 90 -4 45 17 -45 17Z" fill={paint('lid')} stroke="#87cbda"/>
        <ellipse cy="-3" rx="56" ry="15" fill="none" stroke="#86d4de" strokeOpacity=".75"/>
      </g>)}</g>
      <g transform="translate(120,62)" stroke="#9de7ed" strokeLinejoin="round">
        <path d="M-33 -14L0 -30 33 -14 0 3Z" fill={paint('lid')}/>
        <path d="M-33 -14L0 3V32L-33 16Z" fill={paint('wall')}/><path d="M0 3L33 -14V16L0 32Z" fill="#24566c"/>
        <path d="M-24 -11L0 1 24 -11M-24 1L-6 10M8 11L24 3" fill="none" opacity=".75"/>
      </g>
    </svg><figcaption><strong>{namespace}</strong><small>Namespace · architectural view</small></figcaption>
  </figure>;
}
