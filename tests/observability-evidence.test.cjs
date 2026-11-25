const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Setup TypeScript and JSON transpile hooks for server rendering
require.extensions['.json'] = (module, filename) => {
  const content = fs.readFileSync(filename, 'utf8');
  module.exports = JSON.parse(content);
};

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
};

const {VerificationStudio} = require('../src/components/observability/SecurityObservabilityView');
const {domainOf} = require('../src/components/verification/verificationDomains');
const {VerificationInspector} = require('../src/components/verification/VerificationInspector');
const now = new Date().toISOString();
const checks = ['k8s-example','istio-example','future-example'].map((id,i)=>({
  id,control:id,status:['PASS','FAIL','UNKNOWN'][i],observedAt:now,source:'test-context / pods',
  reason:'Test observation',evidence:{ready:false,replicas:0}
}));
const render = props => renderToStaticMarkup(React.createElement(VerificationStudio,{observation:{
  data:{source:'automated-verification',checks,collectedAt:now},isLoading:false,staleReason:null,error:null,refresh(){},...props
}}));
test('matrix and register reflect the actual collection, including previously unseen checks',()=>{
  const html=render();
  assert.match(html,/3 checks/);
  for(const c of checks) {
    assert.equal(html.split('data-check="'+c.id+'"').length-1,2);
    assert.ok(html.includes('1 '+c.status));
  }
  assert.ok(html.includes('Other controls'));
  assert.match(render({data:{checks:[],collectedAt:now}}),/Collection returned no checks/);
});
test('check families map to their observed domains',()=>{
  for(const [id,domain] of Object.entries({k8s:'Kubernetes readiness',gatekeeper:'Policy enforcement',calico:'Network isolation',istio:'Istio mTLS',spire:'SPIRE & workload identity',workload:'SPIRE & workload identity'})) assert.equal(domainOf(id+'-check'),domain);
});
test('stale and unavailable views distinguish retained observations from collection failures',()=>{
  const stale=render({staleReason:'Latest refresh failed',error:'HTTP 503'});
  assert.match(stale,/Last-known snapshot/);assert.doesNotMatch(stale,/Last known · /);
  assert.match(stale,/data-result="PASS" data-age="past"/);
  const unavailable=render({data:null,error:'HTTP 503'});
  assert.match(unavailable,/Verification evidence unavailable/);assert.doesNotMatch(unavailable,/data-check=/);
  assert.match(render({data:null,isLoading:true}),/Collecting verification evidence/);
});
test('inspector preserves falsy evidence and exposes named navigation and raw disclosure',()=>{
  const html=renderToStaticMarkup(React.createElement(VerificationInspector,{check:checks[1],headingRef:{current:null},close(){},lastKnown:true}));
  for(const label of ['Previous check','Next check','Close evidence inspector','Raw evidence','Last known · FAIL','false','>0<','test-context / pods']) assert.ok(html.includes(label));
});
test('historical example is collapsed below the verification register',()=>{
  const html=render();
  assert.match(html,/<details class="vs-history"><summary>/);
  assert.ok(html.indexOf('Verification register')<html.indexOf('HISTORICAL EXPERIMENT / DEMONSTRATION'));
  assert.doesNotMatch(html,/ZeroTrust Index|Simulated transit|Incidents \(Simulated\)/);
});
