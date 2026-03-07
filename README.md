# SpaceCraft 🚀

A browser-based space exploration and crafting game built with React. Mine resources across multiple planets, craft powerful tools and equipment, and unlock the secrets of the galaxy.

## Gameplay Overview

SpaceCraft follows a simple but deep loop:

1. **Mine** resources on your current planet
2. **Travel** to new planets to find different materials
3. **Craft** tools and equipment using gathered resources
4. **Upgrade** your gear to mine faster and discover rarer items

## Features

- **5 explorable planets**, each with unique resources and danger levels
- **Progressive crafting system** — basic materials unlock intermediate recipes, which unlock legendary gear
- **Tool upgrades** that change mining behavior (animations, sounds, and haptics)
- **Haptic feedback** via the Web Haptics API for supported devices
- **Procedural mining sounds** with Web Audio API
- **Star map** with fog-of-war — planets are revealed as you discover them
- **Game log** tracking every action in real time

## Planets

| Planet | Type | Resources | Danger |
|--------|------|-----------|--------|
| 🌍 Terra Nova | Rocky | Iron, Stone, Copper, Coal | ⚠️ |
| 🌋 Volcanus | Volcanic | Obsidian, Diamond, Sulfur | ⚠️⚠️⚠️ |
| ❄️ Glacius | Frozen | Ice Crystals, Titanium, Frozen Gas | ⚠️⚠️ |
| 🌿 Verdantis | Jungle | Bio-fiber, Alien Wood, Nectar | ⚠️⚠️ |
| 🌌 Nebulón | Station | Circuit Boards, Nano-tubes, Plasma Cells | ⚠️⚠️⚠️⚠️ |

## Crafting Progression

```
Raw Resources → Basic Materials → Intermediate Materials → Tools & Equipment
```

**Basic:**
- Iron Ore + Coal → Iron Bar
- Copper Ore → Copper Wire
- Titanium Ore + Coal → Titanium Bar

**Intermediate:**
- Iron Bar + Coal → Steel Plate
- Plasma Cell + Copper Wire → Energy Cell
- Bio-fiber + Nectar → Bio-Gel

**Tools & Equipment:**
- Space Pickaxe ⛏️ — doubles mined resources
- Scanner 📡 — reveals rare items
- Electric Pickaxe ⚡ — fast drilling with electric animation
- Jetpack 🚀 — faster planet travel
- Shield Generator 🛡️ — protection on dangerous planets
- Quantum Drill 🌀 *(legendary)* — triples resources and uncovers secret items
- Warp Drive ✨ *(legendary)* — instant travel between planets

## Tech Stack

- **React 19** — UI and game state
- **Vite** — dev server and bundler
- **Web Haptics API** — vibration feedback on mobile devices
- **Web Audio API** — procedural mining and crafting sounds
- **CSS animations** — particle effects, electric sparks, planet strike animations

## Project Structure

```
src/
├── components/
│   ├── PlanetView.jsx     # Mining interface with animations & sounds
│   ├── StarMap.jsx        # Planet navigation with fog-of-war
│   ├── Inventory.jsx      # Item grid and equipment slots
│   ├── CraftingTable.jsx  # Recipe browser and crafting actions
│   └── GameLog.jsx        # Live event feed
├── context/
│   └── GameContext.jsx    # Global game state (inventory, planet, travel)
├── hooks/
│   ├── useHaptics.js      # Haptic patterns (mine, drill, craft, travel)
│   └── useSound.js        # Audio synthesis for game events
└── data/
    └── gameData.js        # Planets, items, recipes, and constants
```

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

The project includes a `wrangler.toml` for deploying to **Cloudflare Pages**:

```bash
npx wrangler pages deploy dist
```
