import type { ActiveModule } from '../types/security';

// Shared chamfers and a 24-unit drawing grid keep the silhouettes legible on the rail.
const outlines = {
  command_center: 'M3 8V6l3-3h12l3 3v10l-3 3H6l-3-3V8Z M7 14l4-5 3 3 3-4 M9 22h6',
  workload_identity: 'm12 2 8 4v8l-3 4-5 4-5-4-3-4V6Z M12 7l4 4-4 4-4-4Z',
  policy_governance: 'M5 3h11l3 3v12l-3 3H5Z M9 8h6 M9 12h4 M9 16l2 2 4-4',
  service_mesh: 'm12 2 3.5 3.5L12 9 8.5 5.5Z M12 9v3 M5.5 15v-3h13v3 M2.5 18.5l3-3 3 3-3 3Z M15.5 18.5l3-3 3 3-3 3Z',
  supply_chain: 'm12 3 10 5-10 5L2 8Z M3 12l9 5 9-5 M3 16l9 5 9-5',
  experiments: 'M4 9V6l3-3h10l3 3v10l-3 3h-6 M8 11l3 3 6-7 M3 16h4 M3 20h3',
  integrations: 'M3 3h6l2 2v6H5l-2-2Z M13 13h6l2 2v6h-6l-2-2Z M7 14v3h3 M14 7h3v3',
  settings: 'M3 7h6m6 0h6 M3 17h11m5 0h2 M9 5l2-2h4v6l-2 2H9Z M14 15l2-2h3v6l-2 2h-3Z',
  navigation: 'M3 6l3-3h15v15l-3 3H3Z M9 4v16 M13 9l3 3-3 3',
} satisfies Record<ActiveModule | 'settings' | 'navigation', string>;

export function NavigationGlyph({ name }: { name: keyof typeof outlines }) {
  return <svg className="fabric-glyph" width="21" height="21" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    <path d={outlines[name]}/>
  </svg>;
}
