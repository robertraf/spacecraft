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
import App from './App.jsx'

const convexUrl = import.meta.env.VITE_CONVEX_URL
if (!convexUrl) {
  throw new Error(
    'VITE_CONVEX_URL is not set. Define it in .env.local before starting the app.',
  )
}

/** Cliente de Convex configurado con la URL del deployment. */
const convex = new ConvexReactClient(convexUrl)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </StrictMode>,
)
