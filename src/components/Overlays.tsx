import { useState } from 'react';
import { STAGE_THEME_OPTIONS } from '../game/backgrounds';
import {
  ALL_SKULL_IDS,
  INSCRIPTION_DEFS,
  RELIC_DEFS,
  SKULL_DEFS,
} from '../game/data';
import { RunRecords } from '../game/records';
import {
  EquippedSkull,
  GameScreenState,
  HudSnapshot,
  RewardOption,
  SkullId,
  StageThemeId,
} from '../game/types';
import { SkullPortrait } from './SkullPortrait';

const TITLE_ART_PATH = '/Asses/ui/screens/title_backdrop.jpg';

interface OverlaysProps {
  screen: GameScreenState;
  hud: HudSnapshot | null;
  records: RunRecords;
  rewards: RewardOption[];
  starter1: SkullId;
  starter2: SkullId;
  isCoop: boolean;
  onToggleCoop: (val: boolean) => void;
  p2Starter1: SkullId;
  p2Starter2: SkullId;
  onSelectP2Starter1: (id: SkullId) => void;
  onSelectP2Starter2: (id: SkullId) => void;
  stageTheme: StageThemeId;
  onSelectStarter1: (id: SkullId) => void;
  onSelectStarter2: (id: SkullId) => void;
  onSelectStageTheme: (id: StageThemeId) => void;
  onStartGame: () => void;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onPickReward: (option: RewardOption, replaceSlot?: 0 | 1) => void;
  onAwakenSkull: (slot: 0 | 1) => void;
}

export function Overlays({
  screen,
  hud,
  records,
  rewards,
  starter1,
  starter2,
  isCoop,
  onToggleCoop,
  p2Starter1,
  p2Starter2,
  onSelectP2Starter1,
  onSelectP2Starter2,
  stageTheme,
  onSelectStarter1,
  onSelectStarter2,
  onSelectStageTheme,
  onStartGame,
  onResume,
  onRestart,
  onReturnTitle,
  onPickReward,
  onAwakenSkull,
}: OverlaysProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [activePlayerTab, setActivePlayerTab] = useState<1 | 2>(1);

  const currentS1 = activePlayerTab === 1 ? starter1 : p2Starter1;
  const currentS2 = activePlayerTab === 1 ? starter2 : p2Starter2;
  const handleSelectS1 = activePlayerTab === 1 ? onSelectStarter1 : onSelectP2Starter1;
  const handleSelectS2 = activePlayerTab === 1 ? onSelectStarter2 : onSelectP2Starter2;

  if (screen === 'PLAYING') return null;

  if (screen === 'TITLE_MENU') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#0B0D13] overflow-y-auto p-6">
        {/* Background Key Art with Contrast Scrim */}
        {!imgFailed ? (
          <img
            src={TITLE_ART_PATH}
            alt="Moonlit gothic castle battlements with skeleton knight"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-55"
          />
        ) : (
          <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#0B0D13] via-[#171C2B] to-[#1D1219]" />
        )}
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-r from-[#0B0D13]/95 via-[#0B0D13]/85 to-[#0B0D13]/65" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
          {/* Left Hero Column */}
          <div className="flex flex-col justify-between lg:col-span-6 py-2">
            <div>
              <div className="text-xs font-medium tracking-wide text-amber-400">
                2D Skull-Swapping Beat-Em-Up · 5 Stages
              </div>
              <h1 className="mt-3 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-50 [text-wrap:balance]">
                Marrowblade
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
                Battle through the Imperial Vanguard across five moonlit citadel
                stages. Carry two distinct skulls, swap mid-combo for instant
                switch-in strikes, and awaken your relics before facing Sir
                Gawain.
              </p>

              {/* Local Co-op Toggle */}
              <div className="mt-5 flex items-center justify-between rounded-lg border border-white/10 bg-[#151A28] px-4 py-3">
                <div>
                  <div className="text-xs font-semibold text-slate-100">Local 2-Player Co-op Mode</div>
                  <div className="text-[11px] text-slate-400">Play together on the same keyboard</div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleCoop(!isCoop)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    isCoop ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 border border-white/10'
                  }`}
                >
                  {isCoop ? 'Enabled (2P)' : 'Disabled (1P)'}
                </button>
              </div>

              {/* Controls Summary */}
              <div className="mt-5 border-t border-white/10 pt-4">
                <h2 className="text-sm font-semibold text-slate-200">
                  Combat Controls {isCoop && '(P1 / P2)'}
                </h2>
                <div className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>P1 Move / Drop</span>
                    <span className="font-mono-num text-slate-100">A D / S</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>P1 Jump / Atk</span>
                    <span className="font-mono-num text-slate-100">W / J</span>
                  </div>
                  {isCoop && (
                    <>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>P2 Move / Drop</span>
                        <span className="font-mono-num text-slate-100">Arrows / ↓</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>P2 Jump / Atk</span>
                        <span className="font-mono-num text-slate-100">↑ / N</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {records.totalRuns > 0 && (
                <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg border border-white/10 bg-[#121622]/75 px-4 py-2.5 text-xs">
                  <div>
                    <div className="text-slate-400">Best Score</div>
                    <div className="font-mono-num mt-0.5 font-semibold text-amber-400">
                      {records.bestScore.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Deepest Stage</div>
                    <div className="font-mono-num mt-0.5 font-semibold text-slate-100">
                      {records.bestStage}/5
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Victories</div>
                    <div className="font-mono-num mt-0.5 font-semibold text-emerald-400">
                      {records.totalVictories} / {records.totalRuns}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={onStartGame}
                className="rounded-lg bg-rose-600 px-7 py-3.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Start Run
              </button>
              <span className="text-xs text-slate-400">
                P1: {SKULL_DEFS[starter1].name} + {SKULL_DEFS[starter2].name}
                {isCoop && ` | P2: ${SKULL_DEFS[p2Starter1].name} + ${SKULL_DEFS[p2Starter2].name}`}
              </span>
            </div>
          </div>

          {/* Right Loadout Selection */}
          <div className="lg:col-span-6 rounded-xl border border-white/10 bg-[#121622]/90 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-display text-lg font-bold text-slate-100">
                {isCoop ? `Choose Skulls (${activePlayerTab === 1 ? 'Player 1' : 'Player 2'})` : 'Choose Starting Skull Pair'}
              </h2>
              {isCoop ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActivePlayerTab(1)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                      activePlayerTab === 1 ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Player 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePlayerTab(2)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                      activePlayerTab === 2 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Player 2
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  Primary · Reserve
                </span>
              )}
            </div>

            <div className="mt-4 max-h-[340px] space-y-2 overflow-y-auto pr-1">
              {ALL_SKULL_IDS.map((id) => {
                const def = SKULL_DEFS[id];
                const isSlot1 = currentS1 === id;
                const isSlot2 = currentS2 === id;
                return (
                  <div
                    key={id}
                    className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-2.5 transition-colors ${
                      isSlot1 || isSlot2
                        ? 'border-amber-500/40 bg-[#1A2032]'
                        : 'border-white/10 bg-[#151A28]/70'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <SkullPortrait skullId={id} size={42} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                          <span>{def.name}</span>
                          <span className="text-xs font-normal text-slate-400">
                            · {def.archetype}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400 truncate">
                          {def.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectS1(id)}
                        disabled={isSlot2}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                          isSlot1
                            ? 'bg-rose-600 text-white'
                            : 'border border-white/10 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Primary
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectS2(id)}
                        disabled={isSlot1}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                          isSlot2
                            ? 'bg-amber-600 text-white'
                            : 'border border-white/10 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floor / Stage Design Selector */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-200">
                  Arena Floor Design
                </h3>
                <span className="text-[11px] text-slate-400">
                  6 Custom Backdrops
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STAGE_THEME_OPTIONS.map((opt) => {
                  const active = stageTheme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectStageTheme(opt.id)}
                      className={`group flex flex-col overflow-hidden rounded-md border text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-amber-400 bg-slate-800/90'
                          : 'border-white/10 bg-[#151A28]/80 hover:border-white/25'
                      }`}
                    >
                      <div className="h-9 w-full overflow-hidden bg-slate-900">
                        {opt.file ? (
                          <img
                            src={opt.file}
                            alt={opt.label}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover opacity-85 group-hover:opacity-100"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-slate-800 via-indigo-950 to-slate-900 text-[10px] font-medium text-amber-300">
                            Auto Cycle
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-[11px] font-medium truncate w-full ${
                          active ? 'text-amber-300' : 'text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'REWARD_PICK' && hud) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#0B0D13]/85 p-6 backdrop-blur-sm overflow-y-auto">
        <div className="w-full max-w-5xl rounded-xl border border-white/10 bg-[#121622] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="text-xs font-medium text-amber-400">
                Stage {hud.stage} Cleared · Bone Altar
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-slate-50">
                Awaken Skulls &amp; Choose a Spoil
              </h2>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Available Bone Fragments</div>
              <div className="font-mono-num text-xl font-bold text-amber-400">
                {hud.boneFragments}
              </div>
            </div>
          </div>

          {/* Skull Awakening Row */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {([0, 1] as const).map((slot) => {
              const eq: EquippedSkull | null = hud.skulls[slot];
              if (!eq) return null;
              const def = SKULL_DEFS[eq.id];
              const cost = eq.tier === 1 ? 20 : eq.tier === 2 ? 35 : null;
              const canAfford = cost !== null && hud.boneFragments >= cost;
              return (
                <div
                  key={slot}
                  className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#171C2B] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <SkullPortrait skullId={eq.id} size={40} />
                    <div>
                      <div className="text-xs text-slate-400">
                        Slot {slot + 1} · {def.archetype} · Tier {eq.tier}/3
                      </div>
                      <div className="text-sm font-semibold text-slate-100">
                        {def.tierNames[eq.tier - 1]}
                      </div>
                    </div>
                  </div>
                  {cost !== null ? (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onAwakenSkull(slot)}
                      className="rounded-md bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Awaken ({cost} Bones)
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-amber-400">
                      Max Tier
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 3 Reward Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {rewards.map((opt, idx) => {
              if (opt.kind === 'skull') {
                const def = SKULL_DEFS[opt.skullId];
                return (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-lg border border-white/10 bg-[#171C2B] p-5"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <SkullPortrait skullId={opt.skullId} size={44} />
                        <div>
                          <div className="text-xs font-medium text-sky-400">
                            Skull Drop · {def.archetype} · Tier {opt.tier}
                          </div>
                          <h3 className="mt-0.5 font-display text-lg font-bold text-slate-100">
                            {def.tierNames[opt.tier - 1]}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                        {def.summary}
                      </p>
                      <div className="mt-3 space-y-1 text-xs text-slate-400 border-t border-white/10 pt-3">
                        <div>
                          <span className="text-slate-200 font-medium">Switch-In:</span>{' '}
                          {def.switchName}
                        </div>
                        <div>
                          <span className="text-slate-200 font-medium">Skills:</span>{' '}
                          {def.skill1.name} · {def.skill2.name}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPickReward(opt, 0)}
                        className="flex-1 rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Replace Slot 1
                      </button>
                      <button
                        type="button"
                        onClick={() => onPickReward(opt, 1)}
                        className="flex-1 rounded-md border border-white/15 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Replace Slot 2
                      </button>
                    </div>
                  </div>
                );
              }

              if (opt.kind === 'relic') {
                const def = RELIC_DEFS[opt.relicId];
                return (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-lg border border-white/10 bg-[#171C2B] p-5"
                  >
                    <div>
                      <div className="text-xs font-medium text-purple-400">
                        Relic ·{' '}
                        {def.inscriptions
                          .filter(Boolean)
                          .map((i) => INSCRIPTION_DEFS[i!].name)
                          .join(' / ')}
                      </div>
                      <h3 className="mt-1.5 font-display text-lg font-bold text-slate-100">
                        {def.name}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                        {def.description}
                      </p>
                      <div className="mt-3 space-y-1 text-xs text-slate-400 border-t border-white/10 pt-3">
                        {def.inscriptions.filter(Boolean).map((insId) => {
                          const ins = INSCRIPTION_DEFS[insId!];
                          return (
                            <div key={ins.id}>
                              <span
                                className="font-medium"
                                style={{ color: ins.color }}
                              >
                                {ins.name}:
                              </span>{' '}
                              2pc {ins.bonus2}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPickReward(opt)}
                      className="mt-5 w-full rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Equip Relic
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-lg border border-white/10 bg-[#171C2B] p-5"
                >
                  <div>
                    <div className="text-xs font-medium text-emerald-400">
                      Sanctuary · Recovery
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-bold text-slate-100">
                      {opt.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {opt.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onPickReward(opt)}
                    className="mt-5 w-full rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Rest &amp; Continue
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'PAUSED') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#0B0D13]/80 p-6 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#121622] p-6 text-center shadow-2xl">
          <h2 className="font-display text-2xl font-bold text-slate-100">
            Run Paused
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            Press Esc or Resume to return to combat.
          </p>

          <div className="mt-5 border-t border-white/10 pt-4 text-left">
            <div className="text-xs font-medium text-slate-300">
              Arena Floor Theme
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STAGE_THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectStageTheme(opt.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    stageTheme === opt.id
                      ? 'bg-amber-600 text-white'
                      : 'border border-white/10 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors cursor-pointer"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Restart Run
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Title Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VICTORY or GAME_OVER
  const isVictory = screen === 'VICTORY';
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#0B0D13]/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#121622] p-7 text-center shadow-2xl">
        <div
          className={`text-xs font-semibold ${
            isVictory ? 'text-amber-400' : 'text-rose-400'
          }`}
        >
          {isVictory ? 'Citadel Conquered' : 'Defeated in the Vanguard'}
        </div>
        <h2 className="mt-1.5 font-display text-3xl font-bold text-slate-50">
          {isVictory ? 'Victory' : 'Fallen Knight'}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          {isVictory
            ? 'Sir Gawain has fallen and the Demon Citadel stands reclaimed.'
            : 'Your bones scattered on the ramparts—rise again with a new skull pair.'}
        </p>

        {hud && (
          <div className="mt-6 grid grid-cols-3 gap-3 border-y border-white/10 py-4 text-center">
            <div>
              <div className="text-xs text-slate-400">Stage</div>
              <div className="font-mono-num mt-0.5 text-lg font-bold text-slate-100">
                {hud.stage}/{hud.maxStages}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Defeated</div>
              <div className="font-mono-num mt-0.5 text-lg font-bold text-slate-100">
                {hud.kills}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Score</div>
              <div className="font-mono-num mt-0.5 text-lg font-bold text-amber-400">
                {hud.score.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span>
            Best Score:{' '}
            <strong className="font-mono-num text-slate-200">
              {records.bestScore.toLocaleString()}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Victories:{' '}
            <strong className="font-mono-num text-emerald-400">
              {records.totalVictories}
            </strong>
          </span>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="flex-1 rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Change Skulls
          </button>
        </div>
      </div>
    </div>
  );
}
