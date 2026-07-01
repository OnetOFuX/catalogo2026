import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useLocalStorage } from './hooks/useLocalStorage'
import Navbar from './components/Navbar'
import Catalog from './components/Catalog'
import ProductDetailModal from './components/ProductDetailModal'
import CartModal from './components/CartModal'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Sparkles, PhoneCall, Heart, X } from 'lucide-react'

// Productos Semilla de Respaldo por si Supabase no tiene datos o no está configurado
const FALLBACK_PRODUCTS = []

// Icono SVG de WhatsApp
function WhatsAppIcon({ size = 14 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      style={{ flexShrink: 0 }}
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.66.986 3.298 1.448 5.41 1.449 5.428 0 9.847-4.417 9.851-9.845.002-2.63-1.023-5.101-2.887-6.963a9.8 9.8 0 0 0-6.96-2.883C6.6 1.012 2.183 5.43 2.18 10.86c0 2.23.59 3.86 1.48 5.34l-.97 3.543 3.657-.96c.002.001 0 0 0 0zm11.99-6.852c-.3-.15-1.77-.874-2.046-.975-.276-.102-.477-.15-.677.15-.2.3-.777.975-.951 1.176-.176.2-.351.224-.651.075-.3-.15-1.265-.467-2.41-1.487-.893-.797-1.495-1.78-1.67-2.08-.175-.3-.019-.463.13-.612.137-.133.3-.347.45-.52.15-.171.2-.295.3-.49.1-.2.05-.374-.025-.524-.075-.15-.675-1.624-.925-2.224-.244-.589-.493-.51-.678-.519-.176-.009-.376-.01-.576-.01-.2 0-.527.075-.803.374-.276.3-1.053 1.03-1.053 2.512s1.077 2.914 1.227 3.113c.15.2 2.115 3.227 5.126 4.53 3.01.1.758 1.303.743 1.34 1.706.082 1.35.485 1.756.485.405 0 1.77-.724 2.022-1.424.252-.699.252-1.299.176-1.424-.076-.125-.275-.201-.575-.351z" />
    </svg>
  );
}

export default function App() {
  // Estados de navegación
  const [activeView, setActiveView] = useState('catalog') // 'catalog', 'admin-login', 'admin-dashboard'
  const [user, setUser] = useState(null)

  // Estados del Catálogo
  const [products, setProducts] = useState(FALLBACK_PRODUCTS)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [zoomImage, setZoomImage] = useState(null)
  const [showPromo, setShowPromo] = useState(true)

  // Persistencia de Carrito, Tema y Vista (Cuadrícula / Lista)
  const [cartItems, setCartItems] = useLocalStorage('promo-cart', [])
  const [theme, setTheme] = useLocalStorage('promo-theme', 'dark')
  const [viewMode, setViewMode] = useLocalStorage('promo-view-mode', 'grid')

  // Obtener Sesión Inicial (Supabase o Local)
  useEffect(() => {
    const localSession = window.localStorage.getItem('local-admin-session')
    if (localSession) {
      setUser(JSON.parse(localSession))
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        if (!window.localStorage.getItem('local-admin-session')) {
          setUser(null)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Enrutamiento simple por ruta de URL (pathname)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname
      if (path.endsWith('/admin-login') || path.endsWith('/admin-login/')) {
        if (user) {
          window.history.replaceState({}, '', '/catalogo2026/admin-dashboard')
          setActiveView('admin-dashboard')
        } else {
          setActiveView('admin-login')
        }
      } else if (path.endsWith('/admin-dashboard') || path.endsWith('/admin-dashboard/')) {
        if (user) {
          setActiveView('admin-dashboard')
        } else {
          window.history.replaceState({}, '', '/catalogo2026/admin-login')
          setActiveView('admin-login')
        }
      } else {
        setActiveView('catalog')
      }
    }

    handleLocationChange()
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [user])

  // Redireccionar al panel correspondiente al iniciar sesión o cerrar sesión y actualizar URL
  useEffect(() => {
    if (user && activeView === 'admin-login') {
      window.history.pushState({}, '', '/catalogo2026/admin-dashboard')
      setActiveView('admin-dashboard')
    } else if (!user && activeView === 'admin-dashboard') {
      window.history.pushState({}, '', '/catalogo2026/')
      setActiveView('catalog')
    }
  }, [user, activeView])

  // Cambiar clases del DOM del tema
  useEffect(() => {
    const root = window.document.documentElement
    root.setAttribute('data-theme', theme)
  }, [theme])

  // Cargar productos de Supabase
  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        setProducts(data)
      } else {
        // Si la tabla está vacía, mostrar los fallback
        setProducts(FALLBACK_PRODUCTS)
      }
    } catch (err) {
      console.warn('No se pudo conectar a la base de datos Supabase, cargando productos por defecto:', err.message)
      setProducts(FALLBACK_PRODUCTS)
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Métodos del Carrito de Compras
  const handleAddToCart = (product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id)
      if (existing) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevItems, { ...product, quantity: 1 }]
    })
  }

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId)
      return
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const handleRemoveItem = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId))
  }

  // Cerrar Sesión
  const handleLogout = async () => {
    window.localStorage.removeItem('local-admin-session')
    await supabase.auth.signOut()
    setUser(null)
    window.history.pushState({}, '', '/catalogo2026/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Barra de Navegación */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        onAdminClick={() => {
          window.history.pushState({}, '', user ? '/catalogo2026/admin-dashboard' : '/catalogo2026/admin-login')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }}
        onLogout={handleLogout}
      />

      {/* Vistas Dinámicas */}
      <main style={{ flexGrow: 1 }}>
        <AnimatePresence mode="wait">

          {activeView === 'catalog' && (
            <motion.div
              key="catalog-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Sección Héroe Temática de Graduación */}
              <section className="hero">
                {/* Decorador de Cap de Graduación de Fondo */}
                <div className="hero-decorator">
                  <GraduationCap size={300} />
                </div>

                <div className="hero-container">
                  <div className="hero-tag">
                    <Sparkles size={11} style={{ marginRight: '4px' }} />
                    <span>Modelos Oficiales de Promoción 2026</span>
                  </div>

                  <h2 className="hero-title">
                    Inmortaliza tu Logro en un <br />
                    <span className="text-gold-gradient font-black">Cuadro de Promoción Premium</span>
                  </h2>

                  <p className="hero-desc">
                    Fabricación exclusiva de cuadros con molduras de madera noble, vidrio templado y grabados personalizados. Cotiza de manera rápida y directa por WhatsApp.
                  </p>

                  <div className="hero-buttons">
                    <a
                      href="#productos"
                      className="btn-gold"
                    >
                      Ver Modelos
                    </a>
                    <a
                      href="https://wa.me/51953200235?text=Hola,%20me%20gustaría%20cotizar%20un%20cuadro%20de%20promoción."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp"
                    >
                      <WhatsAppIcon />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href="tel:+51987483430"
                      className="btn-outline"
                      style={{ textDecoration: 'none' }}
                    >
                      <PhoneCall size={12} className="text-gold" />
                      <span>Llamar Ahora</span>
                    </a>
                  </div>
                </div>
              </section>

              {/* Contenedor del Catálogo */}
              <div id="productos" style={{ scrollMarginTop: '80px' }}>
                <Catalog
                  products={products}
                  searchTerm={searchTerm}
                  onAddToCart={handleAddToCart}
                  onDetailClick={(prod) => setSelectedProduct(prod)}
                  onImageClick={setZoomImage}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              </div>
            </motion.div>
          )}

          {activeView === 'admin-login' && (
            <motion.div
              key="admin-login-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <AdminLogin
                onBack={() => {
                  window.history.pushState({}, '', '/catalogo2026/')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
                onLoginSuccess={(usr) => {
                  setUser(usr)
                  if (usr.id === 'local-admin') {
                    window.localStorage.setItem('local-admin-session', JSON.stringify(usr))
                  }
                  window.history.pushState({}, '', '/catalogo2026/admin-dashboard')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
              />
            </motion.div>
          )}

          {activeView === 'admin-dashboard' && (
            <motion.div
              key="admin-dashboard-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AdminDashboard
                products={products}
                onRefreshProducts={fetchProducts}
                onBack={() => {
                  window.history.pushState({}, '', '/catalogo2026/')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Modales Compartidos */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            onImageClick={setZoomImage}
          />
        )}

        {isCartOpen && (
          <CartModal
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        )}

        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox-overlay"
            onClick={() => setZoomImage(null)}
          >
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="lightbox-close-btn" onClick={() => setZoomImage(null)} title="Cerrar">
                <X size={16} />
              </button>
              <img src={zoomImage} alt="Vista ampliada" className="lightbox-img" />
            </div>
          </motion.div>
        )}

        {showPromo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="promo-modal-overlay"
            onClick={() => setShowPromo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="promo-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="promo-modal-close-btn" 
                onClick={() => setShowPromo(false)} 
                title="Cerrar promoción"
              >
                <X size={18} />
              </button>
              <img 
                src={`${import.meta.env.BASE_URL || '/'}promo_banner.png`} 
                alt="Promoción Especial" 
                className="promo-modal-img" 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pie de Página */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-left">
            <p>© {new Date().getFullYear()} PROMO 2026. Todos los derechos reservados.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px' }}>Diseñado para Promociones Escolares y Universitarias.</p>
          </div>
          <div className="footer-right">
            <span>Hecho con</span>
            <Heart size={10} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
            <span>en Perú - Compilación Estática en GitHub Pages</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
