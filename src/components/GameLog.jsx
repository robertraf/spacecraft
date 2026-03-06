import { useGame } from '../context/GameContext';

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
          <div key={i} className={`log-entry log-${entry.type}`}>
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}
