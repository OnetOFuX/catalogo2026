import React, { useState, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Edit2, Trash2, Upload, Save, X, RefreshCw, AlertTriangle, ArrowLeft, FileJson, Loader2, CheckCircle2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
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

  // Estados de carga masiva por JSON
  const [bulkData, setBulkData] = useState(null)
  const [bulkFileName, setBulkFileName] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  
  // Estados para reordenar
  const [reordering, setReordering] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState(null)

  // Estados de Filtros y Ordenamiento
  const [filterName, setFilterName] = useState('')
  const [filterCategory, setFilterCategory] = useState('Todos')
  const [filterDate, setFilterDate] = useState('')
  const [filterTimeStart, setFilterTimeStart] = useState('')
  const [filterTimeEnd, setFilterTimeEnd] = useState('')
  const [sortOrder, setSortOrder] = useState('position')

  // Formateador de Fecha de Carga
  const formatLoadDateTime = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  // Cálculo de identificador de producto tipo ID en orden cronológico
  const chronologicalIds = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      if (dateA !== dateB) return dateA - dateB
      if (a.position !== b.position) return (a.position || 0) - (b.position || 0)
      return a.id.localeCompare(b.id)
    })
    
    const idMap = {}
    sorted.forEach((prod, index) => {
      idMap[prod.id] = `#${index + 1}`
    })
    return idMap
  }, [products])

  // Filtrado y Ordenación de Productos
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // 1. Filtrar por nombre, descripción o ID cronológico
    if (filterName.trim()) {
      const search = filterName.toLowerCase().trim()
      result = result.filter((prod) => {
        const nameMatch = prod.name.toLowerCase().includes(search)
        const descMatch = (prod.description || '').toLowerCase().includes(search)
        const idMatch = (chronologicalIds[prod.id] || '').toLowerCase().includes(search)
        return nameMatch || descMatch || idMatch
      })
    }

    // 2. Filtrar por categoría
    if (filterCategory !== 'Todos') {
      result = result.filter((prod) => prod.category === filterCategory)
    }

    // 3. Filtrar por fecha
    if (filterDate) {
      result = result.filter((prod) => {
        if (!prod.created_at) return false
        const localDate = new Date(prod.created_at)
        const year = localDate.getFullYear()
        const month = String(localDate.getMonth() + 1).padStart(2, '0')
        const day = String(localDate.getDate()).padStart(2, '0')
        const formattedLocalDate = `${year}-${month}-${day}`
        return formattedLocalDate === filterDate
      })
    }

    // 4. Filtrar por hora de carga (rango)
    if (filterTimeStart || filterTimeEnd) {
      result = result.filter((prod) => {
        if (!prod.created_at) return false
        const localDate = new Date(prod.created_at)
        const hours = String(localDate.getHours()).padStart(2, '0')
        const minutes = String(localDate.getMinutes()).padStart(2, '0')
        const prodTime = `${hours}:${minutes}`

        if (filterTimeStart && prodTime < filterTimeStart) return false
        if (filterTimeEnd && prodTime > filterTimeEnd) return false
        return true
      })
    }

    // 5. Ordenamiento
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
    } else if (sortOrder === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [products, filterName, filterCategory, filterDate, filterTimeStart, filterTimeEnd, sortOrder, chronologicalIds])

  // Determinar si hay filtros activos para restringir el reordenamiento manual
  const isFilterActive = useMemo(() => {
    return (
      filterName.trim() !== '' ||
      filterCategory !== 'Todos' ||
      filterDate !== '' ||
      filterTimeStart !== '' ||
      filterTimeEnd !== '' ||
      sortOrder !== 'position'
    )
  }, [filterName, filterCategory, filterDate, filterTimeStart, filterTimeEnd, sortOrder])

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
        // 2a. Actualizar producto existente (conservando su posición)
        const { error: updateError } = await supabase.from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (updateError) throw updateError
        setSuccessMsg('Cuadro de promoción actualizado con éxito.')
      } else {
        // 2b. Crear nuevo producto (colocándolo al final)
        const maxPosition = products.length > 0
          ? Math.max(...products.map((p) => p.position || 0), 0)
          : 0
        const productWithPos = {
          ...productData,
          position: maxPosition + 1
        }
        const { error: insertError } = await supabase.from('products')
          .insert([productWithPos])

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

  // Guardar nuevo orden en base de datos Supabase
  const saveNewOrder = async (reorderedList) => {
    setReordering(true)
    setError(null)
    setSuccessMsg(null)

    try {
      // Comparar con el estado actual para actualizar únicamente los registros que cambiaron de posición indexada.
      // Así minimizamos el tráfico de red y escrituras de base de datos.
      const updates = []
      reorderedList.forEach((prod, index) => {
        if (prod.position !== index) {
          updates.push({ id: prod.id, position: index })
        }
      })

      if (updates.length > 0) {
        await Promise.all(
          updates.map(async (u) => {
            const { error: err } = await supabase
              .from('products')
              .update({ position: u.position })
              .eq('id', u.id)
            if (err) throw err
          })
        )
      }

      setSuccessMsg('Orden de los cuadros actualizado y sincronizado.')
      onRefreshProducts()
    } catch (err) {
      console.error('Error saving new product order:', err)
      setError('Error al guardar el nuevo orden: ' + err.message)
    } finally {
      setReordering(false)
    }
  }

  // Funciones de reordenamiento por botones (ChevronUp / ChevronDown)
  const moveUp = (index) => {
    if (index === 0 || reordering || isFilterActive) return
    const updated = [...products]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    saveNewOrder(updated)
  }

  const moveDown = (index) => {
    if (index === products.length - 1 || reordering || isFilterActive) return
    const updated = [...products]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    saveNewOrder(updated)
  }

  // Manejadores de Drag & Drop HTML5
  const handleDragStart = (e, index) => {
    if (reordering || isFilterActive) {
      e.preventDefault()
      return
    }
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Firefox compatibility
    e.dataTransfer.setData('text/html', e.currentTarget)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index || isFilterActive) return
    setDraggedOverIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDraggedOverIndex(null)
  }

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex || reordering || isFilterActive) return

    const updated = [...products]
    const [draggedItem] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, draggedItem)

    await saveNewOrder(updated)
    setDraggedIndex(null)
    setDraggedOverIndex(null)
  }

  // ─── Carga masiva por JSON ───
  const handleBulkFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBulkResult(null)
    setBulkFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        const items = Array.isArray(parsed) ? parsed : parsed.products || parsed.data || [parsed]
        setBulkData(items)
      } catch {
        setError('El archivo JSON no es válido. Revisa el formato.')
        setBulkData(null)
      }
    }
    reader.readAsText(file)
  }

  const handleBulkUpload = async () => {
    if (!bulkData || bulkData.length === 0) return
    setBulkLoading(true)
    setError(null)
    setBulkResult(null)

    try {
      const maxPosition = products.length > 0
        ? Math.max(...products.map((p) => p.position || 0), 0)
        : 0

      const rows = bulkData.map((item, index) => ({
        name: item.name || item.title || 'Sin nombre',
        description: item.description || '',
        price: parseFloat(item.price) || 0,
        category: item.category || 'Inicial',
        image_url: item.image_url || item.imageUrl || null,
        stock: parseInt(item.stock) || 10,
        position: maxPosition + 1 + index,
      }))

      const { data, error: insertErr } = await supabase
        .from('products')
        .insert(rows)
        .select()

      if (insertErr) throw insertErr

      setBulkResult({ success: true, count: rows.length })
      setBulkData(null)
      setBulkFileName('')
      onRefreshProducts()
    } catch (err) {
      console.error('Bulk upload error:', err)
      setError('Error al subir productos: ' + (err.message || 'Intenta de nuevo.'))
      setBulkResult({ success: false })
    } finally {
      setBulkLoading(false)
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
          <div className={editingProduct ? "admin-card-box-editing" : "admin-card-box admin-card-box-accent"}>

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

            {editingProduct && (
              <div className="editing-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>✏️</span>
                  <div>
                    <div style={{ fontWeight: '800' }}>MODO EDICIÓN ACTIVO</div>
                    <div style={{ fontSize: '9px', opacity: 0.8 }}>Modificando: {editingProduct.name}</div>
                  </div>
                </div>
              </div>
            )}

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

          {/* ── Sección Carga Masiva JSON ── */}
          <div className="admin-card-box" style={{ marginTop: '20px' }}>
            <h3 className="admin-panel-title">
              <span><FileJson size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} />Carga Masiva por JSON</span>
            </h3>

            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.6 }}>
              Sube un archivo <strong>.json</strong> con un arreglo de productos para agregarlos al catálogo de una sola vez. Las imágenes se pueden editar después.
            </p>

            {/* Input de archivo */}
            <div className="file-upload-container">
              <label className="file-upload-label">
                <div className="file-upload-icon-text">
                  <FileJson size={16} />
                  <span>{bulkFileName || 'Seleccionar archivo JSON'}</span>
                </div>
                <input
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={handleBulkFileChange}
                />
              </label>
            </div>

            {/* Vista previa de datos */}
            {bulkData && bulkData.length > 0 && (
              <div className="bulk-preview">
                <div className="bulk-preview-header">
                  <span>📦 {bulkData.length} producto{bulkData.length > 1 ? 's' : ''} detectado{bulkData.length > 1 ? 's' : ''}</span>
                  <button
                    className="back-btn"
                    onClick={() => { setBulkData(null); setBulkFileName(''); setBulkResult(null) }}
                  >
                    <X size={12} /> Cancelar
                  </button>
                </div>
                <div className="bulk-preview-list">
                  {bulkData.slice(0, 8).map((item, i) => (
                    <div key={i} className="bulk-preview-item">
                      <span className="bulk-preview-name">{item.name || item.title || 'Sin nombre'}</span>
                      <span className="bulk-preview-price">S/. {parseFloat(item.price || 0).toFixed(2)}</span>
                      <span className="admin-table-badge">{item.category || 'Inicial'}</span>
                    </div>
                  ))}
                  {bulkData.length > 8 && (
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
                      …y {bulkData.length - 8} más
                    </p>
                  )}
                </div>

                <button
                  onClick={handleBulkUpload}
                  disabled={bulkLoading}
                  className="btn-gold w-full"
                  style={{ justifyContent: 'center', padding: '12px', marginTop: '12px' }}
                >
                  {bulkLoading ? (
                    <><Loader2 size={14} className="animate-spin" /><span>Subiendo…</span></>
                  ) : (
                    <><Upload size={14} /><span>Subir {bulkData.length} producto{bulkData.length > 1 ? 's' : ''} a Supabase</span></>
                  )}
                </button>
              </div>
            )}

            {/* Resultado */}
            {bulkResult && bulkResult.success && (
              <div className="alert-success" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> Se subieron <strong>{bulkResult.count}</strong> productos correctamente.
              </div>
            )}
          </div>

        </div>

        {/* Listado de Productos Existentes */}
        <div className="admin-list-panel">
          <div className="admin-card-box">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h3 className="admin-panel-title" style={{ margin: 0 }}>
                Inventario de Cuadros ({filteredAndSortedProducts.length} de {products.length})
              </h3>
              {isFilterActive && (
                <button
                  onClick={() => {
                    setFilterName('')
                    setFilterCategory('Todos')
                    setFilterDate('')
                    setFilterTimeStart('')
                    setFilterTimeEnd('')
                    setSortOrder('position')
                  }}
                  className="back-btn"
                  style={{ color: 'var(--gold)', fontSize: '11px', padding: '4px 8px', border: '1px solid var(--border-gold)', borderRadius: '4px' }}
                >
                  Limpiar Filtros
                </button>
              )}
            </div>

            {/* Panel de Filtros */}
            <div className="admin-filters-grid">
              <div>
                <label className="form-label" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Buscar Nombre o ID</label>
                <input
                  type="text"
                  placeholder="Ej. Vidrio o #3"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="form-input"
                  style={{ padding: '8px 10px', fontSize: '11px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Categoría de Promoción</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="form-input cursor-pointer"
                  style={{ padding: '8px 10px', fontSize: '11px' }}
                >
                  <option value="Todos">Todos</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Fecha de Carga</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="form-input"
                  style={{ padding: '8px 10px', fontSize: '11px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', whiteSpace: 'nowrap' }}>Hora Inicio</label>
                  <input
                    type="time"
                    value={filterTimeStart}
                    onChange={(e) => setFilterTimeStart(e.target.value)}
                    className="form-input"
                    style={{ padding: '8px 6px', fontSize: '10px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', whiteSpace: 'nowrap' }}>Hora Fin</label>
                  <input
                    type="time"
                    value={filterTimeEnd}
                    onChange={(e) => setFilterTimeEnd(e.target.value)}
                    className="form-input"
                    style={{ padding: '8px 6px', fontSize: '10px', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Ordenar por</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="form-input cursor-pointer"
                  style={{ padding: '8px 10px', fontSize: '11px' }}
                >
                  <option value="position">Orden Personalizado</option>
                  <option value="newest">Más reciente</option>
                  <option value="oldest">Más antiguo</option>
                  <option value="name">Nombre (A-Z)</option>
                </select>
              </div>
            </div>

            {isFilterActive && (
              <div className="warning-banner-filters">
                <AlertTriangle size={12} className="text-gold" style={{ flexShrink: 0 }} />
                <span>El reordenamiento manual (arrastrar) está desactivado mientras haya filtros o un ordenamiento especial activo.</span>
              </div>
            )}

            {products.length === 0 ? (
              <div className="text-center" style={{ padding: '40px 0' }}>
                <AlertTriangle size={32} className="text-gold" style={{ opacity: 0.6, marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No hay cuadros registrados en la base de datos.</p>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="text-center" style={{ padding: '40px 0' }}>
                <AlertTriangle size={32} className="text-gold" style={{ opacity: 0.6, marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ningún cuadro coincide con los filtros aplicados.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Posición</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                      <th>Detalle</th>
                      <th>Categoría</th>
                      <th style={{ textAlign: 'right' }}>Precio</th>
                      <th style={{ textAlign: 'center' }}>Stock</th>
                      <th>Cargado el</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedProducts.map((prod, index) => (
                      <tr 
                        key={prod.id}
                        draggable={!isFilterActive}
                        onDragStart={(e) => !isFilterActive && handleDragStart(e, index)}
                        onDragOver={(e) => !isFilterActive && handleDragOver(e, index)}
                        onDragEnd={!isFilterActive ? handleDragEnd : undefined}
                        onDrop={(e) => !isFilterActive && handleDrop(e, index)}
                        className={`reorder-row ${!isFilterActive && draggedIndex === index ? 'dragging' : ''} ${!isFilterActive && draggedOverIndex === index ? 'drag-over' : ''} ${isFilterActive ? 'reorder-disabled' : ''}`}
                      >
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span 
                              className="drag-handle-icon" 
                              title={isFilterActive ? "Reordenamiento desactivado con filtros activos" : "Arrastra para reordenar"}
                              style={{ cursor: (reordering || isFilterActive) ? 'not-allowed' : 'grab', opacity: (reordering || isFilterActive) ? 0.2 : 0.6 }}
                            >
                              <GripVertical size={13} />
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <button
                                type="button"
                                onClick={() => moveUp(index)}
                                disabled={index === 0 || reordering || isFilterActive}
                                className="order-arrow-btn"
                                title="Subir"
                              >
                                <ChevronUp size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveDown(index)}
                                disabled={index === filteredAndSortedProducts.length - 1 || reordering || isFilterActive}
                                className="order-arrow-btn"
                                title="Bajar"
                              >
                                <ChevronDown size={12} />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: '800', color: 'var(--gold)', fontSize: '11px' }}>
                          {chronologicalIds[prod.id] || '-'}
                        </td>
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
                        <td style={{ color: 'var(--text-secondary)', fontSize: '10px', whiteSpace: 'nowrap' }}>
                          {formatLoadDateTime(prod.created_at)}
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
