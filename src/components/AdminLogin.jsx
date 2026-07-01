import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { User, Lock, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminLogin({ onBack, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
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
      if (data?.user) onLoginSuccess(data.user)
    } catch (err) {
      console.error('Login error:', err)
      setError('Credenciales inválidas. Verifica tus datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      {/* Fondo decorativo */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="login-card-modern"
      >
        {/* Línea superior dorada */}
        <div className="login-top-bar" />

        <div className="login-content-modern">

          {/* Botón Volver */}
          <button onClick={onBack} className="back-btn">
            <ArrowLeft size={12} />
            <span>Volver al Catálogo</span>
          </button>

          {/* Avatar del administrador */}
          <div className="login-avatar-wrap">
            <motion.div
              className="login-avatar"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
            >
              <User size={36} strokeWidth={1.5} />
              <div className="login-avatar-ring" />
            </motion.div>
            <h2 className="login-title-modern">Acceso Administrador</h2>
            <p className="login-desc-modern">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert-error"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="login-form-modern">

            {/* Campo usuario */}
            <div className="lm-field">
              <div className="lm-input-wrap">
                <User size={15} className="lm-icon" />
                <input
                  id="email"
                  type="text"
                  required
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="lm-input"
                  autoComplete="username"
                />
                <label htmlFor="email" className="lm-label">Usuario o Correo</label>
              </div>
            </div>

            {/* Campo contraseña */}
            <div className="lm-field">
              <div className="lm-input-wrap">
                <Lock size={15} className="lm-icon" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="lm-input"
                  autoComplete="current-password"
                />
                <label htmlFor="password" className="lm-label">Contraseña</label>
                <button
                  type="button"
                  className="lm-eye-btn"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="lm-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Autenticando…</span>
                </>
              ) : (
                <>
                  <User size={16} />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

        </div>
      </motion.div>
    </div>
  )
}
