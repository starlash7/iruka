import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';

export function Modal({ open, title, children, onClose }: {
  open: boolean; title: string; children: ReactNode; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => { if (dialog.open) dialog.close(); };
  }, [open]);
  return <dialog className="ui-modal" ref={ref} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="ui-modal-header"><h2 id={titleId}>{title}</h2><Button variant="ghost" onClick={onClose}>닫기</Button></div>
    {children}
  </dialog>;
}
