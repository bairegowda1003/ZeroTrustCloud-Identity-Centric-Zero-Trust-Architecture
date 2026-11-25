import React, { useEffect, useRef, useState } from 'react';

interface Connection {
  name: string;
  material: string;
  path: string;
}

// Coordinates share the scene's layout space, so rails track the objects when
// the inspector, sidebar, font metrics or inventory change size.
export function PolicyRelationships({inventory, selected, preview, run}: {inventory: string; selected?: string; preview: string|null; run: number}) {
  const overlay = useRef<SVGSVGElement>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  useEffect(() => {
    const scene = overlay.current?.parentElement;
    if (!scene) return;
    const policies = Array.from(scene.querySelectorAll<HTMLButtonElement>('.ps-guardian'));
    const core = scene.querySelector<SVGSVGElement>('.ps-core > svg');
    const scope = scene.querySelector<SVGSVGElement>('.ps-scope > svg');
    if (!core || !scope || !policies.length) {
      setConnections([]);
      return;
    }
    const measure = () => {
      const origin = scene.getBoundingClientRect();
      const chamber = core.getBoundingClientRect();
      const target = scope.getBoundingClientRect();
      const x = chamber.left - origin.left + chamber.width * .27;
      const y = chamber.top - origin.top + chamber.height * .56;
      const lines = policies.map(button => {
        const bounds = button.getBoundingClientRect();
        const start = bounds.right - origin.left;
        const height = bounds.top - origin.top + bounds.height / 2;
        const bend = start + (x - start) * .42;
        return {
          name: button.dataset.constraint!,
          material: button.dataset.material!,
          path: `M${start} ${height} C${bend} ${height} ${bend} ${y} ${x} ${y}`,
        };
      });
      const outlet = chamber.right - origin.left - chamber.width * .26;
      const end = target.left - origin.left + target.width * .22;
      const endY = target.top - origin.top + target.height * .52;
      lines.push({name: '', material: 'scope',
        path: `M${outlet} ${y} C${(outlet+end)/2} ${y} ${(outlet+end)/2} ${endY} ${end} ${endY}`});
      setConnections(lines);
    };
    const observer = new ResizeObserver(measure);
    [scene, core, scope, ...policies].forEach(node => observer.observe(node));
    measure();
    return () => observer.disconnect();
  }, [inventory]);
  const active = connections.find(line => line.name === selected);
  return <svg ref={overlay} className="ps-relationships" aria-hidden="true">
    {connections.map(line => {
      const outbound = line.name === '';
      const highlighted = !!active && (line === active || outbound);
      return <g key={line.name} data-material={outbound && active ? active.material : line.material}>
        <path className="ps-rail" data-preview={line.name === preview} data-selected={highlighted} d={line.path}/>
        {highlighted && <g key={JSON.stringify([selected, run])} data-leg={outbound ? 'outbound' : 'inbound'}>
          <path className="ps-trace ps-trace-glow" pathLength="100" d={line.path}/>
          <path className="ps-trace" pathLength="100" d={line.path}/>
        </g>}
      </g>;
    })}
  </svg>;
}
