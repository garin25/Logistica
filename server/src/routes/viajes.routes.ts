import { Router } from 'express';
import { ViajeController } from '../controllers/ViajeController';
import { authenticateToken } from '../middlewares/auth'; // Asegúrate de la ruta correcta

const router = Router();

// Todas las rutas de este archivo requieren estar logueado
router.use(authenticateToken);

// --- Rutas Generales ---
router.get('/', ViajeController.getAll);           // Obtener activos
router.post('/', ViajeController.create);          // Crear nuevo
router.get('/historico', ViajeController.getHistory); // Histórico (Debe ir antes de /:id para no chocar)

// --- Rutas por ID de Viaje ---
router.put('/:id', ViajeController.update);        // Editar completo
router.delete('/:id', ViajeController.delete);     // Eliminar
router.put('/:id/cerrar', ViajeController.close);  // Cerrar viaje
router.put('/:id/archivar', ViajeController.archive); // Archivar

// --- Rutas de Pagos dentro de un Viaje ---
router.put('/:viajeId/pagos/:staffId', ViajeController.markPayment);

export default router;