import { Request, Response, NextFunction } from 'express'; // 1. Importaciones necesarias
import jwt from 'jsonwebtoken';

// 2. Aseguramos la clave secreta
const SECRET_KEY = process.env.JWT_SECRET || 'clave_fallback_insegura'; 

// Definimos qué forma tiene tu token (para que TS te ayude)
interface UserPayload {
  id: number;
  email: string;
  agenciaId: number;
}

// Extendemos la Request localmente para este archivo (o usa la solución global que te di antes)
interface CustomRequest extends Request {
  user?: UserPayload;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
      res.sendStatus(401); // Importante: no usar 'return' vacío si TS es estricto
      return; 
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
        res.sendStatus(403);
        return;
    }
    
    // Aquí hacemos el cast seguro
    (req as CustomRequest).user = user as UserPayload;
    next();
  });
};