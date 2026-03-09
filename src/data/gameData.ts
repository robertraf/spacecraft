/**
 * @fileoverview Static data and constants for the SpaceCraft game.
 *
 * Defines planets, items, crafting recipes, and gameplay mechanic constants.
 * This module is the single source of truth for all game configuration
 * and contains no mutable state logic.
 *
 * @module gameData
 */

// ---------------------------------------------------------------------------
// Gameplay mechanic constants
// ---------------------------------------------------------------------------

/** Base travel time between planets (ms). */
export const TRAVEL_TIME_MS = 3000;

/** Base cooldown between mining actions (ms). */
export const MINE_COOLDOWN_MS = 1500;

/** Reduced cooldown when using the electric pickaxe (ms). */
export const ELECTRIC_PICKAXE_COOLDOWN_MS = 800;

/** Maximum inventory size (slots). */
export const INVENTORY_SIZE = 40;

/** Maximum number of game log entries. */
export const MAX_LOG_ENTRIES = 50;

/** Base chance of mining failure without a scanner (0-1). */
export const MINE_FAIL_CHANCE = 0.1;

// ---------------------------------------------------------------------------
// Rarity selection weights for mining
// ---------------------------------------------------------------------------

/** Selection weight for rare resources without a scanner. */
export const RARE_WEIGHT = 5;

/** Selection weight for rare resources with scanner equipped. */
export const RARE_WEIGHT_WITH_SCANNER = 20;

/** Selection weight for uncommon resources. */
export const UNCOMMON_WEIGHT = 25;

/** Selection weight for common resources. */
export const COMMON_WEIGHT = 50;

// ---------------------------------------------------------------------------
// Planets
// ---------------------------------------------------------------------------

export interface Planet {
  id: string;
  emoji: string;
  color: string;
  resources: string[];
  dangerLevel: number;
}

/**
 * List of explorable planets in the game.
 */
export const PLANETS: Planet[] = [
  {
    id: 'terra-nova',
    emoji: '🌍',
    color: '#4a90d9',
    resources: ['iron-ore', 'stone', 'copper-ore', 'coal'],
    dangerLevel: 1,
  },
  {
    id: 'volcanus',
    emoji: '🌋',
    color: '#e74c3c',
    resources: ['obsidian', 'diamond', 'sulfur', 'iron-ore'],
    dangerLevel: 3,
  },
  {
    id: 'glacius',
    emoji: '❄️',
    color: '#a8d8ea',
    resources: ['ice-crystal', 'titanium-ore', 'frozen-gas', 'stone'],
    dangerLevel: 2,
  },
  {
    id: 'verdantis',
    emoji: '🌿',
    color: '#27ae60',
    resources: ['bio-fiber', 'alien-wood', 'nectar', 'copper-ore'],
    dangerLevel: 2,
  },
  {
    id: 'nebulon',
    emoji: '🌌',
    color: '#9b59b6',
    resources: ['circuit-board', 'nano-tube', 'plasma-cell', 'titanium-ore'],
    dangerLevel: 4,
  },
];

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type ItemType = 'resource' | 'material' | 'tool' | 'equipment' | 'artifact';

export type AvatarSlot = 'head' | 'body' | 'back' | 'aura';

export const AVATAR_SLOTS: AvatarSlot[] = ['head', 'body', 'back', 'aura'];

export interface Item {
  emoji: string;
  type: ItemType;
  rarity: Rarity;
  hasEffect?: boolean;
  avatarSlot?: AvatarSlot;
}

/**
 * Dictionary of all game items indexed by their ID.
 * Names, descriptions, and effects are managed via i18n translation files.
 */
export const ITEMS: Record<string, Item> = {
  // Raw resources
  'iron-ore': { emoji: '🪨', type: 'resource', rarity: 'common' },
  'stone': { emoji: '🧱', type: 'resource', rarity: 'common' },
  'copper-ore': { emoji: '🟤', type: 'resource', rarity: 'common' },
  'coal': { emoji: '⬛', type: 'resource', rarity: 'common' },
  'obsidian': { emoji: '🖤', type: 'resource', rarity: 'uncommon' },
  'diamond': { emoji: '💎', type: 'resource', rarity: 'rare' },
  'sulfur': { emoji: '🟡', type: 'resource', rarity: 'uncommon' },
  'ice-crystal': { emoji: '🔷', type: 'resource', rarity: 'uncommon' },
  'titanium-ore': { emoji: '⬜', type: 'resource', rarity: 'uncommon' },
  'frozen-gas': { emoji: '🫧', type: 'resource', rarity: 'uncommon' },
  'bio-fiber': { emoji: '🧬', type: 'resource', rarity: 'common' },
  'alien-wood': { emoji: '🪵', type: 'resource', rarity: 'common' },
  'nectar': { emoji: '🍯', type: 'resource', rarity: 'uncommon' },
  'circuit-board': { emoji: '🔌', type: 'resource', rarity: 'rare' },
  'nano-tube': { emoji: '🔬', type: 'resource', rarity: 'rare' },
  'plasma-cell': { emoji: '⚡', type: 'resource', rarity: 'rare' },

  // Crafted materials
  'iron-bar': { emoji: '🔩', type: 'material', rarity: 'common' },
  'copper-wire': { emoji: '🔗', type: 'material', rarity: 'common' },
  'steel-plate': { emoji: '🔳', type: 'material', rarity: 'uncommon' },
  'titanium-bar': { emoji: '⚙️', type: 'material', rarity: 'uncommon' },
  'energy-cell': { emoji: '🔋', type: 'material', rarity: 'uncommon' },
  'bio-gel': { emoji: '🧪', type: 'material', rarity: 'uncommon' },

  // Tools and equipment
  'space-pickaxe': { emoji: '⛏️', type: 'tool', rarity: 'uncommon', hasEffect: true },
  'scanner': { emoji: '📡', type: 'tool', rarity: 'uncommon', hasEffect: true },
  'jetpack': { emoji: '🚀', type: 'equipment', rarity: 'rare', hasEffect: true },
  'shield-gen': { emoji: '🛡️', type: 'equipment', rarity: 'rare', hasEffect: true },
  'electric-pickaxe': { emoji: '⚒️', type: 'tool', rarity: 'rare', hasEffect: true },
  'quantum-drill': { emoji: '🌀', type: 'tool', rarity: 'legendary', hasEffect: true },
  'warp-drive': { emoji: '✨', type: 'equipment', rarity: 'legendary', hasEffect: true },

  // Avatar artifacts
  'solar-crown': { emoji: '👑', type: 'artifact', rarity: 'rare', avatarSlot: 'head', hasEffect: true },
  'titan-armor': { emoji: '🥋', type: 'artifact', rarity: 'rare', avatarSlot: 'body', hasEffect: true },
  'nebula-cape': { emoji: '🧥', type: 'artifact', rarity: 'legendary', avatarSlot: 'back', hasEffect: true },
  'ion-aura': { emoji: '💫', type: 'artifact', rarity: 'legendary', avatarSlot: 'aura', hasEffect: true },
};

export function isAvatarArtifact(itemId: string): boolean {
  return ITEMS[itemId]?.type === 'artifact';
}

export function isEquippableItem(itemId: string): boolean {
  const type = ITEMS[itemId]?.type;
  return type === 'tool' || type === 'equipment' || type === 'artifact';
}

// ---------------------------------------------------------------------------
// Crafting recipes
// ---------------------------------------------------------------------------

export interface Recipe {
  id: string;
  inputs: Record<string, number>;
  output: string;
  amount: number;
}

/**
 * List of available crafting recipes ordered by progression.
 */
export const RECIPES: Recipe[] = [
  // Basic processing
  { id: 'smelt-iron', inputs: { 'iron-ore': 2, 'coal': 1 }, output: 'iron-bar', amount: 1 },
  { id: 'wire-copper', inputs: { 'copper-ore': 2 }, output: 'copper-wire', amount: 2 },
  { id: 'smelt-titanium', inputs: { 'titanium-ore': 3, 'coal': 2 }, output: 'titanium-bar', amount: 1 },

  // Intermediate
  { id: 'steel', inputs: { 'iron-bar': 2, 'coal': 3 }, output: 'steel-plate', amount: 1 },
  { id: 'energy', inputs: { 'plasma-cell': 1, 'copper-wire': 2 }, output: 'energy-cell', amount: 1 },
  { id: 'biogel', inputs: { 'bio-fiber': 3, 'nectar': 2 }, output: 'bio-gel', amount: 1 },

  // Tools
  { id: 'pickaxe', inputs: { 'iron-bar': 3, 'alien-wood': 2 }, output: 'space-pickaxe', amount: 1 },
  { id: 'scanner', inputs: { 'copper-wire': 3, 'circuit-board': 1, 'ice-crystal': 1 }, output: 'scanner', amount: 1 },

  // Advanced equipment
  { id: 'jetpack', inputs: { 'steel-plate': 2, 'energy-cell': 2, 'frozen-gas': 3 }, output: 'jetpack', amount: 1 },
  { id: 'shield', inputs: { 'titanium-bar': 3, 'energy-cell': 1, 'diamond': 1 }, output: 'shield-gen', amount: 1 },

  // Advanced tools
  { id: 'electric-pickaxe', inputs: { 'steel-plate': 2, 'copper-wire': 3, 'energy-cell': 1 }, output: 'electric-pickaxe', amount: 1 },

  // Legendary
  { id: 'drill', inputs: { 'titanium-bar': 5, 'diamond': 3, 'nano-tube': 2, 'energy-cell': 2 }, output: 'quantum-drill', amount: 1 },
  { id: 'warp', inputs: { 'nano-tube': 5, 'plasma-cell': 3, 'diamond': 2, 'circuit-board': 3 }, output: 'warp-drive', amount: 1 },

  // Avatar artifacts
  { id: 'solar-crown', inputs: { 'diamond': 1, 'circuit-board': 1, 'energy-cell': 1 }, output: 'solar-crown', amount: 1 },
  { id: 'titan-armor', inputs: { 'titanium-bar': 2, 'bio-gel': 1, 'steel-plate': 1 }, output: 'titan-armor', amount: 1 },
  { id: 'nebula-cape', inputs: { 'nano-tube': 2, 'bio-fiber': 3, 'plasma-cell': 1 }, output: 'nebula-cape', amount: 1 },
  { id: 'ion-aura', inputs: { 'plasma-cell': 2, 'ice-crystal': 2, 'energy-cell': 2 }, output: 'ion-aura', amount: 1 },
];

// ---------------------------------------------------------------------------
// Rarity colors (for UI)
// ---------------------------------------------------------------------------

/**
 * CSS color map by rarity level for use in the interface.
 */
export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#aab8c2',
  uncommon: '#2ecc71',
  rare: '#3498db',
  legendary: '#f39c12',
};
