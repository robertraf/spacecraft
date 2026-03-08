/**
 * @fileoverview Hook de feedback háptico para dispositivos móviles.
 *
 * Combina la Web Haptics API (`web-haptics`) con la API nativa de vibración
 * del navegador para proveer patrones de feedback táctil en diferentes
 * eventos del juego.
 *
 * @module useHaptics
 */

import { useWebHaptics } from 'web-haptics/react';
import { useRef, useCallback } from 'react';

/**
 * Hook que provee funciones de feedback háptico para eventos del juego.
 */
export function useHaptics() {
  const { trigger } = useWebHaptics({ debug: false });
  const drillIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopDrill = useCallback(() => {
    if (drillIntervalRef.current) {
      clearInterval(drillIntervalRef.current);
      drillIntervalRef.current = null;
    }
  }, []);

  const drill = useCallback(() => {
    stopDrill();

    if (navigator.vibrate) {
      const pattern: number[] = [];
      for (let i = 0; i < 16; i++) {
        pattern.push(30, 20);
      }
      navigator.vibrate(pattern);
    }

    let count = 0;
    drillIntervalRef.current = setInterval(() => {
      trigger('light');
      count++;
      if (count >= 8) stopDrill();
    }, 100);
  }, [trigger, stopDrill]);

  return {
    mine: () => trigger('light'),
    mineSuccess: () => trigger('success'),
    mineFail: () => trigger('error'),
    craft: () => trigger('success'),
    travel: () => trigger('warning'),
    travelArrive: () => trigger('success'),
    equip: () => trigger('light'),
    tap: () => trigger('light'),
    error: () => trigger('error'),
    drill,
    stopDrill,
  };
}
