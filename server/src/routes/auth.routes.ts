import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// --- Rutas Públicas ---
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// --- Rutas Privadas ---
// GET /api/config (Requiere token)
router.get('/config', authenticateToken, AuthController.getConfig);

export default router;