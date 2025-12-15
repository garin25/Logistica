import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';
import { authenticateToken } from '../middlewares/auth';
const router = Router();
router.use(authenticateToken);

router.post('/', ClienteController.create);
router.delete('/:id', ClienteController.delete);
export default router;