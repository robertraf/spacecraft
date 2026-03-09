/**
 * @fileoverview Game event log and statistics component.
 *
 * Displays a real-time feed of player actions along with
 * summary statistics for items mined, crafted, and planets visited.
 *
 * @module GameLog
 */

import { useTranslation } from 'react-i18next';
import { useGame } from '../context/useGame';
import type { LogEntry } from '../context/GameContext';

function LogMessage({ entry }: { entry: LogEntry }) {
  const { t } = useTranslation();

  const params = entry.params ?? {};
  const resolvedParams: Record<string, string | number> = { ...params };

  if ('itemId' in params) {
    resolvedParams.name = t(`items.${params.itemId}.name`);
  }
  if ('planetId' in params) {
    resolvedParams.name = t(`planets.${params.planetId}.name`);
  }

  return <>{t(entry.key, resolvedParams)}</>;
}

export default function GameLog() {
  const { log } = useGame();

  return (
    <div className="game-log">
      <div className="log-entries">
        {log.map((entry, i) => (
          <div key={`${entry.type}-${entry.key}-${i}`} className={`log-entry log-${entry.type}`}>
            <LogMessage entry={entry} />
          </div>
        ))}
      </div>
    </div>
  );
}
