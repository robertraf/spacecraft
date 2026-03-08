/**
 * @fileoverview Configuration data for the Space Invaders battle mode.
 *
 * Defines enemy types per planet, wave configurations, equipment bonuses,
 * and battle rewards. This module contains no mutable state.
 *
 * @module battleData
 */

// ---------------------------------------------------------------------------
// Battle constants
// ---------------------------------------------------------------------------

/** Grid width (columns). */
export const GRID_COLS = 9;

/** Grid height (rows). */
export const GRID_ROWS = 12;

/** How often aliens move down one row (in ticks). */
export const ALIEN_DESCENT_TICKS = 8;

/** Base chance an alien fires a bullet each tick (per alien). */
export const ALIEN_FIRE_CHANCE = 0.03;

/** Player starting lives. */
export const BASE_LIVES = 3;

/** Score for killing a normal alien. */
export const SCORE_PER_KILL = 10;

/** Bonus score for completing a wave. */
export const WAVE_CLEAR_BONUS = 50;

// ---------------------------------------------------------------------------
// Enemy types per planet
// ---------------------------------------------------------------------------

export interface EnemyType {
  emoji: string;
  hp: number;
  speed: number; // multiplier — lower = faster ticks
  fireRate: number; // multiplier on ALIEN_FIRE_CHANCE
  score: number;
  regenerates?: boolean;
}

export const PLANET_ENEMIES: Record<string, EnemyType[]> = {
  'terra-nova': [
    { emoji: '👾', hp: 1, speed: 1, fireRate: 1, score: 10 },
    { emoji: '👽', hp: 1, speed: 1, fireRate: 1.2, score: 15 },
  ],
  volcanus: [
    { emoji: '🔥', hp: 1, speed: 0.8, fireRate: 1.3, score: 15 },
    { emoji: '☄️', hp: 2, speed: 0.9, fireRate: 1, score: 20 },
  ],
  glacius: [
    { emoji: '❄️', hp: 1, speed: 1, fireRate: 1.8, score: 15 },
    { emoji: '🧊', hp: 2, speed: 1, fireRate: 1.5, score: 20 },
  ],
  verdantis: [
    { emoji: '🌿', hp: 2, speed: 1, fireRate: 1, score: 15, regenerates: true },
    { emoji: '🍄', hp: 1, speed: 0.9, fireRate: 1.2, score: 20 },
  ],
  nebulon: [
    { emoji: '🛸', hp: 3, speed: 0.85, fireRate: 1.5, score: 25 },
    { emoji: '🤖', hp: 2, speed: 0.9, fireRate: 1.3, score: 20 },
  ],
};

// ---------------------------------------------------------------------------
// Wave generation
// ---------------------------------------------------------------------------

export interface WaveConfig {
  /** Number of rows of aliens. */
  rows: number;
  /** Number of aliens per row. */
  cols: number;
  /** Speed multiplier (stacks with enemy speed). */
  speedMultiplier: number;
}

/** Generate wave config for a given wave number. */
export function getWaveConfig(wave: number): WaveConfig {
  return {
    rows: Math.min(2 + Math.floor(wave / 2), 5),
    cols: Math.min(4 + wave, GRID_COLS - 2),
    speedMultiplier: Math.max(0.4, 1 - wave * 0.08),
  };
}

// ---------------------------------------------------------------------------
// Equipment bonuses
// ---------------------------------------------------------------------------

export interface BattleBonuses {
  /** Extra simultaneous bullets the player can have on screen. */
  extraBullets: number;
  /** Player bullet pierces through enemies. */
  piercing: boolean;
  /** Extra lives. */
  extraLives: number;
  /** Ship movement speed bonus (cells per move). */
  shipSpeed: number;
  /** Damage multiplier. */
  damageMultiplier: number;
  /** Reveal hidden/cloaked enemies. */
  revealHidden: boolean;
  /** Teleport ability cooldown (0 = none). */
  teleportCooldown: number;
}

export function getEquipmentBonuses(equipment: string[]): BattleBonuses {
  const bonuses: BattleBonuses = {
    extraBullets: 0,
    piercing: false,
    extraLives: 0,
    shipSpeed: 1,
    damageMultiplier: 1,
    revealHidden: false,
    teleportCooldown: 0,
  };

  if (equipment.includes('space-pickaxe')) bonuses.extraBullets += 1;
  if (equipment.includes('scanner')) bonuses.revealHidden = true;
  if (equipment.includes('electric-pickaxe')) bonuses.piercing = true;
  if (equipment.includes('shield-gen')) bonuses.extraLives += 1;
  if (equipment.includes('jetpack')) bonuses.shipSpeed = 2;
  if (equipment.includes('quantum-drill')) bonuses.damageMultiplier = 3;
  if (equipment.includes('warp-drive')) bonuses.teleportCooldown = 10;

  return bonuses;
}

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------

export interface BattleReward {
  itemId: string;
  amount: number;
}

/**
 * Determine rewards based on wave reached and planet.
 * Returns items from the current planet's resource pool.
 */
export function calculateRewards(
  wavesCleared: number,
  planetResources: string[],
): BattleReward[] {
  if (wavesCleared === 0) return [];

  const rewards: BattleReward[] = [];
  const numRewards = Math.min(wavesCleared, 3);

  for (let i = 0; i < numRewards; i++) {
    const resourceIdx = Math.floor(Math.random() * planetResources.length);
    const existing = rewards.find(r => r.itemId === planetResources[resourceIdx]);
    if (existing) {
      existing.amount += 1;
    } else {
      rewards.push({ itemId: planetResources[resourceIdx], amount: 1 + Math.floor(wavesCleared / 3) });
    }
  }

  return rewards;
}
