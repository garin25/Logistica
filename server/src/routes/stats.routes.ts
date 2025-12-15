import { Router } from 'express';
import { StatsController } from '../controllers/StatsController';
import { authenticateToken } from '../middlewares/auth';
const router = Router();
router.use(authenticateToken);

router.get('/dashboard', StatsController.getDashboard);
export default router;