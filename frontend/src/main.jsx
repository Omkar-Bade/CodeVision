/**
 * main.jsx — Vite application entry point.
 *
 * Mounts the root <App> component into the #root div defined in index.html.
 * React.StrictMode is enabled to surface potential issues (double-invoked
 * hooks, deprecated APIs) during development; it has no effect in production.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'    // global design tokens, base resets, and utility classes

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
