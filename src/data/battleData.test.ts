import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  GRID_COLS,
  calculateRewards,
  getEquipmentBonuses,
  getWaveConfig,
} from './battleData';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('battleData', () => {
  it('scales wave config with caps', () => {
    expect(getWaveConfig(1)).toEqual({ rows: 2, cols: 5, speedMultiplier: 0.92 });
    expect(getWaveConfig(10).rows).toBe(5);
    expect(getWaveConfig(10).cols).toBe(GRID_COLS - 2);
    expect(getWaveConfig(30).speedMultiplier).toBe(0.4);
  });

  it('applies equipment battle bonuses correctly', () => {
    const bonuses = getEquipmentBonuses([
      'space-pickaxe',
      'scanner',
      'electric-pickaxe',
      'shield-gen',
      'jetpack',
      'quantum-drill',
      'warp-drive',
    ]);

    expect(bonuses).toEqual({
      extraBullets: 1,
      piercing: true,
      extraLives: 1,
      shipSpeed: 2,
      damageMultiplier: 3,
      revealHidden: true,
      teleportCooldown: 10,
    });
  });

  it('calculates deterministic rewards when randomness is mocked', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.2);

    const rewards = calculateRewards(3, ['iron-ore', 'coal', 'diamond']);

    expect(rewards).toEqual([
      { itemId: 'iron-ore', amount: 3 },
      { itemId: 'diamond', amount: 2 },
    ]);
    expect(calculateRewards(0, ['iron-ore'])).toEqual([]);
  });
});
