import { describe, expect, it } from 'vitest';
import { ITEMS, isAvatarArtifact, isEquippableItem } from './gameData';

describe('gameData helpers', () => {
  it('identifies avatar artifacts correctly', () => {
    expect(isAvatarArtifact('solar-crown')).toBe(true);
    expect(isAvatarArtifact('scanner')).toBe(false);
    expect(isAvatarArtifact('missing-item')).toBe(false);
  });

  it('identifies equippable items correctly', () => {
    expect(isEquippableItem('scanner')).toBe(true);
    expect(isEquippableItem('jetpack')).toBe(true);
    expect(isEquippableItem('solar-crown')).toBe(true);
    expect(isEquippableItem('coal')).toBe(false);
    expect(isEquippableItem('missing-item')).toBe(false);
  });

  it('keeps item definitions consistent for known IDs', () => {
    expect(ITEMS['scanner']).toMatchObject({ type: 'tool', rarity: 'uncommon' });
    expect(ITEMS['solar-crown']).toMatchObject({ type: 'artifact', avatarSlot: 'head' });
  });
});
