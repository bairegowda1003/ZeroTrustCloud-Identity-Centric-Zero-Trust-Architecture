import React from 'react';
import { Box, ChevronRight, Fingerprint, GitMerge } from 'lucide-react';
import { Artifact } from '../../utils/supplyChainEvidence';

function Engraving({record}: {record: Artifact}) {
  return <g transform="matrix(1 .405 -1 .44 185 -53)" fill="none" stroke="#b7d9e5">
        <rect x="11" y="9" width="88" height="102" rx="4" opacity=".66"/>
        <rect x="31" y="37" width="49" height="42" rx="4" fill="#18313f"/>
        <g className="si-engraving" stroke="var(--edge)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          {record.signature ? <><circle cx="49" cy="54" r="7"/><path d="m54 59 11 11 4-4 m-8 0 4-4"/></>
            : record.findings.length ? <><path d="m55 44 15 25H40z"/><path d="M55 52v7m0 4v1"/></>
            : <><path d="M42 47h7m-7 0v7m26-7h-7m7 0v7m-26 13v-7m0 7h7m19 0h-7m7 0v-7"/><path d="M47 57h16"/></>}
        </g>
      </g>;
}

function ContainerMaterial({record}: {record: Artifact}) {
  return <svg className="si-object" viewBox="24 29 314 208" aria-hidden="true">
    <defs>
      <linearGradient id="si-cap" x2="1" y2=".76"><stop stopColor="var(--cap-light)"/><stop offset=".38" stopColor="var(--cap-mid)"/><stop offset=".79" stopColor="var(--cap-dark)"/><stop offset="1" stopColor="var(--cap-mid)"/></linearGradient>
      <linearGradient id="si-left" x2="1" y2=".3"><stop stopColor="var(--facet)"/><stop offset=".48" stopColor="#1c3d50"/><stop offset="1" stopColor="#122b3b"/></linearGradient>
      <linearGradient id="si-right"><stop stopColor="#0d2332"/><stop offset="1" stopColor="var(--side)"/></linearGradient>
      <radialGradient id="si-shadow"><stop stopColor="#02121c" stopOpacity=".7"/><stop offset="1" stopColor="#0a2738" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="179" cy="193" rx="152" ry="37" fill="url(#si-shadow)"/>
    <g fill="none" stroke="var(--wire)" strokeWidth=".8">
      <path d="m29 174 145 59 154-66-144-59z" strokeDasharray="32 4 2 4"/><path d="m45 174 129 52 137-59-128-52z"/>
    </g>
    <g>
      {[136, 115, 94].map((y,i) => <g key={y} transform={`translate(0 ${y})`}>
        <g className={i===2 ? "si-top-layer" : undefined}>
        <path d="m64 0 111 45 123-54-110-45z" fill="url(#si-cap)" stroke="var(--rim)"/>
        <path d="m64 0 111 45v11L64 11z" fill="url(#si-left)" stroke="#5b7783"/>
        <path d="m175 45 123-54V2L175 56z" fill="url(#si-right)" stroke="#506774"/>
        <path d="m185 46 101-44" stroke="var(--rim)" opacity=".48" fill="none"/>
        <path d="m64 1 111 45 123-54" fill="none" className={i===2 ? 'si-lit-edge' : undefined}
          stroke={i===2?'var(--edge)':'var(--rim)'} strokeWidth={i===2?2:1}/>
        {i===2 && <Engraving record={record}/>}
        </g>
      </g>)}
    </g>
  </svg>;
}

export function ArtifactChamber({record, related, select}: {
  record: Artifact; related: Artifact[]; select: (a: Artifact) => void;
}) {
  const split = record.identity?.lastIndexOf('/') ?? -1;
  return <section className="si-chamber" aria-labelledby="si-chamber-title" data-selected-file={record.path}>
    <div className="si-section-line"><Box size={17}/><h2 id="si-chamber-title">Artifact integrity chamber</h2></div>
    <div className="si-scene">
      <div className="si-model">{record.identity ? <ContainerMaterial key={record.path} record={record}/> : 'Image identity unavailable'}</div>
      <div className="si-caption"><small>Reported image</small>
        {split >= 0 && <code>{record.identity?.slice(0,split+1)}</code>}
        <h3>{record.identity?.slice(split+1) ?? 'Unavailable'}</h3>
        <span className="si-material-label">{record.signature && record.available ? 'Signature claim' : record.status}</span>
      </div>
    </div>
    <div className="si-relation"><Fingerprint aria-hidden="true" size={20}/><div>
      <small>{related.length ? 'SAVED DIGEST MATCH' : (record.signature?'Recorded manifest digest':'Recorded repository digest')}</small>
      <code>{record.digest ? record.digest.slice(0,16)+'…'+record.digest.slice(-8) : 'Unavailable'}</code>
      {related.length>0 && <p>Both files contain the same digest string. Signature validity remains unconfirmed.</p>}
      {related.length ? related.map(a => <button key={a.path} onClick={()=>select(a)} aria-controls="si-inspector">
        <GitMerge size={14}/> Inspect matching {a.signature?'Cosign record':'Trivy report'} <ChevronRight size={14}/>
      </button>) : <p>No linked {record.signature?'Trivy report':'Cosign record'} in this collection.</p>}
    </div></div>
  </section>;
}
