/**
 * @fileoverview Haptic feedback hook for mobile devices.
 *
 * Combines the Web Haptics API (`web-haptics`) with the browser's native
 * vibration API to provide tactile feedback patterns for different
 * game events.
 *
 * @module useHaptics
 */

import { useWebHaptics } from 'web-haptics/react';
import { useRef, useCallback } from 'react';

/**
 * Hook that provides haptic feedback functions for game events.
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
