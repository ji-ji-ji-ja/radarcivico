import express from 'express';
import Post from '../models/Post.js';
import { authenticateModerator, checkModerationOrigin } from '../middleware/auth.js';

const router = express.Router();

// GET solo posts aprobados (públicos)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = { status: 'approved' };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const posts = await Post.find(query).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET todos los posts (para moderación - requiere auth)
router.get('/moderation', checkModerationOrigin, authenticateModerator, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const posts = await Post.find(query).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST nuevo post (siempre va a pending)
router.post('/', async (req, res) => {
  try {
    const { title, content, category, link } = req.body;
    
    const post = new Post({
      title,
      content,
      category,
      link: link || '',
      status: 'pending' // Todos los nuevos posts requieren moderación
    });
    
    const savedPost = await post.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT moderar post (aprobar/rechazar)
router.put('/:id/moderate', checkModerationOrigin, authenticateModerator, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'approve' or 'reject'
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Acción inválida' });
    }
    
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      moderatedBy: 'admin', // Puedes cambiar esto por el usuario real
      moderationDate: new Date(),
      moderationNotes: notes || ''
    };
    
    const post = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT votar post (solo posts aprobados)
/*router.put('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    // Verificar que el post existe y está aprobado
    const post = await Post.findOne({ _id: id, status: 'approved' });
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado o no aprobado' });
    }
    
    const voteChange = action === 'upvote' ? 1 : -1;
    post.votes += voteChange;
    
    await post.save();
    res.json({ votes: post.votes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});*/

// GET estadísticas para moderación
router.get('/moderation/stats', checkModerationOrigin, authenticateModerator, async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

export default router;