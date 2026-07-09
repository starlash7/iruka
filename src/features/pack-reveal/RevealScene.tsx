import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { CardMesh } from "./CardMesh";
import { LightstickParticles } from "./LightstickParticles";
import { PackMesh } from "./PackMesh";
import { StageLights } from "./StageLights";
import { getRevealConfig, type RevealCard, type RevealPhase } from "./revealConfig";

type RevealSceneProps = {
  card: RevealCard;
  phase: RevealPhase;
  progress: number;
  reducedMotion: boolean;
};

export function RevealScene({ card, phase, progress, reducedMotion }: RevealSceneProps) {
  const config = getRevealConfig(card.rarity);

  return (
    <Canvas
      camera={{ fov: 40, position: [0, 0.05, 5.9] }}
      dpr={[1, reducedMotion ? 1 : 2]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      }}
    >
      <StageLights config={config} progress={progress} />
      <Environment preset="city" />
      <group position={[0, 0.1, 0]}>
        <PackMesh config={config} phase={phase} progress={progress} />
        <CardMesh
          card={card}
          config={config}
          phase={phase}
          progress={progress}
          reducedMotion={reducedMotion}
        />
        <LightstickParticles config={config} phase={phase} progress={progress} />
      </group>
      {config.bloom && !reducedMotion ? (
        <EffectComposer>
          <Bloom intensity={0.62} luminanceThreshold={0.18} mipmapBlur />
        </EffectComposer>
      ) : null}
    </Canvas>
  );
}
