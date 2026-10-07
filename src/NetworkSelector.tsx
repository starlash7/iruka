import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AccountAssetMark } from "./AccountAssetMark";
import { activeDeployment, supportedDeployments } from "./activeDeployment.ts";
import { getNetworkUrl, type NetworkId } from "./networkSelection.ts";
import type { Locale } from "./appTypes";
import "./network-selector.css";

export function NetworkSelector({ disabled, locale }: { disabled: boolean; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const label = locale === "ko" ? "네트워크" : "Network";

  useEffect(() => {
    if (disabled) { setOpen(false); return; }
    if (!open) return;
    rootRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    function closeFromOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeFromKeyboard(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    window.addEventListener("pointerdown", closeFromOutside);
    window.addEventListener("keydown", closeFromKeyboard);
    return () => {
      window.removeEventListener("pointerdown", closeFromOutside);
      window.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [open, disabled]);

  function selectNetwork(id: NetworkId) {
    if (disabled) return;
    setOpen(false);
    if (id === activeDeployment.id) { triggerRef.current?.focus(); return; }
    // Reload all RPC clients and chain-specific state together.
    window.location.assign(getNetworkUrl(window.location.href, id));
  }

  function moveMenuFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    const buttons = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
    const index = buttons.findIndex(button => button === document.activeElement);
    let target;
    if (event.key === "ArrowDown") target = (index + 1) % buttons.length;
    else if (event.key === "ArrowUp") target = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[target]?.focus();
  }

  return (
    <div className="network-selector" ref={rootRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        aria-controls={menuId}
        aria-expanded={open && !disabled}
        aria-haspopup="menu"
        aria-label={`${label}: ${activeDeployment.chain.name}`}
        className="network-selector-trigger"
        disabled={disabled}
        onClick={() => setOpen(current => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); setOpen(true);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <AccountAssetMark kind={activeDeployment.id} />
        <span>{activeDeployment.chain.name}</span>
        <ChevronDown aria-hidden="true" size={14} />
      </button>
      <div aria-label={label} className="network-selector-menu" hidden={!open || disabled}
        id={menuId} onKeyDown={moveMenuFocus} role="menu">
        {supportedDeployments.map(({ id, chain }) => (
          <button aria-checked={id === activeDeployment.id} disabled={disabled} key={id}
            onClick={() => selectNetwork(id)} role="menuitemradio" tabIndex={-1} type="button">
            <AccountAssetMark kind={id} />
            <span>{chain.name}</span>
            {id === activeDeployment.id ? <Check aria-hidden="true" size={16} /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
