export type GameScreenState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'REWARD_PICK'
  | 'PAUSED'
  | 'VICTORY'
  | 'GAME_OVER';

export type StageThemeId =
  | 'auto'
  | 'dark_abandoned'
  | 'icy_caves'
  | 'crystal_valley'
  | 'loading_screen'
  | 'eleven_cafe'
  | 'game_night';

export type SkullId =
  | 'little_bone'
  | 'berserker'
  | 'ninja'
  | 'lich'
  | 'frost_warden'
  | 'pyromancer'
  | 'void_reaver'
  | 'astral_lancer';

export type SkullArchetype = 'Balance' | 'Power' | 'Speed';
export type SkullTier = 1 | 2 | 3;

export type InscriptionId =
  | 'might'
  | 'velocity'
  | 'arcana'
  | 'fortitude'
  | 'vampirism';

export interface SkillDef {
  name: string;
  description: string;
  cooldown: number;
  keyLabel: string;
}

export interface SkullDef {
  id: SkullId;
  name: string;
  archetype: SkullArchetype;
  tierNames: [string, string, string];
  primaryColor: string;
  accentColor: string;
  cloakColor: string;
  moveSpeed: number;
  jumpForce: number;
  maxDashCharges: number;
  baseDamage: number;
  attackSpeed: number;
  attackRange: number;
  heavyHits: boolean;
  switchName: string;
  switchDescription: string;
  skill1: SkillDef;
  skill2: SkillDef;
  summary: string;
}

export interface EquippedSkull {
  id: SkullId;
  tier: SkullTier;
  skill1Cd: number;
  skill2Cd: number;
}

export type RelicId =
  | 'iron_gauntlet'
  | 'executioner_crest'
  | 'wind_feather'
  | 'phantom_spur'
  | 'void_prism'
  | 'soul_lantern'
  | 'titans_rib'
  | 'warden_plate'
  | 'crimson_chalice'
  | 'blood_fang';

export interface RelicDef {
  id: RelicId;
  name: string;
  inscriptions: [InscriptionId, InscriptionId?];
  description: string;
  color: string;
}

export interface InscriptionDef {
  id: InscriptionId;
  name: string;
  color: string;
  bonus2: string;
  bonus4: string;
}

export type EnemyType =
  | 'swordsman'
  | 'crossbow'
  | 'shield_knight'
  | 'cleric'
  | 'alchemist'
  | 'frost_wyrm'
  | 'skyfall_tyrant'
  | 'boss_gawain';

export interface Platform {
  x: number;
  y: number;
  w: number;
  oneWay: boolean;
}

export interface Afterimage {
  x: number;
  y: number;
  facing: 1 | -1;
  skullId: SkullId;
  alpha: number;
}

export interface ThrownHead {
  x: number;
  y: number;
  vx: number;
  vy: number;
  timer: number;
  returning: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  skulls: [EquippedSkull, EquippedSkull];
  activeSlot: 0 | 1;
  swapCd: number;
  swapMaxCd: number;
  dashCharges: number;
  maxDashCharges: number;
  dashRechargeTimer: number;
  dashTimer: number;
  dashDir: 1 | -1;
  invulnTimer: number;
  comboStep: number;
  comboResetTimer: number;
  attackTimer: number;
  attackCooldown: number;
  hitstunTimer: number;
  grounded: boolean;
  coyoteTimer: number;
  jumpsLeft: number;
  dropThroughTimer: number;
  thrownHead: ThrownHead | null;
  relics: RelicId[];
  boneFragments: number;
  score: number;
  kills: number;
  comboCount: number;
  comboDecayTimer: number;
  animTime: number;
  airTime: number;
  fallTime: number;
  attackDuration: number;
  hitFlash: number;
  afterimages: Afterimage[];
}

export type EnemyAIState =
  | 'idle'
  | 'chase'
  | 'windup'
  | 'attack'
  | 'recover'
  | 'stagger'
  | 'cast';

export interface EnemyState {
  id: number;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  guardHp: number;
  maxGuardHp: number;
  state: EnemyAIState;
  stateTimer: number;
  attackCooldown: number;
  hitFlash: number;
  chillTimer: number;
  grounded: boolean;
  bossPhase: 1 | 2;
  attackVariant: number;
  telegraphX: number;
  telegraphY: number;
  hasHitThisSwing: boolean;
  animTime: number;
}

export interface Projectile {
  id: number;
  owner: 'player' | 'enemy';
  kind:
    | 'kunai'
    | 'soul_bolt'
    | 'frost_shard'
    | 'fireball'
    | 'flask'
    | 'arrow'
    | 'cyan_flame'
    | 'lightning_spear'
    | 'light_spear'
    | 'bone_wave';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
  maxLife: number;
  pierce: number;
  hitIds: Set<number>;
  gravity: number;
  chill: number;
  heavy: boolean;
}

export interface CorpseEffect {
  type: EnemyType;
  x: number;
  y: number;
  facing: 1 | -1;
  life: number;
  maxLife: number;
}

export interface SlashEffect {
  x: number;
  y: number;
  facing: 1 | -1;
  radius: number;
  angleStart: number;
  angleEnd: number;
  color: string;
  accentColor: string;
  life: number;
  maxLife: number;
  style:
    | 'arc'
    | 'cleave'
    | 'thrust'
    | 'nova'
    | 'pillar'
    | 'cross'
    | 'lightning'
    | 'flare'
    | 'blood'
    | 'snow'
    | 'debris'
    | 'smoke'
    | 'fire'
    | 'point';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  shape: 'square' | 'spark' | 'ring';
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface HazardZone {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  timer: number;
  maxTimer: number;
  triggered: boolean;
  damage: number;
  kind: 'light_pillar' | 'heal_rune' | 'frost_zone' | 'acid_pool';
}

export type RewardOption =
  | {
      kind: 'skull';
      skullId: SkullId;
      tier: SkullTier;
    }
  | {
      kind: 'relic';
      relicId: RelicId;
    }
  | {
      kind: 'sanctuary';
      healAmount: number;
      bonusFragments: number;
      title: string;
      description: string;
    };

export interface InputSnapshot {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpPressed: boolean;
  dashPressed: boolean;
  attackPressed: boolean;
  attackHeld: boolean;
  skill1Pressed: boolean;
  skill2Pressed: boolean;
  swapPressed: boolean;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  player2?: {
    hp: number;
    maxHp: number;
    skulls: [EquippedSkull, EquippedSkull];
    activeSlot: 0 | 1;
    dashCharges: number;
    maxDashCharges: number;
  } | null;
  stage: number;
  maxStages: number;
  wave: number;
  maxWaves: number;
  enemiesRemaining: number;
  score: number;
  kills: number;
  boneFragments: number;
  comboCount: number;
  skulls: [EquippedSkull, EquippedSkull];
  activeSlot: 0 | 1;
  swapCd: number;
  swapMaxCd: number;
  dashCharges: number;
  maxDashCharges: number;
  dashRechargeProgress: number;
  dashCooldownRemaining: number;
  relics: RelicId[];
  boss: {
    name: string;
    hp: number;
    maxHp: number;
    phase: 1 | 2;
  } | null;
  bannerText: string | null;
}
