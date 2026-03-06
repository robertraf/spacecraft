import { ITEMS, RECIPES, RARITY_COLORS } from '../data/gameData';
import { useGame } from '../context/GameContext';
import { useHaptics } from '../hooks/useHaptics';

export default function CraftingTable() {
  const { inventory, canCraft, craft } = useGame();
  const haptics = useHaptics();

  const handleCraft = (recipe) => {
    if (canCraft(recipe)) {
      haptics.craft();
      craft(recipe);
    } else {
      haptics.error();
    }
  };

  return (
    <div className="crafting-table">
      <h3>🔧 Mesa de Crafteo</h3>
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
                  <span className="output-name">{output.name}</span>
                  <span className={`output-rarity rarity-text-${output.rarity}`}>{output.rarity}</span>
                  {output.effect && <span className="output-effect">{output.effect}</span>}
                </div>
              </div>
              <div className="recipe-inputs">
                {Object.entries(recipe.inputs).map(([itemId, needed]) => {
                  const item = ITEMS[itemId];
                  const have = inventory[itemId] || 0;
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
                {craftable ? '⚒️ Craftear' : '🔒 Faltan materiales'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
