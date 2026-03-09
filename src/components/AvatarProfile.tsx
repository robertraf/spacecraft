/**
 * @fileoverview Avatar profile component.
 *
 * Renders a layered avatar preview and currently equipped artifacts
 * by slot.
 *
 * @module AvatarProfile
 */

import { useTranslation } from 'react-i18next';
import { AVATAR_SLOTS, ITEMS, isAvatarArtifact, type AvatarSlot } from '../data/gameData';
import { useGame } from '../context/useGame';

function getArtifactBySlot(equipment: string[], slot: AvatarSlot): string | null {
  const found = equipment.find((itemId) => ITEMS[itemId]?.avatarSlot === slot);
  return found ?? null;
}

export default function AvatarProfile() {
  const { t } = useTranslation();
  const { equipment, craftedItems } = useGame();

  const equippedArtifacts = equipment.filter((itemId) => isAvatarArtifact(itemId));
  const craftedArtifacts = craftedItems.filter((itemId) => isAvatarArtifact(itemId));

  const aura = getArtifactBySlot(equippedArtifacts, 'aura');
  const back = getArtifactBySlot(equippedArtifacts, 'back');
  const body = getArtifactBySlot(equippedArtifacts, 'body');
  const head = getArtifactBySlot(equippedArtifacts, 'head');

  return (
    <section className="avatar-profile">
      <h3>🧑‍🚀 {t('avatar.title')}</h3>

      <div className="avatar-stage">
        {aura && <span className="avatar-layer avatar-aura">{ITEMS[aura].emoji}</span>}
        {back && <span className="avatar-layer avatar-back">{ITEMS[back].emoji}</span>}
        <span className="avatar-base">🧑‍🚀</span>
        {body && <span className="avatar-layer avatar-body">{ITEMS[body].emoji}</span>}
        {head && <span className="avatar-layer avatar-head">{ITEMS[head].emoji}</span>}
      </div>

      <div className="avatar-summary">
        <span>{t('avatar.equippedCount', { count: equippedArtifacts.length })}</span>
        <span>{t('avatar.craftedCount', { count: craftedArtifacts.length })}</span>
      </div>

      <div className="avatar-slots">
        {AVATAR_SLOTS.map((slot) => {
          const artifactId = getArtifactBySlot(equippedArtifacts, slot);
          return (
            <div key={slot} className="avatar-slot-card">
              <span className="avatar-slot-name">{t(`avatar.slots.${slot}`)}</span>
              {artifactId ? (
                <span className="avatar-slot-item">
                  {ITEMS[artifactId].emoji} {t(`items.${artifactId}.name`)}
                </span>
              ) : (
                <span className="avatar-slot-empty">{t('avatar.emptySlot')}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
