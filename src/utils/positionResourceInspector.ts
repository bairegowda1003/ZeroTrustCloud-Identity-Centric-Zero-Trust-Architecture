/** Find a side pocket between rendered resource bounds. Positions are relative to the stage. */
export function positionResourceInspector(panel: HTMLDialogElement, selected: string) {
  const stage = panel.parentElement;
  const map = stage?.querySelector('.tm-map');
  if (!stage || !map || !panel.open) return;

  const stageBox = stage.getBoundingClientRect();
  const mapBox = map.getBoundingClientRect();
  const nodes = Array.from(map.querySelectorAll<SVGGElement>('[data-resource]'), node => ({
    selected: node.dataset.resource === selected,
    box: node.getBoundingClientRect(),
  }));
  const target = nodes.find(node => node.selected)?.box;
  if (!target) return;
  const camera = stage.querySelector('.tm-camera');
  if (camera) nodes.push({selected:false, box:camera.getBoundingClientRect()});
  const gap = 8;
  const inset = stageBox.width >= 600 ? 22 : gap;
  const pocketWidth = Math.max(320, Math.min(410, stageBox.width * .26));
  // Spend the extra edge inset on panel width to keep the inner edge clear of nodes.
  const width = Math.min(stageBox.width - 2 * inset, pocketWidth - (inset - gap));
  const top = Math.max(mapBox.top + gap, stageBox.top + inset, gap);
  const bottom = Math.min(mapBox.bottom - gap, stageBox.bottom - inset, window.innerHeight - gap);
  if (bottom <= top) return;
  const right = stageBox.right - width - inset;
  const left = stageBox.left + inset;
  const preferred = ['gate','admission','calico','sidecars'].includes(selected) ? left : right;
  let best = { x:left, y:top, height:0, score:-Infinity, selectedOverlap:Infinity, overlap:Infinity };

  for (const x of preferred === right ? [right,left] : [left,right]) {
    const obstacles = nodes.filter(({box}) => box.left < x + width + gap && box.right > x - gap);
    // Include every obstacle boundary so a narrow free interval is never skipped.
    const starts = [top, ...obstacles.map(({box}) => Math.max(top, box.bottom + gap))];
    for (const y of starts) {
      if (y >= bottom) continue;
      const next = obstacles.filter(({box}) => box.top > y).map(({box}) => box.top - gap);
      const room = Math.min(bottom, ...next) - y;
      const height = Math.min(370, bottom - y, Math.max(176, room));
      if (height < 150) continue;
      const score = Math.min(height, 265) + (x === preferred ? 90 : 0);
      let selectedOverlap=0, overlap=0;
      for (const {box,selected:active} of obstacles) {
        const intersection = Math.min(y + height,box.bottom + gap) - Math.max(y,box.top - gap);
        if(intersection>0) { overlap+=intersection; if(active) selectedOverlap+=intersection; }
      }
      if (selectedOverlap < best.selectedOverlap || (selectedOverlap === best.selectedOverlap &&
          (overlap < best.overlap || (overlap === best.overlap && score > best.score)))) {
        best = { x,y,height,score,selectedOverlap,overlap };
      }
    }
  }
  if (!best.height) return;
  panel.style.setProperty('--inspector-x',(best.x-stageBox.left)+'px');
  panel.style.setProperty('--inspector-y',(best.y-stageBox.top)+'px');
  panel.style.setProperty('--inspector-width',width+'px');
  panel.style.setProperty('--inspector-height',best.height+'px');
}
