import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, DoubleSide, Group, MathUtils, SRGBColorSpace } from "three";
import { formatUsd } from "../../currency";
import type { RevealCard, RevealConfig, RevealPhase } from "./revealConfig";

type CardMeshProps = {
  card: RevealCard;
  config: RevealConfig;
  phase: RevealPhase;
  progress: number;
  reducedMotion: boolean;
};

function smoothRange(start: number, end: number, value: number) {
  return MathUtils.smoothstep(value, start, end);
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fill();
}

function createCardTexture(card: RevealCard, config: RevealConfig) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 900;

  const context = canvas.getContext("2d");
  if (!context) return new CanvasTexture(canvas);

  const face = context.createLinearGradient(0, 0, 640, 900);
  face.addColorStop(0, "#FFFFFF");
  face.addColorStop(0.48, "#EAF4FF");
  face.addColorStop(1, config.accent);

  context.fillStyle = "#FFFFFF";
  fillRoundedRect(context, 0, 0, 640, 900, 52);
  context.fillStyle = face;
  context.globalAlpha = 0.72;
  fillRoundedRect(context, 28, 28, 584, 844, 42);
  context.globalAlpha = 1;

  context.fillStyle = "rgba(255, 255, 255, 0.66)";
  fillRoundedRect(context, 62, 80, 516, 560, 34);

  const glow = context.createRadialGradient(320, 330, 8, 320, 330, 360);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  glow.addColorStop(0.44, `${config.accent}38`);
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = glow;
  fillRoundedRect(context, 62, 80, 516, 560, 34);

  context.fillStyle = `${config.accent}94`;
  context.beginPath();
  context.arc(320, 330, 78, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255, 255, 255, 0.48)";
  context.beginPath();
  context.arc(320, 330, 36, 0, Math.PI * 2);
  context.fill();

  context.textAlign = "center";
  context.fillStyle = "#475467";
  context.font = "800 26px Inter, Arial, sans-serif";
  context.fillText(card.serial ?? "IRUKA", 320, 116);

  context.fillStyle = "#101828";
  context.font = "900 106px Inter, Arial, sans-serif";
  context.fillText(card.name.slice(0, 2).toUpperCase(), 320, 514);

  context.textAlign = "left";
  context.font = "900 46px Inter, Arial, sans-serif";
  context.fillText(card.name, 86, 716);
  context.fillStyle = config.accent;
  context.font = "900 26px Inter, Arial, sans-serif";
  context.fillText(config.name, 86, 820);

  context.textAlign = "right";
  context.fillStyle = "#101828";
  context.font = "900 28px Inter, Arial, sans-serif";
  context.fillText(card.valueLabel ?? formatUsd(card.estimatedValue), 554, 820);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function CardMesh({ card, config, phase, progress, reducedMotion }: CardMeshProps) {
  const meshRef = useRef<Group>(null);
  const texture = useMemo(() => createCardTexture(card, config), [card, config]);
  const lift = smoothRange(config.name === "Common" ? 0.28 : 0.54, 0.78, progress);
  const orbit = config.bloom ? smoothRange(0.82, 0.98, progress) : 0;
  const stamp = phase === "stamp" ? 1 : smoothRange(0.86, 1, progress);

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  useFrame(({ clock, pointer }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const idle = phase === "stamp" && !reducedMotion ? 1 : 0;
    const liftY = -2.05 + lift * 2.1;

    mesh.position.y = liftY + Math.sin(clock.elapsedTime * 1.4) * 0.025 * idle;
    mesh.position.z = 0.22 + lift * 0.24;
    mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, -0.06 + pointer.y * 0.08 * idle, 0.1);
    mesh.rotation.y = orbit * Math.PI * 2 + pointer.x * 0.12 * idle;
    mesh.rotation.z = MathUtils.lerp(mesh.rotation.z, (1 - lift) * -0.08, 0.12);
    mesh.scale.setScalar(0.74 + lift * 0.28 + stamp * 0.03);
  });

  return (
    <group>
      <group ref={meshRef} position={[0, -2.05, 0.22]} scale={0.74}>
        <mesh>
          <boxGeometry args={[1.55, 2.18, 0.055, 8, 8, 1]} />
          <meshPhysicalMaterial
            clearcoat={1}
            clearcoatRoughness={0.08}
            color="#FFFFFF"
            emissive={config.accent}
            emissiveIntensity={0.06 + stamp * 0.14}
            iridescence={config.bloom ? 0.72 : 0.32}
            iridescenceIOR={1.7}
            iridescenceThicknessRange={[120, 520]}
            metalness={0.08}
            opacity={0.68}
            roughness={0.18}
            transparent
          />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.45, 2.08]} />
          <meshBasicMaterial map={texture} side={DoubleSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.04]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.45, 2.08]} />
          <meshBasicMaterial map={texture} side={DoubleSide} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, -0.1 + lift * 0.95, -0.05]} scale={[1.5 + lift * 0.5, 0.16, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={config.accent} transparent opacity={0.12 + lift * 0.18} />
      </mesh>
    </group>
  );
}
