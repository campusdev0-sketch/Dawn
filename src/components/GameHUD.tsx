import { Pause, Volume2, VolumeX, Repeat, Gamepad2, Wind } from 'lucide-react';
import { INSCRIPTION_DEFS, RELIC_DEFS, SKULL_DEFS } from '../game/data';
import { HudSnapshot, InscriptionId } from '../game/types';
import { SkullPortrait } from './SkullPortrait';

interface GameHUDProps {
  hud: HudSnapshot;
  muted: boolean;
  showTouchControls: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onToggleTouch: () => void;
  onTouchInput: (action: string, pressed: boolean) => void;
}

export function GameHUD({
  hud,
  muted,
  showTouchControls,
  onToggleMute,
  onPause,
  onToggleTouch,
  onTouchInput,
}: GameHUDProps) {
  const activeEquipped = hud.skulls[hud.activeSlot];
  const reserveSlot: 0 | 1 = hud.activeSlot === 0 ? 1 : 0;
  const reserveEquipped = hud.skulls[reserveSlot];
  const activeDef = SKULL_DEFS[activeEquipped.id];
  const reserveDef = SKULL_DEFS[reserveEquipped.id];

  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));

  // Compute active inscription counts for summary readout
  const insCounts: Record<InscriptionId, number> = {
    might: 0,
    velocity: 0,
    arcana: 0,
    fortitude: 0,
    vampirism: 0,
  };
  for (const rid of hud.relics) {
    for (const ins of RELIC_DEFS[rid].inscriptions) {
      if (ins) insCounts[ins]++;
    }
  }
  const activeInscriptions = (Object.keys(insCounts) as InscriptionId[]).filter(
    (k) => insCounts[k] > 0
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* Top Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left: Health & Resources */}
        <div className="pointer-events-auto flex items-center gap-4 rounded-lg border border-white/10 bg-[#111520]/90 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            <div className="min-w-[170px] sm:min-w-[210px]">
              <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-200">
                <span className="text-sky-400 font-semibold">{hud.player2 ? 'P1 Health' : 'Health'}</span>
                <span className="font-mono-num text-slate-100">
                  {hud.hp} / {hud.maxHp}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-800">
                <div
                  className="h-full bg-rose-600 transition-all duration-150"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            {hud.player2 && (
              <div className="min-w-[170px] sm:min-w-[210px]">
                <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-200">
                  <span className="text-amber-400 font-semibold">P2 Health</span>
                  <span className="font-mono-num text-slate-100">
                    {hud.player2.hp} / {hud.player2.maxHp}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-800">
                  <div
                    className="h-full bg-amber-500 transition-all duration-150"
                    style={{
                      width: `${Math.max(0, Math.min(100, (hud.player2.hp / hud.player2.maxHp) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div className="flex items-center gap-4 text-xs text-slate-300">
            <div>
              <div className="text-[11px] text-slate-400">Bones</div>
              <div className="font-mono-num text-sm font-semibold text-amber-400">
                {hud.boneFragments}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Score</div>
              <div className="font-mono-num text-sm font-semibold text-slate-100">
                {hud.score.toLocaleString()}
              </div>
            </div>
            {hud.comboCount > 1 && (
              <div>
                <div className="text-[11px] text-slate-400">Combo</div>
                <div className="font-mono-num text-sm font-semibold text-sky-400">
                  {hud.comboCount}x
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Stage Progress & Boss Bar */}
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-lg border border-white/10 bg-[#111520]/90 px-4 py-2 text-xs text-slate-200 backdrop-blur-sm">
            <span className="font-semibold text-slate-100">
              Stage {hud.stage}/{hud.maxStages}
            </span>
            <span className="mx-2 text-slate-500" aria-hidden="true">
              ·
            </span>
            <span className="font-mono-num text-slate-300">
              Wave {hud.wave}/{hud.maxWaves}
            </span>
            <span className="mx-2 text-slate-500" aria-hidden="true">
              ·
            </span>
            <span className="font-mono-num text-rose-400">
              {hud.enemiesRemaining} {hud.enemiesRemaining === 1 ? 'Foe' : 'Foes'}
            </span>
          </div>

          {hud.boss && (
            <div className="w-[280px] sm:w-[420px] rounded-lg border border-amber-500/30 bg-[#111520]/95 px-4 py-2 backdrop-blur-sm">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-display font-bold text-amber-300">
                  {hud.boss.name}
                </span>
                <span className="font-mono-num text-slate-200">
                  Phase {hud.boss.phase} · {hud.boss.hp}/{hud.boss.maxHp}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-sm bg-slate-800">
                <div
                  className="h-full bg-amber-500 transition-all duration-100"
                  style={{
                    width: `${Math.max(0, (hud.boss.hp / hud.boss.maxHp) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {hud.bannerText && (
            <div className="mt-2 rounded-md border border-white/10 bg-[#0B0D13]/90 px-5 py-2 text-center font-display text-base sm:text-lg font-bold tracking-wide text-amber-200 shadow-lg">
              {hud.bannerText}
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTouch}
            title="Toggle On-Screen Controls"
            className={`flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showTouchControls
                ? 'border-rose-500/50 bg-rose-950/60 text-rose-200'
                : 'border-white/10 bg-[#111520]/90 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            <span className="hidden sm:inline">Touch Pad</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#111520]/90 text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onPause}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-[#111520]/90 px-3.5 text-xs font-medium text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Pause className="h-3.5 w-3.5" />
            <span>Pause</span>
          </button>
        </div>
      </div>

      {/* Bottom Area: Touch Controls (optional) + Combat Dock */}
      <div className="flex flex-col gap-3">
        {showTouchControls && (
          <div className="pointer-events-auto flex items-end justify-between px-1 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onPointerDown={() => onTouchInput('left', true)}
                onPointerUp={() => onTouchInput('left', false)}
                onPointerLeave={() => onTouchInput('left', false)}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/15 bg-[#111520]/85 text-sm font-bold text-slate-100 active:bg-slate-700"
              >
                ←
              </button>
              <button
                type="button"
                onPointerDown={() => onTouchInput('down', true)}
                onPointerUp={() => onTouchInput('down', false)}
                onPointerLeave={() => onTouchInput('down', false)}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/15 bg-[#111520]/85 text-sm font-bold text-slate-100 active:bg-slate-700"
              >
                ↓
              </button>
              <button
                type="button"
                onPointerDown={() => onTouchInput('right', true)}
                onPointerUp={() => onTouchInput('right', false)}
                onPointerLeave={() => onTouchInput('right', false)}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/15 bg-[#111520]/85 text-sm font-bold text-slate-100 active:bg-slate-700"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onPointerDown={() => onTouchInput('skill1', true)}
                onPointerUp={() => onTouchInput('skill1', false)}
                className="flex h-12 px-3 items-center justify-center rounded-lg border border-white/15 bg-[#111520]/85 text-xs font-semibold text-sky-300 active:bg-slate-700"
              >
                Skill Q
              </button>
              <button
                type="button"
                onPointerDown={() => onTouchInput('skill2', true)}
                onPointerUp={() => onTouchInput('skill2', false)}
                className="flex h-12 px-3 items-center justify-center rounded-lg border border-white/15 bg-[#111520]/85 text-xs font-semibold text-amber-300 active:bg-slate-700"
              >
                Skill E
              </button>
              <button
                type="button"
                onPointerDown={() => onTouchInput('swap', true)}
                onPointerUp={() => onTouchInput('swap', false)}
                className="flex h-12 px-3 items-center justify-center rounded-lg border border-white/15 bg-[#111520]/85 text-xs font-semibold text-purple-300 active:bg-slate-700"
              >
                Swap R
              </button>
              <button
                type="button"
                onPointerDown={() => onTouchInput('dash', true)}
                onPointerUp={() => onTouchInput('dash', false)}
                className="flex h-12 px-3 items-center justify-center rounded-lg border border-white/15 bg-[#111520]/85 text-xs font-semibold text-slate-200 active:bg-slate-700"
              >
                Dash
              </button>
              <button
                type="button"
                onPointerDown={() => onTouchInput('jump', true)}
                onPointerUp={() => onTouchInput('jump', false)}
                className="flex h-12 px-3 items-center justify-center rounded-lg border border-white/15 bg-[#111520]/85 text-xs font-semibold text-slate-200 active:bg-slate-700"
              >
                Jump
              </button>
              <button
                type="button"
                onPointerDown={() => onTouchInput('attack', true)}
                onPointerUp={() => onTouchInput('attack', false)}
                onPointerLeave={() => onTouchInput('attack', false)}
                className="flex h-12 px-3 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-900/75 text-xs font-bold text-white active:bg-rose-700"
              >
                Attack
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3">
          {/* Skull & Skills Dock */}
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-white/10 bg-[#111520]/90 px-4 py-2.5 backdrop-blur-sm">
            {/* Active Skull */}
            <div className="flex items-center gap-3">
              <SkullPortrait skullId={activeEquipped.id} size={44} />
              <div>
                <div className="text-xs font-semibold text-slate-100">
                  {activeDef.tierNames[activeEquipped.tier - 1]}
                </div>
                <div className="text-[11px] text-slate-400">
                  {activeDef.archetype} · Tier {activeEquipped.tier}
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* Skill 1 & Skill 2 */}
            <div className="flex items-center gap-2">
              {(() => {
                const cd1 = activeEquipped.skill1Cd;
                const pct1 =
                  cd1 > 0
                    ? Math.max(0, Math.min(100, (1 - cd1 / activeDef.skill1.cooldown) * 100))
                    : 100;
                return (
                  <div className="relative flex h-10 min-w-[96px] flex-col justify-center overflow-hidden rounded-md border border-white/10 bg-slate-900/80 px-2.5 py-1">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-slate-200 truncate">
                        {activeDef.skill1.name}
                      </span>
                      <span className="font-mono-num text-amber-400">Q</span>
                    </div>
                    <div className="font-mono-num text-[11px] text-slate-400">
                      {cd1 > 0 ? `${cd1.toFixed(1)}s` : 'Ready'}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-800">
                      <div
                        className={`h-full transition-[width] duration-75 ${
                          cd1 > 0 ? 'bg-amber-400/90' : 'bg-sky-400'
                        }`}
                        style={{ width: `${pct1}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const cd2 = activeEquipped.skill2Cd;
                const pct2 =
                  cd2 > 0
                    ? Math.max(0, Math.min(100, (1 - cd2 / activeDef.skill2.cooldown) * 100))
                    : 100;
                return (
                  <div className="relative flex h-10 min-w-[96px] flex-col justify-center overflow-hidden rounded-md border border-white/10 bg-slate-900/80 px-2.5 py-1">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-slate-200 truncate">
                        {activeDef.skill2.name}
                      </span>
                      <span className="font-mono-num text-amber-400">E</span>
                    </div>
                    <div className="font-mono-num text-[11px] text-slate-400">
                      {cd2 > 0 ? `${cd2.toFixed(1)}s` : 'Ready'}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-800">
                      <div
                        className={`h-full transition-[width] duration-75 ${
                          cd2 > 0 ? 'bg-amber-400/90' : 'bg-sky-400'
                        }`}
                        style={{ width: `${pct2}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Reserve Skull & Swap Cooldown */}
            {reserveDef && reserveEquipped && (
              <>
                <div className="h-8 w-px bg-white/10" />
                <div className="relative flex items-center gap-2.5 overflow-hidden rounded-md border border-white/10 bg-slate-900/60 px-2.5 py-1.5">
                  <SkullPortrait skullId={reserveEquipped.id} size={30} />
                  <Repeat className="h-3.5 w-3.5 text-slate-400" />
                  <div>
                    <div className="text-[11px] font-medium text-slate-200">
                      {reserveDef.tierNames[reserveEquipped.tier - 1]}
                    </div>
                    <div className="font-mono-num text-[11px] text-slate-400">
                      {hud.swapCd > 0 ? `Swap ${hud.swapCd.toFixed(1)}s` : 'Press R to Swap'}
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-800">
                    <div
                      className={`h-full transition-[width] duration-75 ${
                        hud.swapCd > 0 ? 'bg-amber-400/90' : 'bg-purple-400'
                      }`}
                      style={{
                        width: `${
                          hud.swapCd > 0 && hud.swapMaxCd > 0
                            ? Math.max(
                                0,
                                Math.min(100, (1 - hud.swapCd / hud.swapMaxCd) * 100)
                              )
                            : 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="h-8 w-px bg-white/10" />

            {/* Dash Ability Icon + Radial Cooldown Progress */}
            <div className="flex items-center gap-2.5">
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-slate-900/80"
                title={
                  hud.dashCharges < hud.maxDashCharges
                    ? `Dash recharging: ${hud.dashCooldownRemaining.toFixed(1)}s`
                    : 'Dash ready (Shift)'
                }
              >
                <svg
                  viewBox="0 0 36 36"
                  className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
                  aria-hidden="true"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="rgba(51, 65, 85, 0.7)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={hud.dashCharges > 0 ? '#38BDF8' : '#F59E0B'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 14}
                    strokeDashoffset={
                      2 *
                      Math.PI *
                      14 *
                      (1 -
                        (hud.dashCharges < hud.maxDashCharges
                          ? hud.dashRechargeProgress
                          : 1))
                    }
                  />
                </svg>
                <Wind
                  className={`relative h-4 w-4 ${
                    hud.dashCharges > 0 ? 'text-sky-300' : 'text-slate-400'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-semibold text-slate-200">Dash</span>
                  <span className="font-mono-num text-amber-400">Shift</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: hud.maxDashCharges }).map((_, i) => {
                      const fillPct =
                        i < hud.dashCharges
                          ? 100
                          : i === hud.dashCharges
                          ? Math.round(hud.dashRechargeProgress * 100)
                          : 0;
                      return (
                        <span
                          key={i}
                          className="relative h-2 w-4 overflow-hidden rounded-xs bg-slate-700"
                        >
                          <span
                            className={`block h-full ${
                              i < hud.dashCharges ? 'bg-sky-400' : 'bg-amber-400/90'
                            }`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </span>
                      );
                    })}
                  </div>
                  <span className="font-mono-num text-[11px] text-slate-400">
                    {hud.dashCharges < hud.maxDashCharges
                      ? `${hud.dashCooldownRemaining.toFixed(1)}s`
                      : 'Ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Relics & Inscriptions Summary */}
          <div className="pointer-events-auto hidden md:flex items-center gap-3 rounded-lg border border-white/10 bg-[#111520]/90 px-4 py-2.5 text-xs text-slate-300 backdrop-blur-sm">
            {hud.relics.length === 0 ? (
              <span className="text-slate-400">
                No relics equipped · Defeat stage waves to draft synergies
              </span>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  Relics ({hud.relics.length}):
                </span>
                <div className="flex items-center gap-2">
                  {activeInscriptions.map((insId, idx) => {
                    const def = INSCRIPTION_DEFS[insId];
                    const count = insCounts[insId];
                    return (
                      <span key={insId} className="flex items-center gap-1">
                        {idx > 0 && (
                          <span className="text-slate-600" aria-hidden="true">
                            ·
                          </span>
                        )}
                        <span
                          className="font-medium"
                          style={{ color: count >= 2 ? def.color : '#94A3B8' }}
                          title={`${def.name}: 2pc (${def.bonus2}) | 4pc (${def.bonus4})`}
                        >
                          {def.name} {count}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
