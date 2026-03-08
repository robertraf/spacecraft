/**
 * @fileoverview Entry point for the SpaceCraft application.
 *
 * Initializes the Convex client and i18n, wraps the app with
 * authentication providers, and renders the root component to the DOM.
 *
 * @module main
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import './i18n'
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
