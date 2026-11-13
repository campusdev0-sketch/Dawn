import { EnemyType, SkullId } from './types';

export type HeroAnimName =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'fall'
  | 'fall_loop'
  | 'combo_1'
  | 'combo_1_end';

interface AnimMeta {
  file: string;
  frames: number;
  fps: number;
  loop: boolean;
}

export const HERO_ANIMS: Record<HeroAnimName, AnimMeta> = {
  idle: { file: '/Asses/characters/hero/locomotion/male_hero_template-idle.png', frames: 10, fps: 10, loop: true },
  walk: { file: '/Asses/characters/hero/locomotion/male_hero_template-walk.png', frames: 10, fps: 12, loop: true },
  run: { file: '/Asses/characters/hero/locomotion/male_hero_template-run.png', frames: 10, fps: 15, loop: true },
  jump: { file: '/Asses/characters/hero/locomotion/male_hero_template-jump.png', frames: 6, fps: 15, loop: false },
  fall: { file: '/Asses/characters/hero/locomotion/male_hero_template-fall.png', frames: 4, fps: 14, loop: false },
  fall_loop: { file: '/Asses/characters/hero/locomotion/male_hero_template-fall_loop.png', frames: 3, fps: 12, loop: true },
  combo_1: { file: '/Asses/characters/hero/combat/male_hero_template-combo_1.png', frames: 3, fps: 20, loop: false },
  combo_1_end: { file: '/Asses/characters/hero/combat/male_hero_template-combo_1_end.png', frames: 4, fps: 18, loop: false },
};

type RGB = [number, number, number];

interface SkullPalette {
  head: RGB;
  torso: RGB;
  armFront: RGB;
  armBack: RGB;
  legFront: RGB;
  legBack: RGB;
  blade: RGB;
  bladeHighlight: RGB;
}

// Template RGB keys measured from male_hero_template PNGs
const SRC_HEAD: RGB = [102, 190, 203];
const SRC_TORSO: RGB = [120, 166, 108];
const SRC_ARM_FRONT: RGB = [215, 126, 126];
const SRC_ARM_BACK: RGB = [169, 66, 119];
const SRC_LEG_FRONT: RGB = [84, 137, 177];
const SRC_LEG_BACK: RGB = [40, 53, 132];
const SRC_BLADE: RGB = [166, 252, 219];
const SRC_BLADE_HI: RGB = [255, 255, 255];

const SKULL_PALETTES: Record<SkullId, SkullPalette> = {
  little_bone: {
    head: [241, 245, 249],
    torso: [51, 65, 85],
    armFront: [226, 232, 240],
    armBack: [190, 18, 60],
    legFront: [100, 116, 139],
    legBack: [30, 41, 59],
    blade: [245, 158, 11],
    bladeHighlight: [254, 243, 199],
  },
  berserker: {
    head: [252, 165, 165],
    torso: [127, 29, 29],
    armFront: [239, 68, 68],
    armBack: [153, 27, 27],
    legFront: [71, 85, 105],
    legBack: [30, 41, 59],
    blade: [239, 68, 68],
    bladeHighlight: [254, 226, 226],
  },
  ninja: {
    head: [30, 41, 59],
    torso: [15, 23, 42],
    armFront: [56, 189, 248],
    armBack: [14, 116, 144],
    legFront: [51, 65, 85],
    legBack: [15, 23, 42],
    blade: [34, 211, 238],
    bladeHighlight: [224, 242, 254],
  },
  lich: {
    head: [221, 214, 254],
    torso: [49, 46, 129],
    armFront: [167, 139, 250],
    armBack: [109, 40, 217],
    legFront: [67, 56, 202],
    legBack: [30, 27, 75],
    blade: [192, 132, 252],
    bladeHighlight: [243, 232, 255],
  },
  frost_warden: {
    head: [186, 230, 253],
    torso: [15, 76, 129],
    armFront: [125, 211, 252],
    armBack: [3, 105, 161],
    legFront: [56, 189, 248],
    legBack: [12, 74, 110],
    blade: [125, 211, 252],
    bladeHighlight: [240, 249, 255],
  },
  pyromancer: {
    head: [254, 215, 170],
    torso: [153, 27, 27],
    armFront: [251, 146, 60],
    armBack: [185, 28, 28],
    legFront: [234, 88, 12],
    legBack: [124, 45, 18],
    blade: [253, 224, 71],
    bladeHighlight: [255, 251, 235],
  },
  void_reaver: {
    head: [251, 113, 133],
    torso: [88, 28, 135],
    armFront: [244, 63, 94],
    armBack: [136, 19, 55],
    legFront: [76, 5, 25],
    legBack: [30, 27, 75],
    blade: [244, 63, 94],
    bladeHighlight: [254, 205, 211],
  },
  astral_lancer: {
    head: [224, 242, 254],
    torso: [30, 41, 59],
    armFront: [56, 189, 248],
    armBack: [2, 132, 199],
    legFront: [250, 204, 21],
    legBack: [161, 98, 7],
    blade: [56, 189, 248],
    bladeHighlight: [255, 255, 255],
  },
};

function colorMatch(r: number, g: number, b: number, target: RGB): boolean {
  return (
    Math.abs(r - target[0]) <= 12 &&
    Math.abs(g - target[1]) <= 12 &&
    Math.abs(b - target[2]) <= 12
  );
}

function recolorSheet(
  img: HTMLImageElement,
  palette: SkullPalette,
  hideHead = false
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    // Keep outline crisp black
    if (r < 20 && g < 20 && b < 20) continue;

    if (colorMatch(r, g, b, SRC_HEAD)) {
      if (hideHead) {
        d[i + 3] = 0;
        continue;
      }
      d[i] = palette.head[0];
      d[i + 1] = palette.head[1];
      d[i + 2] = palette.head[2];
    } else if (colorMatch(r, g, b, SRC_TORSO)) {
      d[i] = palette.torso[0];
      d[i + 1] = palette.torso[1];
      d[i + 2] = palette.torso[2];
    } else if (colorMatch(r, g, b, SRC_ARM_FRONT)) {
      d[i] = palette.armFront[0];
      d[i + 1] = palette.armFront[1];
      d[i + 2] = palette.armFront[2];
    } else if (colorMatch(r, g, b, SRC_ARM_BACK) || colorMatch(r, g, b, [92, 44, 79])) {
      d[i] = palette.armBack[0];
      d[i + 1] = palette.armBack[1];
      d[i + 2] = palette.armBack[2];
    } else if (colorMatch(r, g, b, SRC_LEG_FRONT)) {
      d[i] = palette.legFront[0];
      d[i + 1] = palette.legFront[1];
      d[i + 2] = palette.legFront[2];
    } else if (colorMatch(r, g, b, SRC_LEG_BACK)) {
      d[i] = palette.legBack[0];
      d[i + 1] = palette.legBack[1];
      d[i + 2] = palette.legBack[2];
    } else if (colorMatch(r, g, b, SRC_BLADE)) {
      d[i] = palette.blade[0];
      d[i + 1] = palette.blade[1];
      d[i + 2] = palette.blade[2];
    } else if (colorMatch(r, g, b, SRC_BLADE_HI)) {
      d[i] = palette.bladeHighlight[0];
      d[i + 1] = palette.bladeHighlight[1];
      d[i + 2] = palette.bladeHighlight[2];
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export type PixelHeroKey =
  | 'barbarian'
  | 'stormMage'
  | 'stormMageAttack'
  | 'necromancerAttack'
  | 'druid'
  | 'druidDeath'
  | 'firemage'
  | 'alchemist'
  | 'alchemistDeath'
  | 'rogueAttack';

const PIXEL_HERO_PATHS: Record<PixelHeroKey, string> = {
  barbarian: '/Asses/characters/pixel_heroes/Barbarian.png',
  stormMage: '/Asses/characters/pixel_heroes/StormMage.png',
  stormMageAttack: '/Asses/characters/pixel_heroes/StormMage_AttackNoEffect.png',
  necromancerAttack: '/Asses/characters/pixel_heroes/Necromancer_Attack.png',
  druid: '/Asses/characters/pixel_heroes/Druid.png',
  druidDeath: '/Asses/characters/pixel_heroes/Druid_Death.png',
  firemage: '/Asses/characters/pixel_heroes/Firemage.png',
  alchemist: '/Asses/characters/pixel_heroes/Alchemist.png',
  alchemistDeath: '/Asses/characters/pixel_heroes/Alchemist_DeathNoBlood.png',
  rogueAttack: '/Asses/characters/pixel_heroes/Rogue_Attack.png',
};

interface SheetFrameSpec {
  key: PixelHeroKey;
  cellW: number;
  cellH: number;
  cols: number;
  anchorX: number;
  footY: number;
  scale: number;
}

const BARBARIAN_SPEC: SheetFrameSpec = {
  key: 'barbarian',
  cellW: 100,
  cellH: 64,
  cols: 5,
  anchorX: 50,
  footY: 61,
  scale: 1.44,
};

const STORM_MAGE_SPEC: SheetFrameSpec = {
  key: 'stormMage',
  cellW: 64,
  cellH: 64,
  cols: 8,
  anchorX: 32,
  footY: 61,
  scale: 1.52,
};

const STORM_MAGE_ATK_SPEC: SheetFrameSpec = {
  key: 'stormMageAttack',
  cellW: 128,
  cellH: 100,
  cols: 4,
  anchorX: 64,
  footY: 97,
  scale: 1.52,
};

const NECRO_ATK_SPEC: SheetFrameSpec = {
  key: 'necromancerAttack',
  cellW: 100,
  cellH: 80,
  cols: 5,
  anchorX: 48,
  footY: 77,
  scale: 1.44,
};

const DRUID_SPEC: SheetFrameSpec = {
  key: 'druid',
  cellW: 64,
  cellH: 64,
  cols: 8,
  anchorX: 30,
  footY: 61,
  scale: 1.34,
};

const DRUID_DEATH_SPEC: SheetFrameSpec = {
  key: 'druidDeath',
  cellW: 80,
  cellH: 80,
  cols: 6,
  anchorX: 38,
  footY: 68,
  scale: 1.34,
};

const FIREMAGE_SPEC: SheetFrameSpec = {
  key: 'firemage',
  cellW: 80,
  cellH: 64,
  cols: 12,
  anchorX: 40,
  footY: 61,
  scale: 1.36,
};

const ALCHEMIST_SPEC: SheetFrameSpec = {
  key: 'alchemist',
  cellW: 64,
  cellH: 64,
  cols: 8,
  anchorX: 32,
  footY: 61,
  scale: 1.44,
};

const ALCHEMIST_DEATH_SPEC: SheetFrameSpec = {
  key: 'alchemistDeath',
  cellW: 64,
  cellH: 64,
  cols: 4,
  anchorX: 32,
  footY: 61,
  scale: 1.44,
};

const ROGUE_ATK_SPEC: SheetFrameSpec = {
  key: 'rogueAttack',
  cellW: 100,
  cellH: 100,
  cols: 5,
  anchorX: 48,
  footY: 97,
  scale: 1.54,
};

type UnitId =
  | 'f1_bromemk2'
  | 'f2_tier2general'
  | 'f3_grandmasternoshrak'
  | 'f4_maehvmk2'
  | 'f5_megabrontodon'
  | 'f6_greatwhitenorth'
  | 'neutral_trinitywing'
  | 'boss_skyfalltyrant';

type UnitAnim = 'idle' | 'run' | 'attack' | 'cast' | 'hit' | 'death';

interface UnitAnimSpec {
  frames: number;
  fps: number;
  loop: boolean;
}

interface UnitConfig {
  cellW: number;
  cellH: number;
  anchorX: number;
  footY: number;
  portraitBox: [number, number, number, number];
  anims: Partial<Record<UnitAnim, UnitAnimSpec>>;
}

const UNIT_CONFIGS: Record<UnitId, UnitConfig> = {
  f1_bromemk2: {
    cellW: 130,
    cellH: 130,
    anchorX: 64,
    footY: 114,
    portraitBox: [34, 48, 60, 60],
    anims: {
      idle: { frames: 10, fps: 12.5, loop: true },
      run: { frames: 10, fps: 12.5, loop: true },
      attack: { frames: 28, fps: 24, loop: false },
      cast: { frames: 10, fps: 14, loop: false },
      hit: { frames: 3, fps: 12.5, loop: false },
      death: { frames: 14, fps: 15, loop: false },
    },
  },
  f2_tier2general: {
    cellW: 134,
    cellH: 134,
    anchorX: 67,
    footY: 117,
    portraitBox: [38, 46, 58, 58],
    anims: {
      idle: { frames: 16, fps: 12.5, loop: true },
      run: { frames: 8, fps: 14, loop: true },
      attack: { frames: 40, fps: 36, loop: false },
      hit: { frames: 3, fps: 12.5, loop: false },
      death: { frames: 19, fps: 18, loop: false },
    },
  },
  f3_grandmasternoshrak: {
    cellW: 130,
    cellH: 130,
    anchorX: 66,
    footY: 111,
    portraitBox: [38, 36, 56, 56],
    anims: {
      idle: { frames: 20, fps: 12.5, loop: true },
      run: { frames: 8, fps: 12.5, loop: true },
      attack: { frames: 35, fps: 38, loop: false },
      hit: { frames: 3, fps: 12.5, loop: false },
      death: { frames: 24, fps: 20, loop: false },
    },
  },
  f4_maehvmk2: {
    cellW: 130,
    cellH: 130,
    anchorX: 64,
    footY: 113,
    portraitBox: [36, 38, 56, 56],
    anims: {
      idle: { frames: 20, fps: 12.5, loop: true },
      run: { frames: 8, fps: 12.5, loop: true },
      attack: { frames: 29, fps: 34, loop: false },
      cast: { frames: 11, fps: 16, loop: false },
      hit: { frames: 3, fps: 12.5, loop: false },
      death: { frames: 19, fps: 18, loop: false },
    },
  },
  f5_megabrontodon: {
    cellW: 130,
    cellH: 130,
    anchorX: 62,
    footY: 113,
    portraitBox: [34, 42, 66, 66],
    anims: {
      idle: { frames: 14, fps: 12.5, loop: true },
      run: { frames: 10, fps: 12.5, loop: true },
      attack: { frames: 20, fps: 24, loop: false },
      hit: { frames: 3, fps: 12.5, loop: false },
      death: { frames: 17, fps: 18, loop: false },
    },
  },
  f6_greatwhitenorth: {
    cellW: 120,
    cellH: 120,
    anchorX: 52,
    footY: 104,
    portraitBox: [26, 32, 60, 60],
    anims: {
      idle: { frames: 14, fps: 12.5, loop: true },
      run: { frames: 8, fps: 12.5, loop: true },
      attack: { frames: 21, fps: 24, loop: false },
      hit: { frames: 3, fps: 12.5, loop: false },
      death: { frames: 17, fps: 18, loop: false },
    },
  },
  neutral_trinitywing: {
    cellW: 100,
    cellH: 100,
    anchorX: 50,
    footY: 84,
    portraitBox: [22, 20, 58, 58],
    anims: {
      idle: { frames: 8, fps: 12.5, loop: true },
      run: { frames: 8, fps: 12.5, loop: true },
      attack: { frames: 32, fps: 30, loop: false },
      hit: { frames: 3, fps: 12.5, loop: false },
      death: { frames: 11, fps: 14, loop: false },
    },
  },
  boss_skyfalltyrant: {
    cellW: 100,
    cellH: 100,
    anchorX: 50,
    footY: 84,
    portraitBox: [22, 20, 58, 58],
    anims: {
      idle: { frames: 8, fps: 12.5, loop: true },
      run: { frames: 8, fps: 12.5, loop: true },
      attack: { frames: 32, fps: 30, loop: false },
      hit: { frames: 3, fps: 12.5, loop: false },
      death: { frames: 11, fps: 14, loop: false },
    },
  },
};

function pickRangeFrame(
  start: number,
  end: number,
  elapsed: number,
  fps: number,
  loop: boolean
): number {
  const count = end - start + 1;
  const raw = Math.floor(elapsed * fps);
  const idx = loop
    ? ((raw % count) + count) % count
    : Math.min(count - 1, Math.max(0, raw));
  return start + idx;
}

class HeroSpriteAtlas {
  private rawSheets: Partial<Record<HeroAnimName, HTMLImageElement>> = {};
  private pixelHeroes: Partial<Record<PixelHeroKey, HTMLImageElement>> = {};
  private unitStrips: Map<string, HTMLImageElement> = new Map();
  private variants: Map<string, HTMLCanvasElement> = new Map();
  private listeners: Set<() => void> = new Set();
  private started = false;

  onLoad(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifyLoaded() {
    this.listeners.forEach((cb) => cb());
  }

  preload() {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    (Object.keys(HERO_ANIMS) as HeroAnimName[]).forEach((anim) => {
      const img = new Image();
      img.onload = () => {
        this.rawSheets[anim] = img;
        // Bake palette variants for every skull
        (Object.keys(SKULL_PALETTES) as SkullId[]).forEach((skullId) => {
          const key = `${skullId}:${anim}`;
          this.variants.set(key, recolorSheet(img, SKULL_PALETTES[skullId], false));
        });
        this.variants.set(
          `little_bone_headless:${anim}`,
          recolorSheet(img, SKULL_PALETTES.little_bone, true)
        );
        this.notifyLoaded();
      };
      img.src = HERO_ANIMS[anim].file;
    });

    (Object.keys(PIXEL_HERO_PATHS) as PixelHeroKey[]).forEach((key) => {
      const img = new Image();
      img.onload = () => {
        this.pixelHeroes[key] = img;
        this.notifyLoaded();
      };
      img.src = PIXEL_HERO_PATHS[key];
    });

    (Object.keys(UNIT_CONFIGS) as UnitId[]).forEach((unitId) => {
      const cfg = UNIT_CONFIGS[unitId];
      (Object.keys(cfg.anims) as UnitAnim[]).forEach((anim) => {
        const img = new Image();
        img.onload = () => {
          this.unitStrips.set(`${unitId}:${anim}`, img);
          this.notifyLoaded();
        };
        img.src = `/Asses/characters/units/${unitId}/${unitId}_${anim}.png`;
      });
    });
  }

  getSheet(
    skullId: SkullId,
    anim: HeroAnimName,
    headless = false
  ): HTMLCanvasElement | null {
    const key =
      headless && skullId === 'little_bone'
        ? `little_bone_headless:${anim}`
        : `${skullId}:${anim}`;
    return this.variants.get(key) ?? null;
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    spec: SheetFrameSpec,
    frameIndex: number
  ): boolean {
    const img = this.pixelHeroes[spec.key];
    if (!img) return false;
    const col = frameIndex % spec.cols;
    const row = Math.floor(frameIndex / spec.cols);
    const sx =
      spec.key === 'necromancerAttack' && row === 0 && col === 1
        ? 101
        : col * spec.cellW;
    const sy = row * spec.cellH;

    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      img,
      sx,
      sy,
      spec.cellW,
      spec.cellH,
      -spec.anchorX * spec.scale,
      -spec.footY * spec.scale,
      spec.cellW * spec.scale,
      spec.cellH * spec.scale
    );
    ctx.imageSmoothingEnabled = prevSmooth;
    return true;
  }

  /**
   * Draws recovered Unity Pixel Heroes sheets for Berserker (Barbarian),
   * Frost Warden (StormMage), Pyromancer (Firemage), and Lich scythe attack.
   * Returns false when the skull should use the default male_hero_template sheet.
   */
  drawCustomSkullFrame(
    ctx: CanvasRenderingContext2D,
    skullId: SkullId,
    anim: HeroAnimName,
    elapsed: number,
    attackProgress: number,
    hitFlash = false
  ): boolean {
    if (skullId === 'berserker') {
      if (hitFlash) {
        return this.drawCell(ctx, BARBARIAN_SPEC, 32);
      }
      if (anim === 'combo_1' || anim === 'combo_1_end') {
        const frame = 22 + Math.min(9, Math.max(0, Math.floor(attackProgress * 10)));
        return this.drawCell(ctx, BARBARIAN_SPEC, frame);
      }
      if (anim === 'jump') {
        return this.drawCell(ctx, BARBARIAN_SPEC, pickRangeFrame(46, 49, elapsed, 11, false));
      }
      if (anim === 'fall' || anim === 'fall_loop') {
        return this.drawCell(ctx, BARBARIAN_SPEC, pickRangeFrame(51, 54, elapsed, 10, true));
      }
      if (anim === 'walk' || anim === 'run') {
        return this.drawCell(
          ctx,
          BARBARIAN_SPEC,
          pickRangeFrame(12, 21, elapsed, anim === 'run' ? 13 : 10, true)
        );
      }
      return this.drawCell(ctx, BARBARIAN_SPEC, pickRangeFrame(0, 11, elapsed, 9, true));
    }

    if (skullId === 'frost_warden') {
      if (anim === 'combo_1' || anim === 'combo_1_end') {
        const frame = Math.min(17, Math.max(0, Math.floor(attackProgress * 18)));
        if (this.drawCell(ctx, STORM_MAGE_ATK_SPEC, frame)) {
          return true;
        }
      }
      if (anim === 'jump') {
        return this.drawCell(ctx, STORM_MAGE_SPEC, pickRangeFrame(42, 44, elapsed, 11, false));
      }
      if (anim === 'fall' || anim === 'fall_loop') {
        return this.drawCell(ctx, STORM_MAGE_SPEC, pickRangeFrame(48, 50, elapsed, 10, true));
      }
      if (anim === 'walk' || anim === 'run') {
        return this.drawCell(
          ctx,
          STORM_MAGE_SPEC,
          pickRangeFrame(14, 23, elapsed, anim === 'run' ? 13 : 10, true)
        );
      }
      return this.drawCell(ctx, STORM_MAGE_SPEC, pickRangeFrame(0, 13, elapsed, 9, true));
    }

    if (skullId === 'pyromancer') {
      if (hitFlash) {
        return this.drawCell(ctx, FIREMAGE_SPEC, 18);
      }
      if (anim === 'combo_1' || anim === 'combo_1_end') {
        const frame = 35 + Math.min(6, Math.max(0, Math.floor(attackProgress * 7)));
        return this.drawCell(ctx, FIREMAGE_SPEC, frame);
      }
      if (anim === 'jump') {
        return this.drawCell(ctx, FIREMAGE_SPEC, pickRangeFrame(35, 40, elapsed, 11, false));
      }
      if (anim === 'fall' || anim === 'fall_loop') {
        return this.drawCell(ctx, FIREMAGE_SPEC, pickRangeFrame(41, 46, elapsed, 10, true));
      }
      if (anim === 'walk' || anim === 'run') {
        return this.drawCell(
          ctx,
          FIREMAGE_SPEC,
          pickRangeFrame(10, 17, elapsed, anim === 'run' ? 13 : 10, true)
        );
      }
      return this.drawCell(ctx, FIREMAGE_SPEC, pickRangeFrame(0, 9, elapsed, 9, true));
    }

    if (skullId === 'lich' && (anim === 'combo_1' || anim === 'combo_1_end')) {
      const frame = Math.min(14, Math.max(0, Math.floor(attackProgress * 15)));
      return this.drawCell(ctx, NECRO_ATK_SPEC, frame);
    }

    if (skullId === 'ninja' && (anim === 'combo_1' || anim === 'combo_1_end')) {
      const frame = Math.min(10, Math.max(0, Math.floor(attackProgress * 11)));
      return this.drawCell(ctx, ROGUE_ATK_SPEC, frame);
    }

    if (skullId === 'void_reaver' || skullId === 'astral_lancer') {
      const unitId: UnitId =
        skullId === 'void_reaver' ? 'f4_maehvmk2' : 'f3_grandmasternoshrak';
      let unitAnim: UnitAnim = 'idle';
      if (hitFlash) {
        unitAnim = 'hit';
      } else if (anim === 'combo_1' || anim === 'combo_1_end') {
        unitAnim = 'attack';
      } else if (anim === 'walk' || anim === 'run' || anim === 'jump' || anim === 'fall' || anim === 'fall_loop') {
        unitAnim = 'run';
      }
      return this.drawUnitFrame(
        ctx,
        unitId,
        unitAnim,
        unitAnim === 'attack' ? attackProgress : elapsed,
        0.92,
        unitAnim === 'attack'
      );
    }

    return false;
  }

  private drawUnitFrame(
    ctx: CanvasRenderingContext2D,
    unitId: UnitId,
    anim: UnitAnim,
    timeOrProgress: number,
    scale: number,
    useNormalizedProgress = false
  ): boolean {
    const cfg = UNIT_CONFIGS[unitId];
    const spec = cfg.anims[anim] ?? cfg.anims.idle;
    const chosenAnim = cfg.anims[anim] ? anim : 'idle';
    const img = this.unitStrips.get(`${unitId}:${chosenAnim}`) ?? this.unitStrips.get(`${unitId}:idle`);
    if (!img || !spec) return false;

    const frameIndex = useNormalizedProgress
      ? Math.min(spec.frames - 1, Math.max(0, Math.floor(timeOrProgress * spec.frames)))
      : pickRangeFrame(0, spec.frames - 1, timeOrProgress, spec.fps, spec.loop);

    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      img,
      frameIndex * cfg.cellW,
      0,
      cfg.cellW,
      cfg.cellH,
      -cfg.anchorX * scale,
      -cfg.footY * scale,
      cfg.cellW * scale,
      cfg.cellH * scale
    );
    ctx.imageSmoothingEnabled = prevSmooth;
    return true;
  }

  /**
   * Draws Pixel Heroes Druid animation for Battle Cleric enemies.
   */
  drawClericEnemyFrame(
    ctx: CanvasRenderingContext2D,
    state: string,
    animTime: number
  ): boolean {
    if (state === 'windup' || state === 'attack' || state === 'cast') {
      return this.drawCell(ctx, DRUID_SPEC, pickRangeFrame(24, 32, animTime, 11, true));
    }
    if (state === 'chase') {
      return this.drawCell(ctx, DRUID_SPEC, pickRangeFrame(16, 23, animTime, 9, true));
    }
    return this.drawCell(ctx, DRUID_SPEC, pickRangeFrame(0, 15, animTime, 8, true));
  }

  /**
   * Draws Pixel Heroes Alchemist animation for Plague Alchemist enemies.
   */
  drawAlchemistEnemyFrame(
    ctx: CanvasRenderingContext2D,
    state: string,
    animTime: number
  ): boolean {
    if (state === 'windup' || state === 'attack' || state === 'cast') {
      return this.drawCell(ctx, ALCHEMIST_SPEC, pickRangeFrame(36, 44, animTime, 11, true));
    }
    if (state === 'chase') {
      return this.drawCell(ctx, ALCHEMIST_SPEC, pickRangeFrame(16, 23, animTime, 10, true));
    }
    return this.drawCell(ctx, ALCHEMIST_SPEC, pickRangeFrame(0, 13, animTime, 9, true));
  }

  /**
   * Draws animated sprite strips for all unit-pack enemies and bosses.
   */
  drawUnitEnemyFrame(
    ctx: CanvasRenderingContext2D,
    enemyType: EnemyType,
    state: string,
    animTime: number,
    hitFlash: boolean,
    vx: number,
    attackVariant = 0
  ): boolean {
    const map: Partial<Record<EnemyType, { unitId: UnitId; scale: number }>> = {
      swordsman: { unitId: 'f2_tier2general', scale: 1.02 },
      crossbow: { unitId: 'neutral_trinitywing', scale: 1.05 },
      shield_knight: { unitId: 'f5_megabrontodon', scale: 1.15 },
      frost_wyrm: { unitId: 'f6_greatwhitenorth', scale: 1.08 },
      skyfall_tyrant: { unitId: 'boss_skyfalltyrant', scale: 1.48 },
      boss_gawain: { unitId: 'f1_bromemk2', scale: 1.68 },
    };
    const entry = map[enemyType];
    if (!entry) return false;

    let anim: UnitAnim = 'idle';
    if (hitFlash) {
      anim = 'hit';
    } else if (state === 'attack' || state === 'windup') {
      anim =
        enemyType === 'boss_gawain' && attackVariant === 1 ? 'cast' : 'attack';
    } else if (Math.abs(vx) > 18) {
      anim = 'run';
    }

    return this.drawUnitFrame(ctx, entry.unitId, anim, animTime, entry.scale, false);
  }

  /**
   * Draws enemy death animation frame before fade-out.
   */
  drawEnemyCorpseFrame(
    ctx: CanvasRenderingContext2D,
    type: EnemyType,
    progress: number
  ): boolean {
    if (type === 'cleric') {
      const frame = Math.min(17, Math.max(0, Math.floor(progress * 18)));
      return this.drawCell(ctx, DRUID_DEATH_SPEC, frame);
    }
    if (type === 'alchemist') {
      const frame = Math.min(10, Math.max(0, Math.floor(progress * 11)));
      return this.drawCell(ctx, ALCHEMIST_DEATH_SPEC, frame);
    }
    const unitDeathMap: Partial<Record<EnemyType, { unitId: UnitId; scale: number }>> = {
      swordsman: { unitId: 'f2_tier2general', scale: 1.02 },
      crossbow: { unitId: 'neutral_trinitywing', scale: 1.05 },
      shield_knight: { unitId: 'f5_megabrontodon', scale: 1.15 },
      frost_wyrm: { unitId: 'f6_greatwhitenorth', scale: 1.08 },
      skyfall_tyrant: { unitId: 'boss_skyfalltyrant', scale: 1.48 },
      boss_gawain: { unitId: 'f1_bromemk2', scale: 1.68 },
    };
    const entry = unitDeathMap[type];
    if (!entry) return false;
    return this.drawUnitFrame(ctx, entry.unitId, 'death', progress, entry.scale, true);
  }

  /**
   * Draws a centered pixel-art portrait of any skull onto a small UI canvas.
   */
  drawSkullPortrait(
    ctx: CanvasRenderingContext2D,
    skullId: SkullId,
    size: number,
    animTime = 0
  ): boolean {
    ctx.clearRect(0, 0, size, size);
    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    if (skullId === 'berserker') {
      const img = this.pixelHeroes.barbarian;
      if (!img) return false;
      const f = pickRangeFrame(0, 11, animTime, 8, true);
      const col = f % 5;
      const row = Math.floor(f / 5);
      ctx.drawImage(img, col * 100 + 26, row * 64 + 10, 48, 48, 2, 2, size - 4, size - 4);
    } else if (skullId === 'frost_warden') {
      const img = this.pixelHeroes.stormMage;
      if (!img) return false;
      const f = pickRangeFrame(0, 13, animTime, 8, true);
      const col = f % 8;
      const row = Math.floor(f / 8);
      ctx.drawImage(img, col * 64 + 10, row * 64 + 14, 44, 44, 2, 2, size - 4, size - 4);
    } else if (skullId === 'pyromancer') {
      const img = this.pixelHeroes.firemage;
      if (!img) return false;
      const f = pickRangeFrame(0, 9, animTime, 8, true);
      const col = f % 12;
      ctx.drawImage(img, col * 80 + 16, 4, 48, 48, 2, 2, size - 4, size - 4);
    } else if (skullId === 'void_reaver' || skullId === 'astral_lancer') {
      const unitId: UnitId =
        skullId === 'void_reaver' ? 'f4_maehvmk2' : 'f3_grandmasternoshrak';
      const cfg = UNIT_CONFIGS[unitId];
      const spec = cfg.anims.idle!;
      const img = this.unitStrips.get(`${unitId}:idle`);
      if (!img) return false;
      const f = pickRangeFrame(0, spec.frames - 1, animTime, spec.fps, true);
      const [bx, by, bw, bh] = cfg.portraitBox;
      ctx.drawImage(img, f * cfg.cellW + bx, by, bw, bh, 2, 2, size - 4, size - 4);
    } else {
      const sheet = this.getSheet(skullId, 'idle', false);
      if (!sheet) return false;
      const f = pickRangeFrame(0, 9, animTime, 8, true);
      ctx.drawImage(sheet, f * 128 + 44, 42, 40, 40, 2, 2, size - 4, size - 4);
    }

    ctx.imageSmoothingEnabled = prevSmooth;
    return true;
  }
}

export const heroSprites = new HeroSpriteAtlas();
