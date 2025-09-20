const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
  // Obtener posts aprobados con paginación
  getPosts: async (category = 'all', page = 1, limit = 10) => {
    const url = `${API_BASE_URL}/posts?category=${category}&page=${page}&limit=${limit}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error fetching posts');
    return response.json();
  },

  // Obtener estadísticas públicas
  getPublicStats: async () => {
    const response = await fetch(`${API_BASE_URL}/posts/stats/public`);
    if (!response.ok) throw new Error('Error fetching stats');
    return response.json();
  },

  // Crear nuevo post
  createPost: async (postData) => {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error creating post');
    }
    return response.json();
  },

  // Votar post
  votePost: async (postId, action) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/vote`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error voting post');
    }
    return response.json();
  },

  // Obtener estadísticas de categorías
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/posts/categories`);
    if (!response.ok) throw new Error('Error fetching categories');
    return response.json();
  },

  // Obtener estadísticas de moderación
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/posts/stats`);
    if (!response.ok) throw new Error('Error fetching stats');
    return response.json();
  }
};