// Run against a local Vite server and a dedicated Chrome debugging session:
// node tests/shell-browser.mjs <site-url> <chrome-debug-url> [screenshot-directory]
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
async function tap(selector) {
  const point = await evaluate(`(() => {
    const rect = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
    return {x: rect.x + rect.width/2, y: rect.y + rect.height/2};
  })()`);
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}
async function reload() {
  const previous = await evaluate('performance.timeOrigin');
  await call('Page.reload');
  await until("performance.timeOrigin!=="+previous+" && document.querySelector('.shell-brand')");
}
async function capture(theme,view) {
  if(!output)return;
  await mkdir(output,{recursive:true});
  await delay(220);
  const {data}=await call('Page.captureScreenshot',{format:'png'});
  await writeFile(join(output,theme+'-'+view+'.png'),Buffer.from(data,'base64'));
}

try {
  await call('Runtime.enable');
  await call('Page.enable');
  await call('Network.enable');
  // Install before React mounts so even a fast production load records the first frame.
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.fabricEvents = [];
    window.fabricBounds = [];
    const shellBounds = () => [...document.querySelectorAll('.shell-header,.shell-header > *,.shell-navigation,main')]
      .map(el => [el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight]);
    document.addEventListener('animationstart', event => {
      window.fabricEvents.push(event.animationName);
      if (event.animationName === 'bridge-line') window.fabricBounds.push(shellBounds());
    });
    document.addEventListener('animationend', event => {
      if (event.animationName === 'bridge-line') window.fabricBounds.push(shellBounds());
    });`});
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await call('Page.navigate',{url:site});
  await until("document.querySelector('.launch-enter')");
  await evaluate("document.querySelector('.launch-enter').click()");
  await until("!document.querySelector('.tm-launch')");
  await until("document.querySelector('.shell-brand')");
  const morph = "getComputedStyle(document.querySelector('.bridge-surface path')).animationName";
  await until('window.fabricBounds.length===2');
  const bounds = await evaluate('window.fabricBounds');
  assert.deepEqual(bounds[0],bounds[1]);
  const events = await evaluate('window.fabricEvents');
  for (const animation of ['emblem-settle','bridge-line','fabric-boundary']) {
    assert.equal(events.filter(name => name===animation).length,1,animation);
  }
  assert.equal(events.filter(name => name==='shell-arrive').length,9);
  const button = name => 'button[aria-label="'+name+'"]';
  const focus = selector => evaluate('document.querySelector('+JSON.stringify(selector)+').focus()');
  await focus(button('Identity & Access'));
  await key('Enter',13);
  await until("document.querySelector('[aria-current=page]').dataset.module==='workload_identity'");
  await click(button('Toggle visual theme'));
  assert.equal(await evaluate(morph),'none');
  // Sample the workspace and glyph during the normal animated width transition.
  const sampleGeometry = `(() => {
    const icon = document.querySelector('[data-module=command_center] svg').getBoundingClientRect();
    const main = document.querySelector('main').getBoundingClientRect();
    return [icon.x,icon.y,main.x,main.y,main.width,main.height];
  })()`;
  const before = await evaluate(sampleGeometry);
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:22,y:140});
  for (let frame=0;frame<12;frame++) {
    assert.deepEqual(await evaluate('new Promise(r=>requestAnimationFrame(()=>r('+sampleGeometry+')))'),before);
  }
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:300,y:160});
  await focus(button('TrustMesh home'));
  await key('Enter',13);
  await until("document.querySelector('main h1').textContent.includes('Command Center')");
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate(morph),'none');
  assert.ok(await evaluate("getComputedStyle(document.querySelector('.fabric-glyph')).animationName==='none' && getComputedStyle(document.querySelector('.shell-navigation'),'::after').animationName==='none'"));
  const menu=button('Local Kubernetes environment');
  const settings=button('Settings');
  const openSettings="document.querySelector('.shell-dialog').open";
  await click(button('Integrations'));
  await until("document.querySelector('.shell-integrations').innerText.includes('Cluster status API reachable')");
  for (const [width,height] of [[390,844],[768,1024],[1366,768],[1440,900],[1536,864],[1920,1080]]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    for (const theme of ['dark','light']) {
      if (!await evaluate("document.documentElement.classList.contains('"+theme+"')")) await click(button('Toggle visual theme'));
      await until("document.documentElement.classList.contains('"+theme+"')");
      const rail = "document.querySelector('.shell-navigation')";
      const railGeometry = () => evaluate("[document.querySelector('main').getBoundingClientRect().left,document.querySelector('[data-module=command_center] svg').getBoundingClientRect().x]");
      await focus(menu);
      await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:width-5,y:height-5});
      const collapsed=await railGeometry();
      await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:22,y:132});
      await until(rail+".dataset.expanded==='true'");
      assert.deepEqual(await railGeometry(),collapsed);
      await key('Escape',27);
      await until(rail+".dataset.expanded==='false'");
      await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:width-5,y:height-5});
      await focus(button('TrustMesh home'));
      await key('Tab',9);
      await focus(button('Identity & Access'));
      await until(rail+".dataset.expanded==='true'");
      await key('Escape',27);
      await until(rail+".dataset.expanded==='false'");
      assert.equal(await evaluate("document.activeElement.dataset.module"),'workload_identity');
      await key('Tab',9);
      await until(rail+".dataset.expanded==='true'");
      await key('Escape',27);
      const headings = {
        'Command Center': 'Zero Trust Command Center', 'Identity & Access': 'Workload Identity',
        'Policies & Workloads': 'Policy Enforcement Studio', 'Trust Architecture': 'Trust Architecture',
        'Supply Chain Integrity': 'Supply Chain Integrity', 'Security Verification': 'Security Verification',
        'Integrations': 'Environment Hub',
      };
      for (const [label,heading] of Object.entries(headings)) {
        await click(button(label));
        await until("document.querySelector('[aria-current=page]').getAttribute('aria-label')==="+JSON.stringify(label));
        assert.equal(await evaluate("document.querySelector('main h1').textContent"),heading);
        assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth && document.querySelector('main').scrollWidth<=document.querySelector('main').clientWidth+1"));
        assert.ok(await evaluate(`(() => {
          const brand=document.querySelector('.shell-brand').getBoundingClientRect();
          const controls=document.querySelector('.shell-controls').getBoundingClientRect();
          return brand.right<controls.left && controls.right<=innerWidth;
        })()`));
        if(label==='Supply Chain Integrity' && (width===390 || width===1440) && output) {
          await evaluate("document.activeElement.blur()");
          await capture(theme,width+'-rail');
          await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:22,y:height-85});
          await until(rail+".dataset.expanded==='true'");
          await capture(theme,width+'-expanded');
          await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:width-5,y:height-5});
          if(width===1440) {
            await click(button('Pin expanded navigation'));
            await until("document.querySelector('.shell-rail').dataset.pinned==='true'");
            await capture(theme,width+'-pinned');
            await click(button('Pin expanded navigation'));
          }
        }
        if(width===1366 && theme==='dark' && label!=='Integrations') {
          await click(button('TrustMesh home'));
          await until("document.querySelector('main h1').textContent.includes('Command Center')");
        }
      }
      assert.equal(await evaluate(openSettings),false);
      assert.ok(await evaluate("document.querySelector('.shell-integrations').innerText.includes('kind-trustmesh-network-lab')"));
      await until("!document.querySelector('.shell-integrations header button').disabled");
      await evaluate("document.querySelector('main').scrollTo({top:0,behavior:'instant'})");
      await capture(theme,width+'-hub');
      if (width===390 && output) {
        await evaluate("document.querySelector('.hub-cloud').scrollIntoView({block:'end',behavior:'instant'})");
        await capture(theme,width+'-cloud');
        await evaluate("document.querySelector('main').scrollTo({top:0,behavior:'instant'})");
      }
      assert.ok(await evaluate("[...document.querySelectorAll('img.trustmesh-mark')].every(img=>img.complete && img.naturalWidth>0 && img.currentSrc.includes('/brand/trustmesh-mark-dark-'))"));
      assert.deepEqual(await evaluate("[...document.querySelectorAll('.hub-endpoint h3 code')].map(c=>c.textContent)"),
        ['kind-trustmesh-lab','kind-trustmesh-network-lab']);
      assert.ok(await evaluate("document.querySelectorAll('.hub-endpoint time').length===2"));
      assert.deepEqual(await evaluate("[...document.querySelectorAll('.hub-cloud small')].map(e=>e.textContent)"),['NOT CONNECTED','NOT CONNECTED']);
      assert.ok(await evaluate("[...document.querySelectorAll('.hub-cloud img')].every(img=>img.complete && img.naturalWidth>0)"));
      assert.ok(await evaluate(`(() => {
        const header=document.querySelector('.shell-header');
        const surface=header.querySelector('.bridge-surface');
        const path=surface.querySelector('path');
        const {width,height}=surface.getBoundingClientRect();
        const inside=(x,y)=>path.isPointInFill(new DOMPoint(x,y));
        const left=document.querySelector('.shell-brand').getBoundingClientRect().right;
        const right=document.querySelector('.shell-controls').getBoundingClientRect().left;
        const middle=(left+right)/2;
        return !header.textContent.includes('PRJ-34') &&
          surface.getBoundingClientRect().top===0 && width===header.clientWidth &&
          inside(left,height-2) && inside(right,height-2) &&
          inside(middle,height-22) && !inside(middle,height-5) &&
          getComputedStyle(path).stroke!=='none' && getComputedStyle(header).backgroundColor==='rgba(0, 0, 0, 0)' &&
          ['::before','::after'].every(p=>getComputedStyle(header,p).content==='none') &&
          Math.abs(document.querySelector('.shell-navigation').getBoundingClientRect().top-height)<1;
      })()`),'The middle cut must expose the page while both ends meet the lower boundary');
      await focus('.hub-verification');
      await key('Enter',13);
      await until("document.querySelector('main h1').textContent==='Security Verification'");
      await click(button('Integrations'));
      await focus(menu);
      await key('Enter',13);
      await until("document.querySelector('.shell-popover')");
      assert.deepEqual(await evaluate("[...document.querySelectorAll('.shell-popover code')].map(el=>el.textContent)"),['kind-trustmesh-lab','kind-trustmesh-network-lab']);
      assert.ok(await evaluate("!/(AWS|Azure)/.test(document.querySelector('.shell-popover').textContent)"));
      assert.ok(await evaluate("(()=>{const r=document.querySelector('.shell-popover').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})()"));
      assert.ok(await evaluate(`(() => {
        const target=document.querySelector('.shell-popover button');
        const r=target.getBoundingClientRect();
        return target.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)) &&
          getComputedStyle(document.querySelector('.shell-header')).overflow==='visible';
      })()`),'Disclosure below the shaped surface is visible and receives pointer events');
      if(width===1440 || width===390) await capture(theme,width+'-environment');
      await key('Escape',27);
      assert.equal(await evaluate("document.activeElement.getAttribute('aria-label')"),'Local Kubernetes environment');
      await click(button('TrustMesh home'));
      await click(menu);
      await click('.shell-popover button');
      await until("document.activeElement.matches('.shell-integrations h1')");
      const pin=button('Pin expanded navigation');
      await click(pin);
      assert.equal(await evaluate("document.querySelector('.shell-rail').dataset.pinned"),'true');
      const [mainLeft,iconX]=await railGeometry();
      assert.equal(iconX,collapsed[1]);
      assert.ok(width>850 ? mainLeft>collapsed[0] : mainLeft===collapsed[0],
        JSON.stringify({width,mainLeft,collapsed,actualWidth:await evaluate('innerWidth'),rail:await evaluate("document.querySelector('.shell-rail').offsetWidth")}));
      if(width<=850) {
        await key('Escape',27);
        await until(rail+".dataset.expanded==='false'");
        await call('Emulation.setTouchEmulationEnabled',{enabled:true});
        await tap(pin);
        await until(rail+".dataset.expanded==='true'");
        await tap(button('Supply Chain Integrity'));
        await until(rail+".dataset.expanded==='false' && document.querySelector('main h1').textContent==='Supply Chain Integrity'");
        await tap(pin);
        await tap(menu);
        await until(rail+".dataset.expanded==='false' && document.querySelector('.shell-popover')");
        await tap('.shell-popover button');
        await until("document.activeElement.matches('.shell-integrations h1')");
        await call('Emulation.setTouchEmulationEnabled',{enabled:false});
      } else {
        await key('Escape',27);
        assert.equal(await evaluate(rail+".dataset.expanded"),'true');
        await click(pin);
      }
      await focus(settings);
      await key('Enter',13);
      await until(openSettings);
      assert.equal(await evaluate("document.querySelector('[name=workspace-theme]:checked').value"),theme);
      assert.ok(await evaluate("document.activeElement.closest('.shell-dialog')!==null"));
      assert.ok(await evaluate("document.querySelector('.shell-dialog').innerText.includes('Reduced motion is active')"));
      const prefBounds=await evaluate("document.querySelector('.shell-dialog').getBoundingClientRect().toJSON()");
      assert.ok(Math.abs(prefBounds.right-width)<=1 && Math.abs(prefBounds.bottom-height)<=1);
      assert.equal(await evaluate("document.querySelectorAll('[name=workspace-rail]').length"),width<=850 ? 0 : 2);
      if(width>850) {
        await click('.rail-options label:last-child input');
        assert.equal(await evaluate("document.querySelector('.shell-rail').dataset.pinned"),'true');
        await click('.rail-options label:first-child input');
      }
      await capture(theme,width+'-preferences');
      await focus('.shell-dialog header button');
      await key('Tab',9);
      assert.equal(await evaluate('document.activeElement.name'),'workspace-theme');
      await key(theme==='dark' ? 'ArrowRight' : 'ArrowLeft',theme==='dark' ? 39 : 37);
      await until("!document.documentElement.classList.contains('"+theme+"')");
      assert.equal(await evaluate("localStorage.getItem('theme')"),theme==='dark' ? 'morning' : 'night');
      for(let tab=0;tab<4;tab++) {
        await key('Tab',9);
        assert.ok(await evaluate("!!document.activeElement.closest('.shell-dialog')"));
      }
      await key('Escape',27);
      await until("!"+openSettings);
      assert.equal(await evaluate("document.activeElement.getAttribute('aria-label')"),'Settings');
      assert.ok(await evaluate("Boolean(document.querySelector('.shell-integrations'))"));
      console.log(theme,width,height,'passed');
    }
  }
  await until("!document.querySelector('.shell-integrations header button').disabled");
  await click('.shell-integrations header button');
  await until("document.querySelector('.shell-integrations').innerText.includes('Cluster status API reachable')");
  await evaluate("window.qaNow=Date.now;Date.now=()=>window.qaNow()+240000");
  await until("[...document.querySelectorAll('.hub-time')].every(e=>e.textContent.includes('Last known'))");
  const retained=await evaluate("[...document.querySelectorAll('.hub-endpoint dl,.hub-endpoint time')].map(el=>el.textContent)");
  await click(menu);
  await until("document.querySelector('.shell-popover').textContent.includes('Last known')");
  assert.match(await evaluate("document.querySelector('.shell-popover').innerText"),/60 seconds old/);
  await click(menu);
  await evaluate("Date.now=window.qaNow");
  await call('Network.setBlockedURLs',{urls:['*/api/cluster/status*']});
  await until("!document.querySelector('.shell-integrations header button').disabled");
  await click('.shell-integrations header button');
  await until("document.querySelector('.shell-integrations').innerText.includes('Latest refresh failed')");
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.hub-endpoint dl,.hub-endpoint time')].map(el=>el.textContent)"),retained);
  await click(menu);
  assert.match(await evaluate("document.querySelector('.shell-popover').innerText"),/Latest refresh failed/);
  assert.ok(await evaluate("Boolean(document.querySelector('.shell-popover time'))"));
  await click(menu);
  await call('Network.setBlockedURLs',{urls:[]});
  await click('.shell-integrations header button');
  await until("document.querySelector('.hub-bar').textContent.includes('Cluster status API reachable')");
  assert.ok(await evaluate("[...document.querySelectorAll('.hub-time strong')].every(e=>e.textContent==='Fresh snapshot')"));
  await call('Network.setBlockedURLs',{urls:['*/api/cluster/status*']});
  await reload();
  await until("document.querySelector('button[data-module=integrations]')");
  assert.deepEqual(await evaluate("window.fabricEvents.filter(n=>['bridge-line','shell-arrive','emblem-settle','fabric-boundary'].includes(n))"),[]);
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  assert.equal(await evaluate(morph),'none');
  await click(button('Integrations'));
  await until("document.querySelector('.shell-integrations').innerText.includes('Cluster status API unavailable')");
  await click(menu);
  assert.match(await evaluate("document.querySelector('.shell-popover').innerText"),/API unavailable/);
  assert.equal(await evaluate("!!document.querySelector('.shell-popover time')"),false);
  await click(menu);
  assert.ok(await evaluate("[...document.querySelectorAll('.hub-endpoint dd')].every(e=>e.textContent==='Unknown') && !document.querySelector('.hub-endpoint time')"));
  await call('Network.setBlockedURLs',{urls:[]});
  await until("!document.querySelector('.shell-integrations header button').disabled");
  await click('.shell-integrations header button');
  await until("!document.querySelector('.shell-integrations header button').disabled");
  const recovered=await evaluate("document.querySelector('.shell-integrations').innerText");
  assert.match(recovered,/Cluster status API reachable/);
  // Exercise discovery cases using validated cluster responses confined to this test tab.
  await evaluate(`(() => {
    const original=window.fetch.bind(window);
    window.fetch=async (input,init) => {
      const res=await original(input,init);
      if(input!=='/api/cluster/status') return res;
      const data=await res.json();
      data.collectedAt=new Date().toISOString();
      const net={context:'kind-trustmesh-network-lab',name:'network',connected:true,nodes:[]};
      const policy={context:'kind-trustmesh-lab',name:'policy',connected:true,nodes:[{name:'node',ready:false}]};
      data.clusters=window.omitNetwork ? [{...policy,connected:false}] : [net,policy];
      if(window.allReady) data.clusters=[{...policy,nodes:[{name:'control',ready:true},{name:'worker',ready:true}]},net];
      return Response.json(data);
    };
  })()`);
  for(const [omit,expected] of [[false,['Reachable','Not ready','Reachable','Unknown']],[true,['Unreachable','Unknown','Unknown','Unknown']]]) {
    await evaluate('window.omitNetwork='+omit);
    await click('.shell-integrations header button');
    await until("!document.querySelector('.shell-integrations header button').disabled");
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.hub-endpoint dd')].map(el=>el.textContent)"),expected);
    if(omit) assert.ok(await evaluate("document.querySelectorAll('.hub-endpoint time').length===1 && document.querySelector('.hub-endpoint:last-child .hub-time').textContent==='Context not reported'"));
  }
  await evaluate('window.allReady=true');
  await click('.shell-integrations header button');
  await until("!document.querySelector('.shell-integrations header button').disabled");
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.hub-endpoint dd')].map(el=>el.textContent)"),['Reachable','Ready','Reachable','Unknown']);
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`
    const request=window.fetch.bind(window);
    window.fetch=(input,init)=>input==='/api/cluster/status' ? new Promise(resolve=>{
      window.releaseCluster=()=>resolve(request(input,init));
    }) : request(input,init);`});
  await reload();
  await click(button('Integrations'));
  await until("document.querySelector('.hub-time strong').textContent==='Loading'");
  assert.ok(await evaluate("document.querySelector('.shell-integrations header button').disabled"));
  await evaluate("window.releaseCluster()");
  await until("document.querySelector('.hub-time strong').textContent==='Fresh snapshot'");
  await evaluate(`(() => {
    const mark = document.querySelector('.shell-brand .trustmesh-mark');
    mark.removeAttribute('srcset');
    mark.src = 'data:image/webp;base64,AAAA';
  })()`);
  await until("(() => { const img=document.querySelector('.shell-brand .trustmesh-mark'); return img.currentSrc.endsWith('/trustmesh-core.svg') && img.complete && img.naturalWidth>0; })()");
  assert.deepEqual(exceptions,[]);
  assert.deepEqual(consoleErrors,[]);
  await reload();
  await until('window.fabricBounds.length===2');
  assert.equal(await evaluate("window.fabricEvents.filter(n=>n==='bridge-line').length"),1);
  console.log('Fabric reveal, navigation, Settings, API freshness and recovery passed.');
} finally { socket.close(); await fetch(debug+'/json/close/'+page.id); }

