import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferGeometry, Points } from "three";
import type { LegacyRevealPhase, RevealConfig } from "./revealConfig";

type LightstickParticlesProps = {
  config: RevealConfig;
  phase: LegacyRevealPhase;
  progress: number;
};

export function LightstickParticles({ config, phase, progress }: LightstickParticlesProps) {
  const pointsRef = useRef<Points<BufferGeometry>>(null);
  const positions = useMemo(() => {
    const count = 180;
    const values = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const stride = index * 3;
      values[stride] = (Math.random() - 0.5) * 6.2;
      values[stride + 1] = -2.25 + Math.random() * 0.7;
      values[stride + 2] = -0.8 + Math.random() * 1.4;
    }

    return values;
  }, []);
  const visible = phase === "crowd" || phase === "lift" || phase === "orbit" || phase === "stamp";

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;

    points.rotation.z = Math.sin(clock.elapsedTime * 0.9) * 0.025;
    points.position.y = Math.sin(clock.elapsedTime * 1.8) * 0.035;
  });

  return (
    <points ref={pointsRef} visible={visible}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={config.foil}
        depthWrite={false}
        opacity={visible ? 0.2 + progress * 0.36 : 0}
        size={0.035}
        transparent
      />
    </points>
  );
}
