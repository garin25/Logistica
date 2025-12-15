import { Router } from 'express';
import { VehiculoController } from '../controllers/VehiculoController';
import { authenticateToken } from '../middlewares/auth';
const router = Router();
router.use(authenticateToken);

router.post('/', VehiculoController.create);
router.put('/:id', VehiculoController.update);
router.delete('/:id', VehiculoController.delete);
export default router;