import type { RevealConfig } from "./revealConfig";

type StageLightsProps = {
  config: RevealConfig;
  progress: number;
};

export function StageLights({ config, progress }: StageLightsProps) {
  const intensity = 2.4 + progress * 3.2;

  return (
    <>
      <ambientLight intensity={0.42} />
      <spotLight
        angle={0.42}
        color={config.spotlight}
        decay={1.2}
        distance={12}
        intensity={intensity}
        penumbra={0.82}
        position={[-3.2, 4.2, 4.2]}
      />
      <spotLight
        angle={0.36}
        color={config.accent}
        decay={1.1}
        distance={10}
        intensity={1.6 + progress * 2.4}
        penumbra={0.78}
        position={[3.4, 3.4, 4.6]}
      />
      <pointLight color={config.foil} intensity={1.2 + progress * 1.8} position={[0, -1.4, 2.8]} />
    </>
  );
}
