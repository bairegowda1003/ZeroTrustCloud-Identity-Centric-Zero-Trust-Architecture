// Run against a local Vite server and a dedicated Chrome debugging session:
// node tests/verification-browser.mjs <site-url> <chrome-debug-url> [screenshot-directory]
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const [site,debug,output] = process.argv.slice(2);
assert.ok(site && debug,'Supply the local site URL and Chrome debugging URL.');
const page = await (await fetch(debug+'/json/new?about:blank',{method:'PUT'})).json();
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let id=0;
const pending=new Map();
const exceptions=[];
let verificationRequest;
socket.onmessage=({data})=>{
  const msg=JSON.parse(data);
  if(msg.method==='Network.responseReceived' &&
    new URL(msg.params.response.url).pathname==='/api/security/verification') verificationRequest=msg.params.requestId;
  if(msg.method==='Runtime.exceptionThrown') exceptions.push(msg.params.exceptionDetails.text);
  if(!pending.has(msg.id)) return;
  const {resolve,reject}=pending.get(msg.id);
  pending.delete(msg.id);
  if(msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
};
function call(method,params={}) {
  return new Promise((resolve,reject)=>{
    pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression) {
  const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function until(expression) {
  for(let attempt=0;attempt<150;attempt++){
    if(await evaluate(expression))return;
    await delay(100);
  }
  throw Error('Timed out waiting for '+expression);
}
async function key(key,code){
  for(const type of ['keyDown','keyUp']) await call('Input.dispatchKeyEvent',{type,key,code:key,windowsVirtualKeyCode:code,text:key==='Enter' && type==='keyDown'?'\r':''});
}
const matrix='.vs-cells button';
const register='.vs-row';
async function click(selector) {
  await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');
}
async function navigate(label) {
  const select="Array.from(document.querySelectorAll('.sidebar-nav-item')).find(b=>b.textContent.includes("+JSON.stringify(label)+"))";
  await until('Boolean('+select+')');
  await evaluate(select+'.click()');
}
async function capture(theme,view) {
  if(!output)return;
  await mkdir(output,{recursive:true});
  await delay(220);
  const {data}=await call('Page.captureScreenshot',{format:'png'});
  await writeFile(join(output,theme+'-'+view+'.png'),Buffer.from(data,'base64'));
}
async function layout() {
  const overflowing=await evaluate(`[...document.querySelectorAll('.vs-studio,.vs-studio *')].filter(e=>
    e instanceof HTMLElement && e.clientWidth>0 && getComputedStyle(e).display!=='inline' &&
    (e.scrollWidth>e.clientWidth+2 || (e.scrollHeight>e.clientHeight+2 &&
      !(e.matches('.vs-inspector') && getComputedStyle(e).overflowY==='auto') &&
      ['auto','hidden','clip','scroll'].includes(getComputedStyle(e).overflowY)))
  ).map(e=>e.className)`);
  assert.deepEqual(overflowing,[]);
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
}
try {
  await call('Runtime.enable');await call('Page.enable');await call('Network.enable');
  await call('Page.navigate',{url:site});
  await until("!!document.querySelector('.launch-enter')");
  await evaluate("document.querySelector('.launch-enter').click()");
  await until("!document.querySelector('.tm-launch')");
  await navigate('Security Verification');
  await until("document.querySelectorAll('.vs-row').length>0");
  // Compare with the exact collection used by the UI. A second GET may observe different replicas.
  const {body}=await call('Network.getResponseBody',{requestId:verificationRequest});
  const response=JSON.parse(body);
  const ids=response.checks.map(c=>c.id);
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.vs-row'),b=>b.dataset.check)"),ids);
  console.log('Proxy response',response.collectedAt,ids.length,'checks');
  console.log('Result counts', await evaluate("document.querySelector('.vs-legend').innerText"));
  for(const [width,height] of [[1366,768],[1440,900],[1536,864],[1920,1080],[390,844]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    for(const theme of ['dark','light']){
      if(!await evaluate("document.documentElement.classList.contains('"+theme+"')")) await click('[aria-label="Toggle visual theme"]');
      await until("document.documentElement.classList.contains('"+theme+"')");
      await evaluate("document.querySelector('.main-content-viewport').scrollTop=0");
      await layout();
      if(width===1440) {
        await evaluate("document.activeElement.blur();document.querySelector('.vs-heading').scrollIntoView({block:'start',behavior:'instant'})");
        await capture(theme,'matrix');
      }
      await evaluate("document.querySelector('.vs-cells button').focus()");await key('Enter',13);
      await until("document.activeElement.id==='vs-control-title'");
      assert.equal(await evaluate("document.querySelector('.vs-inspector>code').textContent"),ids[0]);
      await click('[aria-label="Next check"]');
      assert.equal(await evaluate("document.querySelector('.vs-row[aria-pressed=true]').dataset.check"),ids[1]);
      await click('[aria-label="Previous check"]');
      await click('.vs-inspector summary');await layout();
      if(width>900) assert.ok(await evaluate("document.querySelector('.vs-inspector').offsetHeight<=document.querySelector('.vs-matrix').offsetHeight+1"));
      assert.ok(await evaluate("!!JSON.parse(document.querySelector('.vs-inspector pre').textContent)"));
      await key('Escape',27);
      assert.ok(await evaluate("document.activeElement===document.querySelector('.vs-cells button')"));
      await evaluate("document.querySelector('.vs-register').scrollIntoView()");
      if(width===1440) await capture(theme,'register');
      for(const check of response.checks){
        await click('.vs-row[data-check="'+check.id+'"]');
        assert.equal(await evaluate("document.querySelector('.vs-cells [aria-pressed=true]').dataset.check"),check.id);
        await click('.vs-inspector summary');
        await layout();
        assert.deepEqual(await evaluate("JSON.parse(document.querySelector('.vs-inspector pre').textContent)"),check.evidence);
      }
      await click('.vs-row[data-check="spire-control-plane-components"]');
      await layout();
      if(width===1440) {
        await evaluate("document.querySelector('.vs-heading').scrollIntoView({block:'start',behavior:'instant'})");
        await capture(theme,'inspector');
      }
      await click('[aria-label="Close evidence inspector"]');
      assert.ok(await evaluate("document.activeElement.matches('.vs-row')"));
      await evaluate("document.querySelector('.vs-search input').focus()");
      await call('Input.insertText',{text:'istio-workload-strict-mtls'});
      assert.equal(await evaluate("document.querySelectorAll('.vs-row').length"),1);
      await key('Escape',27);
      await until("document.querySelector('.vs-search input').value===''");
      await evaluate("(()=>{const select=document.querySelector('.vs-tools select');select.value='UNKNOWN';select.dispatchEvent(new Event('change',{bubbles:true}));})()");
      assert.ok(await evaluate("Array.from(document.querySelectorAll('.vs-row')).every(r=>r.querySelector('.vs-result').textContent.includes('UNKNOWN'))"));
      await evaluate("(()=>{const select=document.querySelector('.vs-tools select');select.value='All';select.dispatchEvent(new Event('change',{bubbles:true}));})()");
      assert.equal(await evaluate("document.querySelector('.vs-history').open"),false);
      console.log(theme,width,height,'passed');
    }
  }
  // Advance the test page clock while retaining the genuine API observation.
  await evaluate("window.qaNow=Date.now;Date.now=()=>window.qaNow()+180000");
  await until("document.querySelector('.vs-freshness').textContent.includes('stale')");
  await click('.vs-cells button');
  assert.ok(await evaluate("document.querySelector('.vs-inspector .vs-result').textContent.includes('Last known')"));
  await key('Escape',27);
  await evaluate("Date.now=window.qaNow;delete window.qaNow");
  await call('Network.emulateNetworkConditions',{offline:false,latency:700,downloadThroughput:-1,uploadThroughput:-1});
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await click('.vs-refresh');
  await until("document.querySelector('.vs-surface').dataset.loading==='true'");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.vs-matrix'),'::after').animationName"),'vs-sweep');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.vs-matrix'),'::after').animationName"),'none');
  await until("document.querySelector('.vs-surface').dataset.loading==='false'");
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.vs-matrix'),'::after').animationName"),'none');
  await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await call('Network.setBlockedURLs',{urls:['*/api/security/verification*']});
  await click('.vs-refresh');await until("document.querySelector('.vs-freshness')?.textContent.includes('refresh failed')");
  assert.equal(await evaluate("document.querySelectorAll('.vs-row').length"),ids.length);
  assert.ok(await evaluate("Array.from(document.querySelectorAll('.vs-result')).every(b=>b.dataset.age==='past' && !b.textContent.includes('Last known'))"));
  await navigate('Supply Chain Integrity');await navigate('Security Verification');
  await until("document.querySelector('.vs-empty')?.textContent.includes('unavailable')");
  assert.equal(await evaluate("document.querySelectorAll('.vs-row').length"),0);
  await call('Network.setBlockedURLs',{urls:[]});await click('.vs-refresh');
  await until("document.querySelectorAll('.vs-row').length>0");
  assert.deepEqual(exceptions,[]);
  console.log('Retained snapshot, initial failure, recovery and runtime checks passed.');
} finally {socket.close();await fetch(debug+'/json/close/'+page.id);}
