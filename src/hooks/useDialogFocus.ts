import { useEffect, useRef } from 'react';
/** Focus lifecycle for an open investigation panel. */
export function useDialogFocus(open: boolean, onClose: () => void) {
 const ref = useRef<HTMLDivElement>(null);
 const close = useRef(onClose); close.current = onClose;
 useEffect(() => {
  if (!open || !ref.current) return;
  const panel = ref.current;
  const previous = document.activeElement as HTMLElement | null;
  const controls = () => Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]')).filter(el=>el.getClientRects().length>0);
  const frame = requestAnimationFrame(()=> (controls()[0] || panel).focus());
  const handle = (e: KeyboardEvent) => {
   if(e.key === 'Escape') {e.preventDefault(); e.stopPropagation(); close.current();}
   if(e.key === 'Tab') {
    const items=controls(), first=items[0], last=items[items.length-1];
    if(!first) {e.preventDefault();panel.focus();return;}
    if(e.shiftKey && (document.activeElement===first || document.activeElement===panel)) {e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last) {e.preventDefault();first.focus();}
   }
  };
  panel.addEventListener('keydown',handle);
  return ()=>{cancelAnimationFrame(frame);panel.removeEventListener('keydown',handle);if(previous?.isConnected)previous.focus();};
 },[open]);
 return ref;
}
