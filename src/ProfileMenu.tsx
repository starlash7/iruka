import {
  ChevronDown,
  Languages,
  LogOut,
  Settings2,
  UserRound
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "./appTypes";

export type ProfileMenuLabels = {
  account: string;
  language: string;
  network: string;
  settings: string;
  signOut: string;
};

type ProfileMenuProps = {
  identity: string;
  labels: ProfileMenuLabels;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onOpenAccount: () => void;
  onSignOut: () => void;
};

export function ProfileMenu({
  identity,
  labels,
  locale,
  onLocaleChange,
  onOpenAccount,
  onSignOut
}: ProfileMenuProps) {
  const [avatarIndex] = useState(() => Math.floor(Math.random() * 4));
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function closeMenu() {
    setMenuOpen(false);
    setSettingsOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;

    function closeFromOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu();
    }

    function closeFromKeyboard(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      closeMenu();
      triggerRef.current?.focus();
    }

    window.addEventListener("pointerdown", closeFromOutside);
    window.addEventListener("keydown", closeFromKeyboard);
    return () => {
      window.removeEventListener("pointerdown", closeFromOutside);
      window.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [menuOpen]);

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`${labels.account}: ${identity}`}
        className="profile-menu-trigger"
        onClick={() => setMenuOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        <span
          aria-hidden="true"
          className={`profile-menu-avatar profile-menu-avatar-${avatarIndex}`}
        />
      </button>

      <div className="profile-menu-popover" hidden={!menuOpen} id={menuId} role="menu">
        <div className="profile-menu-identity">
          <span
            aria-hidden="true"
            className={`profile-menu-avatar profile-menu-avatar-${avatarIndex}`}
          />
          <span>
            <strong>{identity}</strong>
            <small>{labels.network}</small>
          </span>
        </div>

        <button
          className="profile-menu-item"
          onClick={() => {
            closeMenu();
            onOpenAccount();
          }}
          role="menuitem"
          type="button"
        >
          <UserRound size={17} />
          <span>{labels.account}</span>
        </button>

        <button
          aria-expanded={settingsOpen}
          className="profile-menu-item"
          onClick={() => setSettingsOpen((open) => !open)}
          role="menuitem"
          type="button"
        >
          <Settings2 size={17} />
          <span>{labels.settings}</span>
          <ChevronDown className={settingsOpen ? "is-open" : ""} size={16} />
        </button>

        <div className="profile-menu-settings" hidden={!settingsOpen}>
          <span><Languages size={15} />{labels.language}</span>
          <div aria-label={labels.language} className="profile-menu-locale">
            {(["en", "ko"] as const).map((item) => (
              <button
                aria-pressed={locale === item}
                className={locale === item ? "selected" : ""}
                key={item}
                onClick={() => onLocaleChange(item)}
                type="button"
              >
                {item === "en" ? "EN" : "KO"}
              </button>
            ))}
          </div>
        </div>

        <button
          className="profile-menu-item profile-menu-sign-out"
          onClick={() => {
            closeMenu();
            onSignOut();
          }}
          role="menuitem"
          type="button"
        >
          <LogOut size={17} />
          <span>{labels.signOut}</span>
        </button>
      </div>
    </div>
  );
}
