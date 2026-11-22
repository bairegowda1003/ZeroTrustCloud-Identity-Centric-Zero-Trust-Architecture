const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Setup TypeScript transpile hook for server rendering
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2020,
      },
    });
    module._compile(compiled.outputText, filename);
  };
}

// Compile utility module in memory
const filename = path.resolve(__dirname, '../src/utils/identityWorkloads.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'require', 'module', compiled)(loaded.exports, require, loaded);
const { validateIdentityWorkloads, snapshotAgeReason, requestIdentityWorkloads } = loaded.exports;

// Synthetic test fixture matching the live backend response
const fixture = () => ({
  source: 'live-kubernetes',
  cluster: 'kind-trustmesh-network-lab',
  namespace: 'trustmesh-integration-test',
  available: true,
  workloads: [
    {
      name: 'trustmesh-integration-authorized-7c9bcd47f-6txvk',
      phase: 'Running',
      serviceAccountName: 'trustmesh-authorized-sa',
      labels: { app: 'authorized-client' },
      readyContainers: 2,
      totalContainers: 2,
    },
    {
      name: 'trustmesh-integration-spiffe-verifier',
      phase: 'Succeeded',
      serviceAccountName: 'default',
      labels: { app: 'spiffe-verifier' },
      readyContainers: 0,
      totalContainers: 1,
    },
  ],
  serviceAccounts: [
    { name: 'default' },
    { name: 'trustmesh-authorized-sa' },
  ],
  spireRegistration: {
    name: 'trustmesh-integration-workload-identity',
    spiffeIDTemplate: 'spiffe://trustmesh.internal/ns/{{ .PodMeta.Namespace }}/sa/{{ .PodSpec.ServiceAccountName }}',
    namespaceSelector: { matchLabels: { 'kubernetes.io/metadata.name': 'trustmesh-integration-test' } },
    podSelector: { matchLabels: { 'spiffe.io/spire-managed-identity': 'true' } },
    statistics: { podsSelected: 3, entriesToSet: 3 },
    available: true,
    error: null,
  },
  spireComponents: [
    {
      name: 'trustmesh-spire-server',
      kind: 'StatefulSet',
      desiredReplicas: 1,
      readyReplicas: 1,
      available: true,
      error: null,
    },
    {
      name: 'trustmesh-spire-agent',
      kind: 'DaemonSet',
      desiredReplicas: 1,
      readyReplicas: 1,
      available: true,
      error: null,
    },
    {
      name: 'trustmesh-spire-spiffe-csi-driver',
      kind: 'DaemonSet',
      desiredReplicas: 1,
      readyReplicas: 1,
      available: true,
      error: null,
    },
  ],
  collectedAt: '2026-11-18T14:30:00Z',
});

test('accepts valid live identity workload responses', () => {
  const result = validateIdentityWorkloads(fixture());
  assert.deepEqual(result, fixture());
  assert.equal(result.workloads.length, 2);
  assert.equal(result.spireRegistration.available, true);
  assert.equal(result.spireComponents.length, 3);
});

test('handles partial SPIRE failure while preserving live workloads', () => {
  const partial = fixture();
  partial.spireRegistration.available = false;
  partial.spireRegistration.error = 'SPIRE registration unavailable';
  partial.spireComponents[0].available = false;
  partial.spireComponents[0].error = 'SPIRE controller status unavailable';

  const result = validateIdentityWorkloads(partial);
  assert.equal(result.available, true);
  assert.equal(result.workloads.length, 2);
  assert.equal(result.spireRegistration.available, false);
  assert.equal(result.spireRegistration.error, 'SPIRE registration unavailable');
  assert.equal(result.spireComponents[0].available, false);
});

test('rejects malformed identity responses', () => {
  const mutations = [
    (v) => { v.source = 'demo'; },
    (v) => { v.collectedAt = 'invalid'; },
    (v) => { v.cluster = ''; },
    (v) => { v.namespace = ''; },
    (v) => { v.workloads = null; },
    (v) => { v.workloads[0].name = ''; },
    (v) => { v.workloads[0].readyContainers = 3; }, // ready > total
    (v) => { v.serviceAccounts = 'invalid'; },
    (v) => { v.spireRegistration = null; },
    (v) => { v.spireComponents = {}; },
  ];
  for (const mutate of mutations) {
    const value = fixture();
    mutate(value);
    assert.throws(() => validateIdentityWorkloads(value), /Invalid Identity Workloads response/);
  }
});

test('freshness evaluator marks stale and future timestamps correctly', () => {
  const collected = fixture().collectedAt;
  const time = Date.parse(collected);
  assert.equal(snapshotAgeReason(collected, time + 30_000), null);
  assert.match(snapshotAgeReason(collected, time + 65_000), /60 seconds/);
  assert.match(snapshotAgeReason(collected, time - 35_000), /future/);
});

test('fetch handles HTTP 503 error responses with API detail', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, '/api/identity/workloads');
    return {
      ok: false,
      status: 503,
      json: async () => ({ error: 'Pod or ServiceAccount inventory unavailable' }),
    };
  });
  await assert.rejects(
    requestIdentityWorkloads(new AbortController().signal),
    /Pod or ServiceAccount inventory unavailable/
  );
  mock.mock.restore();
});

test('Identity page identifies Kubernetes and registration provenance during loading', () => {
  const { IdentityAccessView } = require('../src/components/identity/IdentityAccessView.tsx');
  const html = renderToStaticMarkup(React.createElement(IdentityAccessView));
  assert.match(html, /Identity Access Studio/);
  assert.match(html, /Kubernetes reports the assignments/);
  assert.match(html, /does not prove an issued SVID is currently valid/);
  assert.doesNotMatch(html, /Demonstration Workload Catalog|DEMONSTRATION DATA/);
});

const { identityRelationships, registrationMatch, replicaReadiness } = require('../src/utils/identityFabric.ts');
test('assignment graph preserves shared, default, referenced-only and unused accounts', () => {
  const data = fixture();
  data.workloads.push({...data.workloads[0], name:'another-pod'}, {...data.workloads[0],name:'third-pod',serviceAccountName:'missing'});
  data.serviceAccounts.push({name:'unused'});
  const graph = identityRelationships(data);
  assert.deepEqual(graph.accounts.map(a => [a.name,a.discovered,a.isDefault,a.pods.length]), [
    ['trustmesh-authorized-sa',true,false,2],['default',true,true,1],['missing',false,false,1],['unused',true,false,0]
  ]);
  data.available=false;
  assert.deepEqual(identityRelationships(data),{pods:[],accounts:[],selectedPods:[]});
});

test('registration requires affirmative namespace and workload selector evidence', () => {
  const data=fixture(), pod=data.workloads[0];
  assert.equal(registrationMatch(data,pod),undefined);
  pod.labels['spiffe.io/spire-managed-identity']='true';
  assert.equal(registrationMatch(data,pod),true);
  data.namespace='other';
  assert.equal(registrationMatch(data,pod),false);
  data.namespace='trustmesh-integration-test';
  data.spireRegistration.podSelector={matchExpressions:[{}]};
  assert.equal(registrationMatch(data,pod),undefined);
  data.spireRegistration.available=false;
  assert.equal(identityRelationships(data).selectedPods.length,0);
});

test('missing, contradictory and partial component counts never default to ready', () => {
  const c=fixture().spireComponents[0];
  assert.equal(replicaReadiness(c),'1/1 replicas ready');
  assert.equal(replicaReadiness({...c,desiredReplicas:3}),'1/3 replicas ready');
  assert.equal(replicaReadiness({...c,readyReplicas:null}),'Unknown');
  assert.equal(replicaReadiness({...c,readyReplicas:2}),'Unknown');
  assert.equal(replicaReadiness({...c,available:false}),'Unavailable');
  const data=fixture(); data.spireComponents[0].readyReplicas='1';
  assert.throws(()=>validateIdentityWorkloads(data));
});

test('fabric uses API readiness, completed phase and identity collection timestamp', () => {
  const { IdentityFabric }=require('../src/components/identity/IdentityFabric.tsx');
  const data=validateIdentityWorkloads(fixture());
  const html=renderToStaticMarkup(React.createElement(IdentityFabric,{data,freshness:'Collected',checks:[],verificationState:'Unavailable'}));
  assert.match(html,/Succeeded .*0\/1 ready/);
  assert.match(html,/Running .*2\/2 ready/);
  const {IdentityEvidence}=require('../src/components/identity/LiveIdentityStatus.tsx');
  const feed={data,isLoading:false,error:null,staleReason:null,refresh() {}};
  const page=renderToStaticMarkup(React.createElement(IdentityEvidence,{
    inventory:feed, verificationFeed:{...feed,data:{collectedAt:'2026-11-18T14:31:00Z',checks:[]}}
  }));
  assert.match(page,/identity\/workloads[^<]*<time dateTime="2026-11-18T14:30:00Z"/i);
  assert.match(page,/security\/verification[^<]*<time dateTime="2026-11-18T14:31:00Z"/i);
});
test('selecting a shared account highlights both bindings and opens its actual inventory', () => {
  const {IdentityFabric}=require('../src/components/identity/IdentityFabric.tsx');
  const data=fixture();
  data.workloads.push({...data.workloads[0],name:'second-client'});
  const html=renderToStaticMarkup(React.createElement(IdentityFabric,{
    data,checks:[],verificationState:'Unavailable',freshness:'Last known snapshot',
    pick:{kind:'account',name:data.workloads[0].serviceAccountName}
  }));
  assert.equal((html.match(/class="if-binding active"/g)||[]).length,2);
  assert.match(html,/role="dialog"/);
  assert.match(html,/Assigned workloads · 2/);
  assert.match(html,/second-client/);
  assert.match(html,/Last known snapshot/);
  assert.match(html,/No reported assignments|Default · 1 assigned/);
});

test('unused default account has no edge and registration selects only evidenced pods', () => {
  const data=fixture(); data.workloads[1].serviceAccountName='trustmesh-authorized-sa';
  data.workloads[1].labels['spiffe.io/spire-managed-identity']='true';
  const graph=identityRelationships(data);
  assert.equal(graph.accounts.find(a=>a.isDefault).pods.length,0);
  assert.deepEqual(graph.selectedPods.map(p=>p.name),[data.workloads[1].name]);
});

test('expanded verification presents reported replica details before unchanged raw evidence', () => {
  const {CheckEvidence}=require('../src/components/identity/IdentityCheckEvidence.tsx');
  const evidence={components:[{kind:'DaemonSet',name:'agent',available:true,desiredReplicas:2,readyReplicas:1}],diagnostic:'collector note'};
  const html=renderToStaticMarkup(React.createElement(CheckEvidence,{checks:[{
    id:'spire-control-plane-components',control:'Component readiness',status:'FAIL',
    source:'test collector',reason:'One replica ready',observedAt:'2026-11-18T14:30:00Z',evidence
  }]}));
  assert.match(html,/class="if-check" open/);
  assert.ok(html.indexOf('1/2 replicas ready') < html.indexOf('Inspect raw evidence'));
  assert.ok(html.includes(JSON.stringify(evidence,null,2).replaceAll('"','&quot;')));
});


test('the chamber follows a workload selection and an unused account has no routes', () => {
  const {IdentityFabric}=require('../src/components/identity/IdentityFabric.tsx');
  const data=fixture();
  data.workloads[1].labels['spiffe.io/spire-managed-identity']='true';
  data.serviceAccounts.push({name:'unused'});
  const render=pick=>renderToStaticMarkup(React.createElement(IdentityFabric,{
    data,pick,checks:[],verificationState:'Unavailable',freshness:'Collected'
  }));
  const verifier=render({kind:'pod',name:data.workloads[1].name});
  assert.match(verifier,/Selected ServiceAccount<\/small><strong>default<\/strong>/);
  assert.equal((verifier.match(/data-binding=/g)||[]).length,1);
  assert.match(verifier,new RegExp('data-binding="'+data.workloads[1].name+'"'));
  const unused=render({kind:'account',name:'unused'});
  assert.match(unused,/No reported assignments/);
  assert.doesNotMatch(unused,/data-binding=/);
  const registration=render({kind:'registration',name:data.spireRegistration.name});
  assert.equal((registration.match(/data-selector=/g)||[]).length,1);
  assert.match(registration,new RegExp('data-selector="'+data.workloads[1].name+'"'));
  assert.doesNotMatch(registration,/data-binding=/);
});

test('registration owns the chamber and clears every pressed ServiceAccount', () => {
  const {IdentityFabric}=require('../src/components/identity/IdentityFabric.tsx');
  const data=fixture();
  const render=pick=>renderToStaticMarkup(React.createElement(IdentityFabric,{
    data,pick,checks:[],freshness:'Collected',verificationState:'Unavailable'
  }));
  const registration=render({kind:'registration',name:data.spireRegistration.name});
  assert.match(registration,/class="studio-seal"/);
  assert.doesNotMatch(registration,/class="studio-credential"|Selected ServiceAccount/);
  const picker=registration.match(/<nav[^>]*class="studio-accounts"[\s\S]*?<\/nav>/)[0];
  assert.doesNotMatch(picker,/aria-pressed="true"/);
  const account=render({kind:'account',name:data.workloads[0].serviceAccountName});
  assert.match(account,/class="studio-credential"/);
  assert.doesNotMatch(account,/class="studio-seal"/);
});
