import { Request, Response, NextFunction } from 'express';

// 1. Fíjate que importamos los tipos arriba 👆

export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction // 2. Express NECESITA estos 4 argumentos para saber que es manejo de errores
) => {
  console.error(err);
  
  // Puedes verificar si es un error conocido o genérico
  res.status(500).json({ error: 'Ocurrió un error inesperado' });
  
  // No borres 'next', aunque no lo uses. Si lo borras, Express deja de tratarlo como ErrorHandler.
};