import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiBaseUrl } from '../api'; // 👈 agrega esto en api.js y lo importamos

const ModerationPanel = () => {
  const [posts, setPosts] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [moderationNotes, setModerationNotes] = useState({});
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();

  const API_KEY = import.meta.env.VITE_MODERATION_API_KEY;

  // Verificar autenticación al cargar
  useEffect(() => {
    const savedAuth = localStorage.getItem('moderation_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchModerationPosts();
      fetchStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === API_KEY) {
      setIsAuthenticated(true);
      localStorage.setItem('moderation_authenticated', 'true');
      fetchModerationPosts();
      fetchStats();
      setError('');
    } else {
      setError('❌ Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('moderation_authenticated');
    setPassword('');
    setPosts([]);
    setStats({});
  };

  const fetchModerationPosts = async () => {
    if (!API_KEY) {
      setError('❌ API_KEY no configurada');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/posts/moderation?status=${selectedStatus}`, // ✅ ahora usa apiBaseUrl
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );

      if (response.status === 401) {
        setError('❌ Error de autenticación. La sesión ha expirado');
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPosts(Array.isArray(data) ? data : (Array.isArray(data.posts) ? data.posts : []));
      setError('');
    } catch (error) {
      console.error('Error fetching moderation posts:', error);
      setError(`❌ Error al cargar publicaciones: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!API_KEY) return;

    try {
      const response = await fetch(`${apiBaseUrl}/posts/moderation/stats`, { // ✅ apiBaseUrl
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const statsObj = data.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {});
        setStats(statsObj);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleModeration = async (postId, action) => {
    if (!API_KEY) {
      setError('API_KEY no configurada');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/posts/${postId}/moderate`, { // ✅ apiBaseUrl
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          action,
          notes: moderationNotes[postId] || ''
        })
      });

      if (response.status === 401) {
        setError('❌ Error de autenticación. La sesión ha expirado');
        handleLogout();
        return;
      }

      if (response.ok) {
        setModerationNotes(prev => ({ ...prev, [postId]: '' }));
        fetchModerationPosts();
        fetchStats();
        setError('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error moderating post:', error);
      setError(`❌ Error al moderar: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      approved: '#28a745',
      rejected: '#dc3545'
    };
    return colors[status] || '#666';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado'
    };
    return texts[status] || status;
  };

  // Si no hay API_KEY configurada
  if (!API_KEY) {
    return (
      <div className="moderation-panel">
        <h2>🛡️ Panel de Moderación</h2>
        <div className="error-message">
          <h3>❌ Configuración Requerida</h3>
          <p>Para usar el panel de moderación, debes configurar tu API_KEY:</p>
          <ol>
            <li>Crea un archivo <code>.env</code> en la carpeta <code>frontend</code></li>
            <li>Agrega la línea: <code>VITE_MODERATION_API_KEY=tu-clave-super-secreta-aqui</code></li>
            <li>Reinicia el servidor de desarrollo</li>
          </ol>
          <p><strong>Nota:</strong> Asegúrate de usar la misma clave que configuraste en el backend.</p>
        </div>
      </div>
    );
  }

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="moderation-login">
        <div className="login-container">
          <h2>🔐 Acceso al Panel de Moderación</h2>
          <p className="login-description">
            Ingresa la contraseña de moderación para acceder al panel administrativo
          </p>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Contraseña de Moderación:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña secreta"
                required
                className="password-input"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="btn btn-submit">
              🔑 Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Panel de moderación principal
  return (
    <div className="moderation-panel">
      <div className="moderation-header">
        <div>
          <h2>🛡️ Panel de Moderación Secreto</h2>
          <p className="moderation-subtitle">Gestiona las publicaciones pendientes de revisión</p>
        </div>
        <button onClick={handleLogout} className="btn btn-logout">
          🚪 Cerrar Sesión
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="moderation-stats">
        <div className="stat">
          <span className="stat-number" style={{color: '#ffc107'}}>
            {stats.pending || 0}
          </span>
          <span className="stat-label">Pendientes</span>
        </div>
        <div className="stat">
          <span className="stat-number" style={{color: '#28a745'}}>
            {stats.approved || 0}
          </span>
          <span className="stat-label">Aprobados</span>
        </div>
        <div className="stat">
          <span className="stat-number" style={{color: '#dc3545'}}>
            {stats.rejected || 0}
          </span>
          <span className="stat-label">Rechazados</span>
        </div>
      </div>

      <div className="moderation-filters">
        <div className="filter-group">
          <label>Filtrar por estado:</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
            <option value="all">Todos</option>
          </select>
        </div>
        
        <button 
          onClick={fetchModerationPosts}
          className="btn btn-refresh"
          disabled={loading}
        >
          {loading ? '⏳ Cargando...' : '🔄 Actualizar'}
        </button>
      </div>

      <div className="moderation-list">
        {loading ? (
          <div className="loading">Cargando publicaciones...</div>
        ) : (
          <>
            {posts.map(post => (
              <div key={post._id} className="moderation-item">
                <div className="moderation-header-info">
                  <span 
                    className="status-badge"
                    style={{backgroundColor: getStatusColor(post.status)}}
                  >
                    {getStatusText(post.status)}
                  </span>
                  <span className="moderation-date">
                    📅 {new Date(post.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <h4>{post.title}</h4>
                
                <div className="post-category">
                  <strong>Categoría:</strong> {post.category}
                </div>

                <p className="moderation-content">{post.content}</p>

                {post.link && (
                  <div className="moderation-link">
                    <strong>🔗 Enlace relacionado: </strong>
                    <a 
                      href={post.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link-preview"
                    >
                      {post.link.length > 50 ? post.link.substring(0, 50) + '...' : post.link}
                    </a>
                    <small>🔍 (Abre en nueva pestaña para verificar)</small>
                  </div>
                )}

                <div className="moderation-actions">
                  <textarea
                    placeholder="Notas de moderación (opcional) - Ej: 'Enlace verificado', 'Contenido apropiado', etc."
                    value={moderationNotes[post._id] || ''}
                    onChange={(e) => setModerationNotes(prev => ({
                      ...prev,
                      [post._id]: e.target.value
                    }))}
                    className="notes-textarea"
                    rows="2"
                  />

                  {post.status === 'pending' && (
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleModeration(post._id, 'approve')}
                        className="btn-approve"
                        title="Aprobar esta publicación"
                      >
                        ✅ Aprobar
                      </button>
                      <button 
                        onClick={() => handleModeration(post._id, 'reject')}
                        className="btn-reject"
                        title="Rechazar esta publicación"
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  )}

                  {post.status !== 'pending' && post.moderatedBy && (
                    <div className="moderation-info">
                      <div className="moderation-details">
                        <small>
                          <strong>Moderado por:</strong> {post.moderatedBy}
                        </small>
                        <small>
                          <strong>Fecha moderación:</strong> {new Date(post.moderationDate).toLocaleDateString()}
                        </small>
                        {post.moderationNotes && (
                          <small>
                            <strong>Notas:</strong> {post.moderationNotes}
                          </small>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {posts.length === 0 && !loading && (
              <p className="no-posts">
                {selectedStatus === 'pending' ? '🎉 No hay publicaciones pendientes de moderación' : 
                 selectedStatus === 'approved' ? 'No hay publicaciones aprobadas' :
                 selectedStatus === 'rejected' ? 'No hay publicaciones rechazadas' :
                 'No hay publicaciones'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ModerationPanel;