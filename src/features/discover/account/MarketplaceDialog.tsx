import { useEffect, useRef, type ReactNode } from "react";

type MarketplaceDialogProps = {
  children: ReactNode;
  className: string;
  labelId: string;
  onRequestClose: () => void;
  open: boolean;
};

export function MarketplaceDialog({
  children,
  className,
  labelId,
  onRequestClose,
  open
}: MarketplaceDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
    }
  }, [open]);

  return (
    <dialog
      aria-labelledby={labelId}
      className={className}
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onRequestClose();
      }}
      ref={dialogRef}
    >
      {children}
    </dialog>
  );
}
