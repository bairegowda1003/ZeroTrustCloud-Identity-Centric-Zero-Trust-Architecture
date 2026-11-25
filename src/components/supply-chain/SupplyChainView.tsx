import React, { useRef, useState } from 'react';
import { Archive, Box, Copy, ChevronDown, ChevronLeft, ChevronRight, FileSearch, FolderOpen, KeyRound, List, Microscope, AlertTriangle } from 'lucide-react';
import { Artifact, relatedRecords } from '../../utils/supplyChainEvidence';
import { ArtifactChamber } from './ArtifactChamber';

function SavedJson({raw}: {raw: unknown}) {
  const [page,setPage] = useState(0);
  const lines = JSON.stringify(raw,null,2).split('\n');
  const start = page * 10;
  return <details className="si-json">
    <summary>Inspect saved JSON <ChevronDown size={14}/></summary>
    <div className="si-json-nav"><span>Lines {start+1} to {Math.min(start+10,lines.length)} of {lines.length}</span>
      <button disabled={page===0} aria-label="Previous JSON lines" onClick={()=>setPage(page-1)}><ChevronLeft size={16}/></button>
      <button disabled={start+10>=lines.length} aria-label="Next JSON lines" onClick={()=>setPage(page+1)}><ChevronRight size={16}/></button>
    </div>
    <pre>{lines.slice(start,start+10).join('\n')}</pre>
  </details>;
}

function DigestValue({digest}: {digest: string}) {
  const code = useRef<HTMLElement>(null);
  const [notice,setNotice] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(digest);
      setNotice('Copied');
    } catch {
      const selection = window.getSelection();
      if (!selection || !code.current) return;
      const range = document.createRange();
      range.selectNodeContents(code.current);
      selection.removeAllRanges();
      selection.addRange(range);
      setNotice('Digest selected. Use the Copy command.');
    }
  }
  return <><code ref={code}>{digest}</code><button className="si-copy" aria-label="Copy full digest" onClick={copy}><Copy size={13}/> Copy</button>
    <span className="si-copy-notice" role="status">{notice}</span></>;
}

function ArtifactInspector({record, index, count, step}: {
  record: Artifact; index: number; count: number; step: (delta: number) => void;
}) {
  return <section className="si-inspector" aria-labelledby="si-inspector-title" id="si-inspector" data-selected-file={record.path}>
    <div className="si-section-line"><Microscope size={17}/><h2 tabIndex={-1} id="si-inspector-title">Evidence inspector</h2>
      <div className="si-step" role="group" aria-label="Artifact navigation"><button aria-label="Previous artifact" disabled={index===0} onClick={()=>step(-1)}><ChevronLeft/></button>
        <small aria-live="polite">{index+1} of {count}</small><button aria-label="Next artifact" disabled={index===count-1} onClick={()=>step(1)}><ChevronRight/></button></div></div>
    <div className="si-inside" key={record.path}>
      <small className="si-kicker">{record.type}</small><h3>{record.filename}</h3>
      <div className={'si-state '+tone(record)}>{record.status}</div>
      {record.mismatch && <p className="si-warning"><AlertTriangle size={15}/>Filename references {record.expectedImage}. The payload identifies {record.identity}.</p>}
      {record.findings.map((f,i)=><div className="si-finding" key={i}><strong>{[f.severity, f.cve].filter(Boolean).join(' · ') || 'Recorded vulnerability'}</strong>
        <p>{[f.pkg,f.installed].filter(Boolean).join(' ')}{f.fixed && ' · Recorded fix '+f.fixed}{typeof f.score==='number' && ' · CVSS '+f.score}</p></div>)}
      {record.signature && <p className="si-warning"><KeyRound size={15}/>Cryptographic verification unconfirmed.</p>}
      <dl>
        {record.identity && <div><dt>Reported image</dt><dd><code>{record.identity}</code></dd></div>}
        {record.digest && <div><dt>{record.signature?'Manifest digest':'Repository digest'}</dt><dd><DigestValue digest={record.digest}/></dd></div>}
        {record.signer && <div><dt>Claimed signer</dt><dd>{record.signer}</dd></div>}

      </dl>
      <details className="si-source">
        <summary>Source &amp; provenance <ChevronDown size={14}/></summary>
        <code>{record.path}</code>
        <p className="si-limits">{record.signature ? 'Offline signature payload. Independent signer and registry verification remain unconfirmed.' :
          record.available ? 'Saved Trivy report. Scan execution time and current vulnerability status are unconfirmed.' : 'Scan results unavailable in this file.'}</p>
      </details>
      {record.raw !== undefined && <SavedJson raw={record.raw}/>}
    </div>
  </section>;
}
function tone(record: Artifact) {
  if (!record.available || record.signature || record.status.includes('unavailable')) return 'si-amber';
  return record.findings.length ? 'si-rose' : 'si-green';
}

export function SupplyChainView({records = []}: {records?: Artifact[]}) {
  const initial = records.findIndex(a => !a.signature && relatedRecords(a,records).length>0);
  const [index,setIndex] = useState(Math.max(0,initial));
  const workspace = useRef<HTMLDivElement>(null);
  const current = records[index];
  const related = current ? relatedRecords(current,records) : [];
  function inspect(record: Artifact) {
    setIndex(records.indexOf(record));
    const panel = workspace.current?.querySelector<HTMLElement>('#si-inspector-title');
    panel?.focus({preventScroll:true});
    panel?.scrollIntoView({block:'nearest'});
  }
  return <div className="si-studio">
    <header className="si-heading"><div><h1>Supply Chain Integrity</h1><p>Container Image Scanning &amp; Signature Evidence</p></div>
      <div className="si-collection"><Archive size={20}/><span><b>{records.length} saved artifacts</b><small>Historical / offline evidence</small></span></div></header>
    {current && <div className={'si-workspace '+tone(current)} ref={workspace}><ArtifactChamber record={current} related={related} select={inspect}/>
      <ArtifactInspector record={current} index={index} count={records.length} step={delta=>{
        const next = index+delta;
        if (next===0 || next===records.length-1) inspect(records[next]);
        else setIndex(next);
      }}/></div>}
    <section className="si-ledger" aria-labelledby="si-ledger-title"><div className="si-section-line"><List size={18}/><h2 id="si-ledger-title">Evidence ledger</h2><small>Repository files</small></div>
      {records.length>0 && <div className="si-columns" aria-hidden="true"><span>Source file</span><span>Reported image</span><span>Saved evidence</span></div>}
      {records.length===0 && <p>No saved artifact files available.</p>}
      {records.map((a,i)=>{const Icon=a.signature?KeyRound:FileSearch;return <button type="button" key={a.path} className={'si-row '+tone(a)} data-file={a.path} aria-pressed={index===i} aria-controls="si-inspector" onClick={()=>inspect(a)}>
        <span className="si-file"><i><Icon size={19}/></i><span><b>{a.filename}</b><small>{a.type}</small></span></span>
        <span className="si-identity">{a.identity ?? 'Identity unavailable'}{a.mismatch && <small>Filename / identity mismatch</small>}</span>
        <span className={'si-row-status '+tone(a)}>{a.findings.length===1 && a.findings[0].severity ? '1 recorded '+a.findings[0].severity.toLowerCase()+' finding' : a.status}{a.signature && a.available && <small>Cryptographic verification unconfirmed</small>}</span><ChevronRight size={15}/></button>})}
    </section>
    <details className="si-demo"><summary><FolderOpen size={16}/><span>Pipeline walkthrough</span><small>DEMONSTRATION / SIMULATED</small><ChevronDown size={15}/></summary>
      <p><Box size={16}/> Build → Scan → Sign → Admission</p><p>This teaching sequence illustrates where an admission policy could use signature verification. The lab’s Gatekeeper constraints cover container security, dedicated ServiceAccounts and workload hardening. This example contains no observed admission event.</p></details>
  </div>;
}
