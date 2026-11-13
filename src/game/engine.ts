import { soundFX } from './audio';
import {
  ALL_RELIC_IDS,
  ALL_SKULL_IDS,
  ARENA_PLATFORMS,
  ARENA_WIDTH,
  GROUND_Y,
  RELIC_DEFS,
  SKULL_DEFS,
  STAGES,
} from './data';
import { RenderScene } from './renderer';
import {
  CorpseEffect,
  EnemyState,
  EnemyType,
  EquippedSkull,
  FloatingText,
  HazardZone,
  HudSnapshot,
  InputSnapshot,
  InscriptionId,
  Particle,
  PlayerState,
  Projectile,
  RelicId,
  RewardOption,
  SkullId,
  SkullTier,
  SlashEffect,
} from './types';

const GRAVITY = 1750;
const BASE_SWAP_CD = 4.2;

export class GameEngine {
  public player: PlayerState;
  public enemies: EnemyState[] = [];
  public projectiles: Projectile[] = [];
  public slashes: SlashEffect[] = [];
  public corpses: CorpseEffect[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public hazards: HazardZone[] = [];

  public stageIndex = 0;
  public waveIndex = 0;
  public time = 0;
  public hitstopTimer = 0;
  public shakeTimer = 0;
  public shakeIntensity = 0;
  public bannerText: string | null = null;
  public bannerTimer = 0;

  private nextId = 1;
  private vampKillCounter = 0;
  private stageClearPauseTimer = 0;
  private waveClearPending = false;
  private perfectDodgeCd = 0;

  public onStageCleared?: (options: RewardOption[]) => void;
  public onVictory?: () => void;
  public onGameOver?: () => void;

  public player2: PlayerState | null = null;

  constructor(
    starterSkull1: SkullId = 'little_bone',
    starterSkull2: SkullId = 'ninja',
    isCoop = false,
    p2Starter1: SkullId = 'berserker',
    p2Starter2: SkullId = 'lich'
  ) {
    this.player = this.createInitialPlayer(starterSkull1, starterSkull2, 240);
    if (isCoop) {
      this.player2 = this.createInitialPlayer(p2Starter1, p2Starter2, 360);
    }
    this.startStage(0);
  }

  private createInitialPlayer(s1: SkullId, s2: SkullId, startX = 240): PlayerState {
    const def = SKULL_DEFS[s1];
    return {
      x: startX,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      w: 44,
      h: 74,
      facing: 1,
      hp: 110,
      maxHp: 110,
      skulls: [
        { id: s1, tier: 1, skill1Cd: 0, skill2Cd: 0 },
        { id: s2, tier: 1, skill1Cd: 0, skill2Cd: 0 },
      ],
      activeSlot: 0,
      swapCd: 0,
      swapMaxCd: BASE_SWAP_CD,
      dashCharges: def.maxDashCharges,
      maxDashCharges: def.maxDashCharges,
      dashRechargeTimer: 0,
      dashTimer: 0,
      dashDir: 1,
      invulnTimer: 0,
      comboStep: 0,
      comboResetTimer: 0,
      attackTimer: 0,
      attackCooldown: 0,
      hitstunTimer: 0,
      grounded: true,
      coyoteTimer: 0,
      jumpsLeft: 2,
      dropThroughTimer: 0,
      thrownHead: null,
      relics: [],
      boneFragments: 15,
      score: 0,
      kills: 0,
      comboCount: 0,
      comboDecayTimer: 0,
      animTime: 0,
      airTime: 0,
      fallTime: 0,
      attackDuration: 0.24,
      hitFlash: 0,
      afterimages: [],
    };
  }

  public getInscriptionCounts(): Record<InscriptionId, number> {
    const counts: Record<InscriptionId, number> = {
      might: 0,
      velocity: 0,
      arcana: 0,
      fortitude: 0,
      vampirism: 0,
    };
    for (const rid of this.player.relics) {
      const def = RELIC_DEFS[rid];
      for (const ins of def.inscriptions) {
        if (ins) counts[ins]++;
      }
    }
    return counts;
  }

  private getComputedStats(targetPlayer: PlayerState = this.player) {
    const active = targetPlayer.skulls[targetPlayer.activeSlot];
    const skullDef = SKULL_DEFS[active.id];
    const ins = this.getInscriptionCounts();
    const tierMult = active.tier === 1 ? 1.0 : active.tier === 2 ? 1.25 : 1.55;

    let damageMult = tierMult;
    let skillMult = 1.0;
    let speedMult = 1.0;
    let atkSpeedMult = 1.0;
    let cdrMult = 1.0;
    let critChance = 0.08;
    let damageReduction = 0;

    if (ins.might >= 4) damageMult *= 1.55;
    else if (ins.might >= 2) damageMult *= 1.25;

    if (ins.velocity >= 4) {
      speedMult *= 1.35;
      atkSpeedMult *= 1.35;
    } else if (ins.velocity >= 2) {
      speedMult *= 1.15;
      atkSpeedMult *= 1.2;
    }

    if (ins.arcana >= 4) cdrMult *= 0.6;
    else if (ins.arcana >= 2) cdrMult *= 0.78;

    if (ins.fortitude >= 4) damageReduction += 0.28;
    else if (ins.fortitude >= 2) damageReduction += 0.15;

    for (const rid of targetPlayer.relics) {
      if (rid === 'iron_gauntlet') damageMult *= 1.12;
      if (rid === 'executioner_crest') critChance += 0.15;
      if (rid === 'wind_feather') {
        speedMult *= 1.12;
        atkSpeedMult *= 1.12;
      }
      if (rid === 'void_prism') skillMult *= 1.18;
      if (rid === 'soul_lantern') cdrMult *= 0.88;
      if (rid === 'warden_plate') damageReduction += 0.1;
      if (rid === 'blood_fang') {
        critChance += 0.1;
        speedMult *= 1.08;
      }
    }

    return {
      skullDef,
      ins,
      damageMult,
      skillMult,
      speedMult,
      atkSpeedMult,
      cdrMult,
      critChance: Math.min(0.75, critChance),
      damageReduction: Math.min(0.6, damageReduction),
    };
  }

  public recalculateMaxHp(healDelta = false) {
    const ins = this.getInscriptionCounts();
    let targetMax = 110;
    if (ins.fortitude >= 4) targetMax += 75;
    else if (ins.fortitude >= 2) targetMax += 35;

    for (const rid of this.player.relics) {
      if (rid === 'titans_rib') targetMax += 20;
    }

    const diff = targetMax - this.player.maxHp;
    this.player.maxHp = targetMax;
    if (healDelta && diff > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + diff);
    } else {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp);
    }
  }

  public startStage(index: number) {
    this.stageIndex = index;
    this.waveIndex = 0;
    this.projectiles = [];
    this.hazards = [];
    this.slashes = [];
    this.corpses = [];
    this.waveClearPending = false;
    this.stageClearPauseTimer = 0;

    const stage = STAGES[this.stageIndex];
    this.showBanner(`Stage ${this.stageIndex + 1} · ${stage.stageName}`, 2.3);
    this.spawnWave();
  }

  private spawnWave() {
    const stage = STAGES[this.stageIndex];
    const waveTypes = stage.waves[this.waveIndex];
    const spawnXs = [210, 1070, 380, 900, 640, 140, 1140];

    waveTypes.forEach((type, idx) => {
      const sx = type === 'boss_gawain' ? 980 : spawnXs[idx % spawnXs.length];
      const sy = type === 'crossbow' && idx % 2 === 1 ? 472 : GROUND_Y;
      this.enemies.push(this.createEnemy(type, sx, sy));
    });

    if (waveTypes.includes('boss_gawain')) {
      soundFX.bossSpawn();
      this.showBanner('Sir Gawain, Vanguard of Caerleon', 2.8);
    }
  }

  private createEnemy(type: EnemyType, x: number, y: number): EnemyState {
    const scale = 1 + this.stageIndex * 0.16;
    const id = this.nextId++;

    if (type === 'boss_gawain') {
      return {
        id,
        type,
        name: 'Sir Gawain, Hero of Caerleon',
        x,
        y,
        vx: 0,
        vy: 0,
        w: 72,
        h: 120,
        facing: -1,
        hp: 860,
        maxHp: 860,
        guardHp: 0,
        maxGuardHp: 0,
        state: 'chase',
        stateTimer: 0.9,
        attackCooldown: 1.0,
        hitFlash: 0,
        chillTimer: 0,
        grounded: true,
        bossPhase: 1,
        attackVariant: 0,
        telegraphX: x,
        telegraphY: y,
        hasHitThisSwing: false,
        animTime: 0,
      };
    }

    if (type === 'skyfall_tyrant') {
      const maxHp = Math.round(360 * scale);
      return {
        id,
        type,
        name: 'Skyfall Tyrant',
        x,
        y,
        vx: 0,
        vy: 0,
        w: 64,
        h: 108,
        facing: x > this.player.x ? -1 : 1,
        hp: maxHp,
        maxHp,
        guardHp: 0,
        maxGuardHp: 0,
        state: 'chase',
        stateTimer: 0.6,
        attackCooldown: 1.2,
        hitFlash: 0,
        chillTimer: 0,
        grounded: true,
        bossPhase: 1,
        attackVariant: 0,
        telegraphX: x,
        telegraphY: y,
        hasHitThisSwing: false,
        animTime: 0,
      };
    }

    if (type === 'frost_wyrm') {
      const maxHp = Math.round(78 * scale);
      return {
        id,
        type,
        name: 'Glacial Wyrm',
        x,
        y,
        vx: 0,
        vy: 0,
        w: 50,
        h: 84,
        facing: x > this.player.x ? -1 : 1,
        hp: maxHp,
        maxHp,
        guardHp: 0,
        maxGuardHp: 0,
        state: 'chase',
        stateTimer: 0,
        attackCooldown: 1.0,
        hitFlash: 0,
        chillTimer: 0,
        grounded: true,
        bossPhase: 1,
        attackVariant: 0,
        telegraphX: 0,
        telegraphY: 0,
        hasHitThisSwing: false,
        animTime: 0,
      };
    }

    if (type === 'shield_knight') {
      const maxHp = Math.round(96 * scale);
      const guardHp = Math.round(55 * scale);
      return {
        id,
        type,
        name: 'Siege Behemoth',
        x,
        y,
        vx: 0,
        vy: 0,
        w: 60,
        h: 92,
        facing: x > this.player.x ? -1 : 1,
        hp: maxHp,
        maxHp,
        guardHp,
        maxGuardHp: guardHp,
        state: 'chase',
        stateTimer: 0,
        attackCooldown: 1.1,
        hitFlash: 0,
        chillTimer: 0,
        grounded: true,
        bossPhase: 1,
        attackVariant: 0,
        telegraphX: 0,
        telegraphY: 0,
        hasHitThisSwing: false,
        animTime: 0,
      };
    }

    if (type === 'crossbow') {
      const maxHp = Math.round(48 * scale);
      return {
        id,
        type,
        name: 'Trinity Wyvern',
        x,
        y,
        vx: 0,
        vy: 0,
        w: 46,
        h: 76,
        facing: x > this.player.x ? -1 : 1,
        hp: maxHp,
        maxHp,
        guardHp: 0,
        maxGuardHp: 0,
        state: 'chase',
        stateTimer: 0,
        attackCooldown: 1.4,
        hitFlash: 0,
        chillTimer: 0,
        grounded: true,
        bossPhase: 1,
        attackVariant: 0,
        telegraphX: this.player.x,
        telegraphY: this.player.y - 26,
        hasHitThisSwing: false,
        animTime: 0,
      };
    }

    if (type === 'cleric') {
      const maxHp = Math.round(62 * scale);
      return {
        id,
        type,
        name: 'Battle Cleric',
        x,
        y,
        vx: 0,
        vy: 0,
        w: 44,
        h: 76,
        facing: x > this.player.x ? -1 : 1,
        hp: maxHp,
        maxHp,
        guardHp: 0,
        maxGuardHp: 0,
        state: 'chase',
        stateTimer: 0,
        attackCooldown: 2.2,
        hitFlash: 0,
        chillTimer: 0,
        grounded: true,
        bossPhase: 1,
        attackVariant: 0,
        telegraphX: 0,
        telegraphY: 0,
        hasHitThisSwing: false,
        animTime: 0,
      };
    }

    if (type === 'alchemist') {
      const maxHp = Math.round(58 * scale);
      return {
        id,
        type,
        name: 'Plague Alchemist',
        x,
        y,
        vx: 0,
        vy: 0,
        w: 44,
        h: 76,
        facing: x > this.player.x ? -1 : 1,
        hp: maxHp,
        maxHp,
        guardHp: 0,
        maxGuardHp: 0,
        state: 'chase',
        stateTimer: 0,
        attackCooldown: 1.7,
        hitFlash: 0,
        chillTimer: 0,
        grounded: true,
        bossPhase: 1,
        attackVariant: 0,
        telegraphX: 0,
        telegraphY: 0,
        hasHitThisSwing: false,
        animTime: 0,
      };
    }

    // Crimson Vanguard (swordsman)
    const maxHp = Math.round(64 * scale);
    return {
      id,
      type: 'swordsman',
      name: 'Crimson Vanguard',
      x,
      y,
      vx: 0,
      vy: 0,
      w: 32,
      h: 58,
      facing: x > this.player.x ? -1 : 1,
      hp: maxHp,
      maxHp,
      guardHp: 0,
      maxGuardHp: 0,
      state: 'chase',
      stateTimer: 0,
      attackCooldown: 0.8,
      hitFlash: 0,
      chillTimer: 0,
      grounded: true,
      bossPhase: 1,
      attackVariant: 0,
      telegraphX: 0,
      telegraphY: 0,
      hasHitThisSwing: false,
      animTime: 0,
    };
  }

  private showBanner(text: string, duration = 2.0) {
    this.bannerText = text;
    this.bannerTimer = duration;
  }

  public triggerShake(intensity: number, duration: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  public update(dtRaw: number, input1: InputSnapshot, input2?: InputSnapshot | null) {
    const dt = Math.min(0.033, dtRaw);
    this.time += dt;

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerText = null;
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateEffectsOnly(dt * 0.35);
      return;
    }

    this.updatePlayer(dt, input1, this.player);
    if (this.player2 && input2) {
      this.updatePlayer(dt, input2, this.player2);
    }
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateHazards(dt);
    this.updateEffectsOnly(dt);
    this.checkWaveProgress(dt);
  }

  private updateEffectsOnly(dt: number) {
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      this.slashes[i].life -= dt;
      if (this.slashes[i].life <= 0) this.slashes.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    if (this.perfectDodgeCd > 0) this.perfectDodgeCd -= dt;

    for (let i = this.corpses.length - 1; i >= 0; i--) {
      this.corpses[i].life -= dt;
      if (this.corpses[i].life <= 0) {
        this.corpses.splice(i, 1);
      }
    }

    for (let i = this.player.afterimages.length - 1; i >= 0; i--) {
      this.player.afterimages[i].alpha -= dt * 4.5;
      if (this.player.afterimages[i].alpha <= 0) {
        this.player.afterimages.splice(i, 1);
      }
    }
  }

  private updatePlayer(dt: number, input: InputSnapshot, targetPlayer = this.player) {
    const p = targetPlayer;
    const stats = this.getComputedStats(p);
    const def = stats.skullDef;

    p.animTime += dt;
    if (p.hitFlash > 0) p.hitFlash -= dt;
    if (p.invulnTimer > 0) p.invulnTimer -= dt;
    if (p.hitstunTimer > 0) p.hitstunTimer -= dt;
    if (p.attackTimer > 0) p.attackTimer -= dt;
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.dropThroughTimer > 0) p.dropThroughTimer -= dt;

    if (p.comboDecayTimer > 0) {
      p.comboDecayTimer -= dt;
      if (p.comboDecayTimer <= 0) p.comboCount = 0;
    }

    if (p.comboResetTimer > 0) {
      p.comboResetTimer -= dt;
      if (p.comboResetTimer <= 0) p.comboStep = 0;
    }

    // Cooldowns on both skulls tick down!
    for (const sk of p.skulls) {
      if (!sk) continue;
      if (sk.skill1Cd > 0) sk.skill1Cd = Math.max(0, sk.skill1Cd - dt);
      if (sk.skill2Cd > 0) sk.skill2Cd = Math.max(0, sk.skill2Cd - dt);
    }
    if (p.swapCd > 0) p.swapCd = Math.max(0, p.swapCd - dt);

    // Dash recharge
    p.maxDashCharges = def.maxDashCharges;
    if (p.dashCharges < p.maxDashCharges) {
      const rechargeSpeed = p.relics.includes('phantom_spur') ? 1.45 : 1.0;
      p.dashRechargeTimer += dt * rechargeSpeed;
      if (p.dashRechargeTimer >= 1.25) {
        p.dashCharges++;
        p.dashRechargeTimer = 0;
      }
    }

    // Thrown head update (Little Bone)
    if (p.thrownHead) {
      const th = p.thrownHead;
      th.timer -= dt;
      th.x += th.vx * dt;
      th.y += th.vy * dt;

      if (!th.returning && (th.timer <= 0.65 || th.x < 30 || th.x > ARENA_WIDTH - 30)) {
        th.returning = true;
      }

      if (th.returning) {
        const dx = p.x - th.x;
        const dy = p.y - 34 - th.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 28 || th.timer <= -1.2) {
          p.thrownHead = null;
        } else {
          th.vx = (dx / dist) * 760;
          th.vy = (dy / dist) * 760;
        }
      }

      // Head hits enemies in flight
      if (p.thrownHead) {
        for (const e of this.enemies) {
          if (
            Math.abs(th.x - e.x) < e.w * 0.65 + 14 &&
            Math.abs(th.y - (e.y - e.h * 0.5)) < e.h * 0.6
          ) {
            if (Math.random() < 0.18) {
              this.damageEnemy(
                e,
                Math.round(def.baseDamage * 0.75 * stats.damageMult * stats.skillMult),
                th.vx >= 0 ? 1 : -1,
                false,
                true
              );
            }
          }
        }
      }
    }

    // Skull Swap!
    if (input.swapPressed && p.skulls[1] && p.swapCd <= 0 && p.hitstunTimer <= 0) {
      this.performSkullSwap(stats);
    }

    // Dash input
    if (input.dashPressed && p.dashCharges > 0 && p.dashTimer <= 0 && p.hitstunTimer <= 0) {
      p.dashCharges--;
      p.dashTimer = 0.16;
      p.invulnTimer = Math.max(p.invulnTimer, 0.2);
      p.dashDir = input.left ? -1 : input.right ? 1 : p.facing;
      p.facing = p.dashDir;
      p.vy = 0;
      soundFX.dash();

      if (def.id === 'ninja') {
        this.slashes.push({
          x: p.x,
          y: p.y - 28,
          facing: p.facing,
          radius: 75,
          angleStart: 0,
          angleEnd: Math.PI * 2,
          color: '#38BDF8',
          accentColor: '#94A3B8',
          life: 0.24,
          maxLife: 0.24,
          style: 'smoke',
        });
      }

      // Velocity 4-piece bonus: Dashing fires a shock bolt!
      if (stats.ins.velocity >= 4) {
        this.slashes.push({
          x: p.x,
          y: p.y - 28,
          facing: p.facing,
          radius: 90,
          angleStart: 0,
          angleEnd: Math.PI * 2,
          color: '#38BDF8',
          accentColor: '#E0F2FE',
          life: 0.24,
          maxLife: 0.24,
          style: 'lightning',
        });
        this.spawnProjectile({
          owner: 'player',
          kind: 'soul_bolt',
          x: p.x + p.facing * 18,
          y: p.y - 30,
          vx: p.facing * 640,
          vy: 0,
          radius: 7,
          damage: Math.round(18 * stats.damageMult),
          color: '#38BDF8',
          life: 0.7,
          maxLife: 0.7,
          pierce: 2,
          hitIds: new Set(),
          gravity: 0,
          chill: 0,
          heavy: false,
        });
      }
    }

    // Movement & Gravity
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.vx = p.dashDir * 860;
      p.vy = 0;
      if (Math.random() < 0.7) {
        p.afterimages.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          skullId: p.skulls[p.activeSlot].id,
          alpha: 0.9,
        });
      }
    } else {
      const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (p.hitstunTimer <= 0) {
        const targetVx = moveDir * def.moveSpeed * stats.speedMult;
        const accel = p.grounded ? 2600 : 1850;
        if (p.vx < targetVx) p.vx = Math.min(targetVx, p.vx + accel * dt);
        else if (p.vx > targetVx) p.vx = Math.max(targetVx, p.vx - accel * dt);

        if (moveDir !== 0 && p.attackTimer <= 0.08) {
          p.facing = moveDir as 1 | -1;
        }
      }

      // Drop through one-way platforms or jump
      if (input.jumpPressed && p.hitstunTimer <= 0) {
        if (input.down && p.grounded && p.y < GROUND_Y - 8) {
          p.dropThroughTimer = 0.22;
          p.grounded = false;
          p.y += 4;
        } else if (p.grounded || p.coyoteTimer > 0) {
          p.vy = -def.jumpForce;
          p.grounded = false;
          p.coyoteTimer = 0;
          p.jumpsLeft = 1;
          p.airTime = 0;
          p.fallTime = 0;
          soundFX.jump();
          this.emitBurst(p.x, p.y, 6, '#94A3B8', 110);
        } else if (p.jumpsLeft > 0) {
          p.vy = -def.jumpForce * 0.92;
          p.jumpsLeft--;
          p.airTime = 0;
          p.fallTime = 0;
          soundFX.jump();
          this.emitBurst(p.x, p.y, 7, def.accentColor, 140);
        }
      }

      p.vy += GRAVITY * dt;
      p.vy = Math.min(p.vy, 1050);
    }

    const prevY = p.y;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Arena horizontal walls
    p.x = Math.max(24, Math.min(ARENA_WIDTH - 24, p.x));

    // Platform collisions
    p.grounded = false;
    if (p.vy >= 0) {
      for (const plat of ARENA_PLATFORMS) {
        if (plat.oneWay && p.dropThroughTimer > 0) continue;
        const withinX = p.x >= plat.x - 10 && p.x <= plat.x + plat.w + 10;
        if (withinX && prevY <= plat.y + 8 && p.y >= plat.y) {
          p.y = plat.y;
          p.vy = 0;
          p.grounded = true;
          p.coyoteTimer = 0.1;
          p.jumpsLeft = 2;
          break;
        }
      }
    }
    if (!p.grounded) {
      p.airTime += dt;
      if (p.vy >= -60) p.fallTime += dt;
      if (p.coyoteTimer > 0) p.coyoteTimer -= dt;
    } else {
      p.airTime = 0;
      p.fallTime = 0;
    }

    // Combat: Basic Combo Attack
    if ((input.attackPressed || input.attackHeld) && p.attackCooldown <= 0 && p.hitstunTimer <= 0) {
      this.performBasicAttack(stats);
    }

    // Combat: Skill 1 (Q / U)
    const activeEquipped = p.skulls[p.activeSlot];
    if (input.skill1Pressed && activeEquipped.skill1Cd <= 0 && p.hitstunTimer <= 0) {
      this.performSkill1(activeEquipped, stats);
    }

    // Combat: Skill 2 (E / I)
    if (input.skill2Pressed && activeEquipped.skill2Cd <= 0 && p.hitstunTimer <= 0) {
      this.performSkill2(activeEquipped, stats);
    }
  }

  private performBasicAttack(stats: ReturnType<typeof this.getComputedStats>) {
    const p = this.player;
    const def = stats.skullDef;
    const cd = (0.3 / def.attackSpeed) / stats.atkSpeedMult;

    p.attackCooldown = cd;
    p.attackDuration = Math.min(0.26, cd * 0.92);
    p.attackTimer = p.attackDuration;
    p.comboStep = (p.comboStep + 1) % 3;
    p.comboResetTimer = 0.75;

    // Slight forward lunge on ground combo
    if (p.grounded && p.dashTimer <= 0) {
      p.vx += p.facing * (def.archetype === 'Power' ? 140 : 190);
    }

    const isFinisher = p.comboStep === 2;
    const dmg = Math.round(
      def.baseDamage * (isFinisher ? 1.35 : 1.0) * stats.damageMult
    );

    soundFX.slash(def.heavyHits);

    // Arcane Lich & Solar Pyromancer launch projectiles on combo swings!
    if (def.id === 'lich') {
      this.spawnProjectile({
        owner: 'player',
        kind: 'soul_bolt',
        x: p.x + p.facing * 24,
        y: p.y - 32,
        vx: p.facing * 520,
        vy: isFinisher ? -35 : 0,
        radius: isFinisher ? 9 : 7,
        damage: Math.round(dmg * 0.78),
        color: '#C084FC',
        life: 0.9,
        maxLife: 0.9,
        pierce: isFinisher ? 2 : 1,
        hitIds: new Set(),
        gravity: 0,
        chill: 0,
        heavy: false,
      });
    } else if (def.id === 'pyromancer') {
      this.spawnProjectile({
        owner: 'player',
        kind: 'fireball',
        x: p.x + p.facing * 26,
        y: p.y - 34,
        vx: p.facing * 590,
        vy: 0,
        radius: isFinisher ? 11 : 8,
        damage: Math.round(dmg * 0.85),
        color: '#FB923C',
        life: 0.85,
        maxLife: 0.85,
        pierce: isFinisher ? 3 : 1,
        hitIds: new Set(),
        gravity: 0,
        chill: 0,
        heavy: isFinisher,
      });
    } else if (def.id === 'astral_lancer' && isFinisher) {
      this.spawnProjectile({
        owner: 'player',
        kind: 'lightning_spear',
        x: p.x + p.facing * 28,
        y: p.y - 34,
        vx: p.facing * 720,
        vy: 0,
        radius: 10,
        damage: Math.round(dmg * 0.9),
        color: '#38BDF8',
        life: 0.65,
        maxLife: 0.65,
        pierce: 3,
        hitIds: new Set(),
        gravity: 0,
        chill: 0,
        heavy: false,
      });
    }

    // Melee hit check
    const hitCenterX = p.x + p.facing * (def.attackRange * 0.55);
    const hitHalfW = def.attackRange * 0.68;
    const hitCenterY = p.y - 30;
    const hitHalfH = 52;

    for (const enemy of this.enemies) {
      const ex = enemy.x;
      const ey = enemy.y - enemy.h * 0.5;
      if (
        Math.abs(ex - hitCenterX) <= hitHalfW + enemy.w * 0.45 &&
        Math.abs(ey - hitCenterY) <= hitHalfH + enemy.h * 0.45
      ) {
        this.damageEnemy(
          enemy,
          dmg,
          p.facing,
          def.heavyHits || isFinisher,
          false,
          def.id === 'frost_warden' ? 2.2 : 0
        );
      }
    }
  }

  private performSkill1(
    equipped: EquippedSkull,
    stats: ReturnType<typeof this.getComputedStats>
  ) {
    const p = this.player;
    const def = stats.skullDef;
    equipped.skill1Cd = def.skill1.cooldown * stats.cdrMult;
    p.attackDuration = 0.28;
    p.attackTimer = p.attackDuration;
    soundFX.skill();

    const baseSkillDmg = def.baseDamage * 1.45 * stats.damageMult * stats.skillMult;

    if (def.id === 'little_bone') {
      p.thrownHead = {
        x: p.x + p.facing * 20,
        y: p.y - 36,
        vx: p.facing * 700,
        vy: 0,
        timer: 1.0,
        returning: false,
      };
      this.emitBurst(p.x + p.facing * 14, p.y - 36, 8, '#F59E0B', 160);
    } else if (def.id === 'berserker') {
      // Leaping Skull Breaker slam + stone debris burst
      p.vy = -420;
      p.vx = p.facing * 440;
      this.slashes.push({
        x: p.x + p.facing * 42,
        y: p.y - 18,
        facing: p.facing,
        radius: 115,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#EF4444',
        accentColor: '#94A3B8',
        life: 0.34,
        maxLife: 0.34,
        style: 'debris',
      });
      this.triggerShake(7, 0.18);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - (p.x + p.facing * 50), e.y - p.y) < 145) {
          this.damageEnemy(e, Math.round(baseSkillDmg * 1.35), p.facing, true, true);
        }
      }
    } else if (def.id === 'ninja') {
      for (const ang of [-0.14, 0, 0.14]) {
        this.spawnProjectile({
          owner: 'player',
          kind: 'kunai',
          x: p.x + p.facing * 18,
          y: p.y - 34,
          vx: Math.cos(ang) * p.facing * 820,
          vy: Math.sin(ang) * 820,
          radius: 7,
          damage: Math.round(baseSkillDmg * 0.68),
          color: '#38BDF8',
          life: 0.8,
          maxLife: 0.8,
          pierce: 2,
          hitIds: new Set(),
          gravity: 0,
          chill: 0,
          heavy: false,
        });
      }
    } else if (def.id === 'lich') {
      for (let i = 0; i < 4; i++) {
        const spread = (i - 1.5) * 0.22;
        this.spawnProjectile({
          owner: 'player',
          kind: 'soul_bolt',
          x: p.x + p.facing * 18,
          y: p.y - 34,
          vx: Math.cos(spread) * p.facing * 520,
          vy: Math.sin(spread) * 520,
          radius: 9,
          damage: Math.round(baseSkillDmg * 0.72),
          color: '#C084FC',
          life: 1.25,
          maxLife: 1.25,
          pierce: 1,
          hitIds: new Set(),
          gravity: 0,
          chill: 0,
          heavy: false,
        });
      }
    } else if (def.id === 'frost_warden') {
      this.spawnProjectile({
        owner: 'player',
        kind: 'frost_shard',
        x: p.x + p.facing * 24,
        y: p.y - 30,
        vx: p.facing * 680,
        vy: 0,
        radius: 14,
        damage: Math.round(baseSkillDmg * 1.15),
        color: '#7DD3FC',
        life: 0.9,
        maxLife: 0.9,
        pierce: 4,
        hitIds: new Set(),
        gravity: 0,
        chill: 3.5,
        heavy: true,
      });
    } else if (def.id === 'pyromancer') {
      this.slashes.push({
        x: p.x + p.facing * 28,
        y: p.y - 34,
        facing: p.facing,
        radius: 95,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#FB923C',
        accentColor: '#FDE047',
        life: 0.28,
        maxLife: 0.28,
        style: 'fire',
      });
      for (const ang of [-0.15, 0, 0.15]) {
        this.spawnProjectile({
          owner: 'player',
          kind: 'fireball',
          x: p.x + p.facing * 22,
          y: p.y - 36,
          vx: Math.cos(ang) * p.facing * 640,
          vy: Math.sin(ang) * 640,
          radius: 12,
          damage: Math.round(baseSkillDmg * 0.78),
          color: '#FB923C',
          life: 1.0,
          maxLife: 1.0,
          pierce: 3,
          hitIds: new Set(),
          gravity: 0,
          chill: 0,
          heavy: false,
        });
      }
    } else if (def.id === 'void_reaver') {
      this.slashes.push({
        x: p.x + p.facing * 90,
        y: p.y - 32,
        facing: p.facing,
        radius: 135,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#F43F5E',
        accentColor: '#FB7185',
        life: 0.3,
        maxLife: 0.3,
        style: 'fire',
      });
      this.triggerShake(6, 0.16);
      for (const e of this.enemies) {
        if (
          (p.facing === 1 ? e.x >= p.x - 20 : e.x <= p.x + 20) &&
          Math.abs(e.x - p.x) < 185 &&
          Math.abs(e.y - p.y) < 85
        ) {
          this.damageEnemy(e, Math.round(baseSkillDmg * 1.15), p.facing, true, true);
        }
      }
    } else if (def.id === 'astral_lancer') {
      this.slashes.push({
        x: p.x + p.facing * 36,
        y: p.y - 34,
        facing: p.facing,
        radius: 110,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#38BDF8',
        accentColor: '#FACC15',
        life: 0.26,
        maxLife: 0.26,
        style: 'lightning',
      });
      this.spawnProjectile({
        owner: 'player',
        kind: 'lightning_spear',
        x: p.x + p.facing * 26,
        y: p.y - 34,
        vx: p.facing * 820,
        vy: 0,
        radius: 13,
        damage: Math.round(baseSkillDmg * 1.12),
        color: '#38BDF8',
        life: 0.9,
        maxLife: 0.9,
        pierce: 5,
        hitIds: new Set(),
        gravity: 0,
        chill: 0,
        heavy: true,
      });
    }
  }

  private performSkill2(
    equipped: EquippedSkull,
    stats: ReturnType<typeof this.getComputedStats>
  ) {
    const p = this.player;
    const def = stats.skullDef;
    equipped.skill2Cd = def.skill2.cooldown * stats.cdrMult;
    p.attackDuration = 0.3;
    p.attackTimer = p.attackDuration;
    soundFX.skill();

    const baseSkillDmg = def.baseDamage * 1.7 * stats.damageMult * stats.skillMult;

    if (def.id === 'little_bone') {
      if (p.thrownHead) {
        p.x = Math.max(30, Math.min(ARENA_WIDTH - 30, p.thrownHead.x));
        p.y = Math.min(GROUND_Y, p.thrownHead.y + 34);
        p.thrownHead = null;
        p.invulnTimer = Math.max(p.invulnTimer, 0.25);
      }
      this.slashes.push({
        x: p.x,
        y: p.y - 26,
        facing: p.facing,
        radius: 120,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#F59E0B',
        accentColor: '#FDE68A',
        life: 0.28,
        maxLife: 0.28,
        style: 'nova',
      });
      this.triggerShake(5, 0.14);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) < 135) {
          this.damageEnemy(e, Math.round(baseSkillDmg), p.facing, true, true);
        }
      }
    } else if (def.id === 'berserker') {
      this.slashes.push({
        x: p.x,
        y: p.y - 28,
        facing: p.facing,
        radius: 165,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#DC2626',
        accentColor: '#FCA5A5',
        life: 0.34,
        maxLife: 0.34,
        style: 'nova',
      });
      this.triggerShake(9, 0.24);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) < 175) {
          this.damageEnemy(e, Math.round(baseSkillDmg * 1.25), p.facing, true, true);
        }
      }
    } else if (def.id === 'ninja') {
      const startX = p.x;
      p.x = Math.max(30, Math.min(ARENA_WIDTH - 30, p.x + p.facing * 230));
      p.invulnTimer = Math.max(p.invulnTimer, 0.28);
      const midX = (startX + p.x) * 0.5;
      this.slashes.push({
        x: midX,
        y: p.y - 30,
        facing: p.facing,
        radius: 95,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#22D3EE',
        accentColor: '#E0F2FE',
        life: 0.26,
        maxLife: 0.26,
        style: 'cross',
      });
      this.slashes.push({
        x: startX,
        y: p.y - 26,
        facing: p.facing,
        radius: 105,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#38BDF8',
        accentColor: '#94A3B8',
        life: 0.3,
        maxLife: 0.3,
        style: 'smoke',
      });
      for (const e of this.enemies) {
        const minX = Math.min(startX, p.x) - 45;
        const maxX = Math.max(startX, p.x) + 45;
        if (e.x >= minX && e.x <= maxX && Math.abs(e.y - p.y) < 95) {
          this.damageEnemy(e, Math.round(baseSkillDmg * 1.1), p.facing, false, true);
        }
      }
    } else if (def.id === 'lich') {
      this.slashes.push({
        x: p.x,
        y: p.y - 28,
        facing: p.facing,
        radius: 175,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#A855F7',
        accentColor: '#E9D5FF',
        life: 0.36,
        maxLife: 0.36,
        style: 'nova',
      });
      this.triggerShake(7, 0.2);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) < 185) {
          this.damageEnemy(e, Math.round(baseSkillDmg * 1.2), p.facing, true, true);
        }
      }
    } else if (def.id === 'frost_warden') {
      this.hazards.push({
        id: this.nextId++,
        x: p.x,
        y: p.y,
        w: 260,
        h: 40,
        timer: 3.5,
        maxTimer: 3.5,
        triggered: false,
        damage: Math.round(baseSkillDmg * 0.4),
        kind: 'frost_zone',
      });
      this.slashes.push({
        x: p.x,
        y: p.y - 20,
        facing: p.facing,
        radius: 150,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#7DD3FC',
        accentColor: '#E0F2FE',
        life: 0.32,
        maxLife: 0.32,
        style: 'nova',
      });
      this.slashes.push({
        x: p.x,
        y: p.y - 32,
        facing: p.facing,
        radius: 175,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#BAE6FD',
        accentColor: '#FFFFFF',
        life: 0.45,
        maxLife: 0.45,
        style: 'snow',
      });
      for (const e of this.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) < 160) {
          this.damageEnemy(e, Math.round(baseSkillDmg), p.facing, true, true, 4.0);
        }
      }
    } else if (def.id === 'pyromancer') {
      this.slashes.push({
        x: p.x,
        y: p.y - 32,
        facing: p.facing,
        radius: 170,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#FB923C',
        accentColor: '#FDE047',
        life: 0.42,
        maxLife: 0.42,
        style: 'fire',
      });
      this.triggerShake(7, 0.2);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) < 190) {
          this.damageEnemy(e, Math.round(baseSkillDmg * 1.25), p.facing, true, true);
        }
      }
    } else if (def.id === 'void_reaver') {
      this.slashes.push({
        x: p.x,
        y: p.y - 32,
        facing: p.facing,
        radius: 190,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#F43F5E',
        accentColor: '#C084FC',
        life: 0.4,
        maxLife: 0.4,
        style: 'fire',
      });
      this.slashes.push({
        x: p.x,
        y: p.y - 34,
        facing: p.facing,
        radius: 135,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#F43F5E',
        accentColor: '#FFFFFF',
        life: 0.3,
        maxLife: 0.3,
        style: 'point',
      });
      this.triggerShake(8, 0.22);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) < 195) {
          this.damageEnemy(e, Math.round(baseSkillDmg * 1.3), p.facing, true, true);
        }
      }
    } else if (def.id === 'astral_lancer') {
      const startX = p.x;
      p.x = Math.max(30, Math.min(ARENA_WIDTH - 30, p.x + p.facing * 250));
      p.invulnTimer = Math.max(p.invulnTimer, 0.28);
      const midX = (startX + p.x) * 0.5;
      this.slashes.push({
        x: midX,
        y: p.y - 34,
        facing: p.facing,
        radius: 145,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#38BDF8',
        accentColor: '#FACC15',
        life: 0.32,
        maxLife: 0.32,
        style: 'lightning',
      });
      this.triggerShake(5, 0.14);
      for (const e of this.enemies) {
        const minX = Math.min(startX, p.x) - 55;
        const maxX = Math.max(startX, p.x) + 55;
        if (e.x >= minX && e.x <= maxX && Math.abs(e.y - p.y) < 105) {
          this.damageEnemy(e, Math.round(baseSkillDmg * 1.15), p.facing, true, true);
        }
      }
    }
  }

  private performSkullSwap(stats: ReturnType<typeof this.getComputedStats>) {
    const p = this.player;
    if (!p.skulls[1]) return;

    p.activeSlot = p.activeSlot === 0 ? 1 : 0;
    const newEquipped = p.skulls[p.activeSlot]!;
    const newDef = SKULL_DEFS[newEquipped.id];

    p.swapCd = BASE_SWAP_CD * stats.cdrMult;
    p.swapMaxCd = p.swapCd;
    p.invulnTimer = Math.max(p.invulnTimer, 0.32);
    p.dashCharges = newDef.maxDashCharges;
    p.thrownHead = null;

    soundFX.swap();
    this.emitBurst(p.x, p.y - 28, 14, newDef.accentColor, 220);
    this.slashes.push({
      x: p.x,
      y: p.y - 28,
      facing: p.facing,
      radius: 115,
      angleStart: 0,
      angleEnd: Math.PI * 2,
      color: newDef.primaryColor,
      accentColor: newDef.accentColor,
      life: 0.26,
      maxLife: 0.26,
      style: 'lightning',
    });
    this.slashes.push({
      x: p.x,
      y: p.y - 28,
      facing: p.facing,
      radius: 95,
      angleStart: 0,
      angleEnd: Math.PI * 2,
      color: newDef.accentColor,
      accentColor: '#FFFFFF',
      life: 0.22,
      maxLife: 0.22,
      style: 'flare',
    });
    this.floatingTexts.push({
      x: p.x,
      y: p.y - 68,
      vy: -38,
      text: newDef.switchName,
      color: newDef.accentColor,
      size: 13,
      life: 0.9,
      maxLife: 0.9,
    });

    const swapDmg = Math.round(
      newDef.baseDamage * 1.45 * stats.damageMult * stats.skillMult
    );

    if (newDef.id === 'ninja') {
      this.slashes.push({
        x: p.x,
        y: p.y - 28,
        facing: p.facing,
        radius: 130,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#22D3EE',
        accentColor: '#94A3B8',
        life: 0.34,
        maxLife: 0.34,
        style: 'smoke',
      });
      for (const dir of [-1, 1] as const) {
        for (const vy of [-60, 0, 60]) {
          this.spawnProjectile({
            owner: 'player',
            kind: 'kunai',
            x: p.x + dir * 14,
            y: p.y - 30,
            vx: dir * 740,
            vy,
            radius: 7,
            damage: Math.round(swapDmg * 0.65),
            color: '#22D3EE',
            life: 0.7,
            maxLife: 0.7,
            pierce: 2,
            hitIds: new Set(),
            gravity: 0,
            chill: 0,
            heavy: false,
          });
        }
      }
    } else {
      if (newDef.id === 'berserker') {
        this.slashes.push({
          x: p.x,
          y: p.y - 18,
          facing: p.facing,
          radius: 140,
          angleStart: 0,
          angleEnd: Math.PI * 2,
          color: '#EF4444',
          accentColor: '#94A3B8',
          life: 0.36,
          maxLife: 0.36,
          style: 'debris',
        });
      } else if (newDef.id === 'frost_warden') {
        this.slashes.push({
          x: p.x,
          y: p.y - 28,
          facing: p.facing,
          radius: 165,
          angleStart: 0,
          angleEnd: Math.PI * 2,
          color: '#7DD3FC',
          accentColor: '#FFFFFF',
          life: 0.4,
          maxLife: 0.4,
          style: 'snow',
        });
      } else if (newDef.id === 'pyromancer' || newDef.id === 'void_reaver') {
        p.vx = p.facing * 420;
        this.slashes.push({
          x: p.x,
          y: p.y - 30,
          facing: p.facing,
          radius: 155,
          angleStart: 0,
          angleEnd: Math.PI * 2,
          color: newDef.primaryColor,
          accentColor: newDef.accentColor,
          life: 0.38,
          maxLife: 0.38,
          style: 'fire',
        });
      } else if (newDef.id === 'astral_lancer') {
        this.slashes.push({
          x: p.x,
          y: p.y - 34,
          facing: p.facing,
          radius: 165,
          angleStart: 0,
          angleEnd: Math.PI * 2,
          color: '#38BDF8',
          accentColor: '#FACC15',
          life: 0.35,
          maxLife: 0.35,
          style: 'lightning',
        });
      }
      this.slashes.push({
        x: p.x,
        y: p.y - 26,
        facing: p.facing,
        radius: 145,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: newDef.primaryColor,
        accentColor: newDef.accentColor,
        life: 0.28,
        maxLife: 0.28,
        style: 'nova',
      });
      this.triggerShake(newDef.heavyHits ? 7 : 4, 0.16);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) < 155) {
          this.damageEnemy(
            e,
            swapDmg,
            e.x >= p.x ? 1 : -1,
            newDef.heavyHits,
            true,
            newDef.id === 'frost_warden' ? 3.0 : 0
          );
        }
      }
    }

    // Arcana 4-piece bonus: Swapping fires 3 homing soul bolts
    if (stats.ins.arcana >= 4) {
      for (const offset of [-180, 0, 180]) {
        this.spawnProjectile({
          owner: 'player',
          kind: 'soul_bolt',
          x: p.x,
          y: p.y - 38,
          vx: p.facing * 420,
          vy: offset,
          radius: 8,
          damage: Math.round(24 * stats.skillMult),
          color: '#C084FC',
          life: 1.0,
          maxLife: 1.0,
          pierce: 1,
          hitIds: new Set(),
          gravity: 0,
          chill: 0,
          heavy: false,
        });
      }
    }
  }

  private damageEnemy(
    enemy: EnemyState,
    rawDmg: number,
    hitDir: 1 | -1,
    heavy: boolean,
    isSkill: boolean,
    chillDuration = 0
  ) {
    const p = this.player;
    const stats = this.getComputedStats();

    // Check Tower Shield Guard!
    const hittingFront = (hitDir === 1 && enemy.facing === -1) || (hitDir === -1 && enemy.facing === 1);
    if (enemy.guardHp > 0 && enemy.state !== 'stagger' && hittingFront) {
      if (heavy) {
        enemy.guardHp -= rawDmg * 1.4;
        soundFX.guardClang();
        this.emitBurst(enemy.x + enemy.facing * 12, enemy.y - 30, 8, '#FACC15', 180);
        if (enemy.guardHp <= 0) {
          enemy.guardHp = 0;
          enemy.state = 'stagger';
          enemy.stateTimer = 2.0;
          this.hitstopTimer = 0.05;
          this.triggerShake(6, 0.16);
          this.slashes.push({
            x: enemy.x,
            y: enemy.y - enemy.h * 0.5,
            facing: hitDir,
            radius: 110,
            angleStart: 0,
            angleEnd: Math.PI * 2,
            color: '#FACC15',
            accentColor: '#FFFFFF',
            life: 0.24,
            maxLife: 0.24,
            style: 'point',
          });
          this.floatingTexts.push({
            x: enemy.x,
            y: enemy.y - enemy.h - 14,
            vy: -40,
            text: 'SHIELD BROKEN!',
            color: '#FACC15',
            size: 13,
            life: 0.9,
            maxLife: 0.9,
          });
        }
      } else {
        // Light frontal hits blocked for reduced chip damage
        const chip = Math.max(2, Math.round(rawDmg * 0.2));
        enemy.hp -= chip;
        enemy.guardHp = Math.max(0, enemy.guardHp - chip);
        soundFX.guardClang();
        this.emitBurst(enemy.x + enemy.facing * 14, enemy.y - 28, 5, '#94A3B8', 130);
        this.floatingTexts.push({
          x: enemy.x,
          y: enemy.y - enemy.h,
          vy: -32,
          text: `BLOCKED ${chip}`,
          color: '#94A3B8',
          size: 12,
          life: 0.6,
          maxLife: 0.6,
        });
        return;
      }
    }

    const isCrit = Math.random() < stats.critChance;
    let finalDmg = Math.round(rawDmg * (isCrit ? 1.65 : 1.0));
    if (enemy.state === 'stagger') finalDmg = Math.round(finalDmg * 1.35);

    enemy.hp -= finalDmg;
    enemy.hitFlash = 0.11;
    if (chillDuration > 0) {
      enemy.chillTimer = Math.max(enemy.chillTimer, chillDuration);
    }

    // Knockback (less on Boss)
    const kbMult = enemy.type === 'boss_gawain' ? 0.15 : heavy ? 1.45 : 0.85;
    enemy.vx += hitDir * 210 * kbMult;
    if (enemy.type !== 'boss_gawain' && enemy.state !== 'attack') {
      enemy.hitFlash = 0.12;
    }

    // Combo & Score
    p.comboCount++;
    p.comboDecayTimer = 2.6;
    p.score += finalDmg;

    // Feedback
    soundFX.hit(isCrit || heavy);
    if (heavy || isCrit) {
      this.hitstopTimer = Math.max(this.hitstopTimer, 0.036);
      this.triggerShake(isCrit ? 5.5 : 4, 0.11);
      this.slashes.push({
        x: enemy.x,
        y: enemy.y - enemy.h * 0.5,
        facing: hitDir,
        radius: isCrit ? 90 : 72,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#EF4444',
        accentColor: '#FDE047',
        life: 0.28,
        maxLife: 0.28,
        style: 'blood',
      });
      if (isCrit) {
        this.slashes.push({
          x: enemy.x,
          y: enemy.y - enemy.h * 0.5,
          facing: hitDir,
          radius: 96,
          angleStart: 0,
          angleEnd: Math.PI * 2,
          color: '#FDE047',
          accentColor: '#FFFFFF',
          life: 0.22,
          maxLife: 0.22,
          style: 'point',
        });
      }
    }

    this.emitBurst(
      enemy.x,
      enemy.y - enemy.h * 0.5,
      isCrit ? 11 : 6,
      isCrit ? '#FACC15' : '#FB7185',
      isCrit ? 220 : 150
    );

    this.floatingTexts.push({
      x: enemy.x + (Math.random() - 0.5) * 18,
      y: enemy.y - enemy.h - 6,
      vy: -55,
      text: isCrit ? `${finalDmg}!` : `${finalDmg}`,
      color: isCrit ? '#FDE047' : isSkill ? '#38BDF8' : '#F8FAFC',
      size: isCrit ? 17 : 14,
      life: 0.65,
      maxLife: 0.65,
    });

    // Might 4-piece bonus: Crits trigger a bonus shockwave
    if (isCrit && stats.ins.might >= 4) {
      this.particles.push({
        x: enemy.x,
        y: enemy.y - 26,
        vx: 0,
        vy: 0,
        size: 55,
        color: '#F87171',
        life: 0.22,
        maxLife: 0.22,
        gravity: 0,
        shape: 'ring',
      });
    }

    // Check Boss Phase 2 transition
    if (
      enemy.type === 'boss_gawain' &&
      enemy.bossPhase === 1 &&
      enemy.hp > 0 &&
      enemy.hp <= enemy.maxHp * 0.5
    ) {
      enemy.bossPhase = 2;
      soundFX.bossSpawn();
      this.triggerShake(8, 0.25);
      this.showBanner('Sir Gawain Unleashes Solar Fury', 2.0);
    }

    // Death check
    if (enemy.hp <= 0) {
      this.handleEnemyKilled(enemy, stats.ins);
    }
  }

  private handleEnemyKilled(
    enemy: EnemyState,
    ins: Record<InscriptionId, number>
  ) {
    const p = this.player;
    p.kills++;
    const fragDrop =
      enemy.type === 'boss_gawain'
        ? 35
        : enemy.type === 'skyfall_tyrant'
        ? 18
        : enemy.type === 'shield_knight'
        ? 8
        : 5;
    p.boneFragments += fragDrop;
    p.score +=
      enemy.type === 'boss_gawain'
        ? 1500
        : enemy.type === 'skyfall_tyrant'
        ? 450
        : 120;

    this.emitBurst(enemy.x, enemy.y - 26, 16, '#E2E8F0', 250);
    this.floatingTexts.push({
      x: enemy.x,
      y: enemy.y - 42,
      vy: -36,
      text: `+${fragDrop} Bones`,
      color: '#F59E0B',
      size: 12,
      life: 0.85,
      maxLife: 0.85,
    });

    // Vampirism Inscription heal
    this.vampKillCounter++;
    if (ins.vampirism >= 4 || (ins.vampirism >= 2 && this.vampKillCounter % 3 === 0)) {
      this.healPlayer(3);
    }

    const corpseLife =
      enemy.type === 'boss_gawain' || enemy.type === 'skyfall_tyrant'
        ? 0.95
        : enemy.type === 'cleric' || enemy.type === 'alchemist'
        ? 0.72
        : 0.85;
    this.corpses.push({
      type: enemy.type,
      x: enemy.x,
      y: enemy.y,
      facing: enemy.facing,
      life: corpseLife,
      maxLife: corpseLife,
    });

    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);
  }

  public healPlayer(amount: number) {
    const p = this.player;
    const prev = p.hp;
    p.hp = Math.min(p.maxHp, p.hp + amount);
    const healed = p.hp - prev;
    if (healed > 0) {
      soundFX.heal();
      this.floatingTexts.push({
        x: p.x,
        y: p.y - 62,
        vy: -34,
        text: `+${healed} HP`,
        color: '#34D399',
        size: 13,
        life: 0.8,
        maxLife: 0.8,
      });
    }
  }

  private damagePlayer(rawDmg: number, knockDir: 1 | -1) {
    const p = this.player;
    if (p.dashTimer > 0 && this.perfectDodgeCd <= 0) {
      this.perfectDodgeCd = 0.7;
      this.hitstopTimer = Math.max(this.hitstopTimer, 0.042);
      p.swapCd = Math.max(0, p.swapCd - 1.0);
      for (const sk of p.skulls) {
        sk.skill1Cd = Math.max(0, sk.skill1Cd - 1.0);
        sk.skill2Cd = Math.max(0, sk.skill2Cd - 1.0);
      }
      if (p.dashCharges < p.maxDashCharges) {
        p.dashCharges++;
      }
      soundFX.swap();
      this.slashes.push({
        x: p.x,
        y: p.y - 34,
        facing: p.facing,
        radius: 105,
        angleStart: 0,
        angleEnd: Math.PI * 2,
        color: '#38BDF8',
        accentColor: '#FFFFFF',
        life: 0.24,
        maxLife: 0.24,
        style: 'point',
      });
      this.floatingTexts.push({
        x: p.x,
        y: p.y - 76,
        vy: -42,
        text: 'PHANTOM STEP!',
        color: '#38BDF8',
        size: 14,
        life: 0.85,
        maxLife: 0.85,
      });
      return;
    }
    if (p.invulnTimer > 0) return;

    const stats = this.getComputedStats();
    const dmg = Math.max(1, Math.round(rawDmg * (1 - stats.damageReduction)));

    p.hp = Math.max(0, p.hp - dmg);
    p.invulnTimer = 0.72;
    p.hitstunTimer = 0.18;
    p.hitFlash = 0.14;
    p.vx = knockDir * 240;
    p.vy = -190;
    p.comboCount = 0;

    soundFX.hurt();
    this.triggerShake(7, 0.18);
    this.emitBurst(p.x, p.y - 28, 10, '#E11D48', 190);
    this.floatingTexts.push({
      x: p.x,
      y: p.y - 58,
      vy: -45,
      text: `-${dmg}`,
      color: '#FB7185',
      size: 15,
      life: 0.75,
      maxLife: 0.75,
    });

    if (p.hp <= 0) {
      if (this.player.hp <= 0 && (!this.player2 || this.player2.hp <= 0)) {
        this.onGameOver?.();
      }
    }
  }

  private updateEnemies(dt: number) {
    const p = this.player;

    for (const e of this.enemies) {
      e.animTime += dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.chillTimer > 0) e.chillTimer -= dt;
      if (e.attackCooldown > 0) e.attackCooldown -= dt;

      const speedScale = e.chillTimer > 0 ? 0.58 : 1.0;
      const dx1 = p.x - e.x;
      const dy1 = p.y - e.y;
      const distX1 = Math.abs(dx1);

      let targetX = p.x;
      let targetY = p.y;
      let targetDx = dx1;
      let targetDistX = distX1;

      if (this.player2 && this.player2.hp > 0 && (p.hp <= 0 || Math.abs(this.player2.x - e.x) < distX1)) {
        targetX = this.player2.x;
        targetY = this.player2.y;
        targetDx = this.player2.x - e.x;
        targetDistX = Math.abs(targetDx);
      }
      const dirToPlayer: 1 | -1 = targetDx >= 0 ? 1 : -1;
      const dx = targetDx;
      const dy = targetY - e.y;
      const distX = targetDistX;

      if (e.state === 'stagger') {
        e.stateTimer -= dt;
        e.vx *= 0.85;
        if (e.stateTimer <= 0) {
          e.state = 'chase';
          e.guardHp = e.maxGuardHp;
        }
      } else if (e.type === 'boss_gawain') {
        this.updateBossAI(e, dt, speedScale, dx, distX, dirToPlayer);
      } else if (e.type === 'skyfall_tyrant') {
        this.updateSkyfallTyrantAI(e, dt, speedScale, distX, dirToPlayer);
      } else if (e.type === 'crossbow') {
        this.updateCrossbowAI(e, dt, speedScale, distX, dirToPlayer);
      } else if (e.type === 'cleric') {
        this.updateClericAI(e, dt, speedScale, distX, dirToPlayer);
      } else if (e.type === 'alchemist') {
        this.updateAlchemistAI(e, dt, speedScale, distX, dirToPlayer);
      } else {
        // Crimson Vanguard, Siege Behemoth & Glacial Wyrm melee AI
        const attackRange =
          e.type === 'shield_knight' ? 82 : e.type === 'frost_wyrm' ? 76 : 68;
        const moveSpeed =
          e.type === 'shield_knight' ? 115 : e.type === 'frost_wyrm' ? 205 : 175;

        if (e.state === 'chase') {
          e.facing = dirToPlayer;
          if (distX > attackRange) {
            e.vx = dirToPlayer * moveSpeed * speedScale;
          } else {
            e.vx *= 0.7;
            if (e.attackCooldown <= 0 && Math.abs(dy) < 95) {
              e.state = 'windup';
              e.stateTimer = e.type === 'shield_knight' ? 0.52 : 0.4;
              e.hasHitThisSwing = false;
            }
          }
        } else if (e.state === 'windup') {
          e.vx *= 0.8;
          e.stateTimer -= dt * speedScale;
          if (e.stateTimer <= 0) {
            e.state = 'attack';
            e.stateTimer = 0.2;
            e.vx =
              e.facing *
              (e.type === 'shield_knight'
                ? 240
                : e.type === 'frost_wyrm'
                ? 360
                : 320);
          }
        } else if (e.state === 'attack') {
          e.stateTimer -= dt;
          if (
            !e.hasHitThisSwing &&
            Math.abs(p.x - (e.x + e.facing * 26)) < 50 &&
            Math.abs(p.y - e.y) < 58
          ) {
            e.hasHitThisSwing = true;
            const hitDmg =
              e.type === 'shield_knight'
                ? 18
                : e.type === 'frost_wyrm'
                ? 15
                : 13;
            this.damagePlayer(hitDmg, e.facing);
          }
          if (e.stateTimer <= 0) {
            e.state = 'recover';
            e.stateTimer = 0.42;
            e.attackCooldown = e.type === 'shield_knight' ? 1.35 : 1.05;
          }
        } else if (e.state === 'recover') {
          e.vx *= 0.82;
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) e.state = 'chase';
        }
      }

      // Gravity & Floor clamping for enemies
      e.vy += GRAVITY * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.x = Math.max(26, Math.min(ARENA_WIDTH - 26, e.x));

      e.grounded = false;
      if (e.vy >= 0) {
        for (const plat of ARENA_PLATFORMS) {
          if (
            e.x >= plat.x - 8 &&
            e.x <= plat.x + plat.w + 8 &&
            e.y >= plat.y &&
            e.y - e.vy * dt <= plat.y + 10
          ) {
            e.y = plat.y;
            e.vy = 0;
            e.grounded = true;
            break;
          }
        }
      }
      if (e.y > GROUND_Y) {
        e.y = GROUND_Y;
        e.vy = 0;
        e.grounded = true;
      }
    }
  }

  private updateCrossbowAI(
    e: EnemyState,
    dt: number,
    speedScale: number,
    distX: number,
    dirToPlayer: 1 | -1
  ) {
    const p = this.player;
    if (e.state === 'chase') {
      e.facing = dirToPlayer;
      if (distX < 180) {
        e.vx = -dirToPlayer * 140 * speedScale;
      } else if (distX > 460) {
        e.vx = dirToPlayer * 145 * speedScale;
      } else {
        e.vx *= 0.8;
        if (e.attackCooldown <= 0) {
          e.state = 'windup';
          e.stateTimer = 0.58;
          e.telegraphX = p.x;
          e.telegraphY = p.y - 28;
        }
      }
    } else if (e.state === 'windup') {
      e.vx *= 0.7;
      e.stateTimer -= dt * speedScale;
      // Track player slightly during early windup
      if (e.stateTimer > 0.22) {
        e.telegraphX = p.x;
        e.telegraphY = p.y - 28;
      }
      if (e.stateTimer <= 0) {
        const ang = Math.atan2(e.telegraphY - (e.y - 32), e.telegraphX - e.x);
        this.spawnProjectile({
          owner: 'enemy',
          kind: 'cyan_flame',
          x: e.x + e.facing * 16,
          y: e.y - 32,
          vx: Math.cos(ang) * 510,
          vy: Math.sin(ang) * 510,
          radius: 8,
          damage: 12,
          color: '#22D3EE',
          life: 1.8,
          maxLife: 1.8,
          pierce: 1,
          hitIds: new Set(),
          gravity: 0,
          chill: 0,
          heavy: false,
        });
        e.state = 'recover';
        e.stateTimer = 0.4;
        e.attackCooldown = 1.9;
      }
    } else if (e.state === 'recover') {
      e.vx *= 0.85;
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) e.state = 'chase';
    }
  }

  private updateClericAI(
    e: EnemyState,
    dt: number,
    speedScale: number,
    distX: number,
    dirToPlayer: 1 | -1
  ) {
    if (e.state === 'chase') {
      e.facing = dirToPlayer;
      if (distX < 210) e.vx = -dirToPlayer * 120 * speedScale;
      else if (distX > 420) e.vx = dirToPlayer * 120 * speedScale;
      else e.vx *= 0.8;

      if (e.attackCooldown <= 0) {
        e.state = 'windup';
        e.stateTimer = 0.65;
      }
    } else if (e.state === 'windup') {
      e.vx *= 0.7;
      e.stateTimer -= dt * speedScale;
      if (e.stateTimer <= 0) {
        // Cast a healing rune near injured allies or self
        const targetAlly =
          this.enemies.find((ally) => ally.hp < ally.maxHp) || e;
        this.hazards.push({
          id: this.nextId++,
          x: targetAlly.x,
          y: targetAlly.y,
          w: 150,
          h: 32,
          timer: 2.2,
          maxTimer: 2.2,
          triggered: false,
          damage: 14,
          kind: 'heal_rune',
        });
        e.state = 'recover';
        e.stateTimer = 0.5;
        e.attackCooldown = 3.6;
      }
    } else if (e.state === 'recover') {
      e.vx *= 0.85;
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) e.state = 'chase';
    }
  }

  private updateAlchemistAI(
    e: EnemyState,
    dt: number,
    speedScale: number,
    distX: number,
    dirToPlayer: 1 | -1
  ) {
    const p = this.player;
    if (e.state === 'chase') {
      e.facing = dirToPlayer;
      if (distX < 190) e.vx = -dirToPlayer * 130 * speedScale;
      else if (distX > 390) e.vx = dirToPlayer * 140 * speedScale;
      else e.vx *= 0.8;

      if (e.attackCooldown <= 0) {
        e.state = 'windup';
        e.stateTimer = 0.55;
        e.telegraphX = p.x;
        e.telegraphY = p.y;
      }
    } else if (e.state === 'windup') {
      e.vx *= 0.72;
      e.stateTimer -= dt * speedScale;
      if (e.stateTimer > 0.2) {
        e.telegraphX = p.x;
      }
      if (e.stateTimer <= 0) {
        const dx = e.telegraphX - e.x;
        const vx = Math.max(-420, Math.min(420, dx * 1.35));
        this.spawnProjectile({
          owner: 'enemy',
          kind: 'flask',
          x: e.x + e.facing * 14,
          y: e.y - 36,
          vx,
          vy: -320,
          radius: 9,
          damage: 14,
          color: '#22D3EE',
          life: 1.9,
          maxLife: 1.9,
          pierce: 1,
          hitIds: new Set(),
          gravity: 960,
          chill: 0,
          heavy: false,
        });
        e.state = 'recover';
        e.stateTimer = 0.45;
        e.attackCooldown = 2.4;
      }
    } else if (e.state === 'recover') {
      e.vx *= 0.85;
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) e.state = 'chase';
    }
  }

  private updateSkyfallTyrantAI(
    e: EnemyState,
    dt: number,
    speedScale: number,
    distX: number,
    dirToPlayer: 1 | -1
  ) {
    const p = this.player;
    if (e.state === 'chase') {
      e.facing = dirToPlayer;
      if (distX > 150) {
        e.vx = dirToPlayer * 185 * speedScale;
      } else {
        e.vx *= 0.78;
      }
      if (e.attackCooldown <= 0) {
        e.attackVariant = (e.attackVariant + 1) % 2;
        e.state = 'windup';
        e.stateTimer = 0.48;
        e.hasHitThisSwing = false;
      }
    } else if (e.state === 'windup') {
      e.vx *= 0.75;
      e.stateTimer -= dt * speedScale;
      if (e.stateTimer <= 0) {
        if (e.attackVariant === 0) {
          e.state = 'attack';
          e.stateTimer = 0.25;
          e.vx = e.facing * 480;
        } else {
          for (const vy of [-95, 0, 95]) {
            this.spawnProjectile({
              owner: 'enemy',
              kind: 'cyan_flame',
              x: e.x + e.facing * 24,
              y: e.y - 42,
              vx: e.facing * 460,
              vy,
              radius: 10,
              damage: 15,
              color: '#38BDF8',
              life: 1.9,
              maxLife: 1.9,
              pierce: 1,
              hitIds: new Set(),
              gravity: 0,
              chill: 0,
              heavy: true,
            });
          }
          e.state = 'recover';
          e.stateTimer = 0.48;
          e.attackCooldown = 1.6;
        }
      }
    } else if (e.state === 'attack') {
      e.stateTimer -= dt;
      if (
        !e.hasHitThisSwing &&
        Math.abs(p.x - (e.x + e.facing * 28)) < 60 &&
        Math.abs(p.y - e.y) < 66
      ) {
        e.hasHitThisSwing = true;
        this.damagePlayer(18, e.facing);
      }
      if (e.stateTimer <= 0) {
        e.state = 'recover';
        e.stateTimer = 0.45;
        e.attackCooldown = 1.45;
      }
    } else if (e.state === 'recover') {
      e.vx *= 0.84;
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) e.state = 'chase';
    }
  }

  private updateBossAI(
    e: EnemyState,
    dt: number,
    speedScale: number,
    dx: number,
    distX: number,
    dirToPlayer: 1 | -1
  ) {
    const p = this.player;
    const phaseMult = e.bossPhase === 2 ? 1.28 : 1.0;

    if (e.state === 'chase') {
      e.facing = dirToPlayer;
      if (distX > 105) {
        e.vx = dirToPlayer * 195 * speedScale * phaseMult;
      } else {
        e.vx *= 0.75;
      }

      if (e.attackCooldown <= 0) {
        e.attackVariant = (e.attackVariant + 1) % 3;
        e.state = 'windup';
        e.hasHitThisSwing = false;
        if (e.attackVariant === 0) {
          // Dash Cleave
          e.stateTimer = 0.45 / phaseMult;
        } else if (e.attackVariant === 1) {
          // Solar Light Pillars
          e.stateTimer = 0.55 / phaseMult;
        } else {
          // Crescent Wave Toss
          e.stateTimer = 0.48 / phaseMult;
        }
      }
    } else if (e.state === 'windup') {
      e.vx *= 0.8;
      e.stateTimer -= dt * speedScale;
      if (e.stateTimer <= 0) {
        if (e.attackVariant === 0) {
          // Dash Cleave
          e.state = 'attack';
          e.stateTimer = 0.24;
          e.vx = e.facing * 590 * phaseMult;
        } else if (e.attackVariant === 1) {
          // Spawn 3 telegraphed solar pillars near player & arena
          const count = e.bossPhase === 2 ? 4 : 3;
          for (let i = 0; i < count; i++) {
            const px = Math.max(
              70,
              Math.min(ARENA_WIDTH - 70, p.x + (i - (count - 1) / 2) * 145)
            );
            this.hazards.push({
              id: this.nextId++,
              x: px - 32,
              y: GROUND_Y,
              w: 64,
              h: 260,
              timer: 0.75,
              maxTimer: 0.75,
              triggered: false,
              damage: 22,
              kind: 'light_pillar',
            });
          }
          e.state = 'recover';
          e.stateTimer = 0.55;
          e.attackCooldown = 1.35 / phaseMult;
        } else {
          // Radiant Blade Projectile
          this.spawnProjectile({
            owner: 'enemy',
            kind: 'light_spear',
            x: e.x + e.facing * 28,
            y: e.y - 42,
            vx: e.facing * 490 * phaseMult,
            vy: 0,
            radius: 13,
            damage: 18,
            color: '#FACC15',
            life: 2.0,
            maxLife: 2.0,
            pierce: 2,
            hitIds: new Set(),
            gravity: 0,
            chill: 0,
            heavy: true,
          });
          e.state = 'recover';
          e.stateTimer = 0.45;
          e.attackCooldown = 1.25 / phaseMult;
        }
      }
    } else if (e.state === 'attack') {
      e.stateTimer -= dt;
      if (
        !e.hasHitThisSwing &&
        Math.abs(p.x - (e.x + e.facing * 32)) < 68 &&
        Math.abs(p.y - e.y) < 72
      ) {
        e.hasHitThisSwing = true;
        this.damagePlayer(20, e.facing);
      }
      if (e.stateTimer <= 0) {
        e.state = 'recover';
        e.stateTimer = 0.45;
        e.attackCooldown = 1.15 / phaseMult;
      }
    } else if (e.state === 'recover') {
      e.vx *= 0.82;
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) e.state = 'chase';
    }
    void dx;
  }

  private spawnProjectile(proj: Omit<Projectile, 'id'>) {
    this.projectiles.push({ ...proj, id: this.nextId++ });
  }

  private updateProjectiles(dt: number) {
    const p = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      pr.vy += pr.gravity * dt;

      // Slight homing for player soul_bolts
      if (pr.owner === 'player' && pr.kind === 'soul_bolt' && this.enemies.length > 0) {
        let nearest: EnemyState | null = null;
        let bestD = 320;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - pr.x, e.y - 30 - pr.y);
          if (d < bestD) {
            bestD = d;
            nearest = e;
          }
        }
        if (nearest) {
          const ang = Math.atan2(nearest.y - nearest.h * 0.5 - pr.y, nearest.x - pr.x);
          const speed = Math.hypot(pr.vx, pr.vy) || 500;
          pr.vx += (Math.cos(ang) * speed - pr.vx) * 5.5 * dt;
          pr.vy += (Math.sin(ang) * speed - pr.vy) * 5.5 * dt;
        }
      }

      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      let remove = pr.life <= 0 || pr.x < -30 || pr.x > ARENA_WIDTH + 30;

      if (!remove && pr.owner === 'player') {
        for (const e of [...this.enemies]) {
          if (pr.hitIds.has(e.id)) continue;
          if (
            Math.abs(pr.x - e.x) < e.w * 0.55 + pr.radius &&
            Math.abs(pr.y - (e.y - e.h * 0.5)) < e.h * 0.55 + pr.radius
          ) {
            pr.hitIds.add(e.id);
            pr.pierce--;
            if (pr.kind === 'frost_shard') {
              this.slashes.push({
                x: e.x,
                y: e.y - e.h * 0.5,
                facing: pr.vx >= 0 ? 1 : -1,
                radius: 75,
                angleStart: 0,
                angleEnd: Math.PI * 2,
                color: '#7DD3FC',
                accentColor: '#FFFFFF',
                life: 0.28,
                maxLife: 0.28,
                style: 'snow',
              });
            } else if (pr.kind === 'fireball') {
              this.slashes.push({
                x: e.x,
                y: e.y - e.h * 0.5,
                facing: pr.vx >= 0 ? 1 : -1,
                radius: 82,
                angleStart: 0,
                angleEnd: Math.PI * 2,
                color: '#FB923C',
                accentColor: '#FDE047',
                life: 0.26,
                maxLife: 0.26,
                style: 'fire',
              });
            }
            this.damageEnemy(
              e,
              pr.damage,
              pr.vx >= 0 ? 1 : -1,
              pr.heavy,
              true,
              pr.chill
            );
            if (pr.pierce <= 0) {
              remove = true;
              break;
            }
          }
        }
      } else if (!remove && pr.owner === 'enemy') {
        if (
          Math.abs(pr.x - p.x) < p.w * 0.5 + pr.radius &&
          Math.abs(pr.y - (p.y - p.h * 0.5)) < p.h * 0.5 + pr.radius
        ) {
          this.damagePlayer(pr.damage, pr.vx >= 0 ? 1 : -1);
          remove = true;
        } else if (pr.kind === 'flask' && pr.y >= GROUND_Y - 4) {
          this.emitBurst(pr.x, GROUND_Y - 8, 10, '#22D3EE', 170);
          this.hazards.push({
            id: this.nextId++,
            x: pr.x,
            y: GROUND_Y,
            w: 112,
            h: 24,
            timer: 2.5,
            maxTimer: 2.5,
            triggered: false,
            damage: 7,
            kind: 'acid_pool',
          });
          if (Math.hypot(p.x - pr.x, p.y - GROUND_Y) < 62) {
            this.damagePlayer(pr.damage, p.x >= pr.x ? 1 : -1);
          }
          remove = true;
        }
      }

      if (remove) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateHazards(dt: number) {
    const p = this.player;
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const hz = this.hazards[i];
      hz.timer -= dt;

      if (hz.kind === 'acid_pool') {
        if (
          Math.abs(p.x - hz.x) < hz.w * 0.48 &&
          Math.abs(p.y - hz.y) < 28 &&
          (p.invulnTimer <= 0 || p.dashTimer > 0)
        ) {
          this.damagePlayer(hz.damage, p.x >= hz.x ? 1 : -1);
        }
      } else if (hz.kind === 'frost_zone') {
        for (const e of this.enemies) {
          if (Math.abs(e.x - hz.x) < hz.w * 0.5 && Math.abs(e.y - hz.y) < 55) {
            e.chillTimer = Math.max(e.chillTimer, 0.5);
            if (Math.random() < dt * 2.5) {
              this.damageEnemy(e, Math.max(4, Math.round(hz.damage * 0.35)), 1, false, true, 1.5);
            }
          }
        }
      } else if (hz.kind === 'heal_rune' && !hz.triggered && hz.timer <= 0.8) {
        hz.triggered = true;
        for (const e of this.enemies) {
          if (Math.abs(e.x - hz.x) < hz.w * 0.55) {
            e.hp = Math.min(e.maxHp, e.hp + hz.damage);
            this.floatingTexts.push({
              x: e.x,
              y: e.y - e.h - 10,
              vy: -30,
              text: `+${hz.damage}`,
              color: '#34D399',
              size: 12,
              life: 0.7,
              maxLife: 0.7,
            });
          }
        }
      } else if (hz.kind === 'light_pillar' && !hz.triggered && hz.timer <= 0.12) {
        hz.triggered = true;
        this.triggerShake(6, 0.15);
        this.emitBurst(hz.x + hz.w * 0.5, hz.y - 24, 14, '#FACC15', 240);
        if (
          p.x >= hz.x - 10 &&
          p.x <= hz.x + hz.w + 10 &&
          p.y >= hz.y - hz.h
        ) {
          this.damagePlayer(hz.damage, p.x >= hz.x + hz.w * 0.5 ? 1 : -1);
        }
      }

      if (hz.timer <= 0) {
        this.hazards.splice(i, 1);
      }
    }
  }

  private checkWaveProgress(dt: number) {
    if (this.enemies.length > 0) return;

    const stage = STAGES[this.stageIndex];
    if (this.waveIndex < stage.waves.length - 1) {
      if (!this.waveClearPending) {
        this.waveClearPending = true;
        this.stageClearPauseTimer = 0.85;
      } else {
        this.stageClearPauseTimer -= dt;
        if (this.stageClearPauseTimer <= 0) {
          this.waveClearPending = false;
          this.waveIndex++;
          this.spawnWave();
        }
      }
      return;
    }

    // Entire Stage Cleared!
    if (!this.waveClearPending) {
      this.waveClearPending = true;
      this.stageClearPauseTimer = 1.0;
      soundFX.waveClear();

      // Crimson Chalice heal on stage clear
      if (this.player.relics.includes('crimson_chalice')) {
        this.healPlayer(10);
      }
    } else {
      this.stageClearPauseTimer -= dt;
      if (this.stageClearPauseTimer <= 0) {
        this.waveClearPending = false;
        if (this.stageIndex >= STAGES.length - 1) {
          this.onVictory?.();
        } else {
          this.onStageCleared?.(this.generateRewardOptions());
        }
      }
    }
  }

  private generateRewardOptions(): RewardOption[] {
    const options: RewardOption[] = [];

    // 1. Skull option (prefer one not currently equipped)
    const equippedIds = new Set(
      this.player.skulls.filter(Boolean).map((s) => s!.id)
    );
    const candidateSkulls = ALL_SKULL_IDS.filter((id) => !equippedIds.has(id));
    const chosenSkull =
      candidateSkulls.length > 0
        ? candidateSkulls[Math.floor(Math.random() * candidateSkulls.length)]
        : ALL_SKULL_IDS[Math.floor(Math.random() * ALL_SKULL_IDS.length)];
    const dropTier: SkullTier = this.stageIndex >= 2 ? 2 : 1;
    options.push({ kind: 'skull', skullId: chosenSkull, tier: dropTier });

    // 2. Relic option (prefer one not yet owned)
    const unownedRelics = ALL_RELIC_IDS.filter(
      (id) => !this.player.relics.includes(id)
    );
    const pool = unownedRelics.length > 0 ? unownedRelics : ALL_RELIC_IDS;
    const chosenRelic = pool[Math.floor(Math.random() * pool.length)];
    options.push({ kind: 'relic', relicId: chosenRelic });

    // 3. Sanctuary heal + Bone Fragments
    options.push({
      kind: 'sanctuary',
      healAmount: 35,
      bonusFragments: 15,
      title: 'Bone Shrine Rest',
      description: 'Restore 35 HP and gather 15 Bone Fragments for awakening.',
    });

    return options;
  }

  public applyReward(option: RewardOption, replaceSlot?: 0 | 1) {
    const p = this.player;
    if (option.kind === 'skull') {
      const slot = replaceSlot ?? p.activeSlot;
      p.skulls[slot] = {
        id: option.skullId,
        tier: option.tier,
        skill1Cd: 0,
        skill2Cd: 0,
      };
      p.activeSlot = slot;
      p.thrownHead = null;
      soundFX.swap();
    } else if (option.kind === 'relic') {
      if (!p.relics.includes(option.relicId)) {
        p.relics.push(option.relicId);
        this.recalculateMaxHp(true);
      } else {
        p.boneFragments += 12;
      }
      soundFX.heal();
    } else if (option.kind === 'sanctuary') {
      this.healPlayer(option.healAmount);
      p.boneFragments += option.bonusFragments;
    }

    this.startStage(this.stageIndex + 1);
  }

  public awakenSkull(slot: 0 | 1): boolean {
    const sk = this.player.skulls[slot];
    if (!sk || sk.tier >= 3) return false;
    const cost = sk.tier === 1 ? 20 : 35;
    if (this.player.boneFragments < cost) return false;

    this.player.boneFragments -= cost;
    sk.tier = (sk.tier + 1) as SkullTier;
    soundFX.swap();
    return true;
  }

  private emitBurst(
    x: number,
    y: number,
    count: number,
    color: string,
    speed: number
  ) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        size: 3 + Math.random() * 3.5,
        color,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        gravity: 520,
        shape: i % 2 === 0 ? 'spark' : 'square',
      });
    }
  }

  public getRenderScene(): RenderScene {
    const sx =
      this.shakeTimer > 0 ? (Math.random() - 0.5) * 2 * this.shakeIntensity : 0;
    const sy =
      this.shakeTimer > 0 ? (Math.random() - 0.5) * 2 * this.shakeIntensity : 0;

    return {
      time: this.time,
      stageIndex: this.stageIndex,
      shakeX: sx,
      shakeY: sy,
      player: this.player,
      player2: this.player2,
      enemies: this.enemies,
      projectiles: this.projectiles,
      slashes: this.slashes,
      corpses: this.corpses,
      particles: this.particles,
      floatingTexts: this.floatingTexts,
      hazards: this.hazards,
    };
  }

  public getHudSnapshot(): HudSnapshot {
    const p = this.player;
    const stage = STAGES[this.stageIndex];
    const bossEnemy = this.enemies.find(
      (e) => e.type === 'boss_gawain' || e.type === 'skyfall_tyrant'
    );
    const rechargeSpeed = p.relics.includes('phantom_spur') ? 1.45 : 1.0;
    const isRecharging = p.dashCharges < p.maxDashCharges;
    const dashRechargeProgress = isRecharging
      ? Math.max(0, Math.min(1, p.dashRechargeTimer / 1.25))
      : 1;
    const dashCooldownRemaining = isRecharging
      ? Math.max(0, (1.25 - p.dashRechargeTimer) / rechargeSpeed)
      : 0;

    return {
      hp: p.hp,
      maxHp: p.maxHp,
      player2: this.player2
        ? {
            hp: this.player2.hp,
            maxHp: this.player2.maxHp,
            skulls: [{ ...this.player2.skulls[0] }, { ...this.player2.skulls[1] }],
            activeSlot: this.player2.activeSlot,
            dashCharges: this.player2.dashCharges,
            maxDashCharges: this.player2.maxDashCharges,
          }
        : null,
      stage: this.stageIndex + 1,
      maxStages: STAGES.length,
      wave: this.waveIndex + 1,
      maxWaves: stage.waves.length,
      enemiesRemaining: this.enemies.length,
      score: p.score,
      kills: p.kills,
      boneFragments: p.boneFragments,
      comboCount: p.comboCount,
      skulls: [{ ...p.skulls[0] }, { ...p.skulls[1] }],
      activeSlot: p.activeSlot,
      swapCd: p.swapCd,
      swapMaxCd: p.swapMaxCd,
      dashCharges: p.dashCharges,
      maxDashCharges: p.maxDashCharges,
      dashRechargeProgress,
      dashCooldownRemaining,
      relics: [...p.relics],
      boss: bossEnemy
        ? {
            name: bossEnemy.name,
            hp: Math.max(0, bossEnemy.hp),
            maxHp: bossEnemy.maxHp,
            phase: bossEnemy.bossPhase,
          }
        : null,
      bannerText: this.bannerText,
    };
  }
}
