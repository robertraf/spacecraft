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
 *
 * Utiliza `web-haptics` como capa principal y `navigator.vibrate` como
 * fallback para patrones de vibración más complejos (como el taladro).
 *
 * @returns {{
 *   mine: Function,
 *   mineSuccess: Function,
 *   mineFail: Function,
 *   craft: Function,
 *   travel: Function,
 *   travelArrive: Function,
 *   equip: Function,
 *   tap: Function,
 *   error: Function,
 *   drill: Function,
 *   stopDrill: Function
 * }}
 *
 * @example
 * const haptics = useHaptics();
 * haptics.mine();        // Vibración ligera al minar
 * haptics.drill();       // Patrón de vibración continuo de taladro
 * haptics.stopDrill();   // Detiene el patrón de taladro
 */
export function useHaptics() {
  const { trigger } = useWebHaptics({ debug: false });
  const drillIntervalRef = useRef(null);

  /**
   * Detiene el patrón háptico de taladro si está activo.
   */
  const stopDrill = useCallback(() => {
    if (drillIntervalRef.current) {
      clearInterval(drillIntervalRef.current);
      drillIntervalRef.current = null;
    }
  }, []);

  /**
   * Inicia un patrón háptico de taladro: pulsos rápidos de 30ms con
   * pausas de 20ms durante ~800ms que simulan una vibración continua.
   */
  const drill = useCallback(() => {
    stopDrill();

    if (navigator.vibrate) {
      const pattern = [];
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
    /** Vibración ligera al golpear durante minería. */
    mine: () => trigger('light'),
    /** Vibración de éxito al obtener un recurso. */
    mineSuccess: () => trigger('success'),
    /** Vibración de error al fallar minería. */
    mineFail: () => trigger('error'),
    /** Vibración de éxito al craftear un ítem. */
    craft: () => trigger('success'),
    /** Vibración de advertencia al iniciar viaje. */
    travel: () => trigger('warning'),
    /** Vibración de éxito al llegar a un planeta. */
    travelArrive: () => trigger('success'),
    /** Vibración ligera al equipar un ítem. */
    equip: () => trigger('light'),
    /** Vibración ligera para interacciones generales. */
    tap: () => trigger('light'),
    /** Vibración de error para acciones inválidas. */
    error: () => trigger('error'),
    drill,
    stopDrill,
  };
}
