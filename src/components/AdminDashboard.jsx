import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Edit2, Trash2, Upload, Save, X, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

const CATEGORIES = ['Inicial', 'Primaria', 'Secundaria']

export default function AdminDashboard({ products, onRefreshProducts, onBack }) {
  const [editingProduct, setEditingProduct] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [imageUrl, setImageUrl] = useState('')
  const [stock, setStock] = useState('10')
  
  // Estados de carga e imagen
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Manejar cambio de archivo de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setImageUrl('') // Limpiar URL manual
    }
  }

  // Cargar producto al formulario para edición
  const startEdit = (product) => {
    setEditingProduct(product)
    setName(product.name)
    setDescription(product.description || '')
    setPrice(product.price)
    setCategory(product.category)
    setImageUrl(product.image_url || '')
    setStock(product.stock.toString())
    setImageFile(null)
    setImagePreview(product.image_url || '')
    setError(null)
    setSuccessMsg(null)
  }

  // Limpiar el formulario
  const resetForm = () => {
    setEditingProduct(null)
    setName('')
    setDescription('')
    setPrice('')
    setCategory(CATEGORIES[0])
    setImageUrl('')
    setStock('10')
    setImageFile(null)
    setImagePreview('')
    setError(null)
  }

  // Guardar (Crear o Editar) Producto
  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    try {
      let finalImageUrl = imageUrl

      // 1. Subir imagen a Supabase Storage si se seleccionó archivo local
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile)

        if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`)

        // Obtener URL Pública
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)
          
        finalImageUrl = data.publicUrl
      }

      // Validar datos básicos
      const productData = {
        name,
        description,
        price: parseFloat(price),
        category,
        image_url: finalImageUrl || null,
        stock: parseInt(stock),
      }

      if (editingProduct) {
        // 2a. Actualizar producto existente
        const { error: updateError } = await supabase.from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (updateError) throw updateError
        setSuccessMsg('Cuadro de promoción actualizado con éxito.')
      } else {
        // 2b. Crear nuevo producto
        const { error: insertError } = await supabase.from('products')
          .insert([productData])

        if (insertError) throw insertError
        setSuccessMsg('Nuevo cuadro de promoción creado con éxito.')
      }

      resetForm()
      onRefreshProducts() // Recargar catálogo en la vista
    } catch (err) {
      console.error('Error saving product:', err)
      setError(err.message || 'Ocurrió un error al guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  // Eliminar producto
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cuadro del catálogo? Esta acción no se puede deshacer.')) return

    try {
      const { error: deleteError } = await supabase.from('products')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      setSuccessMsg('Cuadro de promoción eliminado.')
      onRefreshProducts()
      if (editingProduct?.id === id) {
        resetForm()
      }
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Error al eliminar el producto: ' + err.message)
    }
  }

  return (
    <div className="admin-section">
      
      {/* Cabecera */}
      <div className="admin-header">
        <div>
          <button onClick={onBack} className="back-btn" style={{ marginBottom: '8px' }}>
            <ArrowLeft size={12} />
            <span>Volver al Catálogo Público</span>
          </button>
          <h2 className="hero-title" style={{ fontSize: '1.6rem', textAlign: 'left', margin: 0 }}>
            Panel de Control <span className="text-gold-gradient font-black">Administrativo</span>
          </h2>
        </div>

        <button
          onClick={onRefreshProducts}
          className="btn-outline"
          style={{ padding: '8px 16px', fontSize: '11px' }}
        >
          <RefreshCw size={12} />
          <span>Sincronizar Datos</span>
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="alert-error" style={{ marginBottom: '24px' }}>
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="alert-success" style={{ marginBottom: '24px' }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Grid Dashboard */}
      <div className="admin-dashboard-grid">
        
        {/* Formulario de CRUD */}
        <div className="admin-form-panel">
          <div className="admin-card-box admin-card-box-accent">

            <h3 className="admin-panel-title">
              <span>{editingProduct ? 'Editar Cuadro' : 'Agregar Nuevo Cuadro'}</span>
              {editingProduct && (
                <button 
                  onClick={resetForm} 
                  className="back-btn"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={12} /> Cancelar
                </button>
              )}
            </h3>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label className="form-label">Nombre del Cuadro</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cuadro de Vidrio Duplex Premium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="admin-form-row-2">
                <div>
                  <label className="form-label">Precio (S/.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="150.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Categoría de Promoción</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Descripción / Detalles</label>
                <textarea
                  placeholder="Especifica el tipo de marco, grabado, tamaño de foto y materiales..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="form-input"
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Sección de Imagen */}
              <div>
                <label className="form-label">Imagen del Producto</label>
                
                {/* Preview de la imagen */}
                {imagePreview && (
                  <div className="file-preview-box">
                    <img src={imagePreview} alt="Preview" className="file-preview-img" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview('')
                        setImageUrl('')
                      }}
                      className="file-preview-remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Subida de Archivo */}
                <div className="file-upload-container">
                  <label className="file-upload-label">
                    <div className="file-upload-icon-text">
                      <Upload size={16} />
                      <span>Subir archivo de imagen</span>
                    </div>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                  </label>
                </div>

                <div className="uppercase-divider">O ingresa un enlace</div>

                <input
                  type="url"
                  placeholder="https://ejemplo.com/foto.jpg"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value)
                    setImagePreview(e.target.value)
                    setImageFile(null)
                  }}
                  className="form-input"
                  style={{ fontSize: '11px' }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-gold w-full"
                style={{ justifyContent: 'center', padding: '12px', marginTop: '8px' }}
              >
                <Save size={16} />
                <span>{saving ? 'Guardando...' : editingProduct ? 'Actualizar Cuadro' : 'Registrar Cuadro'}</span>
              </button>

            </form>
          </div>
        </div>

        {/* Listado de Productos Existentes */}
        <div className="admin-list-panel">
          <div className="admin-card-box">
            <h3 className="admin-panel-title">
              Inventario de Cuadros ({products.length})
            </h3>

            {products.length === 0 ? (
              <div className="text-center" style={{ padding: '40px 0' }}>
                <AlertTriangle size={32} className="text-gold" style={{ opacity: 0.6, marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No hay cuadros registrados en la base de datos.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Detalle</th>
                      <th>Categoría</th>
                      <th style={{ textAlign: 'right' }}>Precio</th>
                      <th style={{ textAlign: 'center' }}>Stock</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => (
                      <tr key={prod.id}>
                        <td>
                          <div className="admin-prod-cell">
                            <img
                              src={prod.image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=150'}
                              alt={prod.name}
                              className="admin-prod-thumb"
                            />
                            <div className="admin-prod-name-col">
                              <span className="admin-prod-name">{prod.name}</span>
                              <span className="admin-prod-desc">{prod.description}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="admin-table-badge">
                            {prod.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--gold)' }}>
                          S/. {Number(prod.price).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>
                          {prod.stock}
                        </td>
                        <td>
                          <div className="action-btn-group">
                            <button
                              onClick={() => startEdit(prod)}
                              className="row-action-btn"
                              title="Editar cuadro"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="row-action-btn row-action-btn-delete"
                              title="Eliminar cuadro"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
