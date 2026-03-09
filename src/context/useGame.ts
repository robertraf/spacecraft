import { useContext } from 'react';
import { GameContext } from './gameContextShared';
import type { GameContextValue } from './GameContext';

/**
 * Hook to access the global game context.
 * Must be used within a component wrapped by GameProvider.
 */
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext) as GameContextValue | null;
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
