import { useEffect, useRef } from "react";

export function useRevealDialog(isSummary: boolean) {
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : undefined;
    const previousOverflow = document.body.style.overflow;
    const overlay = overlayRef.current;
    const backgroundElements = overlay?.parentElement
      ? Array.from(overlay.parentElement.children)
          .filter((element): element is HTMLElement =>
            element instanceof HTMLElement && element !== overlay)
          .map((element) => ({ element, inert: element.inert }))
      : [];

    document.body.style.overflow = "hidden";
    backgroundElements.forEach(({ element }) => {
      element.inert = true;
    });
    overlay?.focus({ preventScroll: true });

    function trapFocus(event: KeyboardEvent) {
      if (event.key !== "Tab" || !overlay) return;
      const focusable = Array.from(
        overlay.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      ).filter((element) => !element.hidden);
      const first = focusable[0];
      const last = focusable.at(-1);

      if (!first || !last) {
        event.preventDefault();
        overlay.focus({ preventScroll: true });
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    overlay?.addEventListener("keydown", trapFocus);

    return () => {
      overlay?.removeEventListener("keydown", trapFocus);
      backgroundElements.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (isSummary) continueButtonRef.current?.focus({ preventScroll: true });
  }, [isSummary]);

  return { continueButtonRef, overlayRef };
}
