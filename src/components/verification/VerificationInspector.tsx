import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { VerificationCheck } from '../../utils/securityVerification';
import { SnapshotTime } from '../SnapshotTime';
import { domainOf, scopeNotes } from './verificationDomains';

const fieldLabels = new Map(Object.entries({
  name: 'Name', kind: 'Resource kind', readyReplicas: 'Ready replicas',
  desiredReplicas: 'Desired replicas', apiGroups: 'API groups', sa: 'Service account',
  podSelector: 'Pod selector', namespaceSelector: 'Namespace selector', matchLabels: 'Match labels',
  spiffeIDTemplate: 'SPIFFE ID template', workloadScoped: 'Workload scoped',
  policyTypes: 'Policy types', ingressRules: 'Ingress rules', webhookEnforced: 'Webhook enforced',
  enforcementPoints: 'Enforcement points', serviceAccountName: 'Service account name',
  components: 'Components', available: 'Available', error: 'Error', nodes: 'Nodes',
  workloads: 'Workloads', podsSelected: 'Pods selected', entriesToSet: 'Entries to set',
  entryFailures: 'Entry failures', namespacesSelected: 'Namespaces selected', entriesMasked: 'Entries masked',
}));

function evidenceFacts(evidence: Record<string, unknown>) {
  type Fact = {label: string; value: string; path: string};
  const groups = new Map<string, {label: string; fields: Fact[]}>();
  function visit(value: unknown, path: string[], labels: string[]) {
    if (Array.isArray(value) && value.some(item => typeof item !== 'string')) {
      value.forEach((item, index) => {
        const name = item && typeof item === 'object' && typeof item.name === 'string' ? item.name : '';
        const group = labels[labels.length - 1] + ' [' + index + ']' + (name ? ' · ' + name : '');
        visit(item, [...path, String(index)], [...labels.slice(0, -1), group]);
      });
    } else if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length) {
      for (const [key, child] of Object.entries(value)) {
        visit(child, [...path, key], [...labels, fieldLabels.get(key) ?? key]);
      }
    } else {
      const parent = JSON.stringify(path.slice(0, -1));
      const group = groups.get(parent) ?? {label: labels.slice(0, -1).join(' / '), fields: []};
      const display = Array.isArray(value) && value.length ? value.join(', ')
        : typeof value === 'object' ? JSON.stringify(value) : String(value);
      group.fields.push({label: labels[labels.length - 1], value: display, path: JSON.stringify(path)});
      groups.set(parent, group);
    }
  }
  if (Object.keys(evidence).length) visit(evidence, [], []);
  return groups;
}
export function VerificationInspector({check,previous,next,close,headingRef,lastKnown}: {
  check: VerificationCheck; previous?:()=>void; next?:()=>void; close:()=>void;
  headingRef:React.RefObject<HTMLHeadingElement>; lastKnown:boolean;
}) {
  const facts=evidenceFacts(check.evidence);
  const note=scopeNotes[domainOf(check.id)];
  return <aside className="vs-inspector" id="vs-inspector" aria-labelledby="vs-control-title">
    <div className="vs-inspector-bar"><strong>Selected evidence</strong><div>
      <button aria-label="Previous check" disabled={!previous} onClick={previous}><ChevronLeft/></button>
      <button aria-label="Next check" disabled={!next} onClick={next}><ChevronRight/></button>
      <button aria-label="Close evidence inspector" onClick={close}><X/></button></div></div>
    <h3 id="vs-control-title" ref={headingRef} tabIndex={-1}>{check.control}</h3>
    <code>{check.id}</code>
    <p className="vs-result" data-result={lastKnown?'past':check.status}>{lastKnown?'Last known · ':''}{check.status}</p>
    <p className="vs-reason">{check.reason}</p>
    {facts.size ? Array.from(facts, ([parent, group]) => <div className="vs-fact-group" key={parent}>
      {group.label && <strong className="vs-resource">{group.label}</strong>}
      <dl className="vs-facts" aria-label={group.label || undefined}>
        {group.fields.map(({label, value, path}) => <div key={path}>
          <dt>{label}</dt><dd>{value}</dd>
        </div>)}
      </dl>
    </div>) : <p>No evidence fields reported.</p>}
    <div className="vs-provenance"><small>Kubernetes source</small><code>{check.source}</code>
      <small>Observed</small><SnapshotTime value={check.observedAt}/></div>
    {note && <p className="vs-scope">{note}</p>}
    <details key={check.id}><summary>Raw evidence <ChevronDown size={14}/></summary>
      <pre>{JSON.stringify(check.evidence,null,2)}</pre></details>
  </aside>;
}
