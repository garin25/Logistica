// src/controllers/ViajeController.ts
import { Request, Response, NextFunction } from 'express';
import { ViajeService } from '../services/ViajeService';

export const ViajeController = {

  // 1. Obtener Viajes Activos
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 👇 FIX: Usamos (req as any)
      const agenciaId = (req as any).user.agenciaId;
      const viajes = await ViajeService.getActiveViajes(agenciaId);
      res.json(viajes);
    } catch (error) {
      next(error);
    }
  },

  // 2. Crear Viaje
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 👇 FIX
      const agenciaId = (req as any).user.agenciaId;
      const nuevoViajeId = await ViajeService.createViaje(agenciaId, req.body);
      
      res.status(201).json({ 
        message: 'Viaje creado correctamente', 
        id: nuevoViajeId 
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Editar Viaje Completo
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // 👇 FIX
      const agenciaId = (req as any).user.agenciaId;

      await ViajeService.updateViaje(agenciaId, Number(id), req.body);

      res.json({ message: 'Viaje actualizado correctamente' });
    } catch (error) {
      next(error);
    }
  },

  // 4. Cerrar Viaje
  close: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // 👇 FIX
      const agenciaId = (req as any).user.agenciaId;
      
      await ViajeService.closeViaje(agenciaId, Number(id), req.body);

      res.json({ message: 'Viaje cerrado correctamente' });
    } catch (error) {
      next(error);
    }
  },

  // 5. Archivar Viaje
  archive: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // 👇 FIX
      const agenciaId = (req as any).user.agenciaId;

      await ViajeService.archiveViaje(agenciaId, Number(id));

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // 6. Eliminar Viaje
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // 👇 FIX
      const agenciaId = (req as any).user.agenciaId;

      await ViajeService.deleteViaje(agenciaId, Number(id));

      res.json({ message: 'Viaje eliminado correctamente' });
    } catch (error) {
      next(error);
    }
  },

 // 7. Marcar Pago a Staff
  markPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { viajeId, staffId } = req.params;
      // 👇 FIX casting
      const agenciaId = (req as any).user.agenciaId;

      // 🔍 DEBUG: Agrega esto para ver qué llega
      console.log('--- DEBUG PAGO ---');
      console.log('Agencia ID (Token):', agenciaId, typeof agenciaId);
      console.log('Viaje ID (URL):', viajeId, typeof viajeId);
      console.log('Staff ID (URL):', staffId, typeof staffId);
      console.log('------------------');

      await ViajeService.markStaffPayment(agenciaId, Number(viajeId), Number(staffId));

      res.json({ success: true });
    } catch (error) {
      console.error('Error en markPayment:', error); // Ver el error real en consola
      next(error);
    }
  },

  // 8. Obtener Histórico
  getHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 👇 FIX
      const agenciaId = (req as any).user.agenciaId;
      const { fechaInicio, fechaFin } = req.query;

      const fInicio = typeof fechaInicio === 'string' ? fechaInicio : undefined;
      const fFin = typeof fechaFin === 'string' ? fechaFin : undefined;

      const historial = await ViajeService.getHistory(agenciaId, fInicio, fFin);
      
      res.json(historial);
    } catch (error) {
      next(error);
    }
  }
};