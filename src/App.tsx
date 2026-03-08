/**
 * @fileoverview Root component of the SpaceCraft application.
 *
 * Handles automatic anonymous authentication with Convex Auth,
 * tab navigation, and the overall game layout structure.
 *
 * @module App
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useConvexAuth } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { GameProvider } from './context/GameContext';
import PlanetView from './components/PlanetView';
import StarMap from './components/StarMap';
import Inventory from './components/Inventory';
import CraftingTable from './components/CraftingTable';
import GameLog from './components/GameLog';
import AuthUpgrade from './components/AuthUpgrade';
import './App.css';

interface Tab {
  id: string;
  labelKey: string;
  emoji: string;
  component: React.ComponentType;
}

const TABS: Tab[] = [
  { id: 'planet', labelKey: 'tabs.planet', emoji: '🌍', component: PlanetView },
  { id: 'map', labelKey: 'tabs.map', emoji: '🗺️', component: StarMap },
  { id: 'inventory', labelKey: 'tabs.inventory', emoji: '🎒', component: Inventory },
  { id: 'craft', labelKey: 'tabs.craft', emoji: '🔧', component: CraftingTable },
];

function GameUI() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('planet');
  const ActiveComponent = TABS.find(t => t.id === activeTab)!.component;

  return (
    <div className="game-container">
      <header className="game-header">
        <div className="header-row">
          <div>
            <h1>🚀 {t('app.title')}</h1>
            <p className="subtitle">{t('app.subtitle')}</p>
          </div>
          <AuthUpgrade />
        </div>
      </header>

      <main className="game-main">
        <ActiveComponent />
      </main>

      <GameLog />

      <nav className="game-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.emoji} {t(tab.labelKey)}
          </button>
        ))}
      </nav>
    </div>
  );
}

function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="loading-screen">
      <div className="loading-planet">🚀</div>
      <p>{t('app.loading')}</p>
    </div>
  );
}

export default function App() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();

  const didInitAuth = useRef(false);
  useEffect(() => {
    if (isLoading || didInitAuth.current) return;
    didInitAuth.current = true;
    if (!isAuthenticated) {
      void signIn('anonymous').catch(error => {
        console.error('Anonymous sign-in failed', error);
      });
    }
  }, [isLoading, isAuthenticated, signIn]);

  if (isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <GameProvider>
      <GameUI />
    </GameProvider>
  );
}
