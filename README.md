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
- **Persistent game state** — progress syncs automatically with the Convex backend
- **Account system** — anonymous play by default, with optional email/password or Google sign-in to save progress across devices

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

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework with hooks-based state management |
| **Vite** | Dev server and production bundler |
| **Convex** | Serverless backend (database + real-time sync) |
| **Convex Auth** | Authentication (Anonymous + Password + Google providers) |
| **Web Haptics API** | Vibration feedback on mobile devices |
| **Web Audio API** | Procedural mining and crafting sounds |
| **CSS animations** | Particle effects, electric sparks, planet strike animations |
| **Cloudflare Pages** | Production deployment via GitHub Actions |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React 19 + Vite)                             │
├─────────────────────────────────────────────────────────┤
│  App.jsx ─── GameProvider (GameContext.jsx)              │
│              ├── PlanetView   (mining + animations)     │
│              ├── StarMap      (planet navigation)       │
│              ├── Inventory    (items + equipment)       │
│              ├── CraftingTable (recipes)                │
│              └── GameLog      (events + stats)          │
│              AuthUpgrade      (account linking)         │
├─────────────────────────────────────────────────────────┤
│  Hooks:                                                 │
│  ├── useGame()     — Access global game state           │
│  ├── useHaptics()  — Vibration patterns                 │
│  └── useSound()    — Audio synthesis                    │
├─────────────────────────────────────────────────────────┤
│  Backend (Convex Serverless)                            │
├─────────────────────────────────────────────────────────┤
│  Queries:   getMe, getMyPlayer                          │
│  Mutations: saveGameState                               │
│  Database:  players table + auth tables                 │
│  Auth:      Anonymous + Password + Google               │
├─────────────────────────────────────────────────────────┤
│  Deployment: Cloudflare Pages (GitHub Actions CI/CD)    │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── components/
│   ├── PlanetView.jsx     # Mining interface with animations & sounds
│   ├── StarMap.jsx        # Planet navigation with fog-of-war
│   ├── Inventory.jsx      # Item grid and equipment slots
│   ├── CraftingTable.jsx  # Recipe browser and crafting actions
│   ├── GameLog.jsx        # Live event feed and stats bar
│   └── AuthUpgrade.jsx    # Account linking and sign-in/sign-up modal
├── context/
│   └── GameContext.jsx    # Global game state (reducer + Convex sync)
├── hooks/
│   ├── useHaptics.js      # Haptic patterns (mine, drill, craft, travel)
│   └── useSound.js        # Audio synthesis for game events
├── data/
│   └── gameData.js        # Planets, items, recipes, and game constants
├── App.jsx                # Root component with tab navigation & auth
├── main.jsx               # Entry point with Convex provider setup
├── App.css                # All component styles and animations
└── index.css              # Global styles and CSS variables

convex/
├── schema.ts              # Database schema (players table)
├── players.ts             # Queries and mutations for game state
├── auth.ts                # Convex Auth configuration (Anonymous + Password)
├── auth.config.ts         # OAuth domain configuration
└── http.ts                # HTTP routes for auth endpoints
```

## Documentation

All source code is documented with **JSDoc** (frontend JavaScript/JSX) and **TSDoc** (backend TypeScript). Each module includes:

- `@fileoverview` with module purpose description
- `@typedef` for data structures (Planet, Item, Recipe, GameState, etc.)
- `@param` / `@returns` for all public functions and hooks
- Inline comments for complex logic (mining calculations, audio synthesis, etc.)

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Set up Convex (required for backend)
npx convex dev

# Start development server
npm run dev

# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_CONVEX_URL` | Convex deployment URL | Yes |
| `CONVEX_SITE_URL` | Convex site URL (for auth) | Yes (backend) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | Yes (if Google enabled) |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | Yes (if Google enabled) |

`AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are backend secrets and must be set on your Convex deployment (not in frontend `.env` files).

Set them with:

```bash
npx convex env set AUTH_GOOGLE_ID "<your-google-client-id>"
npx convex env set AUTH_GOOGLE_SECRET "<your-google-client-secret>"
```

## Deployment

The project deploys automatically to **Cloudflare Pages** via GitHub Actions on push to `master`.

### Manual deployment:

```bash
npm run build
npx wrangler pages deploy dist
```

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles:
1. Install dependencies with `npm ci`
2. Build with Vite (injects `VITE_CONVEX_URL` from GitHub Secrets)
3. Deploy to Cloudflare Pages

**Required GitHub Secrets:** `VITE_CONVEX_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
