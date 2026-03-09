/**
 * @fileoverview Planet view and mining component.
 *
 * Displays the current planet with mining animations, rock particles,
 * electric effects for advanced tools, and result popups.
 * Integrates haptic feedback and procedural sound.
 *
 * @module PlanetView
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ITEMS } from '../data/gameData';
import { useGame } from '../context/useGame';
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
  const { t } = useTranslation();
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
      if (latest.type === 'success' && latest.key === 'log.mined') {
        const params = latest.params!;
        setMineResult({
          text: t('log.mined', { amount: params.amount, emoji: params.emoji, name: t(`items.${params.itemId}.name`) }),
          type: 'success',
        });
        sound.mineSuccess();
        haptics.mineSuccess();
        setTimeout(() => setMineResult(null), 1000);
      } else if (latest.type === 'warning' && latest.key === 'log.nothingFound') {
        setMineResult({ text: t('log.nothing'), type: 'fail' });
        sound.mineFail();
        haptics.mineFail();
        setTimeout(() => setMineResult(null), 1000);
      }
    }
    prevLogRef.current = log;
  }, [log, sound, haptics, t]);

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
    ? `⚡ ${t('planet.drill')}`
    : hasDrill
    ? `🌀 ${t('planet.quantumDrill')}`
    : `⛏️ ${t('planet.mine')}`;

  const miningLabel = hasElectricPickaxe
    ? `⚡ ${t('planet.drilling')}`
    : hasDrill
    ? `🌀 ${t('planet.boring')}`
    : `⛏️ ${t('planet.mining')}`;

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

        <h2 className="planet-name">{t(`planets.${currentPlanet.id}.name`)}</h2>
        <p className="planet-desc">{t(`planets.${currentPlanet.id}.description`)}</p>
        <div className="danger-level">
          {'⚠️'.repeat(currentPlanet.dangerLevel)}
          <span> {t('planet.danger', { level: currentPlanet.dangerLevel })}</span>
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
        <h4>{t('planet.availableResources')}</h4>
        <div className="resource-tags">
          {currentPlanet.resources.map(r => {
            const item = ITEMS[r];
            return (
              <span key={r} className={`resource-tag rarity-${item.rarity}`}>
                {item.emoji} {t(`items.${r}.name`)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
