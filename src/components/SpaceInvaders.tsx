/**
 * @fileoverview Space Invaders battle mode — Canvas 2D + requestAnimationFrame.
 *
 * Uses HTML Canvas for rendering and mutable refs for game state so the
 * React tree is never re-rendered during gameplay. The only React state
 * is `uiPhase` which drives the overlay UI (start / wave-clear / game-over).
 *
 * @module SpaceInvaders
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGame } from '../context/useGame';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';
import {
  GRID_COLS,
  GRID_ROWS,
  ALIEN_DESCENT_TICKS,
  ALIEN_FIRE_CHANCE,
  BASE_LIVES,
  WAVE_CLEAR_BONUS,
  PLANET_ENEMIES,
  getWaveConfig,
  getEquipmentBonuses,
  calculateRewards,
  type EnemyType,
} from '../data/battleData';

// ---------------------------------------------------------------------------
// Canvas constants
// ---------------------------------------------------------------------------

const CANVAS_W = 360;
const CANVAS_H = 480;
const CELL_W = CANVAS_W / GRID_COLS;
const CELL_H = CANVAS_H / GRID_ROWS;

/** Game‑logic tick interval (ms). Rendering runs at screen refresh rate. */
const BASE_TICK_MS = 80;

// ---------------------------------------------------------------------------
// Internal mutable types
// ---------------------------------------------------------------------------

interface Alien {
  col: number;
  row: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
}

interface Bullet {
  col: number;
  /** Pixel‑level Y for smooth movement. */
  y: number;
  piercing: boolean;
  damage: number;
  dy: number; // pixels per frame (negative = up)
}

interface GameState {
  phase: 'idle' | 'playing' | 'wave-clear' | 'game-over';
  wave: number;
  score: number;
  lives: number;
  shipCol: number;
  aliens: Alien[];
  playerBullets: Bullet[];
  alienBullets: Bullet[];
  tickCount: number;
  alienDir: 1 | -1;
  highScore: number;
  // bonuses snapshot
  maxBullets: number;
  piercing: boolean;
  dmgMul: number;
  shipSpeed: number;
  teleportCD: number;
  teleportTimer: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpaceInvaders() {
  const { t } = useTranslation();
  const { currentPlanet, equipment, addBattleRewards } = useGame();
  const haptics = useHaptics();
  const sound = useSound();

  const bonuses = getEquipmentBonuses(equipment);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable game state — never triggers React re‑renders
  const gs = useRef<GameState>({
    phase: 'idle', wave: 0, score: 0, lives: BASE_LIVES,
    shipCol: Math.floor(GRID_COLS / 2),
    aliens: [], playerBullets: [], alienBullets: [],
    tickCount: 0, alienDir: 1, highScore: 0,
    maxBullets: 1 + bonuses.extraBullets,
    piercing: bonuses.piercing,
    dmgMul: bonuses.damageMultiplier,
    shipSpeed: bonuses.shipSpeed,
    teleportCD: bonuses.teleportCooldown,
    teleportTimer: 0,
  });

  // Input state — accumulated between frames
  const keysDown = useRef<Set<string>>(new Set());

  // Animation handles
  const rafId = useRef(0);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // React state — only for overlay UI
  const [uiPhase, setUiPhase] = useState<'idle' | 'playing' | 'wave-clear' | 'game-over'>('idle');
  const [uiScore, setUiScore] = useState(0);
  const [uiWave, setUiWave] = useState(0);
  const [, setUiLives] = useState(BASE_LIVES);
  const [uiHighScore, setUiHighScore] = useState(0);

  // ---------------------------------------------------------------------------
  // Spawn helpers
  // ---------------------------------------------------------------------------
  const spawnWave = useCallback((wave: number): Alien[] => {
    const cfg = getWaveConfig(wave);
    const types = PLANET_ENEMIES[currentPlanet.id] ?? PLANET_ENEMIES['terra-nova'];
    const aliens: Alien[] = [];
    const startCol = Math.floor((GRID_COLS - cfg.cols) / 2);
    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        const tp = types[r % types.length];
        aliens.push({ col: startCol + c, row: r + 1, type: tp, hp: tp.hp, maxHp: tp.hp });
      }
    }
    return aliens;
  }, [currentPlanet.id]);

  // ---------------------------------------------------------------------------
  // Render frame (Canvas 2D)
  // ---------------------------------------------------------------------------
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = gs.current;

    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
    ctx.lineWidth = 0.5;
    for (let c = 1; c < GRID_COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_W, 0);
      ctx.lineTo(c * CELL_W, CANVAS_H);
      ctx.stroke();
    }

    // Aliens
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const a of s.aliens) {
      const x = a.col * CELL_W + CELL_W / 2;
      const y = a.row * CELL_H + CELL_H / 2;
      const fontSize = a.hp < a.maxHp ? 18 : 22;
      ctx.globalAlpha = a.hp < a.maxHp ? 0.6 : 1;
      ctx.font = `${fontSize}px serif`;
      ctx.fillText(a.type.emoji, x, y);
    }
    ctx.globalAlpha = 1;

    // Player bullets
    for (const b of s.playerBullets) {
      const x = b.col * CELL_W + CELL_W / 2;
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 8;
      ctx.fillRect(x - 2, b.y, 4, 12);
    }
    ctx.shadowBlur = 0;

    // Alien bullets
    for (const b of s.alienBullets) {
      const x = b.col * CELL_W + CELL_W / 2;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Ship
    const shipX = s.shipCol * CELL_W + CELL_W / 2;
    const shipY = (GRID_ROWS - 1) * CELL_H + CELL_H / 2;
    ctx.font = '26px serif';
    ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText('🚀', shipX, shipY);
    ctx.shadowBlur = 0;

    // HUD bar at top
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS_W, 22);
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${s.score}`, 6, 15);
    ctx.fillStyle = '#818cf8';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${s.wave}`, CANVAS_W / 2, 15);
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'right';
    ctx.fillText('❤️'.repeat(Math.max(0, s.lives)), CANVAS_W - 6, 15);

    ctx.textAlign = 'center';
  }, []);

  // ---------------------------------------------------------------------------
  // Render loop (requestAnimationFrame)
  // ---------------------------------------------------------------------------
  const renderLoop = useCallback(() => {
    const s = gs.current;
    if (s.phase !== 'playing') return;

    // Move bullets smoothly every frame
    for (const b of s.playerBullets) b.y += b.dy;
    for (const b of s.alienBullets) b.y += b.dy;

    // Remove off‑screen
    s.playerBullets = s.playerBullets.filter(b => b.y > -10);
    s.alienBullets = s.alienBullets.filter(b => b.y < CANVAS_H + 10);

    // Process keyboard input
    if (keysDown.current.has('ArrowLeft') || keysDown.current.has('a')) {
      s.shipCol = Math.max(0, s.shipCol - s.shipSpeed);
    }
    if (keysDown.current.has('ArrowRight') || keysDown.current.has('d')) {
      s.shipCol = Math.min(GRID_COLS - 1, s.shipCol + s.shipSpeed);
    }

    drawFrame();
    rafId.current = requestAnimationFrame(renderLoop);
  }, [drawFrame]);

  // ---------------------------------------------------------------------------
  // Game‑logic tick (fixed interval, decoupled from rendering)
  // ---------------------------------------------------------------------------
  const gameTick = useCallback(() => {
    const s = gs.current;
    if (s.phase !== 'playing') return;
    s.tickCount++;

    // --- Collisions: player bullets ↔ aliens ---
    for (let bi = s.playerBullets.length - 1; bi >= 0; bi--) {
      const b = s.playerBullets[bi];
      const bRow = Math.round(b.y / CELL_H);
      for (let ai = s.aliens.length - 1; ai >= 0; ai--) {
        const a = s.aliens[ai];
        if (a.col === b.col && Math.abs(a.row - bRow) <= 0) {
          a.hp -= b.damage;
          if (a.hp <= 0) {
            s.score += a.type.score;
            s.aliens.splice(ai, 1);
          }
          if (!b.piercing) {
            s.playerBullets.splice(bi, 1);
            break;
          }
        }
      }
    }

    // --- Collisions: alien bullets ↔ player ---
    const shipY = (GRID_ROWS - 1) * CELL_H + CELL_H / 2;
    for (let bi = s.alienBullets.length - 1; bi >= 0; bi--) {
      const b = s.alienBullets[bi];
      if (Math.abs(b.y - shipY) < CELL_H * 0.6 && b.col === s.shipCol) {
        s.lives--;
        s.alienBullets.splice(bi, 1);
        sound.explosion();
        haptics.explosion();
      }
    }

    // --- Regeneration ---
    if (s.tickCount % 10 === 0) {
      for (const a of s.aliens) {
        if (a.type.regenerates && a.hp < a.maxHp) a.hp++;
      }
    }

    // --- Move aliens ---
    if (s.tickCount % ALIEN_DESCENT_TICKS === 0 && s.aliens.length > 0) {
      let minC = GRID_COLS, maxC = 0;
      for (const a of s.aliens) { if (a.col < minC) minC = a.col; if (a.col > maxC) maxC = a.col; }

      if ((s.alienDir === 1 && maxC >= GRID_COLS - 1) || (s.alienDir === -1 && minC <= 0)) {
        s.alienDir = (s.alienDir * -1) as 1 | -1;
        for (const a of s.aliens) a.row++;
      } else {
        for (const a of s.aliens) a.col += s.alienDir;
      }
    }

    // --- Aliens reached bottom ---
    if (s.aliens.some(a => a.row >= GRID_ROWS - 2)) {
      endGame(s);
      return;
    }

    // --- Alien fire ---
    for (const a of s.aliens) {
      if (Math.random() < ALIEN_FIRE_CHANCE * a.type.fireRate) {
        s.alienBullets.push({
          col: a.col,
          y: (a.row + 1) * CELL_H,
          piercing: false,
          damage: 1,
          dy: 4,
        });
      }
    }

    // --- Wave cleared ---
    if (s.aliens.length === 0) {
      s.score += WAVE_CLEAR_BONUS;
      s.phase = 'wave-clear';
      s.highScore = Math.max(s.highScore, s.score);
      stopLoop();
      sound.waveClear();
      haptics.craft();
      syncUI(s);
      return;
    }

    // --- Game over ---
    if (s.lives <= 0) {
      endGame(s);
      return;
    }

    // Teleport cooldown
    if (s.teleportTimer > 0) s.teleportTimer--;

    // Sync HUD numbers less frequently (every 4th tick)
    if (s.tickCount % 4 === 0) syncUI(s);
  }, [sound, haptics]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function stopLoop() {
    cancelAnimationFrame(rafId.current);
    if (tickTimer.current) { clearInterval(tickTimer.current); tickTimer.current = null; }
  }

  function endGame(s: GameState) {
    s.phase = 'game-over';
    s.highScore = Math.max(s.highScore, s.score);
    stopLoop();
    sound.explosion();
    haptics.explosion();
    syncUI(s);
  }

  function syncUI(s: GameState) {
    setUiPhase(s.phase);
    setUiScore(s.score);
    setUiWave(s.wave);
    setUiLives(s.lives);
    setUiHighScore(s.highScore);
  }

  // Cleanup on unmount
  useEffect(() => () => stopLoop(), []);

  // ---------------------------------------------------------------------------
  // Start / next wave
  // ---------------------------------------------------------------------------
  const startPlaying = useCallback((wave: number, keepScore = false) => {
    stopLoop();
    const s = gs.current;
    s.phase = 'playing';
    s.wave = wave;
    s.aliens = spawnWave(wave);
    s.playerBullets = [];
    s.alienBullets = [];
    s.tickCount = 0;
    s.alienDir = 1;
    s.shipCol = Math.floor(GRID_COLS / 2);
    if (!keepScore) {
      s.score = 0;
      s.lives = BASE_LIVES + bonuses.extraLives;
    }
    s.maxBullets = 1 + bonuses.extraBullets;
    s.piercing = bonuses.piercing;
    s.dmgMul = bonuses.damageMultiplier;
    s.shipSpeed = bonuses.shipSpeed;
    s.teleportCD = bonuses.teleportCooldown;
    s.teleportTimer = 0;

    syncUI(s);

    const waveCfg = getWaveConfig(wave);
    const tickMs = Math.max(30, BASE_TICK_MS * waveCfg.speedMultiplier);
    tickTimer.current = setInterval(gameTick, tickMs);
    rafId.current = requestAnimationFrame(renderLoop);

    haptics.tap();
    sound.mineHit();
  }, [spawnWave, bonuses, gameTick, renderLoop, haptics, sound]);

  const startGame = useCallback(() => startPlaying(1), [startPlaying]);
  const nextWave = useCallback(() => startPlaying(gs.current.wave + 1, true), [startPlaying]);

  // ---------------------------------------------------------------------------
  // Player actions
  // ---------------------------------------------------------------------------
  const shoot = useCallback(() => {
    const s = gs.current;
    if (s.phase !== 'playing') return;
    if (s.playerBullets.length >= s.maxBullets) return;
    s.playerBullets.push({
      col: s.shipCol,
      y: (GRID_ROWS - 2) * CELL_H,
      piercing: s.piercing,
      damage: s.dmgMul,
      dy: -7,
    });
    sound.shoot();
    haptics.shoot();
  }, [sound, haptics]);

  const moveShip = useCallback((dir: -1 | 1) => {
    const s = gs.current;
    if (s.phase !== 'playing') return;
    s.shipCol = Math.max(0, Math.min(GRID_COLS - 1, s.shipCol + dir * s.shipSpeed));
    haptics.tap();
  }, [haptics]);

  const teleport = useCallback(() => {
    const s = gs.current;
    if (s.phase !== 'playing' || s.teleportCD === 0 || s.teleportTimer > 0) return;
    s.shipCol = Math.floor(Math.random() * GRID_COLS);
    s.teleportTimer = s.teleportCD;
    haptics.tap();
  }, [haptics]);

  // ---------------------------------------------------------------------------
  // Collect rewards
  // ---------------------------------------------------------------------------
  const collectRewards = useCallback(() => {
    const rewards = calculateRewards(gs.current.wave, currentPlanet.resources);
    if (rewards.length > 0) addBattleRewards(rewards);
    gs.current.phase = 'idle';
    setUiPhase('idle');
    haptics.craft();
  }, [currentPlanet, addBattleRewards, haptics]);

  // ---------------------------------------------------------------------------
  // Input: keyboard
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysDown.current.add(e.key);
      if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); shoot(); }
      if (e.key === 't') teleport();
    };
    const onUp = (e: KeyboardEvent) => keysDown.current.delete(e.key);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [shoot, teleport]);

  // ---------------------------------------------------------------------------
  // Input: touch (on canvas)
  // ---------------------------------------------------------------------------
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dy) > 30 && dy < 0) { shoot(); }
    else if (Math.abs(dx) > 20) { moveShip(dx > 0 ? 1 : -1); }
    else { shoot(); }
  }, [shoot, moveShip]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-invaders">
      {uiPhase !== 'playing' && (
        <div className="si-header">
          <h3>👾 {t('battle.title')}</h3>
          {uiHighScore > 0 && (
            <div className="si-high-score">{t('battle.highScore')}: {uiHighScore}</div>
          )}
        </div>
      )}

      {uiPhase === 'idle' && (
        <div className="si-start-screen">
          <div className="si-start-planet">
            <span className="si-big-emoji">👾</span>
          </div>
          <p className="si-start-desc">{t('battle.description', { planet: t(`planets.${currentPlanet.id}.name`) })}</p>

          {equipment.length > 0 && (
            <div className="si-bonuses">
              <h4>{t('battle.equipmentBonuses')}</h4>
              {bonuses.extraBullets > 0 && <span className="si-bonus">⛏️ +{bonuses.extraBullets} {t('battle.bonusExtraBullets')}</span>}
              {bonuses.piercing && <span className="si-bonus">⚡ {t('battle.bonusPiercing')}</span>}
              {bonuses.extraLives > 0 && <span className="si-bonus">🛡️ +{bonuses.extraLives} {t('battle.bonusExtraLives')}</span>}
              {bonuses.shipSpeed > 1 && <span className="si-bonus">🚀 {t('battle.bonusFastShip')}</span>}
              {bonuses.damageMultiplier > 1 && <span className="si-bonus">🌀 x{bonuses.damageMultiplier} {t('battle.bonusDamage')}</span>}
              {bonuses.teleportCooldown > 0 && <span className="si-bonus">✨ {t('battle.bonusTeleport')}</span>}
            </div>
          )}

          <button className="si-start-btn" onClick={startGame}>
            🎮 {t('battle.start')}
          </button>
        </div>
      )}

      {uiPhase === 'playing' && (
        <>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="si-canvas"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          />
          <div className="si-controls">
            <button className="si-ctrl-btn" onClick={() => moveShip(-1)}>⬅️</button>
            <button className="si-ctrl-btn si-fire-btn" onClick={shoot}>🔥</button>
            <button className="si-ctrl-btn" onClick={() => moveShip(1)}>➡️</button>
            {bonuses.teleportCooldown > 0 && (
              <button className="si-ctrl-btn si-teleport-btn" onClick={teleport}>✨</button>
            )}
          </div>
        </>
      )}

      {uiPhase === 'wave-clear' && (
        <div className="si-wave-clear">
          <span className="si-big-emoji">🎉</span>
          <h3>{t('battle.waveClear', { wave: uiWave })}</h3>
          <p>{t('battle.score')}: {uiScore}</p>
          <button className="si-start-btn" onClick={nextWave}>
            {t('battle.nextWave')} →
          </button>
          <button className="si-collect-btn" onClick={collectRewards}>
            🎁 {t('battle.collectRewards')}
          </button>
        </div>
      )}

      {uiPhase === 'game-over' && (
        <div className="si-game-over">
          <span className="si-big-emoji">💥</span>
          <h3>{t('battle.gameOver')}</h3>
          <p>{t('battle.finalScore', { score: uiScore, wave: uiWave })}</p>
          {uiWave > 1 && (
            <button className="si-collect-btn" onClick={collectRewards}>
              🎁 {t('battle.collectRewards')}
            </button>
          )}
          <button className="si-start-btn" onClick={startGame}>
            🔄 {t('battle.playAgain')}
          </button>
        </div>
      )}
    </div>
  );
}
