/**
 * @fileoverview Contexto global del juego SpaceCraft.
 *
 * Implementa el patrón React Context + useReducer para manejar todo el estado
 * del juego: inventario, planeta actual, equipamiento, crafteo, viaje y minería.
 * Sincroniza automáticamente el estado con el backend de Convex después de
 * acciones significativas.
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
} from '../data/gameData';

/**
 * @typedef {Object} GameState
 * @property {import('../data/gameData').Planet} currentPlanet - Planeta actual del jugador.
 * @property {Record<string, number>} inventory - Mapa de itemId a cantidad en inventario.
 * @property {string[]} craftedItems - IDs de items que el jugador ha crafteado al menos una vez.
 * @property {string[]} discoveredPlanets - IDs de planetas descubiertos.
 * @property {string[]} equipment - IDs de items equipados actualmente.
 * @property {boolean} isTraveling - Indica si el jugador esta viajando.
 * @property {boolean} isMining - Indica si el jugador esta minando.
 * @property {string|null} travelTarget - ID del planeta destino, o null.
 * @property {Array<{text: string, type: string}>} log - Historial de acciones del juego.
 * @property {{itemsMined: number, itemsCrafted: number, planetsVisited: number}} stats - Estadisticas acumuladas.
 */

/** @type {import('react').Context<GameState|null>} */
const GameContext = createContext(null);

/** @type {GameState} */
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

/**
 * Obtiene la cantidad de un item en el inventario.
 *
 * @param {Record<string, number>} inventory - Inventario actual.
 * @param {string} itemId - ID del item a consultar.
 * @returns {number} Cantidad del item (0 si no existe).
 */
function getItemCount(inventory, itemId) {
  return inventory[itemId] || 0;
}

/**
 * Agrega una cantidad de un item al inventario respetando el limite de capacidad.
 *
 * @param {Record<string, number>} inventory - Inventario actual (inmutable).
 * @param {string} itemId - ID del item a agregar.
 * @param {number} [amount=1] - Cantidad a agregar.
 * @returns {Record<string, number>|null} Nuevo inventario o `null` si excede la capacidad.
 */
function addToInventory(inventory, itemId, amount = 1) {
  const totalItems = Object.values(inventory).reduce((sum, n) => sum + n, 0);
  if (totalItems + amount > INVENTORY_SIZE) return null;
  return { ...inventory, [itemId]: (inventory[itemId] || 0) + amount };
}

/**
 * Remueve una cantidad de un item del inventario.
 * Elimina la clave del inventario si la cantidad llega a cero.
 *
 * @param {Record<string, number>} inventory - Inventario actual (inmutable).
 * @param {string} itemId - ID del item a remover.
 * @param {number} [amount=1] - Cantidad a remover.
 * @returns {Record<string, number>|null} Nuevo inventario o `null` si no hay suficientes items.
 */
function removeFromInventory(inventory, itemId, amount = 1) {
  const current = inventory[itemId] || 0;
  if (current < amount) return null;
  const next = { ...inventory };
  next[itemId] = current - amount;
  if (next[itemId] === 0) delete next[itemId];
  return next;
}

/**
 * Agrega una entrada al log del juego, manteniendo el limite de {@link MAX_LOG_ENTRIES}.
 *
 * @param {Array<{text: string, type: string}>} log - Log actual.
 * @param {string} text - Texto del mensaje.
 * @param {string} type - Tipo de mensaje ('info'|'success'|'warning'|'error').
 * @returns {Array<{text: string, type: string}>} Nuevo log con la entrada al inicio.
 */
function appendLog(log, text, type) {
  return [{ text, type }, ...log].slice(0, MAX_LOG_ENTRIES);
}

/**
 * Reducer principal del juego. Procesa todas las acciones que modifican el estado.
 *
 * @param {GameState} state - Estado actual.
 * @param {{type: string, payload?: *}} action - Accion despachada.
 * @returns {GameState} Nuevo estado.
 */
function gameReducer(state, action) {
  switch (action.type) {
    case 'LOAD_SAVED': {
      const { currentPlanetId, discoveredPlanets, inventory, equipment, craftedItems, stats } = action.payload;
      const planet = PLANETS.find(p => p.id === currentPlanetId) || PLANETS[0];
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
          log: appendLog(state.log, '¡Inventario lleno! Craftea o descarta items.', 'warning'),
        };
      }
      const item = ITEMS[itemId];
      return {
        ...state,
        isMining: false,
        inventory: newInv,
        stats: { ...state.stats, itemsMined: state.stats.itemsMined + amount },
        log: appendLog(state.log, `Minaste ${amount}x ${item.emoji} ${item.name}`, 'success'),
      };
    }

    case 'MINE_FAIL':
      return {
        ...state,
        isMining: false,
        log: appendLog(state.log, '¡No encontraste nada esta vez!', 'warning'),
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
        log: appendLog(state.log, `Llegaste a ${planet.emoji} ${planet.name}`, 'info'),
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
            log: appendLog(state.log, 'No tienes suficientes materiales.', 'error'),
          };
        }
      }
      inv = addToInventory(inv, recipe.output, recipe.amount);
      if (!inv) {
        return {
          ...state,
          log: appendLog(state.log, '¡Inventario lleno!', 'warning'),
        };
      }
      const outputItem = ITEMS[recipe.output];
      return {
        ...state,
        inventory: inv,
        craftedItems: [...new Set([...state.craftedItems, recipe.output])],
        stats: { ...state.stats, itemsCrafted: state.stats.itemsCrafted + 1 },
        log: appendLog(state.log, `Crafteaste ${recipe.amount}x ${outputItem.emoji} ${outputItem.name}!`, 'success'),
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
        log: appendLog(state.log, `Equipaste ${ITEMS[itemId].emoji} ${ITEMS[itemId].name}`, 'info'),
      };
    }

    case 'DISCARD': {
      const { itemId, amount } = action.payload;
      const inv = removeFromInventory(state.inventory, itemId, amount);
      if (!inv) return state;
      return {
        ...state,
        inventory: inv,
        log: appendLog(state.log, `Descartaste ${amount}x ${ITEMS[itemId].name}`, 'warning'),
      };
    }

    case 'ADD_LOG':
      return {
        ...state,
        log: appendLog(state.log, action.payload.text, action.payload.type),
      };

    default:
      return state;
  }
}

/**
 * Calcula la cantidad de recursos obtenidos al minar segun el equipo del jugador.
 *
 * @param {Object} flags - Flags de equipo del jugador.
 * @param {boolean} flags.hasDrill - Tiene taladro cuantico equipado.
 * @param {boolean} flags.hasElectricPickaxe - Tiene pico electrico equipado.
 * @param {boolean} flags.hasPickaxe - Tiene pico espacial equipado.
 * @returns {number} Cantidad de recursos a obtener.
 */
function calculateMineAmount({ hasDrill, hasElectricPickaxe, hasPickaxe }) {
  if (hasDrill) return Math.random() < 0.5 ? 3 : 2;
  if (hasElectricPickaxe) return Math.random() < 0.5 ? 3 : 2;
  if (hasPickaxe) return Math.random() < 0.5 ? 2 : 1;
  return 1;
}

/**
 * Proveedor del contexto global del juego.
 *
 * Envuelve a los componentes hijos con el estado del juego y las acciones
 * disponibles (minar, viajar, craftear, equipar, descartar).
 * Sincroniza automaticamente el estado con Convex cuando cambia.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.children - Componentes hijos.
 * @returns {import('react').JSX.Element}
 */
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const savedPlayer = useQuery(api.players.getMyPlayer);
  const saveState = useMutation(api.players.saveGameState);

  const hasLoaded = useRef(false);
  const skipNextSync = useRef(false);
  const mineTimeoutRef = useRef(null);
  const travelTimeoutRef = useRef(null);

  // Limpieza de timeouts al desmontar para evitar memory leaks
  useEffect(() => {
    return () => {
      if (mineTimeoutRef.current) clearTimeout(mineTimeoutRef.current);
      if (travelTimeoutRef.current) clearTimeout(travelTimeoutRef.current);
    };
  }, []);

  // Carga unica del estado guardado al montar el componente
  useEffect(() => {
    if (savedPlayer === undefined) return;
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    skipNextSync.current = true;
    if (savedPlayer !== null) {
      dispatch({ type: 'LOAD_SAVED', payload: savedPlayer });
    }
  }, [savedPlayer]);

  // Sincronizacion reactiva con Convex despues de cambios significativos
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

  /**
   * Inicia la accion de minar en el planeta actual.
   * Calcula el resultado despues de un cooldown basado en el equipo.
   * No hace nada si ya se esta minando o viajando.
   */
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

  /**
   * Inicia el viaje a otro planeta.
   * El tiempo de viaje depende del equipo (Warp Drive > Jetpack > base).
   *
   * @param {string} planetId - ID del planeta destino.
   */
  const travel = useCallback((planetId) => {
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

  /**
   * Ejecuta una receta de crafteo.
   * @param {import('../data/gameData').Recipe} recipe - Receta a ejecutar.
   */
  const craft = useCallback((recipe) => {
    dispatch({ type: 'CRAFT', payload: recipe });
  }, []);

  /**
   * Equipa un item del inventario.
   * @param {string} itemId - ID del item a equipar.
   */
  const equip = useCallback((itemId) => {
    dispatch({ type: 'EQUIP', payload: itemId });
  }, []);

  /**
   * Descarta items del inventario.
   * @param {string} itemId - ID del item a descartar.
   * @param {number} [amount=1] - Cantidad a descartar.
   */
  const discard = useCallback((itemId, amount = 1) => {
    dispatch({ type: 'DISCARD', payload: { itemId, amount } });
  }, []);

  /**
   * Verifica si el jugador tiene los materiales necesarios para una receta.
   * @param {import('../data/gameData').Recipe} recipe - Receta a verificar.
   * @returns {boolean} `true` si se puede craftear.
   */
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

/**
 * Hook para acceder al contexto del juego.
 *
 * Debe usarse dentro de un componente envuelto por {@link GameProvider}.
 *
 * @returns {GameState & {mine: Function, travel: Function, craft: Function, equip: Function, discard: Function, canCraft: Function}}
 * @throws {Error} Si se usa fuera de GameProvider.
 */
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
