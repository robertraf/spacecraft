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
  const travelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const stopTravelPulse = useCallback(() => {
    if (travelIntervalRef.current) {
      clearInterval(travelIntervalRef.current);
      travelIntervalRef.current = null;
    }
    if (navigator.vibrate) navigator.vibrate(0);
  }, []);

  const travelPulse = useCallback(() => {
    stopTravelPulse();

    if (navigator.vibrate) {
      // Rhythmic pulse for ~4.5 s: 40 ms vibrate, 260 ms pause
      const pattern: number[] = [];
      for (let i = 0; i < 15; i++) {
        pattern.push(40, 260);
      }
      navigator.vibrate(pattern);
    }

    let count = 0;
    travelIntervalRef.current = setInterval(() => {
      trigger('light');
      count++;
      if (count >= 15) stopTravelPulse();
    }, 300);
  }, [trigger, stopTravelPulse]);

  return {
    mine: () => trigger('light'),
    mineSuccess: () => trigger('success'),
    mineFail: () => trigger('error'),
    craft: () => trigger('success'),
    travel: () => trigger('warning'),
    travelArrive: () => trigger('success'),
    travelPulse,
    stopTravelPulse,
    equip: () => trigger('light'),
    tap: () => trigger('light'),
    error: () => trigger('error'),
    drill,
    stopDrill,
    shoot: () => {
      trigger('light');
      if (navigator.vibrate) navigator.vibrate(15);
    },
    explosion: () => {
      trigger('error');
      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
    },
  };
}
