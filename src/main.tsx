/**
 * @fileoverview Punto de entrada de la aplicación SpaceCraft.
 *
 * Inicializa el cliente de Convex, envuelve la app con los proveedores
 * de autenticación y renderiza el componente raíz en el DOM.
 *
 * @module main
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import './index.css'
import App from './App'

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined
if (!convexUrl) {
  throw new Error(
    'VITE_CONVEX_URL is not set. Define it in .env.local before starting the app.',
  )
}

const convex = new ConvexReactClient(convexUrl)

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </StrictMode>,
)
