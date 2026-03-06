import { useState, useEffect, useRef, useCallback } from 'react';
import { ITEMS } from '../data/gameData';
import { useGame } from '../context/GameContext';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';

export default function PlanetView() {
  const { currentPlanet, isMining, isTraveling, mine, equipment, log } = useGame();
  const haptics = useHaptics();
  const sound = useSound();

  const [strikeAnim, setStrikeAnim] = useState(false);
  const [particles, setParticles] = useState([]);
  const [mineResult, setMineResult] = useState(null);
  const prevLogRef = useRef(log);

  const hasElectricPickaxe = equipment.includes('electric-pickaxe');
  const hasDrill = equipment.includes('quantum-drill');

  // Watch for mining results in the log
  useEffect(() => {
    if (prevLogRef.current !== log && log.length > 0) {
      const latest = log[0];
      if (latest.type === 'success' && latest.text.startsWith('Minaste')) {
        setMineResult({ text: latest.text, type: 'success' });
        sound.mineSuccess();
        haptics.mineSuccess();
        setTimeout(() => setMineResult(null), 1000);
      } else if (latest.type === 'warning' && latest.text.includes('No encontraste')) {
        setMineResult({ text: '¡Nada!', type: 'fail' });
        sound.mineFail();
        haptics.mineFail();
        setTimeout(() => setMineResult(null), 1000);
      }
    }
    prevLogRef.current = log;
  }, [log, sound, haptics]);

  // Stop drill haptics when mining finishes
  useEffect(() => {
    if (!isMining) {
      haptics.stopDrill();
    }
  }, [isMining, haptics]);

  const spawnParticles = useCallback(() => {
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      dx: (Math.random() - 0.5) * 60,
      dy: -(Math.random() * 40 + 10),
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 500);
  }, []);

  const handleMine = () => {
    if (hasElectricPickaxe || hasDrill) {
      // Electric pickaxe / drill: continuous drilling effect
      haptics.drill();
      sound.electricDrill();
    } else {
      // Normal pickaxe: single strike
      haptics.mine();
      sound.mineHit();
    }

    // Trigger strike animation
    setStrikeAnim(true);
    spawnParticles();
    setTimeout(() => setStrikeAnim(false), 300);

    mine();
  };

  const isElectricMining = isMining && (hasElectricPickaxe || hasDrill);

  const mineButtonLabel = hasElectricPickaxe
    ? '⚡ Taladrar'
    : hasDrill
    ? '🌀 Perforar'
    : '⛏️ Minar';

  const miningLabel = hasElectricPickaxe
    ? '⚡ Taladrando...'
    : hasDrill
    ? '🌀 Perforando...'
    : '⛏️ Minando...';

  return (
    <div className="planet-view">
      <div className="planet-display" style={{ '--planet-color': currentPlanet.color }}>
        <div
          className={`planet-sphere ${
            strikeAnim && !isElectricMining ? 'mine-strike' : ''
          } ${isElectricMining ? 'electric-strike' : ''}`}
        >
          <span className="planet-emoji">{currentPlanet.emoji}</span>
          {isElectricMining && (
            <span className="electric-sparks">⚡⚡⚡</span>
          )}
          {/* Rock particles */}
          {particles.length > 0 && (
            <div className="mine-particles">
              {particles.map(p => (
                <span
                  key={p.id}
                  className="mine-particle"
                  style={{
                    '--dx': `${p.dx}px`,
                    '--dy': `${p.dy}px`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mining result popup */}
        {mineResult && (
          <div className={`mine-result-popup ${mineResult.type}`}>
            {mineResult.text}
          </div>
        )}

        <h2 className="planet-name">{currentPlanet.name}</h2>
        <p className="planet-desc">{currentPlanet.description}</p>
        <div className="danger-level">
          {'⚠️'.repeat(currentPlanet.dangerLevel)}
          <span> Peligro: {currentPlanet.dangerLevel}/5</span>
        </div>
      </div>

      <button
        className={`mine-button ${isMining ? 'mining' : ''} ${
          strikeAnim ? 'strike-anim' : ''
        } ${isElectricMining ? 'electric-mining' : ''}`}
        onClick={handleMine}
        disabled={isMining || isTraveling}
      >
        {isMining ? (
          <span className="mining-anim">{miningLabel}</span>
        ) : (
          <span>{mineButtonLabel}</span>
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
