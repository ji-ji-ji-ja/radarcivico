import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import postRoutes from './routes/posts.js';
import { verifyAuthConfig } from './middleware/auth.js';

dotenv.config();

// Verificar la configuración de autenticación al iniciar
verifyAuthConfig();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar CORS dinámicamente
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como apps móviles o Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000'
    ].filter(Boolean); // Remover valores undefined/null

    // Verificar si el origen está permitido
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ Intento de acceso desde origen no permitido:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Log de solicitudes para debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/posts', postRoutes);

// Health check mejorado
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    authConfigured: !!process.env.MODERATION_API_KEY
  });
});

// Ruta de información del servidor (solo desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/info', (req, res) => {
    res.json({
      server: 'Radar Cívico Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL,
      database: {
        connected: mongoose.connection.readyState === 1,
        name: mongoose.connection.name
      },
      cors: {
        allowedOrigins: [
          process.env.FRONTEND_URL,
          'http://localhost:5173',
          'http://localhost:3000'
        ].filter(Boolean)
      }
    });
  });
}

// Manejo de errores de CORS
app.use((err, req, res, next) => {
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({ 
      error: 'Acceso no permitido',
      message: 'El origen de la solicitud no está autorizado'
    });
  }
  next(err);
});

// Manejo general de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// Conectar MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/radarcivico')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Manejar cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔑 Moderation API Key: ${process.env.MODERATION_API_KEY ? 'Configurada' : 'NO configurada'}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

export default app;