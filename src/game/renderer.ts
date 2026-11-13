import { stageBackgrounds } from './backgrounds';
import { ARENA_HEIGHT, ARENA_PLATFORMS, ARENA_WIDTH, GROUND_Y, SKULL_DEFS } from './data';
import { HERO_ANIMS, HeroAnimName, heroSprites } from './sprites';
import { vfxAtlas } from './vfx';
import {
  CorpseEffect,
  EnemyState,
  FloatingText,
  HazardZone,
  Particle,
  PlayerState,
  Projectile,
  SkullId,
  SlashEffect,
  StageThemeId,
} from './types';

export interface RenderScene {
  time: number;
  stageIndex: number;
  shakeX: number;
  shakeY: number;
  player: PlayerState;
  player2?: PlayerState | null;
  enemies: EnemyState[];
  projectiles: Projectile[];
  slashes: SlashEffect[];
  corpses: CorpseEffect[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  hazards: HazardZone[];
}

const TORCH_POSITIONS = [190, 460, 820, 1090];

export function renderGameScene(
  ctx: CanvasRenderingContext2D,
  scene: RenderScene,
  stageTheme: StageThemeId = 'auto'
) {
  const { time, stageIndex, shakeX, shakeY, player } = scene;

  ctx.save();
  ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  // Subtle camera parallax based on player X
  const camBias = (player.x - ARENA_WIDTH / 2) * 0.03;

  // Attempt to draw uploaded floor/stage background design
  const drewBackdrop = stageBackgrounds.drawBackdrop(
    ctx,
    stageIndex,
    stageTheme,
    camBias
  );

  if (!drewBackdrop) {
    // Procedural fallback sky while images load
    const skyGrad = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
    if (stageIndex >= 4) {
      skyGrad.addColorStop(0, '#0E0B18');
      skyGrad.addColorStop(0.55, '#191428');
      skyGrad.addColorStop(1, '#120E18');
    } else {
      skyGrad.addColorStop(0, '#090C14');
      skyGrad.addColorStop(0.58, '#121826');
      skyGrad.addColorStop(1, '#0E111B');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Moon
    const moonX = 960 - camBias * 0.4;
    const moonY = 128;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 18, moonX, moonY, 130);
    moonGlow.addColorStop(0, 'rgba(226, 232, 240, 0.25)');
    moonGlow.addColorStop(1, 'rgba(226, 232, 240, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 130, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = stageIndex >= 4 ? '#FDE68A' : '#E2E8F0';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 42, 0, Math.PI * 2);
    ctx.fill();

    // Distant Citadel Silhouette
    ctx.fillStyle = '#0D121D';
    const spireX = -camBias * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(0, 420);
    ctx.lineTo(120 + spireX, 420);
    ctx.lineTo(145 + spireX, 320);
    ctx.lineTo(175 + spireX, 420);
    ctx.lineTo(310 + spireX, 420);
    ctx.lineTo(340 + spireX, 270);
    ctx.lineTo(370 + spireX, 220);
    ctx.lineTo(400 + spireX, 270);
    ctx.lineTo(420 + spireX, 420);
    ctx.lineTo(680 + spireX, 420);
    ctx.lineTo(720 + spireX, 240);
    ctx.lineTo(750 + spireX, 175);
    ctx.lineTo(780 + spireX, 240);
    ctx.lineTo(820 + spireX, 390);
    ctx.lineTo(1060 + spireX, 390);
    ctx.lineTo(1100 + spireX, 285);
    ctx.lineTo(1140 + spireX, 390);
    ctx.lineTo(ARENA_WIDTH, 390);
    ctx.lineTo(ARENA_WIDTH, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }

  // Apply screen shake for foreground arena
  ctx.translate(shakeX, shakeY);

  if (!drewBackdrop) {
    // Stone Pillars & Battlement Arches (fallback only)
    ctx.fillStyle = '#151B2B';
    for (let px = 80; px < ARENA_WIDTH; px += 280) {
      ctx.fillRect(px, 210, 46, GROUND_Y - 210);
      ctx.fillStyle = '#1C2438';
      ctx.fillRect(px - 6, 200, 58, 18);
      ctx.fillStyle = '#151B2B';
    }

    // Animated Wall Torches
    for (const tx of TORCH_POSITIONS) {
      const flicker = Math.sin(time * 14 + tx) * 3 + Math.cos(time * 23 + tx) * 2;
      const torchGlow = ctx.createRadialGradient(
        tx,
        480,
        4,
        tx,
        480,
        95 + flicker * 2
      );
      torchGlow.addColorStop(0, 'rgba(251, 146, 60, 0.28)');
      torchGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = torchGlow;
      ctx.beginPath();
      ctx.arc(tx, 480, 100, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.fillRect(tx - 4, 486, 8, 22);
      ctx.fillStyle = '#475569';
      ctx.fillRect(tx - 7, 482, 14, 5);

      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.ellipse(tx, 474 + flicker * 0.2, 7, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.ellipse(tx, 476 + flicker * 0.2, 3.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Platforms & Ground Line
  const platStyle = stageBackgrounds.getPlatformStyle(stageIndex, stageTheme);
  for (const plat of ARENA_PLATFORMS) {
    if (!plat.oneWay) {
      if (drewBackdrop) {
        // Crisp walkable ground rim that preserves the floor art below
        ctx.fillStyle = 'rgba(11, 13, 19, 0.55)';
        ctx.fillRect(plat.x, plat.y + 4, plat.w, ARENA_HEIGHT - plat.y - 4);
        ctx.fillStyle = platStyle.platformTrim;
        ctx.fillRect(plat.x, plat.y, plat.w, 3);
      } else {
        ctx.fillStyle = '#1B2233';
        ctx.fillRect(plat.x, plat.y, plat.w, ARENA_HEIGHT - plat.y);
        ctx.fillStyle = '#2B354C';
        ctx.fillRect(plat.x, plat.y, plat.w, 12);
        ctx.fillStyle = '#3B4866';
        ctx.fillRect(plat.x, plat.y, plat.w, 3);
        ctx.fillStyle = '#111622';
        for (let bx = 0; bx < ARENA_WIDTH; bx += 64) {
          ctx.fillRect(bx, plat.y + 12, 2, ARENA_HEIGHT - plat.y);
        }
      }
    } else {
      // Elevated Castle Stone Ledges
      ctx.fillStyle = platStyle.platformColor;
      ctx.fillRect(plat.x, plat.y, plat.w, 13);
      ctx.fillStyle = platStyle.platformTrim;
      ctx.fillRect(plat.x, plat.y, plat.w, 3.5);
      ctx.fillStyle = 'rgba(11, 13, 19, 0.75)';
      ctx.fillRect(plat.x + 12, plat.y + 13, 10, 10);
      ctx.fillRect(plat.x + plat.w - 22, plat.y + 13, 10, 10);
    }
  }

  // Hazard Zones (ground telegraphs, heal runes, frost rings)
  for (const hz of scene.hazards) {
    const progress = 1 - hz.timer / hz.maxTimer;
    if (hz.kind === 'light_pillar') {
      ctx.save();
      ctx.fillStyle = `rgba(250, 204, 21, ${0.14 + progress * 0.25})`;
      ctx.fillRect(hz.x, hz.y - hz.h, hz.w, hz.h);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(hz.x, hz.y - 5, hz.w, 5);
      // Inner rising warning line
      ctx.fillStyle = 'rgba(254, 240, 138, 0.8)';
      ctx.fillRect(hz.x + hz.w * 0.5 - 2, hz.y - hz.h * progress, 4, hz.h * progress);
      ctx.restore();
      vfxAtlas.drawAuraRing(
        ctx,
        hz.x + hz.w * 0.5,
        hz.y - 8,
        24 + progress * 22,
        time * 3,
        0.35 + progress * 0.4,
        'flare3'
      );
      vfxAtlas.drawAuraRing(
        ctx,
        hz.x + hz.w * 0.5,
        hz.y - hz.h * 0.35,
        46,
        -time * 1.5,
        0.22 + progress * 0.25,
        'glow1'
      );
      if (progress > 0.68) {
        vfxAtlas.drawLightningCell(
          ctx,
          hz.x + hz.w * 0.5,
          hz.y - hz.h * 0.45,
          120,
          Math.floor(time * 18),
          0,
          0.75
        );
      }
    } else if (hz.kind === 'heal_rune') {
      vfxAtlas.drawAuraRing(ctx, hz.x, hz.y - 6, hz.w * 0.42, time * 1.4, 0.3, 'circle96');
      ctx.save();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(hz.x, hz.y - 4, hz.w * 0.5, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
      ctx.fill();
      ctx.restore();
      const plusImg = vfxAtlas.get('plus1');
      if (plusImg) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.55 + Math.sin(time * 6) * 0.2;
        const floatY = hz.y - 26 - ((time * 24) % 18);
        ctx.drawImage(plusImg, hz.x - 16, floatY - 16, 32, 32);
        ctx.restore();
      }
    } else if (hz.kind === 'frost_zone') {
      ctx.save();
      ctx.fillStyle = 'rgba(125, 211, 252, 0.16)';
      ctx.beginPath();
      ctx.ellipse(hz.x, hz.y - 4, hz.w * 0.5, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    } else if (hz.kind === 'acid_pool') {
      const fade = Math.min(1, hz.timer / 0.5);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
      ctx.beginPath();
      ctx.ellipse(hz.x, hz.y - 3, hz.w * 0.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.72)';
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let b = 0; b < 3; b++) {
        const phase = (time * 2.4 + b * 0.37) % 1;
        const bx = hz.x + Math.sin(hz.id + b * 2.1) * hz.w * 0.32;
        const by = hz.y - 4 - phase * 14;
        ctx.fillStyle = 'rgba(103, 232, 249, 0.75)';
        ctx.beginPath();
        ctx.arc(bx, by, 2.5 * (1 - phase * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Dash Afterimages
  for (const img of player.afterimages) {
    ctx.save();
    ctx.globalAlpha = img.alpha * 0.45;
    if (!drawHeroSpriteFrame(ctx, img.x, img.y, img.facing, img.skullId, 'run', player.animTime, false)) {
      drawSkulBody(ctx, img.x, img.y, img.facing, img.skullId, 0, 0, 0, false, false);
    }
    ctx.restore();
  }

  // Enemy Death Corpses
  for (const corpse of scene.corpses) {
    ctx.save();
    ctx.translate(corpse.x, corpse.y);
    ctx.scale(corpse.facing, 1);
    const progress = 1 - corpse.life / corpse.maxLife;
    ctx.globalAlpha = Math.min(1, (corpse.life / corpse.maxLife) * 1.6);
    heroSprites.drawEnemyCorpseFrame(ctx, corpse.type, progress);
    ctx.restore();
  }

  // Enemies
  for (const enemy of scene.enemies) {
    drawEnemy(ctx, enemy, time);
  }

  // Thrown Head (Little Bone Skill 1)
  if (player.thrownHead) {
    const th = player.thrownHead;
    ctx.save();
    ctx.translate(th.x, th.y);
    ctx.rotate(time * 18);
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-5, -3, 3, 4);
    ctx.fillRect(2, -3, 3, 4);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-4, -2, 2, 2);
    ctx.fillRect(3, -2, 2, 2);
    ctx.restore();
  }

  // Players (P1 and P2)
  drawPlayer(ctx, player, time, 'P1');
  if (scene.player2) {
    drawPlayer(ctx, scene.player2, time, 'P2');
  }

  // Slash Effects
  for (const slash of scene.slashes) {
    drawSlashEffect(ctx, slash);
  }

  // Projectiles
  for (const proj of scene.projectiles) {
    drawProjectile(ctx, proj);
  }

  // Particles
  for (const pt of scene.particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (pt.shape === 'ring') {
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 2.5;
      const r = pt.size * (1.8 - alpha * 0.8);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (pt.shape === 'spark') {
      ctx.fillStyle = pt.color;
      ctx.translate(pt.x, pt.y);
      ctx.rotate(Math.atan2(pt.vy, pt.vx));
      ctx.fillRect(-pt.size * 1.4, -pt.size * 0.4, pt.size * 2.8, pt.size * 0.8);
    } else {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.restore();
  }

  // Floating Damage & Status Numbers
  for (const ft of scene.floatingTexts) {
    const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${ft.size}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#090D14';
    ctx.fillText(ft.text, ft.x + 1.5, ft.y + 1.5);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  ctx.restore();
}

function drawSkulBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: 1 | -1,
  skullId: SkullId,
  animTime: number,
  vx: number,
  attackProgress: number,
  altSwing: boolean,
  headless: boolean
) {
  const def = SKULL_DEFS[skullId];
  const isMoving = Math.abs(vx) > 25;
  const runBob = isMoving ? Math.sin(animTime * 16) * 3 : Math.sin(animTime * 3.5) * 1.2;
  const stride = isMoving ? Math.sin(animTime * 16) * 7 : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * 1.7, 1.7);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flowing Tattered Cloak
  const cloakLift = Math.min(14, Math.abs(vx) * 0.03) + Math.sin(animTime * 10) * 2;
  ctx.fillStyle = def.cloakColor;
  ctx.beginPath();
  ctx.moveTo(-4, -34 + runBob);
  ctx.lineTo(-20 - cloakLift, -12 + runBob * 0.5);
  ctx.lineTo(-14 - cloakLift * 0.7, -4);
  ctx.lineTo(-4, -10);
  ctx.closePath();
  ctx.fill();

  // Legs
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(-6 + stride * 0.5, -14, 5, 14);
  ctx.fillRect(2 - stride * 0.5, -14, 5, 14);

  // Torso / Ribcage
  ctx.fillStyle = skullId === 'berserker' ? '#991B1B' : '#334155';
  ctx.fillRect(-10, -34 + runBob, 20, 21);
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(-6, -30 + runBob, 12, 3);
  ctx.fillRect(-5, -24 + runBob, 10, 3);

  // Shoulder Pauldrons
  ctx.fillStyle = def.primaryColor;
  ctx.fillRect(-12, -36 + runBob, 8, 7);
  ctx.fillRect(4, -36 + runBob, 8, 7);

  // Head (unless thrown!)
  if (!headless) {
    ctx.save();
    ctx.translate(0, -45 + runBob);

    if (skullId === 'little_bone') {
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      // Jaw
      ctx.fillRect(-6, 6, 12, 5);
      // Eye sockets
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(1, -3, 4, 5);
      ctx.fillRect(-6, -3, 4, 5);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(2, -2, 2.5, 2.5);
      ctx.fillRect(-5, -2, 2.5, 2.5);
    } else if (skullId === 'berserker') {
      // Horned skull helm
      ctx.fillStyle = '#FCA5A5';
      ctx.beginPath();
      ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
      ctx.fill();
      // Horns
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(-16, -20);
      ctx.lineTo(-3, -11);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, -8);
      ctx.lineTo(15, -20);
      ctx.lineTo(2, -11);
      ctx.fill();
      // Glowing red eyes
      ctx.fillStyle = '#111827';
      ctx.fillRect(-1, -3, 10, 4);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(3, -2, 4, 2.5);
    } else if (skullId === 'ninja') {
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      // Ninja headband + glowing visor
      ctx.fillStyle = '#0EA5E9';
      ctx.fillRect(-11, -5, 22, 4);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(2, -2, 6, 3);
      // Trailing scarf tail
      ctx.fillStyle = '#22D3EE';
      ctx.beginPath();
      ctx.moveTo(-9, -3);
      ctx.lineTo(-24 - cloakLift * 0.6, -7);
      ctx.lineTo(-20 - cloakLift * 0.6, -1);
      ctx.closePath();
      ctx.fill();
    } else if (skullId === 'lich') {
      // Crowned dark skull
      ctx.fillStyle = '#DDD6FE';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      // Crown
      ctx.fillStyle = '#A855F7';
      ctx.beginPath();
      ctx.moveTo(-9, -8);
      ctx.lineTo(-7, -18);
      ctx.lineTo(-2, -11);
      ctx.lineTo(2, -19);
      ctx.lineTo(7, -11);
      ctx.lineTo(9, -8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#C084FC';
      ctx.fillRect(2, -3, 4, 3);
      ctx.fillRect(-5, -3, 4, 3);
    } else if (skullId === 'frost_warden') {
      // Glacial knight skull
      ctx.fillStyle = '#BAE6FD';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(-10, -10, 20, 6);
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(1, -3, 7, 3.5);
    } else if (skullId === 'pyromancer') {
      // Solar Pyromancer hooded skull
      ctx.fillStyle = '#FED7AA';
      ctx.beginPath();
      ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-11, -11, 22, 7);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(2, -3, 6, 3);
    } else if (skullId === 'void_reaver') {
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4C0519';
      ctx.fillRect(-10, -10, 20, 6);
    } else if (skullId === 'astral_lancer') {
      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-10, -8, 20, 4);
    }

    ctx.restore();
  }

  // Weapon Arm + Swing Angle
  ctx.save();
  ctx.translate(4, -26 + runBob);
  let swingAngle = -0.35;
  if (attackProgress > 0) {
    const ease = Math.sin(attackProgress * Math.PI);
    swingAngle = altSwing ? 1.15 - ease * 2.2 : -1.25 + ease * 2.35;
  }
  ctx.rotate(swingAngle);

  if (skullId === 'little_bone') {
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, -3, 28, 5);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, -6, 4, 11);
  } else if (skullId === 'berserker') {
    // Heavy Greataxe
    ctx.fillStyle = '#78350F';
    ctx.fillRect(0, -2, 34, 4);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(22, -2);
    ctx.lineTo(38, -16);
    ctx.lineTo(42, 0);
    ctx.lineTo(36, 14);
    ctx.lineTo(22, 2);
    ctx.closePath();
    ctx.fill();
  } else if (skullId === 'ninja') {
    // Sleek Katana
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(0, -2, 32, 3);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-4, -4, 6, 7);
  } else if (skullId === 'lich') {
    // Arcane Staff
    ctx.fillStyle = '#4C1D95';
    ctx.fillRect(0, -2, 30, 4);
    ctx.fillStyle = '#C084FC';
    ctx.beginPath();
    ctx.arc(32, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (skullId === 'frost_warden') {
    // Frost Halberd
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, -2, 36, 4);
    ctx.fillStyle = '#7DD3FC';
    ctx.beginPath();
    ctx.moveTo(24, -12);
    ctx.lineTo(42, 0);
    ctx.lineTo(24, 10);
    ctx.closePath();
    ctx.fill();
  } else if (skullId === 'pyromancer') {
    // Solar Torch Staff
    ctx.fillStyle = '#7C2D12';
    ctx.fillRect(0, -2, 30, 4);
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.arc(32, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(32, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (skullId === 'void_reaver') {
    ctx.fillStyle = '#F43F5E';
    ctx.fillRect(0, -2, 36, 4);
  } else if (skullId === 'astral_lancer') {
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(0, -2, 38, 3.5);
  }
  ctx.restore();

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyState, time: number) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  // Crossbow Laser Telegraph during windup
  if (enemy.type === 'crossbow' && enemy.state === 'windup') {
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.72)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(enemy.facing * 12, -32);
    ctx.lineTo(enemy.telegraphX - enemy.x, enemy.telegraphY - enemy.y);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.scale(enemy.facing, 1);

  if (enemy.hitFlash > 0) {
    ctx.filter = 'brightness(2.3)';
  } else if (enemy.chillTimer > 0) {
    ctx.filter = 'hue-rotate(175deg) brightness(1.15)';
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(0, 0, enemy.w * 0.46, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const bob =
    Math.abs(enemy.vx) > 15 ? Math.sin(enemy.animTime * 12) * 2.5 : Math.sin(time * 3 + enemy.id) * 1;

  if (enemy.type === 'cleric') {
    if (!heroSprites.drawClericEnemyFrame(ctx, enemy.state, enemy.animTime)) {
      ctx.fillStyle = '#312E81';
      ctx.fillRect(-11, -40 + bob, 22, 36);
    }
  } else if (enemy.type === 'alchemist') {
    if (!heroSprites.drawAlchemistEnemyFrame(ctx, enemy.state, enemy.animTime)) {
      ctx.fillStyle = '#115E59';
      ctx.fillRect(-11, -38 + bob, 22, 34);
    }
  } else {
    if (enemy.type === 'boss_gawain') {
      if (enemy.state === 'attack') {
        vfxAtlas.drawBeamTrail(ctx, -46, -44, 1, 150, 56, 0.72);
      }
      if (enemy.bossPhase === 2) {
        vfxAtlas.drawAuraRing(ctx, 0, -48, 86, time * 2.2, 0.55, 'flare21');
        vfxAtlas.drawLightningCell(ctx, 0, -48, 118, Math.floor(time * 16), time * 1.3, 0.55);
      }
    } else if (enemy.type === 'skyfall_tyrant') {
      vfxAtlas.drawAuraRing(ctx, 0, -42, 68, time * 1.8, 0.4, 'circle96');
    }

    const drewUnit = heroSprites.drawUnitEnemyFrame(
      ctx,
      enemy.type,
      enemy.state,
      enemy.animTime,
      enemy.hitFlash > 0,
      enemy.vx,
      enemy.attackVariant
    );
    if (!drewUnit) {
      ctx.fillStyle = enemy.type === 'boss_gawain' ? '#F59E0B' : '#475569';
      ctx.fillRect(-enemy.w * 0.45, -enemy.h + bob, enemy.w * 0.9, enemy.h);
    }
  }

  ctx.restore();

  // Stagger indicator
  if (enemy.state === 'stagger') {
    ctx.fillStyle = '#FACC15';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GUARD BROKEN', 0, -enemy.h - 22);
  } else if (enemy.state === 'windup') {
    // Clear Attack Telegraph Spark above enemy
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(0, -enemy.h - 18, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Non-boss HP bar & Guard bar
  if (enemy.type !== 'boss_gawain') {
    const barW = Math.max(34, enemy.w);
    const barY = -enemy.h - 12;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(-barW / 2, barY, barW, 5);
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(-barW / 2, barY, barW * Math.max(0, enemy.hp / enemy.maxHp), 5);

    if (enemy.maxGuardHp > 0 && enemy.guardHp > 0) {
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(
        -barW / 2,
        barY - 4,
        barW * Math.max(0, enemy.guardHp / enemy.maxGuardHp),
        3
      );
    }
  }

  ctx.restore();
}

function drawSlashEffect(ctx: CanvasRenderingContext2D, slash: SlashEffect) {
  const t = slash.life / slash.maxLife;
  ctx.save();
  ctx.globalAlpha = Math.min(1, t * 1.4);

  if (slash.style === 'lightning') {
    const cell = Math.floor((1 - t) * 8);
    vfxAtlas.drawLightningCell(
      ctx,
      slash.x,
      slash.y,
      slash.radius * 1.65,
      cell,
      slash.facing === -1 ? Math.PI * 0.25 : -Math.PI * 0.15,
      Math.min(1, t * 1.3)
    );
    vfxAtlas.drawPixelLightning(
      ctx,
      slash.x,
      slash.y,
      slash.facing,
      slash.radius * 1.4,
      1 - t,
      Math.min(1, t * 1.4)
    );
  } else if (slash.style === 'flare') {
    vfxAtlas.drawAuraRing(
      ctx,
      slash.x,
      slash.y,
      slash.radius * (0.65 + (1 - t) * 0.55),
      (1 - t) * 1.6,
      Math.min(1, t * 1.2),
      'flare20'
    );
  } else if (slash.style === 'blood') {
    vfxAtlas.drawBloodFrame(
      ctx,
      slash.x,
      slash.y,
      slash.facing,
      slash.radius * 1.35,
      1 - t,
      Math.min(1, t * 1.5)
    );
    vfxAtlas.drawPixelBlood(
      ctx,
      slash.x,
      slash.y,
      slash.facing,
      slash.radius * 1.15,
      1 - t,
      Math.min(1, t * 1.5)
    );
  } else if (slash.style === 'nova') {
    const r = slash.radius * (1.25 - t * 0.45);
    ctx.strokeStyle = slash.color;
    ctx.lineWidth = 6 * t;
    ctx.beginPath();
    ctx.arc(slash.x, slash.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = slash.accentColor;
    ctx.globalAlpha = t * 0.22;
    ctx.beginPath();
    ctx.arc(slash.x, slash.y, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (slash.style === 'snow') {
    vfxAtlas.drawSnowBurst(
      ctx,
      slash.x,
      slash.y,
      slash.radius,
      1 - t,
      Math.min(1, t * 1.4)
    );
  } else if (slash.style === 'debris') {
    vfxAtlas.drawDebrisBurst(
      ctx,
      slash.x,
      slash.y,
      slash.facing,
      slash.radius,
      1 - t,
      Math.min(1, t * 1.4)
    );
  } else if (slash.style === 'smoke') {
    vfxAtlas.drawSmokeBurst(
      ctx,
      slash.x,
      slash.y,
      slash.radius,
      1 - t,
      Math.min(1, t * 1.35)
    );
  } else if (slash.style === 'fire') {
    vfxAtlas.drawFireBurst(
      ctx,
      slash.x,
      slash.y,
      slash.radius,
      1 - t,
      Math.min(1, t * 1.4)
    );
  } else if (slash.style === 'point') {
    const pointKey = slash.color === '#38BDF8' ? 'point12' : 'point19';
    vfxAtlas.drawImpactPoint(
      ctx,
      slash.x,
      slash.y,
      slash.radius,
      1 - t,
      pointKey,
      Math.min(1, t * 1.45)
    );
  } else if (slash.style === 'cross') {
    ctx.translate(slash.x, slash.y);
    ctx.strokeStyle = slash.color;
    ctx.lineWidth = 5 * t;
    for (const ang of [Math.PI * 0.25, -Math.PI * 0.25]) {
      ctx.save();
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(-slash.radius, 0);
      ctx.lineTo(slash.radius, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.rotate(Math.atan2(proj.vy, proj.vx));

  if (
    proj.kind === 'light_spear' ||
    proj.kind === 'lightning_spear' ||
    proj.kind === 'fireball' ||
    proj.kind === 'frost_shard'
  ) {
    vfxAtlas.drawBeamTrail(ctx, -20, 0, 1, 56, 20, 0.6);
  }

  if (proj.kind === 'kunai') {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -4);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();
  } else if (proj.kind === 'lightning_spear') {
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-14, -5);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(-8, -1.5, 22, 3);
  } else if (proj.kind === 'cyan_flame') {
    ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22D3EE';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ECFEFF';
    ctx.beginPath();
    ctx.arc(2, 0, proj.radius * 0.48, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'arrow') {
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(-10, -1.5, 18, 3);
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(5, -4);
    ctx.lineTo(5, 4);
    ctx.closePath();
    ctx.fill();
  } else if (proj.kind === 'frost_shard') {
    ctx.fillStyle = '#BAE6FD';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fill();
  } else if (proj.kind === 'fireball') {
    ctx.fillStyle = 'rgba(251, 146, 60, 0.38)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(2, 0, proj.radius * 0.52, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'flask') {
    ctx.rotate(proj.life * 10);
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.arc(0, 2, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22D3EE';
    ctx.beginPath();
    ctx.arc(0, 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(-2.5, -8, 5, 5);
  } else {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function selectPlayerAnimation(player: PlayerState): {
  anim: HeroAnimName;
  animElapsed: number;
} {
  if (player.attackTimer > 0) {
    const dur = Math.max(0.1, player.attackDuration || 0.24);
    const progress = 1 - player.attackTimer / dur;
    if (progress < 0.52) {
      const localProgress = progress / 0.52;
      return {
        anim: 'combo_1',
        animElapsed: localProgress * (HERO_ANIMS.combo_1.frames / HERO_ANIMS.combo_1.fps),
      };
    }
    const localProgress = (progress - 0.52) / 0.48;
    return {
      anim: 'combo_1_end',
      animElapsed: localProgress * (HERO_ANIMS.combo_1_end.frames / HERO_ANIMS.combo_1_end.fps),
    };
  }

  if (!player.grounded) {
    if (player.vy < -60) {
      return { anim: 'jump', animElapsed: player.airTime };
    }
    if (player.fallTime < 0.28) {
      return { anim: 'fall', animElapsed: player.fallTime };
    }
    return { anim: 'fall_loop', animElapsed: player.fallTime - 0.28 };
  }

  const speed = Math.abs(player.vx);
  if (speed > 210) {
    return { anim: 'run', animElapsed: player.animTime };
  }
  if (speed > 20) {
    return { anim: 'walk', animElapsed: player.animTime };
  }
  return { anim: 'idle', animElapsed: player.animTime };
}

function drawHeroSpriteFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: 1 | -1,
  skullId: SkullId,
  anim: HeroAnimName,
  elapsed: number,
  headless: boolean,
  attackProgress = 0,
  hitFlash = false
): boolean {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * 1.7, 1.7);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (heroSprites.drawCustomSkullFrame(ctx, skullId, anim, elapsed, attackProgress, hitFlash)) {
    ctx.restore();
    return true;
  }

  const sheet = heroSprites.getSheet(skullId, anim, headless);
  if (!sheet) {
    ctx.restore();
    return false;
  }

  const meta = HERO_ANIMS[anim];
  const rawIndex = Math.floor(elapsed * meta.fps);
  const frameIndex = meta.loop
    ? ((rawIndex % meta.frames) + meta.frames) % meta.frames
    : Math.min(meta.frames - 1, Math.max(0, rawIndex));

  const tile = 128;
  const scale = 2.45;
  const def = SKULL_DEFS[skullId];

  // Flowing cloak accent behind sprite
  const cloakWave = Math.sin(elapsed * 12) * 2.5;
  ctx.fillStyle = def.cloakColor;
  ctx.beginPath();
  ctx.moveTo(-4, -40);
  ctx.lineTo(-22 - Math.abs(cloakWave), -12);
  ctx.lineTo(-14, -6);
  ctx.lineTo(-2, -14);
  ctx.closePath();
  ctx.fill();

  // Crisp nearest-neighbor sprite sheet frame aligned at feet (y=80 in 128 tile)
  const prevSmooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sheet,
    frameIndex * tile,
    0,
    tile,
    tile,
    -63 * scale,
    -80 * scale,
    tile * scale,
    tile * scale
  );
  ctx.imageSmoothingEnabled = prevSmooth;

  // Signature skull accessories
  if (!headless) {
    if (skullId === 'berserker') {
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.moveTo(-6, -58);
      ctx.lineTo(-14, -71);
      ctx.lineTo(-1, -61);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, -58);
      ctx.lineTo(14, -71);
      ctx.lineTo(2, -61);
      ctx.fill();
    } else if (skullId === 'lich') {
      ctx.fillStyle = '#A855F7';
      ctx.beginPath();
      ctx.moveTo(-7, -58);
      ctx.lineTo(-6, -68);
      ctx.lineTo(-1, -61);
      ctx.lineTo(2, -69);
      ctx.lineTo(6, -61);
      ctx.lineTo(8, -58);
      ctx.closePath();
      ctx.fill();
    } else if (skullId === 'ninja') {
      ctx.fillStyle = '#22D3EE';
      ctx.beginPath();
      ctx.moveTo(-6, -54);
      ctx.lineTo(-24, -58 + cloakWave * 0.6);
      ctx.lineTo(-20, -51 + cloakWave * 0.6);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
  return true;
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, time: number, label: string) {
  // Dash Afterimages
  for (const img of player.afterimages) {
    ctx.save();
    ctx.globalAlpha = img.alpha * 0.45;
    if (!drawHeroSpriteFrame(ctx, img.x, img.y, img.facing, img.skullId, 'run', player.animTime, false)) {
      drawSkulBody(ctx, img.x, img.y, img.facing, img.skullId, 0, 0, 0, false, false);
    }
    ctx.restore();
  }

  const activeSkull = player.skulls[player.activeSlot];
  const hasAwakenedAura = activeSkull.tier >= 2;
  const hasComboAura = player.comboCount >= 5;
  const justSwapped = player.swapCd > player.swapMaxCd - 1.25;

  if (hasAwakenedAura || hasComboAura || justSwapped || player.dashTimer > 0) {
    const auraKey =
      activeSkull.id === 'berserker' || activeSkull.id === 'pyromancer'
        ? activeSkull.tier === 3
          ? 'flare21'
          : 'fire13'
        : activeSkull.tier === 3
        ? 'circle96'
        : 'circle131';
    vfxAtlas.drawAuraRing(
      ctx,
      player.x,
      player.y - 38,
      activeSkull.tier === 3 ? 82 : 66,
      time * 2.4,
      hasAwakenedAura ? 0.52 : 0.36,
      auraKey
    );
    if (activeSkull.tier === 3) {
      vfxAtlas.drawAuraRing(ctx, player.x, player.y - 38, 68, -time * 1.2, 0.25, 'glow1');
    }
    if (player.dashTimer > 0) {
      vfxAtlas.drawElectricTrail(
        ctx,
        player.x - player.dashDir * 36,
        player.y - 38,
        player.dashDir,
        165,
        54,
        0.85
      );
    }
    if (hasComboAura || justSwapped || activeSkull.tier === 3) {
      vfxAtlas.drawLightningCell(
        ctx,
        player.x,
        player.y - 38,
        116,
        Math.floor(time * 14),
        time * 1.5,
        justSwapped ? 0.85 : 0.45
      );
    }
  }

  const blinkSkip =
    player.invulnTimer > 0 && Math.floor(player.invulnTimer * 24) % 2 === 1 && player.dashTimer <= 0;
  if (!blinkSkip) {
    ctx.save();
    if (player.hitFlash > 0) {
      ctx.filter = 'brightness(2.2)';
    }
    const headless = Boolean(player.thrownHead && activeSkull.id === 'little_bone');
    const { anim, animElapsed } = selectPlayerAnimation(player);
    const attackProgress =
      player.attackTimer > 0
        ? Math.min(1, Math.max(0, 1 - player.attackTimer / Math.max(0.1, player.attackDuration || 0.24)))
        : 0;
    const drewSprite = drawHeroSpriteFrame(
      ctx,
      player.x,
      player.y,
      player.facing,
      activeSkull.id,
      anim,
      animElapsed,
      headless,
      attackProgress,
      player.hitFlash > 0
    );
    if (!drewSprite) {
      drawSkulBody(
        ctx,
        player.x,
        player.y,
        player.facing,
        activeSkull.id,
        player.animTime,
        player.vx,
        attackProgress,
        player.comboStep % 2 === 1,
        headless
      );
    }
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = label === 'P1' ? '#38BDF8' : '#F59E0B';
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, player.x, player.y - 82);
  ctx.restore();
}


