import React, { useState, useMemo } from 'react'
import ProductCard from './ProductCard'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, PackageOpen, LayoutGrid, Rows } from 'lucide-react'

const CATEGORIES = ['Todos', 'Inicial', 'Primaria', 'Secundaria']

export default function Catalog({ products, onAddToCart, onDetailClick, searchTerm, viewMode, setViewMode }) {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [sortBy, setSortBy] = useState('featured')

  // Filtrado y ordenación dinámicos
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // 1. Filtrar por término de búsqueda
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower)
      )
    }

    // 2. Filtrar por categoría
    if (selectedCategory !== 'Todos') {
      result = result.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // 3. Ordenar
    if (sortBy === 'price-asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price))
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [products, selectedCategory, sortBy, searchTerm])

  return (
    <div className="catalog-section">
      
      {/* Cabecera del catálogo y filtros */}
      <div className="filter-bar">
        
        {/* Filtros de Categorías Deslizables */}
        <div className="categories-container">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Panel de Ordenamiento y Vista */}
        <div className="controls-right-container">
          
          {/* Ordenar */}
          <div className="sort-container">
            <div className="sort-label">
              <SlidersHorizontal size={12} className="text-gold" />
              <span>Ordenar:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name-asc">Nombre: A - Z</option>
            </select>
          </div>

          {/* Cambiar de Vista (Filas / Columnas) */}
          <div className="view-mode-container">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Vista Columnas (Cuadrícula)"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="Vista Filas (Lista)"
            >
              <Rows size={16} />
            </button>
          </div>

        </div>

      </div>

      {/* Resultados e indicador */}
      <div className="results-info">
        <span>
          Mostrando <strong>{filteredProducts.length}</strong> cuadros encontrados
        </span>
        {selectedCategory !== 'Todos' && (
          <span style={{ color: 'var(--gold)' }}>Filtro activo: {selectedCategory}</span>
        )}
      </div>

      {/* Grid o Lista de Productos */}
      <div className={viewMode === 'grid' ? 'products-grid' : 'products-list'}>
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onDetailClick={onDetailClick}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Vista de no resultados */}
      {filteredProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
          style={{
            padding: '60px 20px',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            marginTop: '32px'
          }}
        >
          <PackageOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>
            No se encontraron cuadros
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Prueba a buscar con otra palabra clave o selecciona otra categoría de promoción.
          </p>
        </motion.div>
      )}

    </div>
  )
}
