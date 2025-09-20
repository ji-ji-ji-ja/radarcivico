// eslint-disable-next-line no-unused-vars
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import PublicSite from './components/PublicSite'
import ModerationPanel from './components/ModerationPanel'
import './App.css'

// Componente para redireccionar basado en la ruta
function AppContent() {
  const location = useLocation()
  const isModerationRoute = location.pathname === '/moderacion-secreta'

  return (
    <div className="app">
      {!isModerationRoute && (
        <header className="header">
          <h1>🗣️ Radar Cívico</h1>
          <p>Plataforma para centralizar y reportar casos de corrupción</p>
        </header>
      )}
      
      <div className="container">
        <Routes>
          <Route path="/" element={<PublicSite />} />
          <Route path="/moderacion-secreta" element={<ModerationPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App