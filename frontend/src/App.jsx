// eslint-disable-next-line no-unused-vars
import { useState, useEffect } from 'react'
import ModerationPanel from './components/ModerationPanel'
import PublicSite from './components/PublicSite'
import './App.css'

function App() {
  // Detectar si estamos en la ruta de moderación
  const isModerationPath = window.location.pathname === '/moderacion-secreta'

  if (isModerationPath) {
    return <ModerationPanel />
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🗣️ Radar Cívico</h1>
        <p>Plataforma para informar y reportar posibles casos de corrupción</p>
      </header>

      <div className="container">
        <PublicSite />
      </div>
    </div>
  )
}

export default App