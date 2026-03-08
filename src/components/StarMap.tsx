/**
 * @fileoverview Star map component for planet navigation.
 *
 * Displays a grid of planets. All planets show their real emoji and name
 * so new users immediately understand they can travel anywhere.
 *
 * @module StarMap
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PLANETS, ITEMS } from '../data/gameData';
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

  // Pulse haptics throughout the entire travel loading state
  useEffect(() => {
    if (isTraveling) {
      haptics.travelPulse();
    } else {
      haptics.stopTravelPulse();
    }
    return () => haptics.stopTravelPulse();
  }, [isTraveling]);

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
              className={`planet-card ${isCurrent ? 'current' : ''} ${isTarget ? 'traveling' : ''} ${!discovered ? 'unvisited' : ''}`}
              onClick={() => handleTravel(planet.id)}
              disabled={isCurrent || isTraveling}
              style={{ '--planet-color': planet.color } as React.CSSProperties}
            >
              <span className="planet-card-emoji">{planet.emoji}</span>
              <span className="planet-card-name">{t(`planets.${planet.id}.name`)}</span>
              <div className="planet-card-danger">
                {Array.from({ length: planet.dangerLevel }, (_, i) => (
                  <span key={i}>⚠️</span>
                ))}
              </div>
              <div className="planet-card-resources">
                {planet.resources.map(r => (
                  <span key={r} className="resource-mini-icon" title={r}>
                    {ITEMS[r]?.emoji}
                  </span>
                ))}
              </div>
              {isCurrent && <span className="here-badge">{t('starMap.here')}</span>}
              {isTarget && <span className="traveling-badge">{t('starMap.traveling')}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
