import { Request, Response, NextFunction } from 'express';
import { VehiculoService } from '../services/VehiculoService';

export const VehiculoController = {

  // POST /api/vehiculos
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 👇 FIX: Casting
      const agenciaId = (req as any).user.agenciaId;
      
      await VehiculoService.create(agenciaId, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/vehiculos/:id
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // 👇 FIX: Casting
      const agenciaId = (req as any).user.agenciaId;
      
      await VehiculoService.update(agenciaId, Number(id), req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/vehiculos/:id
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // 👇 FIX: Casting
      const agenciaId = (req as any).user.agenciaId;
      
      await VehiculoService.delete(agenciaId, Number(id));
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
};