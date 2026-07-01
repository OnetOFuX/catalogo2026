import React from 'react'
import { GraduationCap, Search, ShoppingCart, Sun, Moon, Lock, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar({
  searchTerm,
  setSearchTerm,
  cartCount,
  onCartClick,
  theme,
  toggleTheme,
  user,
  onAdminClick,
  onLogout
}) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        {/* Logotipo / Branding de Graduación */}
        <div 
          className="logo-container"
          onClick={() => {
            window.history.pushState({}, '', '/catalogo2026/')
            window.dispatchEvent(new PopStateEvent('popstate'))
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <div className="logo-badge">
            <GraduationCap size={22} />
            <div className="logo-badge-dot"></div>
          </div>
          <div className="logo-text">
            <h1 className="logo-text-title">
              PROMO<span className="text-gold-gradient">2026</span>
            </h1>
            <p className="logo-text-sub">Cuadros de Promoción</p>
          </div>
        </div>

        {/* Buscador Dinámico */}
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar cuadros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Botones de Control */}
        <div className="navbar-actions">
          
          {/* Botón Modo Claro/Oscuro */}
          <button
            onClick={toggleTheme}
            className="icon-btn"
            title="Cambiar Tema"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Botón Carrito con Animación de Rebote */}
          <button
            onClick={onCartClick}
            className="icon-btn"
            title="Ver Carrito"
          >
            <ShoppingCart size={18} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="cart-badge"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Botón Panel de Admin / Autenticado */}
          {user ? (
            <div className="admin-action-container">
              <button
                onClick={onAdminClick}
                className="btn-admin-text"
              >
                Panel Admin
              </button>
              <button
                onClick={onLogout}
                className="btn-logout"
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : null}

        </div>
      </div>
    </nav>
  )
}
