import { Request, Response, NextFunction } from 'express';
import { StaffService } from '../services/StaffService';

export const StaffController = {

  // POST /api/staff
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 👇 FIX: Casting para evitar el error de 'user'
      const agenciaId = (req as any).user.agenciaId;
      
      await StaffService.create(agenciaId, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/staff/:id
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 👇 FIX: Casting
      const agenciaId = (req as any).user.agenciaId;
      
      await StaffService.delete(agenciaId, Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
};