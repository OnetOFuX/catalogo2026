import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { KeyRound, Mail, Lock, ArrowLeft, Loader2, Info } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminLogin({ onBack, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Autenticación Local con credenciales del usuario
    if (email === 'mortisedsteam40' && password === '35156906') {
      onLoginSuccess({ email: 'mortisedsteam40', id: 'local-admin', role: 'admin' })
      setLoading(false)
      return
    }

    // 2. Si no coincide, intentar con Supabase
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.includes('@') ? email : `${email}@gmail.com`,
        password,
      })

      if (error) throw error

      if (data?.user) {
        onLoginSuccess(data.user)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Credenciales inválidas. Verifica tus datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="login-card"
      >
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}></div>
        
        <div className="login-content">
          
          {/* Botón Volver */}
          <div className="back-btn-row">
            <button
              onClick={onBack}
              className="back-btn"
            >
              <ArrowLeft size={12} />
              <span>Volver al Catálogo</span>
            </button>
          </div>

          {/* Icono y Título */}
          <div className="login-title-row">
            <div className="login-icon-box">
              <KeyRound size={20} />
            </div>
            <h2 className="login-title">
              Acceso Administrador
            </h2>
            <p className="login-desc">
              Ingresa tus credenciales para gestionar el catálogo.
            </p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert-error"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin}>
            
            <div className="login-form-group">
              <label className="form-label" htmlFor="email">
                Usuario o Correo
              </label>
              <div className="form-input-relative">
                <Mail size={14} className="form-input-icon" />
                <input
                  id="email"
                  type="text"
                  required
                  placeholder="Usuario o admin@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="login-form-group">
              <label className="form-label" htmlFor="password">
                Contraseña
              </label>
              <div className="form-input-relative">
                <Lock size={14} className="form-input-icon" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full"
              style={{ justifyContent: 'center', padding: '12px', marginTop: '12px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Ayuda de Configuración */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div className="detail-award-box" style={{ margin: 0, background: 'var(--bg-primary)' }}>
              <Info size={16} className="text-gold" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p className="detail-award-text" style={{ fontSize: '10px' }}>
                <strong>¿Configurando por primera vez?</strong> Registra a tu administrador en la sección <em>Authentication &gt; Users</em> de tu panel de Supabase.
              </p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
