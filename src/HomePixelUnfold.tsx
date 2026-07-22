import { useEffect, useRef } from "react";
import skyOcean from "./assets/iruka-entry-sky-ocean.png";

const PIXEL_SIZE = 32;
const DURATION_MS = 3000;

type Tile = { x: number; y: number };

function shuffleTiles(tiles: Tile[]) {
  for (let index = tiles.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [tiles[index], tiles[randomIndex]] = [tiles[randomIndex], tiles[index]];
  }

  return tiles;
}

function drawBackground(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  tile?: Tile
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;
  const offsetX = (width - imageWidth) / 2;
  const offsetY = (height - imageHeight) / 2;

  if (!tile) {
    context.drawImage(image, offsetX, offsetY, imageWidth, imageHeight);
    return;
  }

  const tileWidth = Math.min(PIXEL_SIZE, width - tile.x);
  const tileHeight = Math.min(PIXEL_SIZE, height - tile.y);
  context.drawImage(
    image,
    (tile.x - offsetX) / scale,
    (tile.y - offsetY) / scale,
    tileWidth / scale,
    tileHeight / scale,
    tile.x,
    tile.y,
    tileWidth,
    tileHeight
  );
}

export function HomePixelUnfold() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame: number | undefined;
    let image: HTMLImageElement | undefined;
    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const drawFullBackground = () => {
      if (!image) return;
      context.clearRect(0, 0, width, height);
      drawBackground(context, image, width, height);
    };

    const unfoldBackground = () => {
      if (!image || reducedMotion.matches) {
        drawFullBackground();
        return;
      }

      const tiles: Tile[] = [];
      for (let y = 0; y < height; y += PIXEL_SIZE) {
        for (let x = 0; x < width; x += PIXEL_SIZE) tiles.push({ x, y });
      }

      shuffleTiles(tiles);
      const startTime = performance.now();
      let revealedTileCount = 0;

      const drawFrame = (now: number) => {
        const progress = Math.min((now - startTime) / DURATION_MS, 1);
        const nextTileCount = Math.ceil(progress * tiles.length);

        for (let index = revealedTileCount; index < nextTileCount; index += 1) {
          drawBackground(context, image!, width, height, tiles[index]);
        }

        revealedTileCount = nextTileCount;
        if (revealedTileCount === tiles.length) {
          animationFrame = undefined;
        } else {
          animationFrame = window.requestAnimationFrame(drawFrame);
        }
      };

      animationFrame = window.requestAnimationFrame(drawFrame);
    };

    const handleResize = () => {
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
      resizeCanvas();
      drawFullBackground();
    };

    const handleMotionChange = () => {
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
      drawFullBackground();
    };

    resizeCanvas();
    image = new Image();
    image.onload = unfoldBackground;
    image.src = skyOcean;
    window.addEventListener("resize", handleResize);
    reducedMotion.addEventListener("change", handleMotionChange);

    return () => {
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      reducedMotion.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return <canvas aria-hidden="true" className="iruka-entry-pixel-unfold" ref={canvasRef} />;
}
