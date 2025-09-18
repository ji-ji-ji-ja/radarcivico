import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const API_KEY = process.env.MODERATION_API_KEY;

export const authenticateModerator = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado' });
  }

  const token = authHeader.substring(7);
  
  if (token !== API_KEY) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  next();
};

// Middleware para verificar el origen de la solicitud (opcional)
export const checkModerationOrigin = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const referer = req.headers.referer;
    const host = req.headers.host;
    
    // Verificar que la solicitud venga de nuestro dominio
    if (!referer || !referer.includes(host)) {
      console.warn('⚠️ Intento de acceso al panel de moderación desde origen no autorizado:', referer);
      return res.status(403).json({ error: 'Acceso no permitido desde este origen' });
    }
  }
  
  next();
};