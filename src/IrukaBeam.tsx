import { BorderBeam } from "border-beam";
import type { ReactNode } from "react";

type IrukaBeamProps = {
  active?: boolean;
  borderRadius?: number;
  children: ReactNode;
  className?: string;
  strength?: number;
  variant?: "action" | "selection" | "reveal";
};

const beamPresets = {
  action: {
    borderRadius: 999,
    brightness: 1.05,
    duration: 4.8,
    saturation: 0.95,
    size: "pulse-inner" as const,
    strength: 0.62,
    theme: "dark" as const
  },
  selection: {
    borderRadius: 16,
    brightness: 1,
    duration: 6.4,
    saturation: 0.95,
    size: "pulse-inner" as const,
    strength: 0.34,
    theme: "dark" as const
  },
  reveal: {
    borderRadius: 34,
    brightness: 1.08,
    duration: 4.2,
    saturation: 1,
    size: "pulse-inner" as const,
    strength: 0.62,
    theme: "light" as const
  }
};

export function IrukaBeam({
  active = true,
  borderRadius,
  children,
  className,
  strength,
  variant = "action"
}: IrukaBeamProps) {
  const preset = beamPresets[variant];

  return (
    <BorderBeam
      active={active}
      borderRadius={borderRadius ?? preset.borderRadius}
      brightness={preset.brightness}
      className={["iruka-beam", `iruka-beam-${variant}`, className].filter(Boolean).join(" ")}
      colorVariant="ocean"
      duration={preset.duration}
      hueRange={0}
      saturation={preset.saturation}
      size={preset.size}
      staticColors
      strength={strength ?? preset.strength}
      theme={preset.theme}
    >
      {children}
    </BorderBeam>
  );
}
