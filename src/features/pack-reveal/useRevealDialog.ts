import { useEffect, useRef } from "react";

export function useRevealDialog(isSummary: boolean) {
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : undefined;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    overlayRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (isSummary) continueButtonRef.current?.focus({ preventScroll: true });
  }, [isSummary]);

  return { continueButtonRef, overlayRef };
}
