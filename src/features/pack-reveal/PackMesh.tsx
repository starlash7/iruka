import { useMemo } from "react";
import { MathUtils } from "three";
import type { RevealConfig, RevealPhase } from "./revealConfig";

type PackMeshProps = {
  config: RevealConfig;
  phase: RevealPhase;
  progress: number;
};

function smoothRange(start: number, end: number, value: number) {
  return MathUtils.smoothstep(value, start, end);
}

export function PackMesh({ config, phase, progress }: PackMeshProps) {
  const isCommon = config.name === "Common";
  const tear = isCommon ? smoothRange(0.18, 0.32, progress) : smoothRange(0.24, 0.42, progress);
  const fade = smoothRange(0.58, 0.76, progress);
  const shake = phase === "shake" ? Math.sin(progress * 94) * 0.08 : 0;
  const material = useMemo(
    () => ({
      color: config.accent,
      emissive: config.accent,
      emissiveIntensity: 0.18,
      metalness: 0.35,
      roughness: 0.22
    }),
    [config.accent]
  );

  return (
    <group
      position={[0, -0.44 + tear * 0.18, 0]}
      rotation={[shake * 0.5, -shake, shake]}
      scale={1 - fade * 0.08}
      visible={fade < 0.98}
    >
      <mesh position={[0, -0.1, 0]} scale={[1.78, 2.2, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          clearcoat={0.9}
          color="#F8FBFF"
          emissive={config.accent}
          emissiveIntensity={0.05}
          metalness={0.28}
          roughness={0.18}
          transparent
          opacity={1 - fade}
        />
      </mesh>
      <mesh position={[0, 1.08 + tear * 0.48, 0.04]} rotation={[0, 0, -tear * 0.18]} scale={[1.86, 0.32, 0.18]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          {...material}
          clearcoat={1}
          transparent
          opacity={1 - fade}
        />
      </mesh>
      <mesh position={[0, 0.04, 0.12]} scale={[1.48, 1.42, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={config.foil} transparent opacity={(0.24 + tear * 0.5) * (1 - fade)} />
      </mesh>
    </group>
  );
}
