import { useWebHaptics } from 'web-haptics/react';
import { useRef, useCallback } from 'react';

export function useHaptics() {
  const { trigger } = useWebHaptics({ debug: false });
  const drillIntervalRef = useRef(null);

  const stopDrill = useCallback(() => {
    if (drillIntervalRef.current) {
      clearInterval(drillIntervalRef.current);
      drillIntervalRef.current = null;
    }
  }, []);

  const drill = useCallback(() => {
    // Extended drilling haptic pattern - rapid pulses that feel like a drill
    // Uses navigator.vibrate for a continuous drilling sensation
    stopDrill();

    if (navigator.vibrate) {
      // Pattern: vibrate 30ms, pause 20ms - repeating rapidly for 800ms
      // This creates a buzzing/drilling sensation
      const pattern = [];
      for (let i = 0; i < 16; i++) {
        pattern.push(30, 20); // vibrate, pause
      }
      navigator.vibrate(pattern);
    }

    // Fallback: also fire web-haptics pulses rapidly
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
