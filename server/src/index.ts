import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/auth.routes';
import viajesRoutes from './routes/viajes.routes';
import clientesRoutes from './routes/clientes.routes';
import staffRoutes from './routes/staff.routes';
import vehiculosRoutes from './routes/vehiculos.routes';
import statsRoutes from './routes/stats.routes';

// Importar Middleware de Error (que hicimos antes)
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());


// --- RUTA HEALTH CHECK (Pública) ---
// Esta ruta sirve para probar que el servidor responde sin pedir login
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});


app.use('/api', authRoutes); 
app.use('/api/viajes', viajesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/stats', statsRoutes);

// --- MIDDLEWARE DE ERRORES (Siempre al final) ---
app.use(errorHandler);

// Solo "escuchar" en el puerto si NO estamos testeando
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}

// Exportamos la app para que Vitest la pueda usar
export default app;