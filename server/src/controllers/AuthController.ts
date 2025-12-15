import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

export const AuthController = {

  // POST /api/register
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AuthService.register(req.body);
      res.status(201).json({ 
        message: 'Usuario registrado correctamente. Por favor inicia sesión.' 
      });
    } catch (error: any) {
      // Si es un error de negocio (ej: mail duplicado), mandamos 400
      if (error.message === 'El email ya está registrado') {
         res.status(400).json({ error: error.message });
      } else {
         next(error); // Error 500 genérico
      }
    }
  },

  // POST /api/login
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (error: any) {
      // Si falla login, mandamos 401
      if (error.message === 'Credenciales inválidas') {
         res.status(401).json({ error: error.message });
      } else {
         next(error);
      }
    }
  },

  // GET /api/config
  getConfig: async (req: Request, res: Response, next: NextFunction) => {
    try {
      //const agenciaId = req.user!.agenciaId; // Usamos el ID del token
      const agenciaId = (req as any).user.agenciaId;
      const data = await AuthService.getConfig(agenciaId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
};