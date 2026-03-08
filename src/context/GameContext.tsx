/**
 * @fileoverview Global game context for SpaceCraft.
 *
 * Implements the React Context + useReducer pattern to manage all game state:
 * inventory, current planet, equipment, crafting, travel, and mining.
 * Automatically syncs state with the Convex backend after significant actions.
 *
 * @module GameContext
 */

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  PLANETS,
  ITEMS,
  INVENTORY_SIZE,
  TRAVEL_TIME_MS,
  MINE_COOLDOWN_MS,
  ELECTRIC_PICKAXE_COOLDOWN_MS,
  MAX_LOG_ENTRIES,
  MINE_FAIL_CHANCE,
  RARE_WEIGHT,
  RARE_WEIGHT_WITH_SCANNER,
  UNCOMMON_WEIGHT,
  COMMON_WEIGHT,
  type Planet,
  type Recipe,
} from '../data/gameData';
import type { BattleReward } from '../data/battleData';

export interface LogEntry {
  key: string;
  params?: Record<string, string | number>;
  type: string;
}

interface Stats {
  itemsMined: number;
  itemsCrafted: number;
  planetsVisited: number;
}

interface GameState {
  currentPlanet: Planet;
  inventory: Record<string, number>;
  craftedItems: string[];
  discoveredPlanets: string[];
  equipment: string[];
  isTraveling: boolean;
  isMining: boolean;
  travelTarget: string | null;
  log: LogEntry[];
  stats: Stats;
}

interface GameActions {
  mine: () => void;
  travel: (planetId: string) => void;
  craft: (recipe: Recipe) => void;
  equip: (itemId: string) => void;
  discard: (itemId: string, amount?: number) => void;
  canCraft: (recipe: Recipe) => boolean;
  addBattleRewards: (rewards: BattleReward[]) => void;
}

type GameContextValue = GameState & GameActions;

const GameContext = createContext<GameContextValue | null>(null);

const initialState: GameState = {
  currentPlanet: PLANETS[0],
  inventory: {},
  craftedItems: [],
  discoveredPlanets: ['terra-nova'],
  equipment: [],
  isTraveling: false,
  isMining: false,
  travelTarget: null,
  log: [{ key: 'log.welcome', type: 'info' }],
  stats: { itemsMined: 0, itemsCrafted: 0, planetsVisited: 1 },
};

function getItemCount(inventory: Record<string, number>, itemId: string): number {
  return inventory[itemId] || 0;
}

function addToInventory(
  inventory: Record<string, number>,
  itemId: string,
  amount = 1,
): Record<string, number> | null {
  const totalItems = Object.values(inventory).reduce((sum, n) => sum + n, 0);
  if (totalItems + amount > INVENTORY_SIZE) return null;
  return { ...inventory, [itemId]: (inventory[itemId] || 0) + amount };
}

function removeFromInventory(
  inventory: Record<string, number>,
  itemId: string,
  amount = 1,
): Record<string, number> | null {
  const current = inventory[itemId] || 0;
  if (current < amount) return null;
  const next = { ...inventory };
  next[itemId] = current - amount;
  if (next[itemId] === 0) delete next[itemId];
  return next;
}

function appendLog(log: LogEntry[], key: string, type: string, params?: Record<string, string | number>): LogEntry[] {
  return [{ key, params, type }, ...log].slice(0, MAX_LOG_ENTRIES);
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

type GameAction =
  | {
      type: 'LOAD_SAVED';
      payload: {
        currentPlanetId: string;
        discoveredPlanets: string[];
        inventory: Record<string, number>;
        equipment: string[];
        craftedItems: string[];
        stats: Stats;
      };
    }
  | { type: 'MINE_START' }
  | { type: 'MINE_COMPLETE'; payload: { itemId: string; amount: number } }
  | { type: 'MINE_FAIL' }
  | { type: 'TRAVEL_START'; payload: string }
  | { type: 'TRAVEL_COMPLETE'; payload: string }
  | { type: 'CRAFT'; payload: Recipe }
  | { type: 'EQUIP'; payload: string }
  | { type: 'DISCARD'; payload: { itemId: string; amount: number } }
  | { type: 'ADD_LOG'; payload: { key: string; type: string; params?: Record<string, string | number> } }
  | { type: 'BATTLE_REWARDS'; payload: BattleReward[] };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD_SAVED': {
      const { currentPlanetId, discoveredPlanets, inventory, equipment, craftedItems, stats } = action.payload;
      const planet = PLANETS.find(p => p.id === currentPlanetId) ?? PLANETS[0];
      const safeInventory = Object.fromEntries(
        Object.entries(inventory || {}).filter(([itemId]) => ITEMS[itemId])
      );
      const safeEquipment = Array.isArray(equipment)
        ? equipment.filter(itemId => ITEMS[itemId])
        : [];
      const safeCraftedItems = Array.isArray(craftedItems)
        ? craftedItems.filter(itemId => ITEMS[itemId])
        : [];
      return {
        ...initialState,
        currentPlanet: planet,
        discoveredPlanets,
        inventory: safeInventory,
        equipment: safeEquipment,
        craftedItems: safeCraftedItems,
        stats,
        log: [{ key: 'log.welcomeBack', type: 'info' }],
      };
    }

    case 'MINE_START':
      return { ...state, isMining: true };

    case 'MINE_COMPLETE': {
      const { itemId, amount } = action.payload;
      const newInv = addToInventory(state.inventory, itemId, amount);
      if (!newInv) {
        return {
          ...state,
          isMining: false,
          log: appendLog(state.log, 'log.inventoryFull', 'warning'),
        };
      }
      const item = ITEMS[itemId];
      return {
        ...state,
        isMining: false,
        inventory: newInv,
        stats: { ...state.stats, itemsMined: state.stats.itemsMined + amount },
        log: appendLog(state.log, 'log.mined', 'success', { amount, emoji: item.emoji, itemId }),
      };
    }

    case 'MINE_FAIL':
      return {
        ...state,
        isMining: false,
        log: appendLog(state.log, 'log.nothingFound', 'warning'),
      };

    case 'TRAVEL_START':
      return { ...state, isTraveling: true, travelTarget: action.payload };

    case 'TRAVEL_COMPLETE': {
      const planet = PLANETS.find(p => p.id === action.payload) ?? PLANETS[0];
      const discovered = state.discoveredPlanets.includes(planet.id)
        ? state.discoveredPlanets
        : [...state.discoveredPlanets, planet.id];
      return {
        ...state,
        isTraveling: false,
        travelTarget: null,
        currentPlanet: planet,
        discoveredPlanets: discovered,
        stats: { ...state.stats, planetsVisited: discovered.length },
        log: appendLog(state.log, 'log.arrived', 'info', { emoji: planet.emoji, planetId: planet.id }),
      };
    }

    case 'CRAFT': {
      const recipe = action.payload;
      let inv: Record<string, number> | null = { ...state.inventory };
      for (const [itemId, amount] of Object.entries(recipe.inputs)) {
        inv = removeFromInventory(inv, itemId, amount);
        if (!inv) {
          return {
            ...state,
            log: appendLog(state.log, 'log.notEnoughMaterials', 'error'),
          };
        }
      }
      inv = addToInventory(inv, recipe.output, recipe.amount);
      if (!inv) {
        return {
          ...state,
          log: appendLog(state.log, 'log.inventoryFullShort', 'warning'),
        };
      }
      const outputItem = ITEMS[recipe.output];
      return {
        ...state,
        inventory: inv,
        craftedItems: [...new Set([...state.craftedItems, recipe.output])],
        stats: { ...state.stats, itemsCrafted: state.stats.itemsCrafted + 1 },
        log: appendLog(state.log, 'log.crafted', 'success', { amount: recipe.amount, emoji: outputItem.emoji, itemId: recipe.output }),
      };
    }

    case 'EQUIP': {
      const itemId = action.payload;
      const inv = removeFromInventory(state.inventory, itemId, 1);
      if (!inv) return state;
      return {
        ...state,
        inventory: inv,
        equipment: [...state.equipment, itemId],
        log: appendLog(state.log, 'log.equipped', 'info', { emoji: ITEMS[itemId].emoji, itemId }),
      };
    }

    case 'DISCARD': {
      const { itemId, amount } = action.payload;
      const inv = removeFromInventory(state.inventory, itemId, amount);
      if (!inv) return state;
      return {
        ...state,
        inventory: inv,
        log: appendLog(state.log, 'log.discarded', 'warning', { amount, itemId }),
      };
    }

    case 'ADD_LOG':
      return {
        ...state,
        log: appendLog(state.log, action.payload.key, action.payload.type, action.payload.params),
      };

    case 'BATTLE_REWARDS': {
      let inv: Record<string, number> = { ...state.inventory };
      const added: string[] = [];
      for (const reward of action.payload) {
        const result = addToInventory(inv, reward.itemId, reward.amount);
        if (result) {
          inv = result;
          const item = ITEMS[reward.itemId];
          if (item) added.push(`${reward.amount}x ${item.emoji}`);
        }
      }
      const logMsg = added.length > 0 ? added.join(', ') : '';
      return {
        ...state,
        inventory: inv,
        stats: { ...state.stats, itemsMined: state.stats.itemsMined + action.payload.reduce((s: number, r: BattleReward) => s + r.amount, 0) },
        log: added.length > 0
          ? appendLog(state.log, 'log.battleRewards', 'success', { items: logMsg })
          : state.log,
      };
    }

    default:
      return state;
  }
}

interface MineFlags {
  hasDrill: boolean;
  hasElectricPickaxe: boolean;
  hasPickaxe: boolean;
}

function calculateMineAmount({ hasDrill, hasElectricPickaxe, hasPickaxe }: MineFlags): number {
  if (hasDrill) return Math.random() < 0.5 ? 3 : 2;
  if (hasElectricPickaxe) return Math.random() < 0.5 ? 3 : 2;
  if (hasPickaxe) return Math.random() < 0.5 ? 2 : 1;
  return 1;
}

/**
 * Global game context provider.
 */
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const savedPlayer = useQuery(api.players.getMyPlayer);
  const saveState = useMutation(api.players.saveGameState);

  const hasLoaded = useRef(false);
  const skipNextSync = useRef(false);
  const mineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const travelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (mineTimeoutRef.current) clearTimeout(mineTimeoutRef.current);
      if (travelTimeoutRef.current) clearTimeout(travelTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (savedPlayer === undefined) return;
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    skipNextSync.current = true;
    if (savedPlayer !== null) {
      dispatch({ type: 'LOAD_SAVED', payload: savedPlayer });
    }
  }, [savedPlayer]);

  useEffect(() => {
    if (!hasLoaded.current) return;
    if (state.isMining || state.isTraveling) return;

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    saveState({
      currentPlanetId: state.currentPlanet.id,
      discoveredPlanets: state.discoveredPlanets,
      inventory: state.inventory,
      equipment: state.equipment,
      craftedItems: state.craftedItems,
      stats: state.stats,
    }).catch((error) => {
      console.error('Failed to save game state:', error);
    });
  }, [
    state.inventory,
    state.equipment,
    state.craftedItems,
    state.discoveredPlanets,
    state.currentPlanet,
    state.stats,
    state.isMining,
    state.isTraveling,
    saveState,
  ]);

  const mine = useCallback(() => {
    if (state.isMining || state.isTraveling) return;
    dispatch({ type: 'MINE_START' });

    const planet = state.currentPlanet;
    const hasPickaxe = state.equipment.includes('space-pickaxe');
    const hasElectricPickaxe = state.equipment.includes('electric-pickaxe');
    const hasDrill = state.equipment.includes('quantum-drill');
    const hasScanner = state.equipment.includes('scanner');

    const cooldown = hasElectricPickaxe ? ELECTRIC_PICKAXE_COOLDOWN_MS : MINE_COOLDOWN_MS;

    mineTimeoutRef.current = setTimeout(() => {
      const roll = Math.random();
      if (roll < MINE_FAIL_CHANCE && !hasScanner) {
        dispatch({ type: 'MINE_FAIL' });
        return;
      }

      const resources = planet.resources;
      const weights = resources.map(r => {
        const rarity = ITEMS[r].rarity;
        if (rarity === 'rare') return hasScanner ? RARE_WEIGHT_WITH_SCANNER : RARE_WEIGHT;
        if (rarity === 'uncommon') return UNCOMMON_WEIGHT;
        return COMMON_WEIGHT;
      });
      const total = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * total;
      let chosen = resources[0];
      for (let i = 0; i < resources.length; i++) {
        rand -= weights[i];
        if (rand <= 0) { chosen = resources[i]; break; }
      }

      const amount = calculateMineAmount({ hasDrill, hasElectricPickaxe, hasPickaxe });
      dispatch({ type: 'MINE_COMPLETE', payload: { itemId: chosen, amount } });
    }, cooldown);
  }, [state.isMining, state.isTraveling, state.currentPlanet, state.equipment]);

  const travel = useCallback((planetId: string) => {
    if (state.isTraveling || state.isMining) return;
    if (state.currentPlanet.id === planetId) return;
    dispatch({ type: 'TRAVEL_START', payload: planetId });

    const hasJetpack = state.equipment.includes('jetpack');
    const hasWarp = state.equipment.includes('warp-drive');
    const time = hasWarp ? 500 : hasJetpack ? 1500 : TRAVEL_TIME_MS;

    travelTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'TRAVEL_COMPLETE', payload: planetId });
    }, time);
  }, [state.isTraveling, state.isMining, state.currentPlanet, state.equipment]);

  const craft = useCallback((recipe: Recipe) => {
    dispatch({ type: 'CRAFT', payload: recipe });
  }, []);

  const equip = useCallback((itemId: string) => {
    dispatch({ type: 'EQUIP', payload: itemId });
  }, []);

  const discard = useCallback((itemId: string, amount = 1) => {
    dispatch({ type: 'DISCARD', payload: { itemId, amount } });
  }, []);

  const canCraft = useCallback((recipe: Recipe): boolean => {
    for (const [itemId, amount] of Object.entries(recipe.inputs)) {
      if (getItemCount(state.inventory, itemId) < amount) return false;
    }
    return true;
  }, [state.inventory]);

  const addBattleRewards = useCallback((rewards: BattleReward[]) => {
    dispatch({ type: 'BATTLE_REWARDS', payload: rewards });
  }, []);

  return (
    <GameContext.Provider value={{
      ...state,
      mine, travel, craft, equip, discard, canCraft, addBattleRewards,
    }}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Hook to access the game context.
 * Must be used within a component wrapped by {@link GameProvider}.
 *
 * @throws {Error} If used outside of GameProvider.
 */
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
