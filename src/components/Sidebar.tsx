import { useEffect, useRef, useState } from 'react';
import { NavigationGlyph } from './NavigationGlyph';
import type { ActiveModule } from '../types/security';

const destinations = [
  ['command_center', 'Command Center'],
  ['workload_identity', 'Identity & Access'],
  ['policy_governance', 'Policies & Workloads'],
  ['service_mesh', 'Trust Architecture'],
  ['supply_chain', 'Supply Chain Integrity'],
  ['experiments', 'Security Verification'],
  ['integrations', 'Integrations'],
] as const;

const overlayLayout = () => window.matchMedia('(max-width: 850px)').matches;

export function Sidebar({ currentModule, onModuleChange, onSettings, pinned, onTogglePinned }: {
  currentModule: ActiveModule;
  onModuleChange: (module: ActiveModule) => void;
  onSettings: () => void;
  pinned: boolean;
  onTogglePinned: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [keyboardPeek, setKeyboardPeek] = useState(false);
  const expanded = pinned || hovered || keyboardPeek;
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!expanded) return;
    const dismiss = () => {
      setHovered(false);
      setKeyboardPeek(false);
      if (pinned && overlayLayout()) onTogglePinned();
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('dialog[open]')) dismiss();
    };
    const onOutsidePress = (event: PointerEvent) => {
      const target = event.target as Element;
      if (overlayLayout() && !navigation.current?.contains(target) && !target.closest('dialog[open]')) dismiss();
    };
    document.addEventListener('keydown', onEscape);
    document.addEventListener('pointerdown', onOutsidePress);
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.removeEventListener('pointerdown', onOutsidePress);
    };
  }, [expanded, pinned, onTogglePinned]);

  return <div className="shell-rail" data-pinned={pinned}>
    <nav ref={navigation} className="shell-navigation" aria-label="Main navigation" data-expanded={expanded}
      onFocus={event => setKeyboardPeek(event.target.matches(':focus-visible'))}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardPeek(false); }}
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }}
      onPointerLeave={() => setHovered(false)}>
      <button className="shell-nav-control" aria-label="Pin expanded navigation" aria-pressed={pinned}
        title={pinned ? 'Unpin navigation' : 'Pin expanded navigation'} onClick={onTogglePinned}>
        <NavigationGlyph name="navigation"/><span>Navigation</span>
      </button>
      <div className="shell-destinations">
        {destinations.map(([id, label]) => <button key={id} className="sidebar-nav-item shell-nav-control"
          data-module={id} aria-current={currentModule === id ? 'page' : undefined} title={label}
          aria-label={label} onClick={() => {
            setHovered(false);
            setKeyboardPeek(false);
            if (pinned && overlayLayout()) onTogglePinned();
            onModuleChange(id);
          }}>
          <NavigationGlyph name={id}/><span>{label}</span>
        </button>)}
      </div>
      <button className="shell-nav-control shell-settings" title="Settings" aria-label="Settings"
        aria-haspopup="dialog" onClick={() => { setHovered(false); onSettings(); }}>
        <NavigationGlyph name="settings"/><span>Settings</span>
      </button>
    </nav>
  </div>;
}
