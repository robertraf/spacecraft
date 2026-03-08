/**
 * @fileoverview Datos estáticos y constantes del juego SpaceCraft.
 *
 * Define planetas, items, recetas de crafteo y constantes de mecánicas de juego.
 * Este módulo es la fuente única de verdad para toda la configuración
 * del juego y no contiene lógica de estado mutable.
 *
 * @module gameData
 */

// ---------------------------------------------------------------------------
// Constantes de mecánicas de juego
// ---------------------------------------------------------------------------

/** Tiempo base de viaje entre planetas (ms). */
export const TRAVEL_TIME_MS = 3000;

/** Cooldown base entre acciones de minería (ms). */
export const MINE_COOLDOWN_MS = 1500;

/** Cooldown reducido al usar el pico eléctrico (ms). */
export const ELECTRIC_PICKAXE_COOLDOWN_MS = 800;

/** Tamaño máximo del inventario (slots). */
export const INVENTORY_SIZE = 40;

/** Cantidad máxima de entradas en el log del juego. */
export const MAX_LOG_ENTRIES = 50;

/** Probabilidad base de fallo al minar sin escáner (0-1). */
export const MINE_FAIL_CHANCE = 0.1;

// ---------------------------------------------------------------------------
// Pesos de selección de rareza al minar
// ---------------------------------------------------------------------------

/** Peso de selección para recursos raros sin escáner. */
export const RARE_WEIGHT = 5;

/** Peso de selección para recursos raros con escáner equipado. */
export const RARE_WEIGHT_WITH_SCANNER = 20;

/** Peso de selección para recursos poco comunes. */
export const UNCOMMON_WEIGHT = 25;

/** Peso de selección para recursos comunes. */
export const COMMON_WEIGHT = 50;

// ---------------------------------------------------------------------------
// Planetas
// ---------------------------------------------------------------------------

export interface Planet {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  resources: string[];
  dangerLevel: number;
}

/**
 * Lista de planetas explorables en el juego.
 */
export const PLANETS: Planet[] = [
  {
    id: 'terra-nova',
    name: 'Terra Nova',
    emoji: '🌍',
    description: 'Un planeta rocoso rico en minerales básicos.',
    color: '#4a90d9',
    resources: ['iron-ore', 'stone', 'copper-ore', 'coal'],
    dangerLevel: 1,
  },
  {
    id: 'volcanus',
    name: 'Volcanus',
    emoji: '🌋',
    description: 'Mundo volcánico con minerales raros en sus cavernas.',
    color: '#e74c3c',
    resources: ['obsidian', 'diamond', 'sulfur', 'iron-ore'],
    dangerLevel: 3,
  },
  {
    id: 'glacius',
    name: 'Glacius',
    emoji: '❄️',
    description: 'Planeta helado con cristales energéticos bajo el hielo.',
    color: '#a8d8ea',
    resources: ['ice-crystal', 'titanium-ore', 'frozen-gas', 'stone'],
    dangerLevel: 2,
  },
  {
    id: 'verdantis',
    name: 'Verdantis',
    emoji: '🌿',
    description: 'Selva alienígena llena de materiales orgánicos.',
    color: '#27ae60',
    resources: ['bio-fiber', 'alien-wood', 'nectar', 'copper-ore'],
    dangerLevel: 2,
  },
  {
    id: 'nebulon',
    name: 'Nebulón',
    emoji: '🌌',
    description: 'Estación espacial abandonada con tecnología antigua.',
    color: '#9b59b6',
    resources: ['circuit-board', 'nano-tube', 'plasma-cell', 'titanium-ore'],
    dangerLevel: 4,
  },
];

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type ItemType = 'resource' | 'material' | 'tool' | 'equipment';

export interface Item {
  name: string;
  emoji: string;
  type: ItemType;
  rarity: Rarity;
  effect?: string;
}

/**
 * Diccionario de todos los ítems del juego indexados por su ID.
 */
export const ITEMS: Record<string, Item> = {
  // Recursos crudos
  'iron-ore': { name: 'Mineral de Hierro', emoji: '🪨', type: 'resource', rarity: 'common' },
  'stone': { name: 'Piedra', emoji: '🧱', type: 'resource', rarity: 'common' },
  'copper-ore': { name: 'Mineral de Cobre', emoji: '🟤', type: 'resource', rarity: 'common' },
  'coal': { name: 'Carbón', emoji: '⬛', type: 'resource', rarity: 'common' },
  'obsidian': { name: 'Obsidiana', emoji: '🖤', type: 'resource', rarity: 'uncommon' },
  'diamond': { name: 'Diamante', emoji: '💎', type: 'resource', rarity: 'rare' },
  'sulfur': { name: 'Azufre', emoji: '🟡', type: 'resource', rarity: 'uncommon' },
  'ice-crystal': { name: 'Cristal de Hielo', emoji: '🔷', type: 'resource', rarity: 'uncommon' },
  'titanium-ore': { name: 'Mineral de Titanio', emoji: '⬜', type: 'resource', rarity: 'uncommon' },
  'frozen-gas': { name: 'Gas Congelado', emoji: '🫧', type: 'resource', rarity: 'uncommon' },
  'bio-fiber': { name: 'Fibra Biológica', emoji: '🧬', type: 'resource', rarity: 'common' },
  'alien-wood': { name: 'Madera Alien', emoji: '🪵', type: 'resource', rarity: 'common' },
  'nectar': { name: 'Néctar Espacial', emoji: '🍯', type: 'resource', rarity: 'uncommon' },
  'circuit-board': { name: 'Placa de Circuito', emoji: '🔌', type: 'resource', rarity: 'rare' },
  'nano-tube': { name: 'Nanotubo', emoji: '🔬', type: 'resource', rarity: 'rare' },
  'plasma-cell': { name: 'Celda de Plasma', emoji: '⚡', type: 'resource', rarity: 'rare' },

  // Ítems crafteados
  'iron-bar': { name: 'Barra de Hierro', emoji: '🔩', type: 'material', rarity: 'common' },
  'copper-wire': { name: 'Cable de Cobre', emoji: '🔗', type: 'material', rarity: 'common' },
  'steel-plate': { name: 'Placa de Acero', emoji: '🛡️', type: 'material', rarity: 'uncommon' },
  'titanium-bar': { name: 'Barra de Titanio', emoji: '⚙️', type: 'material', rarity: 'uncommon' },
  'energy-cell': { name: 'Celda de Energía', emoji: '🔋', type: 'material', rarity: 'uncommon' },
  'bio-gel': { name: 'Bio-Gel', emoji: '🧪', type: 'material', rarity: 'uncommon' },

  // Herramientas y equipo
  'space-pickaxe': { name: 'Pico Espacial', emoji: '⛏️', type: 'tool', rarity: 'uncommon', effect: 'Duplica recursos al minar' },
  'scanner': { name: 'Escáner', emoji: '📡', type: 'tool', rarity: 'uncommon', effect: 'Revela items raros' },
  'jetpack': { name: 'Jetpack', emoji: '🚀', type: 'equipment', rarity: 'rare', effect: 'Viaja más rápido entre planetas' },
  'shield-gen': { name: 'Generador de Escudo', emoji: '🛡️', type: 'equipment', rarity: 'rare', effect: 'Protege en planetas peligrosos' },
  'electric-pickaxe': { name: 'Pico Eléctrico', emoji: '⚡', type: 'tool', rarity: 'rare', effect: 'Mina rápido con efecto de taladro eléctrico' },
  'quantum-drill': { name: 'Taladro Cuántico', emoji: '🌀', type: 'tool', rarity: 'legendary', effect: 'Triplica recursos y encuentra items secretos' },
  'warp-drive': { name: 'Motor Warp', emoji: '✨', type: 'equipment', rarity: 'legendary', effect: 'Viaje instantáneo entre planetas' },
};

// ---------------------------------------------------------------------------
// Recetas de crafteo
// ---------------------------------------------------------------------------

export interface Recipe {
  id: string;
  inputs: Record<string, number>;
  output: string;
  amount: number;
}

/**
 * Lista de recetas de crafteo disponibles ordenadas por progresión.
 */
export const RECIPES: Recipe[] = [
  // Procesado básico
  { id: 'smelt-iron', inputs: { 'iron-ore': 2, 'coal': 1 }, output: 'iron-bar', amount: 1 },
  { id: 'wire-copper', inputs: { 'copper-ore': 2 }, output: 'copper-wire', amount: 2 },
  { id: 'smelt-titanium', inputs: { 'titanium-ore': 3, 'coal': 2 }, output: 'titanium-bar', amount: 1 },

  // Intermedio
  { id: 'steel', inputs: { 'iron-bar': 2, 'coal': 3 }, output: 'steel-plate', amount: 1 },
  { id: 'energy', inputs: { 'plasma-cell': 1, 'copper-wire': 2 }, output: 'energy-cell', amount: 1 },
  { id: 'biogel', inputs: { 'bio-fiber': 3, 'nectar': 2 }, output: 'bio-gel', amount: 1 },

  // Herramientas
  { id: 'pickaxe', inputs: { 'iron-bar': 3, 'alien-wood': 2 }, output: 'space-pickaxe', amount: 1 },
  { id: 'scanner', inputs: { 'copper-wire': 3, 'circuit-board': 1, 'ice-crystal': 1 }, output: 'scanner', amount: 1 },

  // Equipo avanzado
  { id: 'jetpack', inputs: { 'steel-plate': 2, 'energy-cell': 2, 'frozen-gas': 3 }, output: 'jetpack', amount: 1 },
  { id: 'shield', inputs: { 'titanium-bar': 3, 'energy-cell': 1, 'diamond': 1 }, output: 'shield-gen', amount: 1 },

  // Herramientas avanzadas
  { id: 'electric-pickaxe', inputs: { 'steel-plate': 2, 'copper-wire': 3, 'energy-cell': 1 }, output: 'electric-pickaxe', amount: 1 },

  // Legendario
  { id: 'drill', inputs: { 'titanium-bar': 5, 'diamond': 3, 'nano-tube': 2, 'energy-cell': 2 }, output: 'quantum-drill', amount: 1 },
  { id: 'warp', inputs: { 'nano-tube': 5, 'plasma-cell': 3, 'diamond': 2, 'circuit-board': 3 }, output: 'warp-drive', amount: 1 },
];

// ---------------------------------------------------------------------------
// Colores de rareza (para UI)
// ---------------------------------------------------------------------------

/**
 * Mapa de colores CSS por nivel de rareza para uso en la interfaz.
 */
export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#aab8c2',
  uncommon: '#2ecc71',
  rare: '#3498db',
  legendary: '#f39c12',
};
