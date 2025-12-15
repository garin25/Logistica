import { Request, Response, NextFunction } from 'express';
import { StatsService } from '../services/StatsService';

export const StatsController = {
  
  // GET /api/stats/dashboard
  getDashboard: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 👇 FIX: Casting
      const agenciaId = (req as any).user.agenciaId;
      
      const stats = await StatsService.getDashboard(agenciaId, req.query.year);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
};