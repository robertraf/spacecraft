/**
 * @fileoverview Componente de vista de planeta y minería.
 *
 * Muestra el planeta actual con animaciones de minería, partículas de roca,
 * efectos eléctricos para herramientas avanzadas y popups de resultado.
 * Integra feedback háptico y sonido procedural.
 *
 * @module PlanetView
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ITEMS } from '../data/gameData';
import { useGame } from '../context/GameContext';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';

interface Particle {
  id: number;
  dx: number;
  dy: number;
}

interface MineResult {
  text: string;
  type: 'success' | 'fail';
}

export default function PlanetView() {
  const { currentPlanet, isMining, isTraveling, mine, equipment, log } = useGame();
  const haptics = useHaptics();
  const sound = useSound();

  const [strikeAnim, setStrikeAnim] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mineResult, setMineResult] = useState<MineResult | null>(null);
  const prevLogRef = useRef(log);

  const hasElectricPickaxe = equipment.includes('electric-pickaxe');
  const hasDrill = equipment.includes('quantum-drill');

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
      haptics.drill();
      sound.electricDrill();
    } else {
      haptics.mine();
      sound.mineHit();
    }

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
      <div className="planet-display" style={{ '--planet-color': currentPlanet.color } as React.CSSProperties}>
        <div
          className={`planet-sphere ${
            strikeAnim && !isElectricMining ? 'mine-strike' : ''
          } ${isElectricMining ? 'electric-strike' : ''}`}
        >
          <span className="planet-emoji">{currentPlanet.emoji}</span>
          {isElectricMining && (
            <span className="electric-sparks">⚡⚡⚡</span>
          )}
          {particles.length > 0 && (
            <div className="mine-particles">
              {particles.map(p => (
                <span
                  key={p.id}
                  className="mine-particle"
                  style={{
                    '--dx': `${p.dx}px`,
                    '--dy': `${p.dy}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )}
        </div>

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
