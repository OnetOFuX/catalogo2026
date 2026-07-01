import React from 'react'
import { X, Award, ShoppingCart, Info } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  if (!product) return null

  const { name, description, price, category, image_url, stock } = product

  return (
    <div className="modal-overlay">
      {/* Fondo translúcido */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0 }}
      ></motion.div>

      {/* Tarjeta de Detalle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="detail-modal-card"
      >
        
        {/* Adorno dorado en la parte superior */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}></div>

        {/* Botón de cierre */}
        <button
          onClick={onClose}
          className="modal-close-btn"
        >
          <X size={18} />
        </button>

        {/* Estructura Interna del Modal */}
        <div className="detail-modal-layout">
          
          {/* Columna de Imagen */}
          <div className="detail-modal-image-panel">
            <img
              src={image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'}
              alt={name}
              className="detail-modal-img"
            />
          </div>

          {/* Columna de Contenido */}
          <div className="detail-modal-info-panel">
            
            {/* Info del Producto */}
            <div>
              <div className="detail-tag-row">
                <span className="detail-tag detail-tag-category">
                  {category}
                </span>
                
                {stock > 0 ? (
                  <span className="detail-tag detail-tag-stock">
                    En Stock
                  </span>
                ) : (
                  <span className="detail-tag detail-tag-out">
                    Agotado
                  </span>
                )}
              </div>

              <h2 className="detail-title">
                {name}
              </h2>

              <div className="detail-award-box">
                <Award size={16} className="text-gold" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p className="detail-award-text">
                  Perfecto para conmemorar tu logro de promoción. Hecho con acabados finos a mano y materiales duraderos garantizados.
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 className="detail-desc-title">
                  Descripción del Cuadro
                </h4>
                <p className="detail-desc-text">
                  {description}
                </p>
              </div>
            </div>

            {/* Fila de Compra inferior */}
            <div className="detail-action-row">
              
              <div className="price-container">
                <span className="price-label">Inversión Unitario</span>
                <span className="price-value" style={{ fontSize: '1.4rem' }}>
                  S/. {Number(price).toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => {
                  onAddToCart(product)
                  onClose()
                }}
                disabled={stock === 0}
                className="btn-gold"
                style={{ padding: '12px 24px' }}
              >
                <ShoppingCart size={16} />
                <span>Agregar al Pedido</span>
              </button>

            </div>

          </div>

        </div>

      </motion.div>
    </div>
  )
}
