import { ARENA_HEIGHT, ARENA_WIDTH, GROUND_Y } from './data';
import { StageThemeId } from './types';

export interface StageThemeOption {
  id: StageThemeId;
  label: string;
  file?: string;
  platformColor: string;
  platformTrim: string;
  floorOverlayAlpha: number;
}

export const STAGE_THEME_OPTIONS: StageThemeOption[] = [
  {
    id: 'auto',
    label: 'Stage Progression',
    platformColor: '#222B3F',
    platformTrim: '#3B4968',
    floorOverlayAlpha: 0.28,
  },
  {
    id: 'dark_abandoned',
    label: 'Dark Abandoned',
    file: '/Asses/environments/floors/dark_abandoned.jpg',
    platformColor: '#27272A',
    platformTrim: '#71717A',
    floorOverlayAlpha: 0.24,
  },
  {
    id: 'icy_caves',
    label: 'Icy Caves',
    file: '/Asses/environments/floors/icy_caves.jpg',
    platformColor: '#16324A',
    platformTrim: '#38BDF8',
    floorOverlayAlpha: 0.25,
  },
  {
    id: 'crystal_valley',
    label: 'Crystal Valley',
    file: '/Asses/environments/floors/crystal_valley.jpg',
    platformColor: '#2E1F4D',
    platformTrim: '#A78BFA',
    floorOverlayAlpha: 0.24,
  },
  {
    id: 'loading_screen',
    label: 'Cosmic Eclipse',
    file: '/Asses/ui/screens/loading_screen.jpg',
    platformColor: '#241438',
    platformTrim: '#E879F9',
    floorOverlayAlpha: 0.22,
  },
  {
    id: 'eleven_cafe',
    label: 'Night Storefront',
    file: '/Asses/environments/floors/eleven_cafe.jpg',
    platformColor: '#1E293B',
    platformTrim: '#34D399',
    floorOverlayAlpha: 0.28,
  },
  {
    id: 'game_night',
    label: 'Pixel Arcade',
    file: '/Asses/environments/floors/game_night.jpg',
    platformColor: '#271E45',
    platformTrim: '#F472B6',
    floorOverlayAlpha: 0.34,
  },
];

type LoadedStageKey = Exclude<StageThemeId, 'auto'>;

const IMAGE_FILES: Record<LoadedStageKey, string> = {
  dark_abandoned: '/Asses/environments/floors/dark_abandoned.jpg',
  icy_caves: '/Asses/environments/floors/icy_caves.jpg',
  crystal_valley: '/Asses/environments/floors/crystal_valley.jpg',
  loading_screen: '/Asses/ui/screens/loading_screen.jpg',
  eleven_cafe: '/Asses/environments/floors/eleven_cafe.jpg',
  game_night: '/Asses/environments/floors/game_night.jpg',
};

class StageBackgroundManager {
  private images: Partial<Record<LoadedStageKey, HTMLImageElement>> = {};
  private started = false;

  preload() {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    (Object.keys(IMAGE_FILES) as LoadedStageKey[]).forEach((key) => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
      };
      img.src = IMAGE_FILES[key];
    });
  }

  resolveTheme(stageIndex: number, themeId: StageThemeId): LoadedStageKey {
    if (themeId !== 'auto') return themeId;
    const cycle: LoadedStageKey[] = [
      'dark_abandoned',
      'icy_caves',
      'crystal_valley',
      'icy_caves',
      'loading_screen',
    ];
    return cycle[stageIndex % cycle.length];
  }

  getPlatformStyle(stageIndex: number, themeId: StageThemeId) {
    const resolved = this.resolveTheme(stageIndex, themeId);
    return (
      STAGE_THEME_OPTIONS.find((opt) => opt.id === resolved) ||
      STAGE_THEME_OPTIONS[0]
    );
  }

  drawBackdrop(
    ctx: CanvasRenderingContext2D,
    stageIndex: number,
    themeId: StageThemeId,
    camBias: number
  ): boolean {
    const resolved = this.resolveTheme(stageIndex, themeId);
    const img = this.images[resolved];
    if (!img) return false;

    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return false;

    let sx = 0;
    let sy = 0;
    let sw = iw;
    let sh = ih;

    if (resolved === 'icy_caves') {
      // Icy Caves contains 5 stacked horizontal biome banners (736x1308).
      // Stage 2 uses Band 2 (Glacial Ice Cavern), Stage 4 uses Band 4 (Twilight Crystal)
      if (stageIndex === 3) {
        sy = 795;
        sh = 242;
      } else {
        sy = 272;
        sh = 242;
      }
    } else if (resolved === 'loading_screen') {
      // Portrait 482x680 -> center-crop cleanly to 16:9 focal eclipse
      sw = iw;
      sh = Math.round(iw * (9 / 16));
      sy = Math.max(0, Math.round((ih - sh) * 0.35));
    } else if (resolved === 'eleven_cafe') {
      // Crop slightly above bottom margin so corner text stays out of frame
      sh = Math.round(ih * 0.93);
    }

    ctx.save();
    const parallaxOffset = Math.max(-22, Math.min(22, -camBias * 0.65));
    const drawW = ARENA_WIDTH + 48;
    const drawH = ARENA_HEIGHT;

    ctx.drawImage(
      img,
      sx,
      sy,
      sw,
      sh,
      -24 + parallaxOffset,
      0,
      drawW,
      drawH
    );

    // Subtle dark scrim for crisp foreground combat readability
    const style = this.getPlatformStyle(stageIndex, themeId);
    ctx.fillStyle = `rgba(9, 12, 20, ${style.floorOverlayAlpha})`;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Ground plane contrast gradient below GROUND_Y so feet & enemies pop cleanly
    const floorGrad = ctx.createLinearGradient(0, GROUND_Y - 24, 0, ARENA_HEIGHT);
    floorGrad.addColorStop(0, 'rgba(11, 13, 19, 0)');
    floorGrad.addColorStop(0.28, 'rgba(11, 13, 19, 0.55)');
    floorGrad.addColorStop(1, 'rgba(11, 13, 19, 0.92)');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, GROUND_Y - 24, ARENA_WIDTH, ARENA_HEIGHT - (GROUND_Y - 24));

    ctx.restore();
    return true;
  }
}

export const stageBackgrounds = new StageBackgroundManager();
