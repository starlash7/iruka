import { useEffect, useState } from "react";

export function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

export function getRevealCount() {
  try {
    return Number(window.localStorage.getItem("iruka-reveal-count") ?? "0");
  } catch {
    return 0;
  }
}

export function markRevealSeen() {
  try {
    window.localStorage.setItem("iruka-reveal-count", String(getRevealCount() + 1));
  } catch {
    // Storage availability must not block a completed reveal.
  }
}
