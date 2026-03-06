import { ITEMS } from '../data/gameData';
import { useGame } from '../context/GameContext';
import { useHaptics } from '../hooks/useHaptics';

export default function PlanetView() {
  const { currentPlanet, isMining, isTraveling, mine } = useGame();
  const haptics = useHaptics();

  const handleMine = () => {
    haptics.mine();
    mine();
  };

  return (
    <div className="planet-view">
      <div className="planet-display" style={{ '--planet-color': currentPlanet.color }}>
        <div className="planet-sphere">
          <span className="planet-emoji">{currentPlanet.emoji}</span>
        </div>
        <h2 className="planet-name">{currentPlanet.name}</h2>
        <p className="planet-desc">{currentPlanet.description}</p>
        <div className="danger-level">
          {'⚠️'.repeat(currentPlanet.dangerLevel)}
          <span> Peligro: {currentPlanet.dangerLevel}/5</span>
        </div>
      </div>

      <button
        className={`mine-button ${isMining ? 'mining' : ''}`}
        onClick={handleMine}
        disabled={isMining || isTraveling}
      >
        {isMining ? (
          <span className="mining-anim">⛏️ Minando...</span>
        ) : (
          <span>⛏️ Minar</span>
        )}
      </button>

      <div className="planet-resources">
        <h4>Recursos disponibles:</h4>
        <div className="resource-tags">
          {currentPlanet.resources.map(r => {
            const item = ITEMS[r];
            return (
              <span key={r} className={`resource-tag rarity-${item.rarity}`}>
                {item.emoji} {item.name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
