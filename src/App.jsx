/**
 * @fileoverview Componente raíz de la aplicación SpaceCraft.
 *
 * Maneja la autenticación automática anónima con Convex Auth,
 * la navegación por tabs y la estructura general del layout del juego.
 *
 * @module App
 */

import { useState, useEffect, useRef } from 'react';
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

/**
 * Configuración de las tabs de navegación del juego.
 * @type {Array<{id: string, label: string, component: import('react').ComponentType}>}
 */
const TABS = [
  { id: 'planet', label: '🌍 Planeta', component: PlanetView },
  { id: 'map', label: '🗺️ Mapa', component: StarMap },
  { id: 'inventory', label: '🎒 Inventario', component: Inventory },
  { id: 'craft', label: '🔧 Crafteo', component: CraftingTable },
];

/**
 * Interfaz principal del juego con navegación por tabs.
 *
 * Renderiza el header con título y botón de autenticación,
 * el componente activo según la tab seleccionada, el log de eventos
 * y la barra de navegación inferior.
 *
 * @returns {import('react').JSX.Element}
 */
function GameUI() {
  const [activeTab, setActiveTab] = useState('planet');
  const ActiveComponent = TABS.find(t => t.id === activeTab).component;

  return (
    <div className="game-container">
      <header className="game-header">
        <div className="header-row">
          <div>
            <h1>🚀 SpaceCraft</h1>
            <p className="subtitle">Explora. Mina. Craftea.</p>
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
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/**
 * Pantalla de carga mostrada mientras se inicializa la autenticación.
 * @returns {import('react').JSX.Element}
 */
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-planet">🚀</div>
      <p>Cargando SpaceCraft...</p>
    </div>
  );
}

/**
 * Componente raíz de la aplicación.
 *
 * Gestiona el flujo de autenticación automática: si el usuario no está
 * autenticado, inicia sesión anónima automáticamente. Una vez autenticado,
 * renderiza el {@link GameProvider} con la UI del juego.
 *
 * @returns {import('react').JSX.Element}
 */
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
