import React from 'react'
import { X, Trash2, Plus, Minus, Send, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  whatsappNumber = '+51953200235'
}) {
  if (!isOpen) return null

  // Calcular subtotal
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

  // Generar y enviar mensaje formateado a WhatsApp
  const handleSendWhatsApp = () => {
    let itemsText = ''
    cartItems.forEach((item) => {
      itemsText += `- *${item.quantity}x* ${item.name} (_S/. ${Number(item.price).toFixed(2)} c/u_) -> *S/. ${(item.price * item.quantity).toFixed(2)}*\n`
    })

    const message = `¡Hola! Me gustaría cotizar el siguiente pedido de Cuadros de Promoción:\n\n*DETALLE DEL PEDIDO:*\n${itemsText}\n*TOTAL DE INVERSIÓN: S/. ${subtotal.toFixed(2)}*\n\nPor favor, contáctenme para coordinar las fotos, nombres, diseño y detalles de entrega.`
    
    // Codificar mensaje y abrir WhatsApp
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="cart-drawer-overlay">
      {/* Fondo de desenfoque */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(3px)' }}
      ></motion.div>

      {/* Drawer del Carrito */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="cart-drawer"
      >
        <div className="cart-drawer-content">
          
          {/* Cabecera del Carrito */}
          <div className="cart-header">
            <div className="cart-header-title">
              <ShoppingBag size={18} className="text-gold" />
              <h2>Mi Pedido</h2>
              <span className="cart-header-badge">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="modal-close-btn"
              style={{ position: 'relative', top: 'auto', right: 'auto' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Listado de Productos en el Carrito */}
          <div className="cart-items-list">
            <AnimatePresence initial={false}>
              {cartItems.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-icon">
                    <ShoppingBag size={24} />
                  </div>
                  <h3 className="cart-empty-title">Carrito vacío</h3>
                  <p className="cart-empty-desc">
                    Navega por nuestro catálogo de cuadros de promoción y agrega tus modelos favoritos para cotizar.
                  </p>
                </div>
              ) : (
                <div>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="cart-item"
                    >
                      {/* Miniatura de imagen */}
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=150'}
                        alt={item.name}
                        className="cart-item-thumb"
                      />

                      {/* Detalles del Item */}
                      <div className="cart-item-details">
                        <div className="cart-item-header">
                          <div>
                            <h4 className="cart-item-name">{item.name}</h4>
                            <span className="cart-item-category">{item.category}</span>
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            title="Remover artículo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Controles de cantidad y subtotal */}
                        <div className="cart-item-controls">
                          <div className="quantity-selector">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="quantity-btn"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="quantity-value">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="quantity-btn"
                            >
                              <Plus size={10} />
                            </button>
                          </div>

                          <span className="cart-item-total">
                            S/. {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Pie del Carrito - Resumen de Pago */}
          {cartItems.length > 0 && (
            <div className="cart-summary">
              <div className="cart-summary-row">
                <div className="price-container">
                  <span className="cart-summary-label">Total Estimado</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Incluye IGV y grabado</span>
                </div>
                <span className="cart-summary-value">
                  S/. {subtotal.toFixed(2)}
                </span>
              </div>

              <div className="cart-notice">
                📢 <strong>Nota de Coordinación:</strong> Al enviar tu pedido, se abrirá WhatsApp con el resumen de tu selección. Te solicitaremos los datos de grabado y fotos de promoción vía chat.
              </div>

              <button
                onClick={handleSendWhatsApp}
                className="btn-gold w-full"
                style={{ justifyContent: 'center', padding: '14px' }}
              >
                <Send size={14} />
                <span>Enviar Pedido a WhatsApp</span>
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  )
}
