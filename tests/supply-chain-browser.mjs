// Run against a local Vite server and a dedicated Chrome debugging session:
// node tests/supply-chain-browser.mjs <site-url> <chrome-debug-url> [screenshot-directory]
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
socket.onmessage=({data})=>{
  const msg=JSON.parse(data);
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
  for(let attempt=0;attempt<80;attempt++){
    if(await evaluate(expression))return;
    await delay(100);
  }
  throw Error('Timed out waiting for '+expression);
}
async function key(key,code){
  for(const type of ['keyDown','keyUp']) await call('Input.dispatchKeyEvent',{type,key,code:key,windowsVirtualKeyCode:code,text:key==='Enter' && type==='keyDown'?'\r':''});
}
try {
  await call('Runtime.enable'); await call('Page.enable');
  await call('Browser.grantPermissions',{origin:new URL(site).origin,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
  await call('Network.enable');
  await call('Network.setBlockedURLs',{urls:['*/api/*']});
  await call('Page.navigate',{url:site});
  await until("!!document.querySelector('.launch-enter')");
  await evaluate("document.querySelector('.launch-enter').click()");
  await until("!document.querySelector('.tm-launch')");
  await until("Array.from(document.querySelectorAll('.sidebar-nav-item')).some(b=>b.innerText.includes('Supply Chain Integrity') || b.title==='Supply Chain Integrity')");
  await evaluate("Array.from(document.querySelectorAll('.sidebar-nav-item')).find(b=>b.textContent.includes('Supply Chain Integrity')).click()");
  await until("document.querySelectorAll('.si-row').length===3");
  for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[768,1024],[390,844]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    for(const theme of ['dark','light']){
      if(!await evaluate("document.documentElement.classList.contains('"+theme+"')"))
        await evaluate("document.querySelector('[aria-label=\"Toggle visual theme\"]').click()");
      await until("document.documentElement.classList.contains('"+theme+"')");
      async function checkSelection(index) {
        const state=await evaluate(`(()=>{
          const row=document.querySelector('.si-row[aria-pressed=true]');
          return {
            index:[...document.querySelectorAll('.si-row')].indexOf(row),
            file:row.dataset.file, chamber:document.querySelector('.si-chamber').dataset.selectedFile,
            inspector:document.querySelector('.si-inspector').dataset.selectedFile,
            name:document.querySelector('.si-inside h3').textContent,
            number:document.querySelector('.si-step small').textContent,
            material:document.querySelector('.si-workspace').classList[1],
            relation:document.querySelector('.si-relation').textContent
          };
        })()`);
        assert.equal(state.index,index);
        assert.equal(state.file,state.chamber);
        assert.equal(state.file,state.inspector);
        assert.equal(state.name,state.file.split('/').pop());
        assert.equal(state.number,(index+1)+' of 3');
        assert.equal(state.material,['si-rose','si-green','si-amber'][index]);
        assert.equal(state.relation.includes('SAVED DIGEST MATCH'),index!==0);
        assert.equal(state.relation.includes('Signature validity remains unconfirmed'),index!==0);
        assert.match(state.relation,[/No linked Cosign record/,/Inspect matching Cosign record/,/Inspect matching Trivy report/][index]);
      }
      async function checkLayout() {
        const bad=await evaluate(`[...document.querySelectorAll('.si-studio, .si-studio *')].filter(e=>
          e.clientWidth>0 && !(e instanceof SVGElement) && getComputedStyle(e).display!=='inline' &&
          (e.scrollWidth>e.clientWidth+2 || (e.scrollHeight>e.clientHeight+2 && ['auto','scroll','hidden','clip'].includes(getComputedStyle(e).overflowY)))
        ).map(e=>e.className)`);
        assert.deepEqual(bad,[],JSON.stringify({width,theme,bad}));
        assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
      }
      async function capture(label) {
        if(!output) return;
        await evaluate("document.activeElement.blur();document.querySelector('.main-content-viewport').scrollTop=0");
        await delay(280);
        await mkdir(output,{recursive:true});
        const {data}=await call('Page.captureScreenshot',{format:'png'});
        await writeFile(join(output,theme+'-'+width+'x'+height+label+'.png'),Buffer.from(data,'base64'));
      }
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
      await evaluate("document.querySelectorAll('.si-row')[0].click()");
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.si-top-layer')).animationDuration"),'0.44s');
      await until("document.querySelector('.si-top-layer').getAnimations().length===0");
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.si-top-layer')).transform"),'none');
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
      for(const index of [0,1,2]) {
        await evaluate(`document.querySelectorAll('.si-row')[${index}].focus()`);
        await key('Enter',13);
        await checkSelection(index);
        assert.ok(await evaluate("document.activeElement.id==='si-inspector-title'"));
        assert.equal(await evaluate("getComputedStyle(document.querySelector('.si-top-layer')).animationName"),'none');
        assert.equal(await evaluate("getComputedStyle(document.querySelector('.si-engraving')).animationName"),'none');
        await checkLayout();
        assert.equal(await evaluate("document.querySelector('.si-source').open"),false);
        if(width===1440) await capture(['-finding','','-signature'][index]);
        await evaluate("document.querySelector('.si-source summary').focus()");
        await key('Enter',13);
        assert.equal(await evaluate("document.querySelector('.si-source').open && document.querySelector('.si-source>code').innerText"),await evaluate("document.querySelector('.si-row[aria-pressed=true]').dataset.file"));
        await checkLayout();
        await key('Enter',13);
        await evaluate("document.querySelector('.si-copy').focus()");
        await key('Enter',13);
        await until("document.querySelector('.si-copy-notice').textContent==='Copied'");
        const copied=await evaluate('navigator.clipboard.readText()');
        await evaluate("document.querySelector('.si-json summary').focus()");
        await key('Enter',13);
        const first=await evaluate("document.querySelector('.si-json pre').innerText");
        await evaluate("document.querySelector('[aria-label=\"Next JSON lines\"]').click()");
        assert.notEqual(await evaluate("document.querySelector('.si-json pre').innerText"),first);
        const chunks=[first,await evaluate("document.querySelector('.si-json pre').innerText")];
        while(true){
          await checkLayout();
          if(await evaluate("document.querySelector('[aria-label=\"Next JSON lines\"]').disabled")) break;
          await evaluate("document.querySelector('[aria-label=\"Next JSON lines\"]').click()");
          chunks.push(await evaluate("document.querySelector('.si-json pre').innerText"));
        }
        const raw=JSON.parse(chunks.join('\n'));
        const digest=raw.Metadata?.RepoDigests[0].split('@')[1] ?? raw.critical.image['docker-manifest-digest'];
        const displayed=await evaluate("document.querySelector('.si-inside').innerText");
        assert.equal(copied,digest);
        assert.ok(displayed.includes(digest));
        assert.ok(displayed.includes(raw.ArtifactName ?? raw.critical.identity['docker-reference']));
        await evaluate("document.querySelector('[aria-label=\"Previous JSON lines\"]').click()");
        assert.equal(await evaluate("document.querySelector('.si-json pre').innerText"),chunks.at(-2));
        await evaluate("document.querySelector('.si-json summary').focus()");
        await key('Enter',13);
        assert.equal(await evaluate("document.querySelector('.si-json').open"),false);
      }
      await evaluate("document.querySelector('.si-relation button').focus()");
      await key('Enter',13); await checkSelection(1);
      await evaluate("document.querySelector('.si-relation button').click()"); await checkSelection(2);
      await key('Tab',9);
      assert.equal(await evaluate("document.activeElement.getAttribute('aria-label')"),'Previous artifact');
      await key('Enter',13); await checkSelection(1);
      await evaluate("document.querySelector('[aria-label=\"Next artifact\"]').click()"); await checkSelection(2);
      assert.ok(await evaluate("document.querySelector('[aria-label=\"Next artifact\"]').disabled"));
      await evaluate("document.querySelector('.si-demo summary').focus()");
      await key('Enter',13);
      assert.equal(await evaluate("document.querySelector('.si-demo').open"),true);
      await key('Enter',13);
      console.log(theme,width,height,'passed');
    }
  }
  assert.deepEqual(exceptions,[]);
} finally {socket.close();await fetch(debug+'/json/close/'+page.id);}
