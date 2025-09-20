import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const API_KEY = process.env.MODERATION_API_KEY;

// Middleware de autenticación
export const authenticateModerator = (req, res, next) => {
  // Verificar que la API_KEY esté configurada
  if (!API_KEY) {
    console.error('❌ ERROR: MODERATION_API_KEY no está configurada en las variables de entorno');
    return res.status(500).json({ 
      error: 'Error de configuración del servidor',
      message: 'La clave de moderación no está configurada correctamente'
    });
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Token requerido',
      message: 'Incluye Authorization: Bearer <tu-token> en los headers'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Formato de token inválido',
      message: 'Usa el formato: Bearer <tu-token>'
    });
  }

  const token = authHeader.substring(7).trim();
  
  if (token !== API_KEY) {
    console.warn('⚠️ Intento de acceso con token inválido desde IP:', req.ip);
    return res.status(401).json({ 
      error: 'Token inválido',
      message: 'Verifica tu clave de moderación'
    });
  }

  console.log('✅ Acceso autorizado desde IP:', req.ip);
  next();
};

// Middleware opcional para verificar la configuración al iniciar
export const verifyAuthConfig = () => {
  if (!API_KEY) {
    console.error('❌ ERROR CRÍTICO: MODERATION_API_KEY no está configurada');
    console.error('Por favor agrega MODERATION_API_KEY=tu-clave-secreta en tu archivo .env');
    process.exit(1);
  }
  
  if (!process.env.FRONTEND_URL) {
    console.warn('⚠️ ADVERTENCIA: FRONTEND_URL no está configurada');
    console.warn('Usando URL por defecto: http://localhost:5173');
  }
  
  console.log('✅ Configuración de autenticación verificada correctamente');
  console.log('✅ Configuración de CORS verificada');
};