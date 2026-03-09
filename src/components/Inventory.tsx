/**
 * @fileoverview Player inventory component.
 *
 * Displays collected items, current equipment, and allows
 * equipping tools or discarding items. Items are sorted
 * by rarity (legendary first).
 *
 * @module Inventory
 */

import { useTranslation } from 'react-i18next';
import { ITEMS, INVENTORY_SIZE, isAvatarArtifact, isEquippableItem, type Rarity } from '../data/gameData';
import { useGame } from '../context/useGame';
import { useHaptics } from '../hooks/useHaptics';

const RARITY_SORT_ORDER: Record<Rarity, number> = { legendary: 0, rare: 1, uncommon: 2, common: 3 };

export default function Inventory() {
  const { inventory, equipment, equip, unequip, discard } = useGame();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const totalItems = Object.values(inventory).reduce((sum, n) => sum + n, 0);
  const entries = Object.entries(inventory).sort((a, b) => {
    const ra: Rarity = (ITEMS[a[0]]?.rarity as Rarity) ?? 'common';
    const rb: Rarity = (ITEMS[b[0]]?.rarity as Rarity) ?? 'common';
    return RARITY_SORT_ORDER[ra] - RARITY_SORT_ORDER[rb];
  });

  const handleEquip = (itemId: string) => {
    haptics.equip();
    equip(itemId);
  };

  const handleDiscard = (itemId: string) => {
    haptics.tap();
    discard(itemId, 1);
  };

  const handleUnequip = (itemId: string) => {
    haptics.tap();
    unequip(itemId);
  };

  return (
    <div className="inventory">
      <h3>🎒 {t('inventory.title', { count: totalItems, max: INVENTORY_SIZE })}</h3>
      <div className="inventory-bar">
        <div className="inventory-fill" style={{ width: `${(totalItems / INVENTORY_SIZE) * 100}%` }} />
      </div>

      {equipment.length > 0 && (
        <div className="equipment-section">
          <h4>{t('inventory.equipped')}</h4>
          <div className="equipment-list">
            {equipment.map(id => (
              <div key={id} className="equipped-item-row">
                <span className="equipped-item">
                  {ITEMS[id].emoji} {t(`items.${id}.name`)}
                  {isAvatarArtifact(id) && ITEMS[id].avatarSlot && (
                    <span className="item-effect"> [{t(`avatar.slots.${ITEMS[id].avatarSlot}`)}]</span>
                  )}
                  {ITEMS[id].hasEffect && <span className="item-effect"> — {t(`items.${id}.effect`)}</span>}
                </span>
                <button className="btn-equip" onClick={() => handleUnequip(id)}>{t('inventory.unequip')}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="inventory-grid">
        {entries.map(([itemId, count]) => {
          const item = ITEMS[itemId];
          if (!item) return null;
          const isEquippable = isEquippableItem(itemId);
          const alreadyEquipped = equipment.includes(itemId);

          return (
            <div key={itemId} className={`inventory-item rarity-${item.rarity}`}>
              <div className="item-header">
                <span className="item-icon">{item.emoji}</span>
                <span className="item-count">x{count}</span>
              </div>
              <span className="item-name">{t(`items.${itemId}.name`)}</span>
              {isAvatarArtifact(itemId) && item.avatarSlot && (
                <span className="item-effect-text">{t('avatar.slot')}: {t(`avatar.slots.${item.avatarSlot}`)}</span>
              )}
              {item.hasEffect && <span className="item-effect-text">{t(`items.${itemId}.effect`)}</span>}
              <div className="item-actions">
                {isEquippable && !alreadyEquipped && (
                  <button className="btn-equip" onClick={() => handleEquip(itemId)}>{t('inventory.equip')}</button>
                )}
                {isEquippable && alreadyEquipped && (
                  <button className="btn-equip" onClick={() => handleUnequip(itemId)}>{t('inventory.unequip')}</button>
                )}
                <button className="btn-discard" onClick={() => handleDiscard(itemId)}>🗑️</button>
              </div>
            </div>
          );
        })}
        {entries.length === 0 && (
          <p className="empty-inventory">{t('inventory.empty')}</p>
        )}
      </div>
    </div>
  );
}
