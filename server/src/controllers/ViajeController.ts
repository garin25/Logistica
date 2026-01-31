import { Request, Response, NextFunction } from 'express';
import { ViajeService } from '../services/ViajeService';
import { z } from 'zod';


const createViajeSchema = z.object({
  // 1. CLIENTE: Ahora esperamos "cliente" (String), NO "clienteId".
  // Aceptamos el nombre "Augusto" directamente.
  cliente: z.string()
    .min(1, "El nombre del cliente es obligatorio"),

  // 2. CAMIONETA: El front manda "tipoCamioneta" directo.
  // Si viene vacío '', lo pasamos a undefined.
  tipoCamioneta: z.string().optional()
    .transform(val => val === "" ? undefined : val),

  // 3. PEONES: Tu log dice que llega [].
  peonesIds: z.union([
    z.array(z.coerce.number()), 
    z.string()
  ]).optional().transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  }),

  // 4. RESTO DE CAMPOS (Coinciden con el log)
  origen: z.string(),
  destinos: z.union([z.array(z.string()), z.string()]), 
  fecha: z.coerce.date(),
  hora: z.string(),
  
  // Chofer: No aparece en tu log, así que lo dejamos opcional
  choferId: z.union([z.string(), z.number(), z.undefined()])
    .optional()
    .transform(val => {
      if (val === "" || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }),
    
  tipoTarifa: z.string().optional(),
})
.transform((data) => {
  // Lógica de destinos
  let destinosArray: string[] = [];
  if (Array.isArray(data.destinos)) {
    destinosArray = data.destinos;
  } else {
    try { destinosArray = JSON.parse(data.destinos); } catch { destinosArray = [data.destinos]; }
  }

  return {
    // ASIGNACIÓN DIRECTA
    cliente: data.cliente, // Pasamos "Augusto"
    tipoCamioneta: data.tipoCamioneta || "Sin asignar",
    
    origen: data.origen,
    destinos: destinosArray,
    fecha: data.fecha,
    hora: new Date(`1970-01-01T${data.hora}:00Z`),
    choferId: data.choferId,
    peonesIds: data.peonesIds,
    tipoTarifa: data.tipoTarifa
  };
});
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
      const agenciaId = (req as any).user.agenciaId;
      // Zod valida, parsea y transforma todo en un solo paso
      const dto = createViajeSchema.parse(req.body);

      console.log("DTO generado para el servicio:", dto); // Para debug

      const nuevoViajeId = await ViajeService.createViaje(agenciaId, dto);
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
      const agenciaId = (req as any).user.agenciaId;
      const dto = createViajeSchema.parse(req.body);

      await ViajeService.updateViaje(agenciaId, Number(id), dto);

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