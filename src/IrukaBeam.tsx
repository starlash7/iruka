import { BorderBeam } from "border-beam";
import type { ReactNode } from "react";

type IrukaBeamProps = {
  active?: boolean;
  borderRadius?: number;
  children: ReactNode;
  className?: string;
  strength?: number;
};

export function IrukaBeam({
  active = true,
  borderRadius = 999,
  children,
  className,
  strength = 0.34
}: IrukaBeamProps) {
  return (
    <BorderBeam
      active={active}
      borderRadius={borderRadius}
      brightness={0.92}
      className={["iruka-beam", className].filter(Boolean).join(" ")}
      colorVariant="ocean"
      duration={4.2}
      hueRange={0}
      saturation={0.86}
      size="pulse-inner"
      staticColors
      strength={strength}
      theme="light"
    >
      {children}
    </BorderBeam>
  );
}
