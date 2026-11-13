export type VfxKey =
  | 'lightning'
  | 'trail73'
  | 'circle131'
  | 'flare20'
  | 'fire13'
  | 'bloodAnim'
  | 'plus1'
  | 'pixelLightning'
  | 'pixelBlood'
  | 'snow5'
  | 'debris2'
  | 'smoke24'
  | 'flare6'
  | 'trail71'
  | 'circle96'
  | 'flare3'
  | 'flare21'
  | 'glow1'
  | 'point12'
  | 'point19';

const VFX_PATHS: Record<VfxKey, string> = {
  lightning: '/Asses/vfx/lightning/Lightning11.png',
  trail73: '/Asses/vfx/lightning/Trail73.png',
  trail71: '/Asses/vfx/lightning/Trail71.png',
  circle131: '/Asses/vfx/auras/Circle131.png',
  circle96: '/Asses/vfx/auras/Circle96.png',
  flare20: '/Asses/vfx/auras/Flare20.png',
  flare3: '/Asses/vfx/auras/Flare3.png',
  flare21: '/Asses/vfx/auras/Flare21.png',
  fire13: '/Asses/vfx/auras/Fire13.png',
  glow1: '/Asses/vfx/auras/Glow1.png',
  bloodAnim: '/Asses/vfx/impacts/BloodAnim1.png',
  plus1: '/Asses/vfx/impacts/Plus1.png',
  point12: '/Asses/vfx/impacts/Point12.png',
  point19: '/Asses/vfx/impacts/Point19.png',
  pixelLightning: '/Asses/vfx/pixel/LightningBolt.png',
  pixelBlood: '/Asses/vfx/pixel/Bloodspurt.png',
  snow5: '/Asses/vfx/impacts/Snow5.png',
  debris2: '/Asses/vfx/impacts/Debris2.png',
  smoke24: '/Asses/vfx/impacts/Smoke24.png',
  flare6: '/Asses/vfx/auras/Flare6.png',
};

class VfxAtlas {
  private images: Partial<Record<VfxKey, HTMLImageElement>> = {};
  private started = false;

  preload() {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    (Object.keys(VFX_PATHS) as VfxKey[]).forEach((key) => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
      };
      img.src = VFX_PATHS[key];
    });
  }

  get(key: VfxKey): HTMLImageElement | null {
    return this.images[key] ?? null;
  }

  /**
   * Draws one of the 4 cells from Lightning11.png (2x2 grid, additive black-keyed).
   */
  drawLightningCell(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    cellIndex: number,
    rotation = 0,
    alpha = 0.85
  ) {
    const img = this.get('lightning');
    if (!img) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const idx = ((cellIndex % 4) + 4) % 4;
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cw = iw / 2;
    const ch = ih / 2;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(img, col * cw, row * ch, cw, ch, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  /**
   * Draws rotating character aura (Circle131.png) with optional tint glow.
   */
  drawAuraRing(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    rotation: number,
    alpha = 0.45,
    key:
      | 'circle131'
      | 'circle96'
      | 'fire13'
      | 'flare20'
      | 'flare3'
      | 'flare21'
      | 'glow1' = 'circle131'
  ) {
    const img = this.get(key);
    if (!img) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }

  /**
   * Draws an animated frame from BloodAnim1.png (3x3 grid).
   */
  drawBloodFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: 1 | -1,
    size: number,
    progress: number,
    alpha = 0.9
  ) {
    const img = this.get('bloodAnim');
    if (!img) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const frame = Math.min(8, Math.max(0, Math.floor(progress * 9)));
    const col = frame % 3;
    const row = Math.floor(frame / 3);
    const cw = iw / 3;
    const ch = ih / 3;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    ctx.drawImage(
      img,
      col * cw,
      row * ch,
      cw,
      ch,
      -size * 0.25,
      -size * 0.5,
      size,
      size
    );
    ctx.restore();
  }

  /**
   * Draws electric dash/beam trail (Trail73.png) horizontally.
   */
  drawElectricTrail(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: 1 | -1,
    width: number,
    height: number,
    alpha = 0.75
  ) {
    const img = this.get('trail73');
    if (!img) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    ctx.drawImage(img, -width * 0.5, -height * 0.5, width, height);
    ctx.restore();
  }
  /**
   * Draws crisp pixel-art lightning bolt from LightningBolt.png (2x2 grid, 64x32 cells).
   */
  drawPixelLightning(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: 1 | -1,
    width: number,
    progress: number,
    alpha = 0.95
  ) {
    const img = this.get('pixelLightning');
    if (!img) return;
    const frame = Math.min(3, Math.max(0, Math.floor(progress * 4)));
    const col = frame % 2;
    const row = Math.floor(frame / 2);
    const height = width * 0.5;

    ctx.save();
    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    ctx.drawImage(img, col * 64, row * 32, 64, 32, -width * 0.5, -height * 0.5, width, height);
    ctx.imageSmoothingEnabled = prevSmooth;
    ctx.restore();
  }

  /**
   * Draws crisp pixel-art blood spurt from Bloodspurt.png (4x2 grid, 6 frames).
   */
  drawPixelBlood(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: 1 | -1,
    size: number,
    progress: number,
    alpha = 0.95
  ) {
    const img = this.get('pixelBlood');
    if (!img) return;
    const frame = Math.min(5, Math.max(0, Math.floor(progress * 6)));
    const col = frame % 4;
    const row = Math.floor(frame / 4);

    ctx.save();
    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    ctx.drawImage(img, col * 64, row * 64, 64, 64, -size * 0.3, -size * 0.5, size, size);
    ctx.imageSmoothingEnabled = prevSmooth;
    ctx.restore();
  }

  drawSnowBurst(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    progress: number,
    alpha = 0.85
  ) {
    const img = this.get('snow5');
    if (!img) return;
    const size = radius * (0.9 + progress * 0.9);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * (1 - progress * 0.65);
    ctx.translate(x, y);
    ctx.rotate(progress * 1.4);
    ctx.drawImage(img, -size * 0.5, -size * 0.5, size, size);
    ctx.restore();
  }

  drawDebrisBurst(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: 1 | -1,
    radius: number,
    progress: number,
    alpha = 0.9
  ) {
    const img = this.get('debris2');
    if (!img) return;
    const size = radius * (0.85 + progress * 0.75);
    ctx.save();
    ctx.globalAlpha = alpha * (1 - progress * 0.55);
    ctx.translate(x, y - progress * 16);
    ctx.scale(facing, 1);
    ctx.rotate(progress * 1.2);
    ctx.drawImage(img, -size * 0.5, -size * 0.5, size, size);
    ctx.restore();
  }

  drawSmokeBurst(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    progress: number,
    alpha = 0.72
  ) {
    const img = this.get('smoke24');
    if (!img) return;
    const size = radius * (0.75 + progress * 0.95);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * (1 - progress * 0.75);
    ctx.translate(x, y);
    ctx.rotate(-progress * 0.9);
    ctx.drawImage(img, -size * 0.5, -size * 0.5, size, size);
    ctx.restore();
  }

  drawFireBurst(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    progress: number,
    alpha = 0.9
  ) {
    const flare = this.get('flare6');
    const fire = this.get('fire13');
    if (!flare && !fire) return;
    const size = radius * (0.9 + progress * 0.95);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * (1 - progress * 0.5);
    ctx.translate(x, y);
    ctx.rotate(progress * 2.1);
    if (fire) ctx.drawImage(fire, -size * 0.5, -size * 0.5, size, size);
    if (flare) ctx.drawImage(flare, -size * 0.55, -size * 0.55, size * 1.1, size * 1.1);
    ctx.restore();
  }

  drawBeamTrail(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: 1 | -1,
    width: number,
    height: number,
    alpha = 0.8
  ) {
    const img = this.get('trail71');
    if (!img) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    ctx.drawImage(img, -width * 0.5, -height * 0.5, width, height);
    ctx.restore();
  }

  drawImpactPoint(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    progress: number,
    key: 'point12' | 'point19' = 'point19',
    alpha = 0.95
  ) {
    const img = this.get(key);
    if (!img) return;
    const size = radius * (1.25 - progress * 0.35);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * (1 - progress * 0.65);
    ctx.translate(x, y);
    ctx.rotate(progress * 0.9);
    ctx.drawImage(img, -size * 0.5, -size * 0.5, size, size);
    ctx.restore();
  }
}

export const vfxAtlas = new VfxAtlas();
