import { useEffect, useState, type RefObject } from 'react';
import { X } from 'lucide-react';
import { environmentStatus, type ClusterFeed } from '../utils/labEvidence';
import { SnapshotTime } from './SnapshotTime';

type Theme = 'dark' | 'light';

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener('change',sync);
    return () => media.removeEventListener('change',sync);
  }, [query]);
  return matches;
}

export function WorkspacePreferences({ dialog, theme, setTheme, pinned, setPinned, cluster, onReplay }: {
  onReplay: () => void;
  dialog: RefObject<HTMLDialogElement>; theme: Theme; setTheme: (theme: Theme) => void;
  pinned: boolean; setPinned: (value: boolean) => void; cluster: ClusterFeed;
}) {
  const overlay = useMedia('(max-width: 850px)');
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  return <dialog ref={dialog} className="shell-dialog" aria-labelledby="preferences-title"
    onClose={() => document.querySelector<HTMLButtonElement>('.shell-settings')?.focus({preventScroll:true})}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const stops = event.currentTarget.querySelectorAll<HTMLElement>('button, input:checked');
      const first = stops[0], last = stops[stops.length-1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
    <header><div><p className="lab-caption">TrustMesh workspace</p><h2 id="preferences-title">Workspace preferences</h2></div>
      <form method="dialog"><button autoFocus aria-label="Close workspace preferences"><X size={18}/></button></form></header>
    <div className="preferences-body">
      <fieldset><legend>Appearance</legend>
        <div className="theme-options">{(['dark','light'] as const).map(value => <label key={value} className="theme-choice">
          <span aria-hidden="true" className={'theme-preview preview-'+value}><i/><b/><em/></span>
          <span><input type="radio" name="workspace-theme" value={value} checked={theme===value} onChange={() => setTheme(value)}/>
            {value==='dark' ? 'Dark' : 'Light'}</span>
        </label>)}</div>
      </fieldset>
      <fieldset><legend>Navigation</legend>
        {overlay ? <p>The compact rail expands over the workspace on this screen.</p> :
          <div className="rail-options">{[false,true].map(wide => <label key={String(wide)}>
            <input type="radio" name="workspace-rail" checked={pinned===wide} onChange={() => setPinned(wide)}/>
            {wide ? 'Pinned Navigation' : 'Compact Rail'}
          </label>)}</div>}
      </fieldset>
      <section><h3>Motion</h3><p>{reduced ? 'Reduced motion is active. The shell opens immediately.' :
        'System motion is enabled. The Fabric Reveal plays once when the workspace loads.'}</p>
        <button type="button" className="launch-replay" onClick={onReplay}>Replay opening experience</button></section>
      <section><h3>Workspace information</h3><dl className="workspace-info">
        <dt>Application</dt><dd>TrustMesh / ZeroTrustCloud</dd><dt>Project</dt><dd>PRJ-34</dd>
        <dt>Environment</dt><dd>Local Kubernetes · two fixed contexts</dd><dt>Cluster status</dt>
        <dd>{environmentStatus(cluster)}{cluster.data && <small>{cluster.staleReason ? 'Last known' : 'Collected'} · <SnapshotTime value={cluster.data.collectedAt}/></small>}</dd>
      </dl></section>
    </div>
  </dialog>;
}
