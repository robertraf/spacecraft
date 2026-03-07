import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { PLANETS, ITEMS, RECIPES, INVENTORY_SIZE, TRAVEL_TIME_MS, MINE_COOLDOWN_MS } from '../data/gameData';

const GameContext = createContext(null);

const initialState = {
  currentPlanet: PLANETS[0],
  inventory: {},
  craftedItems: [],
  discoveredPlanets: ['terra-nova'],
  equipment: [],
  isTraveling: false,
  isMining: false,
  travelTarget: null,
  log: [{ text: '¡Bienvenido al espacio, explorador! Estás en Terra Nova.', type: 'info' }],
  stats: { itemsMined: 0, itemsCrafted: 0, planetsVisited: 1 },
};

function getItemCount(inventory, itemId) {
  return inventory[itemId] || 0;
}

function addToInventory(inventory, itemId, amount = 1) {
  const totalItems = Object.values(inventory).reduce((sum, n) => sum + n, 0);
  if (totalItems + amount > INVENTORY_SIZE) return null;
  return { ...inventory, [itemId]: (inventory[itemId] || 0) + amount };
}

function removeFromInventory(inventory, itemId, amount = 1) {
  const current = inventory[itemId] || 0;
  if (current < amount) return null;
  const next = { ...inventory };
  next[itemId] = current - amount;
  if (next[itemId] === 0) delete next[itemId];
  return next;
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'LOAD_SAVED': {
      const { currentPlanetId, discoveredPlanets, inventory, equipment, craftedItems, stats } = action.payload;
      const planet = PLANETS.find(p => p.id === currentPlanetId) || PLANETS[0];
      return {
        ...initialState,
        currentPlanet: planet,
        discoveredPlanets,
        inventory,
        equipment,
        craftedItems,
        stats,
        log: [{ text: '¡Bienvenido de vuelta! Tu progreso ha sido restaurado.', type: 'info' }],
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
          log: [{ text: '¡Inventario lleno! Craftea o descarta items.', type: 'warning' }, ...state.log].slice(0, 50),
        };
      }
      const item = ITEMS[itemId];
      return {
        ...state,
        isMining: false,
        inventory: newInv,
        stats: { ...state.stats, itemsMined: state.stats.itemsMined + amount },
        log: [{ text: `Minaste ${amount}x ${item.emoji} ${item.name}`, type: 'success' }, ...state.log].slice(0, 50),
      };
    }

    case 'MINE_FAIL':
      return {
        ...state,
        isMining: false,
        log: [{ text: '¡No encontraste nada esta vez!', type: 'warning' }, ...state.log].slice(0, 50),
      };

    case 'TRAVEL_START':
      return { ...state, isTraveling: true, travelTarget: action.payload };

    case 'TRAVEL_COMPLETE': {
      const planet = PLANETS.find(p => p.id === action.payload);
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
        log: [{ text: `Llegaste a ${planet.emoji} ${planet.name}`, type: 'info' }, ...state.log].slice(0, 50),
      };
    }

    case 'CRAFT': {
      const recipe = action.payload;
      let inv = { ...state.inventory };
      for (const [itemId, amount] of Object.entries(recipe.inputs)) {
        inv = removeFromInventory(inv, itemId, amount);
        if (!inv) {
          return {
            ...state,
            log: [{ text: 'No tienes suficientes materiales.', type: 'error' }, ...state.log].slice(0, 50),
          };
        }
      }
      inv = addToInventory(inv, recipe.output, recipe.amount);
      if (!inv) {
        return {
          ...state,
          log: [{ text: '¡Inventario lleno!', type: 'warning' }, ...state.log].slice(0, 50),
        };
      }
      const outputItem = ITEMS[recipe.output];
      return {
        ...state,
        inventory: inv,
        craftedItems: [...new Set([...state.craftedItems, recipe.output])],
        stats: { ...state.stats, itemsCrafted: state.stats.itemsCrafted + 1 },
        log: [{ text: `Crafteaste ${recipe.amount}x ${outputItem.emoji} ${outputItem.name}!`, type: 'success' }, ...state.log].slice(0, 50),
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
        log: [{ text: `Equipaste ${ITEMS[itemId].emoji} ${ITEMS[itemId].name}`, type: 'info' }, ...state.log].slice(0, 50),
      };
    }

    case 'DISCARD': {
      const { itemId, amount } = action.payload;
      const inv = removeFromInventory(state.inventory, itemId, amount);
      if (!inv) return state;
      return {
        ...state,
        inventory: inv,
        log: [{ text: `Descartaste ${amount}x ${ITEMS[itemId].name}`, type: 'warning' }, ...state.log].slice(0, 50),
      };
    }

    case 'ADD_LOG':
      return {
        ...state,
        log: [action.payload, ...state.log].slice(0, 50),
      };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const savedPlayer = useQuery(api.players.getMyPlayer);
  const saveState = useMutation(api.players.saveGameState);

  // Simple load-once: GameProvider remounts (via key in App.jsx) on auth change,
  // so we only need to load once per mount.
  const hasLoaded = useRef(false);
  const skipNextSync = useRef(false);

  useEffect(() => {
    if (savedPlayer === undefined) return; // still loading
    if (hasLoaded.current) return; // already loaded this mount
    hasLoaded.current = true;
    if (savedPlayer !== null) {
      skipNextSync.current = true;
      dispatch({ type: 'LOAD_SAVED', payload: savedPlayer });
    }
  }, [savedPlayer]);

  // Sync to Convex after significant state changes
  useEffect(() => {
    if (!hasLoaded.current) return; // don't sync before initial load
    if (state.isMining || state.isTraveling) return; // don't sync mid-action

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

    const cooldown = hasElectricPickaxe ? 800 : MINE_COOLDOWN_MS;

    setTimeout(() => {
      const roll = Math.random();
      if (roll < 0.1 && !hasScanner) {
        dispatch({ type: 'MINE_FAIL' });
        return;
      }

      const resources = planet.resources;
      let weights = resources.map(r => {
        const rarity = ITEMS[r].rarity;
        if (rarity === 'rare') return hasScanner ? 20 : 5;
        if (rarity === 'uncommon') return 25;
        return 50;
      });
      const total = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * total;
      let chosen = resources[0];
      for (let i = 0; i < resources.length; i++) {
        rand -= weights[i];
        if (rand <= 0) { chosen = resources[i]; break; }
      }

      let amount = 1;
      if (hasDrill) amount = Math.random() < 0.5 ? 3 : 2;
      else if (hasElectricPickaxe) amount = Math.random() < 0.5 ? 3 : 2;
      else if (hasPickaxe) amount = Math.random() < 0.5 ? 2 : 1;

      dispatch({ type: 'MINE_COMPLETE', payload: { itemId: chosen, amount } });
    }, cooldown);
  }, [state.isMining, state.isTraveling, state.currentPlanet, state.equipment]);

  const travel = useCallback((planetId) => {
    if (state.isTraveling || state.isMining) return;
    if (state.currentPlanet.id === planetId) return;
    dispatch({ type: 'TRAVEL_START', payload: planetId });

    const hasJetpack = state.equipment.includes('jetpack');
    const hasWarp = state.equipment.includes('warp-drive');
    const time = hasWarp ? 500 : hasJetpack ? 1500 : TRAVEL_TIME_MS;

    setTimeout(() => {
      dispatch({ type: 'TRAVEL_COMPLETE', payload: planetId });
    }, time);
  }, [state.isTraveling, state.isMining, state.currentPlanet, state.equipment]);

  const craft = useCallback((recipe) => {
    dispatch({ type: 'CRAFT', payload: recipe });
  }, []);

  const equip = useCallback((itemId) => {
    dispatch({ type: 'EQUIP', payload: itemId });
  }, []);

  const discard = useCallback((itemId, amount = 1) => {
    dispatch({ type: 'DISCARD', payload: { itemId, amount } });
  }, []);

  const canCraft = useCallback((recipe) => {
    for (const [itemId, amount] of Object.entries(recipe.inputs)) {
      if (getItemCount(state.inventory, itemId) < amount) return false;
    }
    return true;
  }, [state.inventory]);

  return (
    <GameContext.Provider value={{
      ...state,
      mine, travel, craft, equip, discard, canCraft,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
