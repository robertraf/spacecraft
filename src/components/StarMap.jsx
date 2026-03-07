/**
 * @fileoverview Componente de mapa estelar para navegación entre planetas.
 *
 * Muestra una grilla de planetas con sistema de niebla de guerra
 * (fog-of-war) donde los planetas no descubiertos aparecen ocultos.
 *
 * @module StarMap
 */

import { PLANETS } from '../data/gameData';
import { useGame } from '../context/GameContext';
import { useHaptics } from '../hooks/useHaptics';

/**
 * Mapa estelar interactivo que permite viajar entre planetas.
 *
 * Cada planeta se muestra como una tarjeta con su emoji y nombre.
 * Los planetas no descubiertos muestran "???" hasta que el jugador los visite.
 * El planeta actual se resalta y no se puede seleccionar como destino.
 *
 * @returns {import('react').JSX.Element}
 */
export default function StarMap() {
  const { currentPlanet, isTraveling, travelTarget, travel, discoveredPlanets } = useGame();
  const haptics = useHaptics();

  /**
   * Inicia el viaje a un planeta con feedback háptico.
   * @param {string} planetId - ID del planeta destino.
   */
  const handleTravel = (planetId) => {
    haptics.travel();
    travel(planetId);
  };

  return (
    <div className="star-map">
      <h3>🗺️ Mapa Estelar</h3>
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
              style={{ '--planet-color': planet.color }}
            >
              <span className="planet-card-emoji">{discovered ? planet.emoji : '❓'}</span>
              <span className="planet-card-name">{discovered ? planet.name : '???'}</span>
              {isCurrent && <span className="here-badge">AQUÍ</span>}
              {isTarget && <span className="traveling-badge">Viajando...</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
