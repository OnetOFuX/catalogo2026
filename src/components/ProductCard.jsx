import React from 'react'
import { Plus, Eye, Award } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProductCard({ product, onAddToCart, onDetailClick, onImageClick, viewMode = 'grid' }) {
  const { name, description, price, category, image_url, stock, is_new_model } = product
  const isList = viewMode === 'list'

  return (
    <div 
      className={`angular-card ${isList ? 'angular-card-row' : ''}`}
      onClick={() => onDetailClick(product)}
    >
      
      {/* Contenedor de Imagen y Badge de Categoría */}
      <div className={`angular-card-media ${isList ? 'angular-card-media-row' : ''}`}>
        <img
          src={image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'}
          alt={name}
          className="angular-card-img"
          loading="lazy"
        />
        
        {/* Capa gradiente decorativa */}
        <div className="angular-card-overlay"></div>
        
        {/* Categoría Badge */}
        <span className="card-badge">
          {category}
        </span>

        {/* Novedad "Nuevo Modelo" Badge */}
        {is_new_model && (
          <span className="new-model-badge">
            Nuevo Modelo
          </span>
        )}

        {/* Decorador de stock bajo */}
        {stock <= 5 && stock > 0 && (
          <span className="stock-warning-badge">
            Solo {stock} unidades
          </span>
        )}
        
        {stock === 0 && (
          <span className="stock-out-badge">
            Agotado
          </span>
        )}
      </div>

      {/* Cuerpo de la Tarjeta */}
      <div className={`angular-card-body ${isList ? 'angular-card-body-row' : ''}`}>
        <div className="card-header-row">
          <h3 className="card-title">
            {name}
          </h3>
          <Award size={14} className="text-gold" style={{ opacity: 0.4 }} />
        </div>

        <p className="card-desc">
          {description}
        </p>

        {/* Fila de Precio y Acción */}
        <div className="card-action-row">
          <div className="price-container">
            <span className="price-label">Precio</span>
            <span className="price-value">
              S/. {Number(price).toFixed(2)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              if (stock > 0) onAddToCart(product)
            }}
            disabled={stock === 0}
            className="card-btn-add"
          >
            <Plus size={12} />
            <span>Añadir</span>
          </button>
        </div>
      </div>
      
    </div>
  )
}
