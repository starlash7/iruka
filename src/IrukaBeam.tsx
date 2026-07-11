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
    brightness: 1.22,
    duration: 2.6,
    saturation: 1.25,
    size: "sm" as const,
    strength: 0.9,
    theme: "dark" as const
  },
  selection: {
    borderRadius: 16,
    brightness: 1.18,
    duration: 3.4,
    saturation: 1.2,
    size: "md" as const,
    strength: 0.78,
    theme: "light" as const
  },
  reveal: {
    borderRadius: 34,
    brightness: 1.2,
    duration: 3.6,
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
      colorVariant="colorful"
      duration={preset.duration}
      hueRange={55}
      saturation={preset.saturation}
      size={preset.size}
      strength={strength ?? preset.strength}
      theme={preset.theme}
    >
      {children}
    </BorderBeam>
  );
}
