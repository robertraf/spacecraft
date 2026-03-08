/**
 * @fileoverview Star map component for planet navigation.
 *
 * Displays a grid of planets with a fog-of-war system
 * where undiscovered planets appear hidden.
 *
 * @module StarMap
 */

import { useTranslation } from 'react-i18next';
import { PLANETS } from '../data/gameData';
import { useGame } from '../context/GameContext';
import { useHaptics } from '../hooks/useHaptics';

export default function StarMap() {
  const { currentPlanet, isTraveling, travelTarget, travel, discoveredPlanets } = useGame();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const handleTravel = (planetId: string) => {
    haptics.travel();
    travel(planetId);
  };

  return (
    <div className="star-map">
      <h3>🗺️ {t('starMap.title')}</h3>
      <div className="planets-grid">
        {PLANETS.map(planet => {
          const isCurrent = currentPlanet.id === planet.id;
          const isTarget = travelTarget === planet.id;
          const discovered = discoveredPlanets.includes(planet.id);

          return (
            <button
              key={planet.id}
              className={`planet-card ${isCurrent ? 'current' : ''} ${isTarget ? 'traveling' : ''} ${!discovered ? 'undiscovered' : ''}`}
              onClick={() => handleTravel(planet.id)}
              disabled={isCurrent || isTraveling}
              style={{ '--planet-color': planet.color } as React.CSSProperties}
            >
              <span className="planet-card-emoji">{discovered ? planet.emoji : '❓'}</span>
              <span className="planet-card-name">{discovered ? t(`planets.${planet.id}.name`) : '???'}</span>
              {isCurrent && <span className="here-badge">{t('starMap.here')}</span>}
              {isTarget && <span className="traveling-badge">{t('starMap.traveling')}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
