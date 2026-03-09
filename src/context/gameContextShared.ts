import { createContext } from 'react';

// Shared context container used by provider and hook modules.
export const GameContext = createContext<unknown | null>(null);
