/**
 * @fileoverview Componente de inventario del jugador.
 *
 * Muestra los ítems recolectados, el equipo actual y permite
 * equipar herramientas o descartar ítems. Los ítems se ordenan
 * por rareza (legendario primero).
 *
 * @module Inventory
 */

import { ITEMS, INVENTORY_SIZE } from '../data/gameData';
import { useGame } from '../context/GameContext';
import { useHaptics } from '../hooks/useHaptics';

/** Orden de prioridad para ordenar ítems por rareza (menor = primero). */
const RARITY_SORT_ORDER = { legendary: 0, rare: 1, uncommon: 2, common: 3 };

/**
 * Panel de inventario con barra de capacidad, sección de equipo y grilla de ítems.
 *
 * Muestra la capacidad usada vs disponible, lista de ítems equipados con sus
 * efectos, y una grilla de todos los ítems en inventario con acciones de
 * equipar y descartar.
 *
 * @returns {import('react').JSX.Element}
 */
export default function Inventory() {
  const { inventory, equipment, equip, discard } = useGame();
  const haptics = useHaptics();

  const totalItems = Object.values(inventory).reduce((sum, n) => sum + n, 0);
  const entries = Object.entries(inventory).sort((a, b) => {
    const ra = ITEMS[a[0]]?.rarity || 'common';
    const rb = ITEMS[b[0]]?.rarity || 'common';
    return RARITY_SORT_ORDER[ra] - RARITY_SORT_ORDER[rb];
  });

  /**
   * Equipa un ítem con feedback háptico.
   * @param {string} itemId - ID del ítem a equipar.
   */
  const handleEquip = (itemId) => {
    haptics.equip();
    equip(itemId);
  };

  /**
   * Descarta un ítem con feedback háptico.
   * @param {string} itemId - ID del ítem a descartar.
   */
  const handleDiscard = (itemId) => {
    haptics.tap();
    discard(itemId, 1);
  };

  return (
    <div className="inventory">
      <h3>🎒 Inventario ({totalItems}/{INVENTORY_SIZE})</h3>
      <div className="inventory-bar">
        <div className="inventory-fill" style={{ width: `${(totalItems / INVENTORY_SIZE) * 100}%` }} />
      </div>

      {equipment.length > 0 && (
        <div className="equipment-section">
          <h4>Equipado:</h4>
          <div className="equipment-list">
            {equipment.map(id => (
              <span key={id} className="equipped-item">
                {ITEMS[id].emoji} {ITEMS[id].name}
                {ITEMS[id].effect && <span className="item-effect"> — {ITEMS[id].effect}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="inventory-grid">
        {entries.map(([itemId, count]) => {
          const item = ITEMS[itemId];
          if (!item) return null;
          const isEquippable = item.type === 'tool' || item.type === 'equipment';
          const alreadyEquipped = equipment.includes(itemId);

          return (
            <div key={itemId} className={`inventory-item rarity-${item.rarity}`}>
              <div className="item-header">
                <span className="item-icon">{item.emoji}</span>
                <span className="item-count">x{count}</span>
              </div>
              <span className="item-name">{item.name}</span>
              {item.effect && <span className="item-effect-text">{item.effect}</span>}
              <div className="item-actions">
                {isEquippable && !alreadyEquipped && (
                  <button className="btn-equip" onClick={() => handleEquip(itemId)}>Equipar</button>
                )}
                <button className="btn-discard" onClick={() => handleDiscard(itemId)}>🗑️</button>
              </div>
            </div>
          );
        })}
        {entries.length === 0 && (
          <p className="empty-inventory">Tu inventario está vacío. ¡Ve a minar!</p>
        )}
      </div>
    </div>
  );
}
