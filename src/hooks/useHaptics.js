import { useWebHaptics } from 'web-haptics/react';

export function useHaptics() {
  const { trigger } = useWebHaptics({ debug: false });

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
  };
}
