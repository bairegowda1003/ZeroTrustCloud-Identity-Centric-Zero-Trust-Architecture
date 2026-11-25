// Run against a local Vite server and a dedicated Chrome debugging session:
// node tests/launch-browser.mjs <site-url> <chrome-debug-url> [screenshot-directory]
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
const consoleErrors=[];
socket.onmessage=({data})=>{
  const msg=JSON.parse(data);
  if(msg.method==='Runtime.consoleAPICalled' && msg.params.type==='error') consoleErrors.push(msg.params.args.map(arg=>arg.value || arg.description));
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
    if(await evaluate('Boolean('+expression+')'))return;
    await delay(100);
  }
  throw Error('Timed out waiting for '+expression);
}
async function key(key,code){
  for(const type of ['keyDown','keyUp']) await call('Input.dispatchKeyEvent',{type,key,code:key,windowsVirtualKeyCode:code,text:key==='Enter' && type==='keyDown'?'\r':''});
}
async function click(selector) {
  await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');
}

const video = 'document.querySelector(".launch-film video")';
const requests = [];
// Record startup collection independently of the cinematic media lifecycle.
await call('Runtime.enable');
await call('Page.enable');
await call('Network.enable');
const onMessage = socket.onmessage;
socket.onmessage = event => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Network.requestWillBeSent') requests.push(new URL(msg.params.request.url).pathname);
  onMessage(event);
};
const preference = value => call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value}]});
async function openNewSession(theme) {
  await evaluate(`sessionStorage.removeItem('trustmesh.launch.entered');localStorage.setItem('theme','${theme}')`);
  const old = await evaluate('performance.timeOrigin');
  await call('Page.reload');
  await until(`performance.timeOrigin!==${old} && document.querySelector('.launch-enter')`);
}
async function enter() {
  await evaluate("document.querySelector('.launch-enter').focus()");
  await key('Enter',13);
  await until("!document.querySelector('.tm-launch') && document.activeElement.textContent==='Zero Trust Command Center'");
}
try {
  await preference('no-preference');
  await call('Page.navigate',{url:site});
  await until("document.querySelector('.launch-enter')");
  await openNewSession('morning');
  await until(`${video}?.currentTime>0 && !${video}.paused`);
  assert.ok(await evaluate(`${video}.muted && ${video}.loop && ${video}.playsInline`));
  assert.ok(await evaluate("document.querySelector('.launch-brand img').naturalWidth>0 && !document.querySelector('.shell-header')"));
  await click('.launch-motion');
  await until(`${video}.paused`);
  const t = await evaluate(`${video}.currentTime`);
  await delay(160);
  assert.equal(await evaluate(`${video}.currentTime`),t);
  const visibility = hidden => evaluate(`Object.defineProperty(document,'hidden',{configurable:true,value:${hidden}});document.dispatchEvent(new Event('visibilitychange'));void 0`);
  await visibility(true);
  await visibility(false);
  assert.ok(await evaluate(`${video}.paused`));
  await click('.launch-motion');
  await until(`${video}.currentTime>${t}`);
  await visibility(true);
  await until(`${video}.paused`);
  await visibility(false);
  await until(`!${video}.paused`);
  await evaluate(`window.launchMedia=${video};window.launchMedia.currentTime=window.launchMedia.duration-.25`);
  await until(`${video}.currentTime<1`);
  for (const [width,height] of [[390,844],[768,1024],[1366,768],[1440,900],[1536,864],[1920,1080]]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    assert.ok(await evaluate(`(() => {
      const a=document.querySelector('.tm-launch'), b=document.querySelector('.launch-enter').getBoundingClientRect();
      return a.scrollWidth===a.clientWidth && b.left>=0 && b.right<=innerWidth && b.bottom<=innerHeight;
    })()`));
    if(output && [390,768,1440].includes(width)){
      await mkdir(output,{recursive:true});
      const {data}=await call('Page.captureScreenshot',{format:'png'});
      await writeFile(join(output,`launch-${width}x${height}.png`),Buffer.from(data,'base64'));
    }
  }
  for(const path of ['/api/cluster/status','/api/identity/workloads','/api/policies/gatekeeper','/api/security/network','/api/security/verification']) assert.ok(requests.includes(path),path);
  await enter();
  assert.deepEqual(await evaluate("[document.documentElement.classList.contains('light'),window.launchMedia.paused,window.launchMedia.hasAttribute('src'),window.launchMedia.networkState,window.launchMedia.isConnected]"),[true,true,false,0,false]);
  await call('Page.reload');
  await until("document.querySelector('.shell-brand') && !document.querySelector('.tm-launch')");
  await click('[aria-label="Settings"]');
  await click('.launch-replay');
  await until("document.querySelector('.launch-enter')");
  await preference('reduce');
  await until(`!${video}`);
  const requestCount = requests.length;
  await openNewSession('morning');
  assert.ok(await evaluate(`!${video} && !document.querySelector('.launch-motion')`));
  assert.ok(!requests.slice(requestCount).includes('/launch/trustmesh-launch.mp4'));
  await enter();
  await call('Network.setBlockedURLs',{urls:['*/api/*','*/launch/trustmesh-launch.mp4']});
  await preference('no-preference');
  await openNewSession('night');
  await until(`!${video} && document.querySelector('.launch-film img').naturalWidth>0`);
  await enter();
  assert.ok(await evaluate("document.documentElement.classList.contains('dark')"));
  await call('Network.setBlockedURLs',{urls:[]});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:"HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('Autoplay policy','NotAllowedError'))"});
  await openNewSession('night');
  await until("document.querySelector('[aria-label=\"Resume background motion\"]')");
  await enter();
  assert.deepEqual(exceptions,[]);
  assert.deepEqual(consoleErrors,[]);
  console.log('Launch, playback, loop, fallback, keyboard, theme, session, API collection, cleanup and six viewports passed.');
} finally {socket.close();await fetch(debug+'/json/close/'+page.id);}
