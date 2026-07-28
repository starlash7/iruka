import type { Locale } from "./appTypes.ts";

type LocaleStorage = Pick<Storage, "getItem" | "setItem">;

export function getStoredLocale(storage?: Pick<LocaleStorage, "getItem">): Locale {
  if (!storage && typeof window === "undefined") return "en";
  try {
    return (storage ?? window.localStorage).getItem("iruka-locale") === "ko"
      ? "ko"
      : "en";
  } catch {
    return "en";
  }
}

export function saveStoredLocale(
  storage: Pick<LocaleStorage, "setItem"> | undefined,
  locale: Locale
) {
  if (!storage && typeof window === "undefined") return;
  try {
    (storage ?? window.localStorage).setItem("iruka-locale", locale);
  } catch {
    // Language switching remains available when browser storage is blocked.
  }
}
