import { useState } from 'react';
import { GameProvider } from './context/GameContext';
import PlanetView from './components/PlanetView';
import StarMap from './components/StarMap';
import Inventory from './components/Inventory';
import CraftingTable from './components/CraftingTable';
import GameLog from './components/GameLog';
import './App.css';

const TABS = [
  { id: 'planet', label: '🌍 Planeta', component: PlanetView },
  { id: 'map', label: '🗺️ Mapa', component: StarMap },
  { id: 'inventory', label: '🎒 Inventario', component: Inventory },
  { id: 'craft', label: '🔧 Crafteo', component: CraftingTable },
];

function GameUI() {
  const [activeTab, setActiveTab] = useState('planet');
  const ActiveComponent = TABS.find(t => t.id === activeTab).component;

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>🚀 SpaceCraft</h1>
        <p className="subtitle">Explora. Mina. Craftea.</p>
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

export default function App() {
  return (
    <GameProvider>
      <GameUI />
    </GameProvider>
  );
}
