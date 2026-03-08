/**
 * @fileoverview Crafting table component.
 *
 * Displays all available recipes with their required ingredients
 * and allows crafting items when the player has the necessary materials.
 *
 * @module CraftingTable
 */

import { useTranslation } from 'react-i18next';
import { ITEMS, RECIPES, type Recipe } from '../data/gameData';
import { useGame } from '../context/GameContext';
import { useHaptics } from '../hooks/useHaptics';

export default function CraftingTable() {
  const { inventory, canCraft, craft } = useGame();
  const { t } = useTranslation();
  const haptics = useHaptics();

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
      <div className="recipes-list">
        {RECIPES.map(recipe => {
          const output = ITEMS[recipe.output];
          const craftable = canCraft(recipe);

          return (
            <div key={recipe.id} className={`recipe-card ${craftable ? 'craftable' : 'locked'}`}>
              <div className="recipe-output">
                <span className={`output-icon rarity-border-${output.rarity}`}>
                  {output.emoji}
                </span>
                <div className="output-info">
                  <span className="output-name">{t(`items.${recipe.output}.name`)}</span>
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
                className="craft-button"
                onClick={() => handleCraft(recipe)}
                disabled={!craftable}
              >
                {craftable ? `⚒️ ${t('crafting.craft')}` : `🔒 ${t('crafting.missingMaterials')}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
