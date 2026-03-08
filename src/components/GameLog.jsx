/**
 * @fileoverview Componente de log de eventos y estadísticas del juego.
 *
 * Muestra un feed en tiempo real de las acciones del jugador junto con
 * estadísticas resumidas de ítems minados, crafteados y planetas visitados.
 *
 * @module GameLog
 */

import { useGame } from '../context/GameContext';

/**
 * Panel de log de eventos con barra de estadísticas.
 *
 * La barra superior muestra contadores de ítems minados, crafteados y
 * planetas visitados. Debajo, las entradas del log se muestran en orden
 * cronológico inverso con colores según el tipo de evento.
 *
 * @returns {import('react').JSX.Element}
 */
export default function GameLog() {
  const { log, stats } = useGame();

  return (
    <div className="game-log">
      <div className="stats-bar">
        <span>⛏️ {stats.itemsMined}</span>
        <span>🔧 {stats.itemsCrafted}</span>
        <span>🌍 {stats.planetsVisited}</span>
      </div>
      <div className="log-entries">
        {log.map((entry, i) => (
          <div key={`${entry.type}-${entry.text}-${i}`} className={`log-entry log-${entry.type}`}>
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}
