import { describe, expect, it } from 'vitest';
import { RECIPES } from '../data/gameData';
import { __testUtils } from './GameContext';

const { initialState, gameReducer } = __testUtils;

describe('GameContext reducer', () => {
  it('sanitizes unknown saved items when loading state', () => {
    const next = gameReducer(initialState, {
      type: 'LOAD_SAVED',
      payload: {
        currentPlanetId: 'terra-nova',
        discoveredPlanets: ['terra-nova', 'glacius'],
        inventory: { 'iron-ore': 2, 'not-real-item': 99 },
        equipment: ['scanner', 'not-real-item'],
        craftedItems: ['scanner', 'not-real-item'],
        stats: { itemsMined: 10, itemsCrafted: 2, planetsVisited: 2 },
      },
    });

    expect(next.inventory).toEqual({ 'iron-ore': 2 });
    expect(next.equipment).toEqual(['scanner']);
    expect(next.craftedItems).toEqual(['scanner']);
    expect(next.log[0]?.key).toBe('log.welcomeBack');
  });

  it('crafts recipe consuming inputs and updating stats', () => {
    const recipe = RECIPES.find((r) => r.id === 'smelt-iron');
    expect(recipe).toBeDefined();

    const withMaterials = {
      ...initialState,
      inventory: { 'iron-ore': 2, coal: 1 },
      craftedItems: [],
    };

    const next = gameReducer(withMaterials, {
      type: 'CRAFT',
      payload: recipe!,
    });

    expect(next.inventory).toEqual({ 'iron-bar': 1 });
    expect(next.craftedItems).toContain('iron-bar');
    expect(next.stats.itemsCrafted).toBe(initialState.stats.itemsCrafted + 1);
    expect(next.log[0]?.key).toBe('log.crafted');
  });

  it('adds battle rewards and increments mined stats', () => {
    const rewards = [
      { itemId: 'iron-ore', amount: 2 },
      { itemId: 'coal', amount: 1 },
    ];

    const next = gameReducer(initialState, {
      type: 'BATTLE_REWARDS',
      payload: rewards,
    });

    expect(next.inventory).toEqual({ 'iron-ore': 2, coal: 1 });
    expect(next.stats.itemsMined).toBe(initialState.stats.itemsMined + 3);
    expect(next.log[0]?.key).toBe('log.battleRewards');
  });
});
