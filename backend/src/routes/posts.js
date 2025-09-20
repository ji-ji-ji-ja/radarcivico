import express from 'express';
import Post from '../models/Post.js';
import { authenticateModerator } from '../middleware/auth.js';

const router = express.Router();

// GET solo posts aprobados (públicos)
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    let query = { status: 'approved' };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const posts = await Post.find(query)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);
    
    const total = await Post.countDocuments(query);
    
    res.json({
      posts,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron cargar las publicaciones'
    });
  }
});

// GET todos los posts (para moderación - requiere auth)
router.get('/moderation', authenticateModerator, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const posts = await Post.find(query)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);
    
    const total = await Post.countDocuments(query);
    
    res.json({
      posts,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching moderation posts:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron cargar las publicaciones para moderación'
    });
  }
});

// POST nuevo post (siempre va a pending)
router.post('/', async (req, res) => {
  try {
    const { title, content, category, link } = req.body;
    
    // Validaciones básicas
    if (!title || !content || !category) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        message: 'Title, content and category are required' 
      });
    }

    if (title.length > 255) {
      return res.status(400).json({
        error: 'Título demasiado largo',
        message: 'El título no puede exceder los 255 caracteres'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        error: 'Contenido demasiado largo',
        message: 'El contenido no puede exceder los 5000 caracteres'
      });
    }

    const post = new Post({
      title: title.trim(),
      content: content.trim(),
      category,
      link: link ? link.trim() : '',
      status: 'pending'
    });
    
    const savedPost = await post.save();
    
    // Log de nueva publicación
    console.log('📝 Nueva publicación creada:', {
      id: savedPost._id,
      title: savedPost.title,
      category: savedPost.category,
      status: savedPost.status
    });
    
    res.status(201).json(savedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Error de validación',
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo crear la publicación'
    });
  }
});

// PUT moderar post (aprobar/rechazar)
router.put('/:id/moderate', authenticateModerator, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        error: 'Acción inválida',
        message: 'La acción debe ser "approve" o "reject"' 
      });
    }
    
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      moderatedBy: 'admin',
      moderationDate: new Date(),
      moderationNotes: notes ? notes.trim() : ''
    };
    
    const post = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Post no encontrado',
        message: 'La publicación no existe' 
      });
    }
    
    // Log de moderación
    console.log('🛡️ Publicación moderada:', {
      id: post._id,
      action: action,
      status: post.status,
      moderator: 'admin'
    });
    
    res.json(post);
  } catch (error) {
    console.error('Error moderating post:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'ID inválido',
        message: 'El ID de la publicación no es válido' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo moderar la publicación' 
    });
  }
});

// GET estadísticas para moderación
router.get('/moderation/stats', authenticateModerator, async (req, res) => {
  try {
    const stats = await Post.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron cargar las estadísticas' 
    });
  }
});

// GET estadísticas públicas
router.get('/stats/public', async (req, res) => {
  try {
    const stats = await Post.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalVotes: { $sum: '$votes' }
        }
      }
    ]);
    
    const categoryStats = await Post.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      totalPosts: stats[0]?.totalPosts || 0,
      totalVotes: stats[0]?.totalVotes || 0,
      categories: categoryStats
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron cargar las estadísticas públicas' 
    });
  }
});

export default router;