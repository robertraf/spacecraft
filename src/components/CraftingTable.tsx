/**
 * @fileoverview Crafting table component.
 *
 * Displays all available recipes with their required ingredients
 * and allows crafting items when the player has the necessary materials.
 *
 * @module CraftingTable
 */

import { useTranslation } from 'react-i18next';
import { ITEMS, RECIPES, isEquippableItem, type ItemType, type Recipe } from '../data/gameData';
import { useGame } from '../context/GameContext';
import { useHaptics } from '../hooks/useHaptics';

const CRAFTING_CATEGORY_ORDER: ItemType[] = ['material', 'tool', 'equipment', 'artifact'];

const CRAFTING_CATEGORY_ICON: Record<ItemType, string> = {
  resource: '🪨',
  material: '🧰',
  tool: '⛏️',
  equipment: '🛰️',
  artifact: '✨',
};

export default function CraftingTable() {
  const { inventory, equipment, canCraft, craft } = useGame();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const recipesByCategory = RECIPES.reduce<Record<ItemType, Recipe[]>>((grouped, recipe) => {
    const category = ITEMS[recipe.output]?.type ?? 'material';
    grouped[category] = [...(grouped[category] ?? []), recipe];
    return grouped;
  }, { resource: [], material: [], tool: [], equipment: [], artifact: [] });

  const isAlreadyOwned = (itemId: string): boolean => {
    return (inventory[itemId] ?? 0) > 0 || equipment.includes(itemId);
  };

  const handleCraft = (recipe: Recipe) => {
    if (canCraft(recipe)) {
      haptics.craft();
      craft(recipe);
    } else {
      haptics.error();
    }
  };

  return (
    <div className="crafting-table">
      <h3>🔧 {t('crafting.title')}</h3>
      <div className="crafting-groups">
        {CRAFTING_CATEGORY_ORDER.map((category) => {
          const recipes = recipesByCategory[category];
          if (recipes.length === 0) return null;

          return (
            <section key={category} className="crafting-group">
              <div className="crafting-group-header">
                <h4>
                  <span>{CRAFTING_CATEGORY_ICON[category]}</span>
                  <span>{t(`crafting.categories.${category}`)}</span>
                </h4>
                <span className="crafting-group-count">{recipes.length}</span>
              </div>

              <div className="recipes-list">
                {recipes.map(recipe => {
                  const output = ITEMS[recipe.output];
                  const craftable = canCraft(recipe);
                  const isEquippable = isEquippableItem(recipe.output);
                  const owned = isEquippable && isAlreadyOwned(recipe.output);
                  const disabled = owned || !craftable;

                  return (
                    <div
                      key={recipe.id}
                      className={`recipe-card ${craftable ? 'craftable' : 'locked'} ${owned ? 'owned' : ''}`}
                    >
                      <div className="recipe-output">
                        <span className={`output-icon rarity-border-${output.rarity}`}>
                          {output.emoji}
                        </span>
                        <div className="output-info">
                          <span className="output-name">
                            {t(`items.${recipe.output}.name`)}
                            {owned && <span className="owned-badge">{t('crafting.ownedBadge')}</span>}
                          </span>
                          <span className={`output-rarity rarity-text-${output.rarity}`}>{output.rarity}</span>
                          {output.hasEffect && <span className="output-effect">{t(`items.${recipe.output}.effect`)}</span>}
                        </div>
                      </div>
                      <div className="recipe-inputs">
                        {Object.entries(recipe.inputs).map(([itemId, needed]) => {
                          const item = ITEMS[itemId];
                          const have = inventory[itemId] ?? 0;
                          const enough = have >= needed;
                          return (
                            <span key={itemId} className={`recipe-ingredient ${enough ? 'have' : 'need'}`}>
                              {item.emoji} {have}/{needed}
                            </span>
                          );
                        })}
                      </div>
                      <button
                        className={`craft-button ${owned ? 'owned' : ''}`}
                        onClick={() => handleCraft(recipe)}
                        disabled={disabled}
                      >
                        {owned
                          ? `✅ ${t('crafting.alreadyOwned')}`
                          : craftable
                            ? `⚒️ ${t('crafting.craft')}`
                            : `🔒 ${t('crafting.missingMaterials')}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
