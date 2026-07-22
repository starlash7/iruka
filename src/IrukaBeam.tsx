import { BorderBeam } from "border-beam";
import type { ReactNode } from "react";

type IrukaBeamProps = {
  active?: boolean;
  borderRadius?: number;
  children: ReactNode;
  className?: string;
  strength?: number;
  variant?: "action" | "hero" | "selection" | "reveal";
};

const beamPresets = {
  action: {
    borderRadius: 999,
    brightness: 1.04,
    colorVariant: "ocean" as const,
    duration: 6.8,
    hueRange: 9,
    saturation: 0.82,
    size: "sm" as const,
    strength: 0.42,
    theme: "dark" as const
  },
  hero: {
    borderRadius: 999,
    brightness: 1.08,
    colorVariant: "ocean" as const,
    duration: 5.8,
    hueRange: 18,
    saturation: 1.06,
    size: "pulse-inner" as const,
    strength: 0.52,
    theme: "light" as const
  },
  selection: {
    borderRadius: 18,
    brightness: 1.06,
    colorVariant: "ocean" as const,
    duration: 5.4,
    hueRange: 16,
    saturation: 1.04,
    size: "pulse-inner" as const,
    strength: 0.28,
    theme: "light" as const
  },
  reveal: {
    borderRadius: 34,
    brightness: 1.2,
    colorVariant: "colorful" as const,
    duration: 3.6,
    hueRange: 55,
    saturation: 1.2,
    size: "pulse-inner" as const,
    strength: 0.78,
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
      colorVariant={preset.colorVariant}
      duration={preset.duration}
      hueRange={preset.hueRange}
      saturation={preset.saturation}
      size={preset.size}
      strength={strength ?? preset.strength}
      theme={preset.theme}
    >
      {children}
    </BorderBeam>
  );
}
