const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
for (const extension of ['.ts','.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename,'utf8'), {
      compilerOptions: {module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true,target:ts.ScriptTarget.ES2020}
    });
    module._compile(compiled.outputText, filename);
  };
}
const {readArtifact,readCollection,relatedRecords} = require('../src/utils/supplyChainEvidence');
const {SupplyChainView} = require('../src/components/supply-chain/SupplyChainView');
const files = {};
for (const dir of ['trivy/reports','cosign/signatures']) {
  const folder = 'k8s/supply-chain/'+dir;
  for (const name of fs.readdirSync(folder).filter(n=>n.endsWith('.json'))) {
    const source = path.posix.join(folder,name);
    files[source] = fs.readFileSync(source,'utf8');
  }
}
const records = readCollection(files);
const vuln = records.find(a=>a.filename==='order-api-v1.1-vuln.json');
const clean = records.find(a=>a.filename==='order-api-v1.2-clean.json');
const signature = records.find(a=>a.filename==='verified-signatures.json');
test('payload identity survives filename mismatch and preserves the recorded finding',()=>{
  assert.equal(vuln.identity,'trustmesh/mysql-proxy:cache');
  assert.equal(vuln.expectedImage,'order-api');
  assert.equal(vuln.mismatch,true);
  assert.deepEqual(vuln.findings,[{cve:'CVE-2024-21508',severity:'CRITICAL',pkg:'mysql2',installed:'3.9.2',fixed:'3.9.4',score:8.8}]);
  assert.equal(clean.identity,'trustmesh/order-api:v1.2');
  assert.equal(clean.status,'No findings recorded');
  assert.equal(clean.mismatch,false);
  assert.equal(signature.identity,'trustmesh/order-api');
});
test('digest links require repository, manifest digest and available records',()=>{
  assert.deepEqual(relatedRecords(signature,records),[clean]);
  assert.deepEqual(relatedRecords(vuln,records),[]);
  for(const change of [{digest:undefined},{digest:vuln.digest},{reference:'wrong'},{available:false}]){
    assert.deepEqual(relatedRecords({...signature,...change},records),[]);
  }
  const imageIdOnly=readArtifact(clean.path,JSON.stringify({...clean.raw,Metadata:{ImageID:signature.digest}}));
  assert.deepEqual(relatedRecords(signature,[imageIdOnly]),[]);
});
test('missing, partial and unreadable evidence cannot manufacture identities, signers, or clean findings',()=>{
  assert.deepEqual(readCollection({}),[]);
  for(const text of ['{','{}','null']){
    const a=readArtifact(signature.path,text);
    assert.equal(a.status,'Evidence unavailable');
    assert.equal(a.signer,undefined); assert.equal(a.identity,undefined);
  }
  for(const Results of [[],[{}],[{Vulnerabilities:[]},{}]]) {
    assert.equal(readArtifact(clean.path,JSON.stringify({Results})).status,'Findings unavailable');
  }
  assert.equal(readArtifact(clean.path,JSON.stringify({Results:[{},...vuln.raw.Results]})).findings.length,1);
});
test('studio distinguishes digest evidence, offline provenance and the collapsed simulated sequence',()=>{
  const html=renderToStaticMarkup(React.createElement(SupplyChainView,{records}));
  assert.match(html,/3 saved artifacts/);
  assert.match(html,/Historical \/ offline evidence/);
  assert.match(html,/SAVED DIGEST MATCH/);
  assert.match(html,/Both files contain the same digest string/);
  assert.match(html,/Source &amp; provenance/);
  assert.match(html,/Filename \/ identity mismatch/);
  assert.match(html,/Cryptographic verification unconfirmed/);
  assert.match(html,/<details class="si-demo"><summary>.*?DEMONSTRATION \/ SIMULATED/);
  assert.ok(html.indexOf('Evidence ledger')<html.indexOf('DEMONSTRATION'));
  assert.doesNotMatch(html,/Monitored Images|Blocked Deployments/);
  const cosign=renderToStaticMarkup(React.createElement(SupplyChainView,{records:[signature]}));
  assert.match(cosign,/Cryptographic verification unconfirmed/);
  assert.match(cosign,/dedicated ServiceAccounts and workload hardening/);
  const empty=renderToStaticMarkup(React.createElement(SupplyChainView));
  assert.match(empty,/No saved artifact files available/);
});
