import { Request, Response, NextFunction } from 'express';
import { ClienteService } from '../services/ClienteService';

export const ClienteController = {
  
  // POST /api/clientes
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 👇 FIX: Usamos el casting para evitar el error de TS
      const agenciaId = (req as any).user.agenciaId;
      
      await ClienteService.create(agenciaId, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/clientes/:id
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 👇 FIX: Usamos el casting
      const agenciaId = (req as any).user.agenciaId;
      
      await ClienteService.delete(agenciaId, Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
};