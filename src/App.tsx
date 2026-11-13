/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { Overlays } from './components/Overlays';
import { soundFX } from './game/audio';
import { stageBackgrounds } from './game/backgrounds';
import { ARENA_HEIGHT, ARENA_WIDTH } from './game/data';
import { GameEngine } from './game/engine';
import { loadRunRecords, RunRecords, saveRunResult } from './game/records';
import { renderGameScene } from './game/renderer';
import { heroSprites } from './game/sprites';
import { vfxAtlas } from './game/vfx';
import {
  GameScreenState,
  HudSnapshot,
  InputSnapshot,
  RewardOption,
  SkullId,
  StageThemeId,
} from './game/types';

heroSprites.preload();
stageBackgrounds.preload();
vfxAtlas.preload();

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [screen, setScreen] = useState<GameScreenState>('TITLE_MENU');
  const screenRef = useRef<GameScreenState>('TITLE_MENU');
  const [starter1, setStarter1] = useState<SkullId>('little_bone');
  const [starter2, setStarter2] = useState<SkullId>('ninja');
  const [isCoop, setIsCoop] = useState(false);
  const [p2Starter1, setP2Starter1] = useState<SkullId>('berserker');
  const [p2Starter2, setP2Starter2] = useState<SkullId>('lich');
  const [stageTheme, setStageTheme] = useState<StageThemeId>('auto');
  const stageThemeRef = useRef<StageThemeId>('auto');
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [records, setRecords] = useState<RunRecords>(() => loadRunRecords());
  const [rewards, setRewards] = useState<RewardOption[]>([]);
  const [muted, setMuted] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);

  const keysHeldRef = useRef<Set<string>>(new Set());
  const touchHeldRef = useRef<{
    left: boolean;
    right: boolean;
    down: boolean;
    attack: boolean;
  }>({ left: false, right: false, down: false, attack: false });

  const edgeQueueRef = useRef({
    jump: false,
    dash: false,
    attack: false,
    skill1: false,
    skill2: false,
    swap: false,
  });

  const edgeQueueP2 = useRef({
    jump: false,
    dash: false,
    attack: false,
    skill1: false,
    skill2: false,
    swap: false,
  });

  const updateScreen = useCallback((next: GameScreenState) => {
    screenRef.current = next;
    setScreen(next);
  }, []);

  const createNewRun = useCallback(
    (s1: SkullId, s2: SkullId) => {
      const engine = new GameEngine(s1, s2, isCoop, p2Starter1, p2Starter2);
      engine.onStageCleared = (opts) => {
        setRewards(opts);
        setHud(engine.getHudSnapshot());
        updateScreen('REWARD_PICK');
      };
      engine.onVictory = () => {
        const snap = engine.getHudSnapshot();
        setHud(snap);
        setRecords(saveRunResult(snap.score, snap.stage, true));
        updateScreen('VICTORY');
      };
      engine.onGameOver = () => {
        const snap = engine.getHudSnapshot();
        setHud(snap);
        setRecords(saveRunResult(snap.score, snap.stage, false));
        updateScreen('GAME_OVER');
      };

      engineRef.current = engine;
      setRewards([]);
      setHud(engine.getHudSnapshot());
      updateScreen('PLAYING');
    },
    [updateScreen]
  );

  // Detect touch device automatically on first touch
  useEffect(() => {
    const onFirstTouch = () => {
      setShowTouchControls(true);
      window.removeEventListener('touchstart', onFirstTouch);
    };
    window.addEventListener('touchstart', onFirstTouch, { passive: true });
    return () => window.removeEventListener('touchstart', onFirstTouch);
  }, []);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (screenRef.current === 'PLAYING') {
          updateScreen('PAUSED');
          return;
        }
        if (screenRef.current === 'PAUSED') {
          updateScreen('PLAYING');
          return;
        }
      }

      if (screenRef.current !== 'PLAYING') return;

      const wasHeld = keysHeldRef.current.has(e.code);
      keysHeldRef.current.add(e.code);

      if (!wasHeld) {
        if (e.code === 'Space' || e.code === 'KeyW' || (!isCoop && e.code === 'ArrowUp')) {
          edgeQueueRef.current.jump = true;
        } else if (e.code === 'ShiftLeft' || e.code === 'KeyK') {
          edgeQueueRef.current.dash = true;
        } else if (e.code === 'KeyJ' || e.code === 'KeyZ') {
          edgeQueueRef.current.attack = true;
        } else if (e.code === 'KeyQ' || e.code === 'KeyU') {
          edgeQueueRef.current.skill1 = true;
        } else if (e.code === 'KeyE' || e.code === 'KeyI') {
          edgeQueueRef.current.skill2 = true;
        } else if (e.code === 'KeyR' || e.code === 'KeyC') {
          edgeQueueRef.current.swap = true;
        }

        if (isCoop) {
          if (e.code === 'ArrowUp') {
            edgeQueueP2.current.jump = true;
          } else if (e.code === 'ShiftRight' || e.code === 'KeyM') {
            edgeQueueP2.current.dash = true;
          } else if (e.code === 'KeyN' || e.code === 'Enter') {
            edgeQueueP2.current.attack = true;
          } else if (e.code === 'KeyY') {
            edgeQueueP2.current.skill1 = true;
          } else if (e.code === 'KeyH') {
            edgeQueueP2.current.skill2 = true;
          } else if (e.code === 'KeyB') {
            edgeQueueP2.current.swap = true;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
    };

    const handleBlur = () => {
      keysHeldRef.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [updateScreen]);

  // Main 60fps Game Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let hudSyncAcc = 0;

    const frame = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const engine = engineRef.current;
      const canvas = canvasRef.current;

      if (engine && canvas) {
        if (screenRef.current === 'PLAYING') {
          const held = keysHeldRef.current;
          const touch = touchHeldRef.current;
          const edge = edgeQueueRef.current;

          const input1: InputSnapshot = {
            left: held.has('KeyA') || (!isCoop && held.has('ArrowLeft')) || touch.left,
            right: held.has('KeyD') || (!isCoop && held.has('ArrowRight')) || touch.right,
            up: held.has('KeyW') || (!isCoop && held.has('ArrowUp')),
            down: held.has('KeyS') || (!isCoop && held.has('ArrowDown')) || touch.down,
            jumpPressed: edge.jump,
            dashPressed: edge.dash,
            attackPressed: edge.attack,
            attackHeld: held.has('KeyJ') || held.has('KeyZ') || touch.attack,
            skill1Pressed: edge.skill1,
            skill2Pressed: edge.skill2,
            swapPressed: edge.swap,
          };

          const input2: InputSnapshot | null = isCoop
            ? {
                left: held.has('ArrowLeft'),
                right: held.has('ArrowRight'),
                up: held.has('ArrowUp'),
                down: held.has('ArrowDown'),
                jumpPressed: edgeQueueP2.current.jump,
                dashPressed: edgeQueueP2.current.dash,
                attackPressed: edgeQueueP2.current.attack,
                attackHeld: held.has('KeyN') || held.has('Enter'),
                skill1Pressed: edgeQueueP2.current.skill1,
                skill2Pressed: edgeQueueP2.current.skill2,
                swapPressed: edgeQueueP2.current.swap,
              }
            : null;

          edge.jump = false;
          edge.dash = false;
          edge.attack = false;
          edge.skill1 = false;
          edge.skill2 = false;
          edge.swap = false;

          edgeQueueP2.current.jump = false;
          edgeQueueP2.current.dash = false;
          edgeQueueP2.current.attack = false;
          edgeQueueP2.current.skill1 = false;
          edgeQueueP2.current.skill2 = false;
          edgeQueueP2.current.swap = false;

          engine.update(dt, input1, input2);

          hudSyncAcc += dt;
          if (hudSyncAcc >= 0.06) {
            hudSyncAcc = 0;
            setHud(engine.getHudSnapshot());
          }
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderGameScene(ctx, engine.getRenderScene(), stageThemeRef.current);
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screenRef.current !== 'PLAYING') return;
    if (e.button === 0) {
      edgeQueueRef.current.attack = true;
    } else if (e.button === 2) {
      edgeQueueRef.current.dash = true;
    }
  };

  const handleToggleMute = () => {
    const next = !muted;
    soundFX.muted = next;
    setMuted(next);
  };

  const handleTouchInput = (action: string, pressed: boolean) => {
    if (action === 'left') touchHeldRef.current.left = pressed;
    else if (action === 'right') touchHeldRef.current.right = pressed;
    else if (action === 'down') touchHeldRef.current.down = pressed;
    else if (action === 'attack') {
      touchHeldRef.current.attack = pressed;
      if (pressed) edgeQueueRef.current.attack = true;
    } else if (pressed) {
      if (action === 'jump') edgeQueueRef.current.jump = true;
      else if (action === 'dash') edgeQueueRef.current.dash = true;
      else if (action === 'skill1') edgeQueueRef.current.skill1 = true;
      else if (action === 'skill2') edgeQueueRef.current.skill2 = true;
      else if (action === 'swap') edgeQueueRef.current.swap = true;
    }
  };

  const handlePickReward = (option: RewardOption, replaceSlot?: 0 | 1) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.applyReward(option, replaceSlot);
    setHud(engine.getHudSnapshot());
    updateScreen('PLAYING');
  };

  const handleAwakenSkull = (slot: 0 | 1) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.awakenSkull(slot)) {
      setHud(engine.getHudSnapshot());
    }
  };

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0B0D13]">
      <canvas
        ref={canvasRef}
        width={ARENA_WIDTH}
        height={ARENA_HEIGHT}
        onPointerDown={handleCanvasPointerDown}
        onContextMenu={(e) => e.preventDefault()}
        className="h-full w-full object-contain select-none"
      />

      {hud && screen !== 'TITLE_MENU' && (
        <GameHUD
          hud={hud}
          muted={muted}
          showTouchControls={showTouchControls}
          onToggleMute={handleToggleMute}
          onPause={() =>
            updateScreen(screen === 'PAUSED' ? 'PLAYING' : 'PAUSED')
          }
          onToggleTouch={() => setShowTouchControls((v) => !v)}
          onTouchInput={handleTouchInput}
        />
      )}

      <Overlays
        screen={screen}
        hud={hud}
        records={records}
        rewards={rewards}
        starter1={starter1}
        starter2={starter2}
        isCoop={isCoop}
        onToggleCoop={setIsCoop}
        p2Starter1={p2Starter1}
        p2Starter2={p2Starter2}
        onSelectP2Starter1={setP2Starter1}
        onSelectP2Starter2={setP2Starter2}
        stageTheme={stageTheme}
        onSelectStarter1={setStarter1}
        onSelectStarter2={setStarter2}
        onSelectStageTheme={(theme) => {
          stageThemeRef.current = theme;
          setStageTheme(theme);
        }}
        onStartGame={() => createNewRun(starter1, starter2)}
        onResume={() => updateScreen('PLAYING')}
        onRestart={() => createNewRun(starter1, starter2)}
        onReturnTitle={() => updateScreen('TITLE_MENU')}
        onPickReward={handlePickReward}
        onAwakenSkull={handleAwakenSkull}
      />
    </main>
  );
}
