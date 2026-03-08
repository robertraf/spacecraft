/**
 * @fileoverview Space Invaders battle mode component.
 *
 * Renders a grid-based Space Invaders minigame using CSS grid and emojis.
 * Integrates with the main game via equipment bonuses and resource rewards.
 *
 * @module SpaceInvaders
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGame } from '../context/GameContext';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';
import {
  GRID_COLS,
  GRID_ROWS,
  BASE_TICK_MS,
  ALIEN_DESCENT_TICKS,
  ALIEN_FIRE_CHANCE,
  BASE_LIVES,
  WAVE_CLEAR_BONUS,
  PLANET_ENEMIES,
  getWaveConfig,
  getEquipmentBonuses,
  calculateRewards,
  type EnemyType,
  type BattleReward,
} from '../data/battleData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Alien {
  id: number;
  col: number;
  row: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
}

interface Bullet {
  id: number;
  col: number;
  row: number;
  direction: 'up' | 'down';
  piercing?: boolean;
  damage: number;
}

type GamePhase = 'idle' | 'playing' | 'wave-clear' | 'game-over' | 'rewards';

interface BattleState {
  phase: GamePhase;
  wave: number;
  score: number;
  lives: number;
  shipCol: number;
  aliens: Alien[];
  playerBullets: Bullet[];
  alienBullets: Bullet[];
  tickCount: number;
  alienDirection: 1 | -1;
  rewards: BattleReward[];
  maxBulletsOnScreen: number;
  piercing: boolean;
  damageMultiplier: number;
  shipSpeed: number;
  teleportCooldown: number;
  teleportTimer: number;
  highScore: number;
}

let nextId = 1;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpaceInvaders() {
  const { t } = useTranslation();
  const { currentPlanet, equipment, addBattleRewards } = useGame();
  const haptics = useHaptics();
  const sound = useSound();
  const gameRef = useRef<BattleState | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bonuses = getEquipmentBonuses(equipment);

  const createInitialState = useCallback((): BattleState => {
    return {
      phase: 'idle',
      wave: 0,
      score: 0,
      lives: BASE_LIVES + bonuses.extraLives,
      shipCol: Math.floor(GRID_COLS / 2),
      aliens: [],
      playerBullets: [],
      alienBullets: [],
      tickCount: 0,
      alienDirection: 1,
      rewards: [],
      maxBulletsOnScreen: 1 + bonuses.extraBullets,
      piercing: bonuses.piercing,
      damageMultiplier: bonuses.damageMultiplier,
      shipSpeed: bonuses.shipSpeed,
      teleportCooldown: bonuses.teleportCooldown,
      teleportTimer: 0,
      highScore: 0,
    };
  }, [bonuses]);

  const [state, setState] = useState<BattleState>(createInitialState);

  // Keep ref in sync
  useEffect(() => {
    gameRef.current = state;
  }, [state]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Spawn aliens for a wave
  // ---------------------------------------------------------------------------
  const spawnWave = useCallback((wave: number): Alien[] => {
    const config = getWaveConfig(wave);
    const enemyTypes = PLANET_ENEMIES[currentPlanet.id] ?? PLANET_ENEMIES['terra-nova'];
    const aliens: Alien[] = [];
    const startCol = Math.floor((GRID_COLS - config.cols) / 2);

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const type = enemyTypes[row % enemyTypes.length];
        aliens.push({
          id: nextId++,
          col: startCol + col,
          row: row + 1,
          type,
          hp: type.hp,
          maxHp: type.hp,
        });
      }
    }
    return aliens;
  }, [currentPlanet.id]);

  // ---------------------------------------------------------------------------
  // Start game
  // ---------------------------------------------------------------------------
  const startGame = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);

    const newState: BattleState = {
      ...createInitialState(),
      phase: 'playing',
      wave: 1,
      aliens: spawnWave(1),
      highScore: state.highScore,
    };
    setState(newState);
    haptics.tap();
    sound.mineHit();

    const waveConfig = getWaveConfig(1);
    const tickMs = BASE_TICK_MS * waveConfig.speedMultiplier;

    tickRef.current = setInterval(() => {
      setState(prev => gameTick(prev));
    }, tickMs);
  }, [createInitialState, spawnWave, state.highScore, haptics, sound]);

  // ---------------------------------------------------------------------------
  // Next wave
  // ---------------------------------------------------------------------------
  const nextWave = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);

    const wave = state.wave + 1;
    setState(prev => ({
      ...prev,
      phase: 'playing',
      wave,
      aliens: spawnWave(wave),
      playerBullets: [],
      alienBullets: [],
      tickCount: 0,
      alienDirection: 1,
      shipCol: Math.floor(GRID_COLS / 2),
    }));

    const waveConfig = getWaveConfig(wave);
    const tickMs = BASE_TICK_MS * waveConfig.speedMultiplier;

    tickRef.current = setInterval(() => {
      setState(prev => gameTick(prev));
    }, tickMs);
  }, [state.wave, spawnWave]);

  // ---------------------------------------------------------------------------
  // Game tick
  // ---------------------------------------------------------------------------
  function gameTick(s: BattleState): BattleState {
    if (s.phase !== 'playing') return s;

    let { aliens, playerBullets, alienBullets, lives, score, tickCount, alienDirection } = {
      aliens: [...s.aliens],
      playerBullets: [...s.playerBullets],
      alienBullets: [...s.alienBullets],
      lives: s.lives,
      score: s.score,
      tickCount: s.tickCount + 1,
      alienDirection: s.alienDirection,
    };

    // --- Move player bullets up ---
    playerBullets = playerBullets
      .map(b => ({ ...b, row: b.row - 1 }))
      .filter(b => b.row >= 0);

    // --- Move alien bullets down ---
    alienBullets = alienBullets
      .map(b => ({ ...b, row: b.row + 1 }))
      .filter(b => b.row < GRID_ROWS);

    // --- Check player bullet ↔ alien collisions ---
    const bulletsToRemove = new Set<number>();
    const aliensToRemove = new Set<number>();

    for (const bullet of playerBullets) {
      for (const alien of aliens) {
        if (alien.col === bullet.col && alien.row === bullet.row && !aliensToRemove.has(alien.id)) {
          alien.hp -= bullet.damage;
          if (alien.hp <= 0) {
            aliensToRemove.add(alien.id);
            score += alien.type.score;
          }
          if (!bullet.piercing) {
            bulletsToRemove.add(bullet.id);
          }
          break;
        }
      }
    }

    playerBullets = playerBullets.filter(b => !bulletsToRemove.has(b.id));
    aliens = aliens.filter(a => !aliensToRemove.has(a.id));

    // --- Regeneration for verdantis enemies ---
    for (const alien of aliens) {
      if (alien.type.regenerates && alien.hp < alien.maxHp && tickCount % 10 === 0) {
        alien.hp = Math.min(alien.hp + 1, alien.maxHp);
      }
    }

    // --- Check alien bullet ↔ player collisions ---
    for (const bullet of alienBullets) {
      if (bullet.row === GRID_ROWS - 1 && bullet.col === s.shipCol) {
        lives--;
        alienBullets = alienBullets.filter(b => b.id !== bullet.id);
      }
    }

    // --- Move aliens ---
    if (tickCount % ALIEN_DESCENT_TICKS === 0 && aliens.length > 0) {
      const minCol = Math.min(...aliens.map(a => a.col));
      const maxCol = Math.max(...aliens.map(a => a.col));

      if ((alienDirection === 1 && maxCol >= GRID_COLS - 1) ||
          (alienDirection === -1 && minCol <= 0)) {
        alienDirection = (alienDirection * -1) as 1 | -1;
        aliens = aliens.map(a => ({ ...a, row: a.row + 1 }));
      } else {
        aliens = aliens.map(a => ({ ...a, col: a.col + alienDirection }));
      }
    }

    // --- Check if aliens reached the bottom ---
    if (aliens.some(a => a.row >= GRID_ROWS - 2)) {
      if (tickRef.current) clearInterval(tickRef.current);
      const hs = Math.max(s.highScore, score);
      return {
        ...s,
        phase: 'game-over',
        aliens, playerBullets, alienBullets, lives, score, tickCount, alienDirection,
        highScore: hs,
        rewards: [],
      };
    }

    // --- Alien shooting ---
    for (const alien of aliens) {
      if (Math.random() < ALIEN_FIRE_CHANCE * alien.type.fireRate) {
        alienBullets.push({
          id: nextId++,
          col: alien.col,
          row: alien.row + 1,
          direction: 'down',
          damage: 1,
        });
      }
    }

    // --- Check if wave cleared ---
    if (aliens.length === 0) {
      if (tickRef.current) clearInterval(tickRef.current);
      score += WAVE_CLEAR_BONUS;
      return {
        ...s,
        phase: 'wave-clear',
        aliens, playerBullets: [], alienBullets: [], lives, score, tickCount, alienDirection,
        highScore: Math.max(s.highScore, score),
      };
    }

    // --- Check game over ---
    if (lives <= 0) {
      if (tickRef.current) clearInterval(tickRef.current);
      return {
        ...s,
        phase: 'game-over',
        aliens, playerBullets, alienBullets, lives: 0, score, tickCount, alienDirection,
        highScore: Math.max(s.highScore, score),
        rewards: [],
      };
    }

    return {
      ...s,
      aliens, playerBullets, alienBullets, lives, score, tickCount, alienDirection,
    };
  }

  // ---------------------------------------------------------------------------
  // Player actions
  // ---------------------------------------------------------------------------
  const moveShip = useCallback((dir: -1 | 1) => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      const newCol = Math.max(0, Math.min(GRID_COLS - 1, prev.shipCol + dir * prev.shipSpeed));
      return { ...prev, shipCol: newCol };
    });
    haptics.tap();
  }, [haptics]);

  const shoot = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      if (prev.playerBullets.length >= prev.maxBulletsOnScreen) return prev;
      sound.shoot();
      haptics.shoot();
      return {
        ...prev,
        playerBullets: [...prev.playerBullets, {
          id: nextId++,
          col: prev.shipCol,
          row: GRID_ROWS - 2,
          direction: 'up' as const,
          piercing: prev.piercing,
          damage: prev.damageMultiplier,
        }],
      };
    });
  }, [sound, haptics]);

  const teleport = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing' || prev.teleportCooldown === 0 || prev.teleportTimer > 0) return prev;
      const newCol = Math.floor(Math.random() * GRID_COLS);
      haptics.tap();
      return { ...prev, shipCol: newCol, teleportTimer: prev.teleportCooldown };
    });
  }, [haptics]);

  // Reduce teleport timer each tick
  useEffect(() => {
    if (state.phase === 'playing' && state.teleportTimer > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, teleportTimer: Math.max(0, prev.teleportTimer - 1) }));
      }, BASE_TICK_MS);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.teleportTimer]);

  // ---------------------------------------------------------------------------
  // Collect rewards
  // ---------------------------------------------------------------------------
  const collectRewards = useCallback(() => {
    const rewards = calculateRewards(
      state.wave,
      currentPlanet.resources,
    );
    if (rewards.length > 0) {
      addBattleRewards(rewards);
    }
    setState(prev => ({ ...prev, phase: 'idle', rewards }));
    haptics.craft();
  }, [currentPlanet, state.wave, addBattleRewards, haptics]);

  // ---------------------------------------------------------------------------
  // Touch controls
  // ---------------------------------------------------------------------------
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dy) > 30 && dy < 0) {
      shoot();
    } else if (Math.abs(dx) > 20) {
      moveShip(dx > 0 ? 1 : -1);
    } else {
      shoot();
    }
  }, [shoot, moveShip]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (state.phase !== 'playing') return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          moveShip(-1);
          break;
        case 'ArrowRight':
        case 'd':
          moveShip(1);
          break;
        case ' ':
        case 'ArrowUp':
          e.preventDefault();
          shoot();
          break;
        case 't':
          teleport();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.phase, moveShip, shoot, teleport]);

  // ---------------------------------------------------------------------------
  // Render grid
  // ---------------------------------------------------------------------------
  const renderGrid = () => {
    const cells: React.ReactNode[] = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const alien = state.aliens.find(a => a.row === row && a.col === col);
        const playerBullet = state.playerBullets.find(b => b.row === row && b.col === col);
        const alienBullet = state.alienBullets.find(b => b.row === row && b.col === col);
        const isShip = row === GRID_ROWS - 1 && col === state.shipCol;

        let content = '';
        let cellClass = 'si-cell';

        if (alien) {
          content = alien.type.emoji;
          cellClass += ' si-alien';
          if (alien.hp < alien.maxHp) cellClass += ' si-alien-damaged';
        } else if (isShip) {
          content = '🚀';
          cellClass += ' si-ship';
        } else if (playerBullet) {
          content = '|';
          cellClass += ' si-bullet-player';
        } else if (alienBullet) {
          content = '·';
          cellClass += ' si-bullet-alien';
        }

        cells.push(
          <div key={`${row}-${col}`} className={cellClass}>
            {content}
          </div>
        );
      }
    }
    return cells;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-invaders">
      <div className="si-header">
        <h3>👾 {t('battle.title')}</h3>
        <div className="si-stats">
          <span className="si-score">{t('battle.score')}: {state.score}</span>
          <span className="si-wave">{t('battle.wave')}: {state.wave}</span>
          <span className="si-lives">{'❤️'.repeat(Math.max(0, state.lives))}</span>
        </div>
        {state.highScore > 0 && (
          <div className="si-high-score">{t('battle.highScore')}: {state.highScore}</div>
        )}
      </div>

      {state.phase === 'idle' && (
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

      {state.phase === 'playing' && (
        <>
          <div
            className="si-grid"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {renderGrid()}
          </div>

          <div className="si-controls">
            <button className="si-ctrl-btn" onClick={() => moveShip(-1)}>⬅️</button>
            <button className="si-ctrl-btn si-fire-btn" onClick={shoot}>🔥</button>
            <button className="si-ctrl-btn" onClick={() => moveShip(1)}>➡️</button>
            {state.teleportCooldown > 0 && (
              <button
                className={`si-ctrl-btn si-teleport-btn ${state.teleportTimer > 0 ? 'cooldown' : ''}`}
                onClick={teleport}
                disabled={state.teleportTimer > 0}
              >
                ✨
              </button>
            )}
          </div>
        </>
      )}

      {state.phase === 'wave-clear' && (
        <div className="si-wave-clear">
          <span className="si-big-emoji">🎉</span>
          <h3>{t('battle.waveClear', { wave: state.wave })}</h3>
          <p>{t('battle.score')}: {state.score}</p>
          <button className="si-start-btn" onClick={nextWave}>
            {t('battle.nextWave')} →
          </button>
          <button className="si-collect-btn" onClick={collectRewards}>
            🎁 {t('battle.collectRewards')}
          </button>
        </div>
      )}

      {state.phase === 'game-over' && (
        <div className="si-game-over">
          <span className="si-big-emoji">💥</span>
          <h3>{t('battle.gameOver')}</h3>
          <p>{t('battle.finalScore', { score: state.score, wave: state.wave })}</p>
          {state.wave > 1 && (
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
