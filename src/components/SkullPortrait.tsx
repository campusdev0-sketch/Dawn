import { useEffect, useRef } from 'react';
import { SKULL_DEFS } from '../game/data';
import { heroSprites } from '../game/sprites';
import { SkullId } from '../game/types';

interface SkullPortraitProps {
  skullId: SkullId;
  size?: number;
  className?: string;
}

export function SkullPortrait({
  skullId,
  size = 44,
  className = '',
}: SkullPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const def = SKULL_DEFS[skullId];

  useEffect(() => {
    heroSprites.preload();
    let animTime = 0;

    const renderFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const drawn = heroSprites.drawSkullPortrait(ctx, skullId, size, animTime);
      if (!drawn) {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = def.primaryColor;
        ctx.font = `700 ${Math.round(size * 0.34)}px "Cinzel", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.name.slice(0, 2).toUpperCase(), size / 2, size / 2);
      }
    };

    renderFrame();
    const unsub = heroSprites.onLoad(renderFrame);
    const interval = window.setInterval(() => {
      animTime += 0.14;
      renderFrame();
    }, 140);

    return () => {
      unsub();
      window.clearInterval(interval);
    };
  }, [skullId, size, def.name, def.primaryColor]);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/15 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: `${def.cloakColor}88`,
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="block h-full w-full [image-rendering:pixelated]"
      />
    </div>
  );
}
