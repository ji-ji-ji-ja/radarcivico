import { useState, useEffect } from 'react'
import { api } from '../services/api'

const PublicSite = () => {
  const [showForm, setShowForm] = useState(false)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    link: ''
  })

  // Cargar posts aprobados
  useEffect(() => {
    fetchApprovedPosts()
  }, [])

  const fetchApprovedPosts = async () => {
    try {
      setLoading(true)
      const data = await api.getPosts('all', 1, 50) // Obtener las primeras 50 publicaciones
      setPosts(data.posts || data) // Ajustar según la respuesta de tu API
      setError('')
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError('❌ Error al cargar las publicaciones. Intenta recargar la página.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createPost(formData)
      setFormData({ title: '', content: '', category: 'general', link: '' })
      setShowForm(false)
      alert('✅ Publicación enviada para moderación. Será revisada pronto.')
      fetchApprovedPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('❌ Error al crear la publicación: ' + error.message)
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      general: '#666',
      gobierno: '#dc3545',
      empresas: '#007bff',
      educacion: '#28a745',
      salud: '#ffc107',
      justicia: '#6f42c1'
    }
    return colors[category] || colors.general
  }

  const getDomainFromUrl = (url) => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      return 'enlace'
    }
  }

  const handleLinkClick = (e, url) => {
    e.preventDefault()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <button 
        className="btn btn-primary"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Cancelar' : '➕ Nueva Publicación'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="post-form">
          <h2>Nueva Publicación</h2>
          
          <div className="form-group">
            <label>Título:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              placeholder="Título de la publicación"
              maxLength="100"
            />
          </div>

          <div className="form-group">
            <label>Categoría:</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="general">General</option>
              <option value="gobierno">Gobierno</option>
              <option value="empresas">Empresas</option>
              <option value="educacion">Educación</option>
              <option value="salud">Salud</option>
              <option value="justicia">Justicia</option>
            </select>
          </div>

          <div className="form-group">
            <label>Enlace:</label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({...formData, link: e.target.value})}
              placeholder="https://ejemplo.com"
              pattern="https?://.+"
              title="La URL debe comenzar con http:// o https://"
            />
            <small className="help-text">Solo enlaces a fuentes confiables</small>
          </div>

          <div className="form-group">
            <label>Descripción:</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
              rows="4"
              placeholder="Describe los detalles de la publicación..."
              maxLength="1000"
            />
          </div>

          <button type="submit" className="btn btn-submit">
            📨 Realizar Publicación
          </button>

          <div className="moderation-notice">
            <p>⚠️ Todas las publicaciones son revisadas antes de ser publicadas.</p>
          </div>
        </form>
      )}

      <div className="posts-container">
        <div className="posts-header">
          <h2>Listado de Publicaciones</h2>
          <button 
            onClick={fetchApprovedPosts}
            className="btn btn-refresh"
            title="Actualizar publicaciones"
          >
            🔄 Actualizar
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">
            <p>Cargando publicaciones...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="no-posts">
            <h3>📝 No hay publicaciones aún</h3>
            <p>Sé el primero en compartir información sobre casos de corrupción.</p>
            <p>Tu publicación será revisada antes de aparecer aquí.</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map(post => (
              <div key={post._id} className="post-card">
                <div className="post-header">
                  <span 
                    className="category-badge"
                    style={{backgroundColor: getCategoryColor(post.category)}}
                  >
                    {post.category}
                  </span>
                  <span className="post-date">
                    {new Date(post.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <h3>{post.title}</h3>
                
                {post.link && (
                  <div className="post-link">
                    <a 
                      href={post.link} 
                      onClick={(e) => handleLinkClick(e, post.link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-link"
                    >
                      📎 {getDomainFromUrl(post.link)}
                    </a>
                    <small>Se abre en nueva pestaña</small>
                  </div>
                )}
                
                <p className="post-content">{post.content}</p>
                
                <div className="post-footer">
                  <span className="verified-badge">
                    🔒 Anónimo
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <div className="posts-summary">
            <p>Mostrando {posts.length} publicación{posts.length !== 1 ? 'es' : ''} verificada{posts.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
    </>
  )
}

export default PublicSite