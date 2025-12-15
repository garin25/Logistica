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

// --- DEFINICIÓN DE RUTAS ---
app.use('/api', authRoutes); // login, register, config
app.use('/api/viajes', viajesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/stats', statsRoutes);

// --- MIDDLEWARE DE ERRORES (Siempre al final) ---
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});