import { Router } from 'express';
import { StaffController } from '../controllers/StaffController';
import { authenticateToken } from '../middlewares/auth';
const router = Router();
router.use(authenticateToken);

router.post('/', StaffController.create);
router.delete('/:id', StaffController.delete);
export default router;