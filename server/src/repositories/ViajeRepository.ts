import { Prisma, viajes } from '@prisma/client';
import { prisma } from '../db';

// Interfaces para tipar los datos que entran a la BD
interface ViajeData {
  agenciaId: number;
  cliente: string;
  origen: string;
  destinos: string; // JSON stringified
  fecha: string;
  hora: string;
  estado: string;
  choferId: number | null;
  tipoCamioneta: string;
  tipoTarifa: string;
}

interface UpdateViajeData {
  cliente: string;
  origen: string;
  destinos: string;
  fecha: Date;
  hora: Date;
  estado: string;
  choferId: number | null;
  tipoCamioneta: string | undefined;
}

interface CloseViajeData {
  horasReales: number;
  peajes: number;
  precioFinalCliente: number;
}

// Definimos QUÉ NECESITA el repositorio para guardar (Contrato interno)
// Ojo: Aquí 'destinos' lo pedimos como Array o Objeto, y nosotros lo stringificamos
export interface CreateViajeParams {
  agenciaId: number;
  cliente: string;
  origen: string;
  destinos: string[] | object; // Recibimos el objeto real
  fecha: Date;
  hora: Date;
  estado: string;              // Obligatorio, ya calculado
  choferId: number | null;
  tipoCamioneta: string | undefined;
  tipoTarifa: string;
}



export const ViajeRepository = {

  // 1. Obtener Viajes Activos (Lectura: Usa pool directo)
  async findAllActive(agenciaId: number): Promise<viajes[]>{
    const idSafe = Number(agenciaId);
     return  await prisma.$queryRaw`
      SELECT 
        v.id, v.cliente_nombre, v.origen, v.destinos, v.precio_final, 
        v.estado, v.peajes, v.horas_reales, v.tipo_camioneta, v.tipo_tarifa,
        to_char(v.fecha_viaje, 'YYYY-MM-DD') as fecha, 
        to_char(v.hora_viaje, 'HH24:MI') as hora,
        COALESCE(
          json_agg(
            json_build_object(
              'staff_id', vs.staff_id, 
              'nombre', s.nombre, 
              'rol', vs.rol,
              'monto_a_cobrar', vs.monto_a_cobrar, 
              'pagado', vs.pagado,
              'alias_pago', s.cbu_alias,
              'es_externo', s.es_externo
            ) 
          ) FILTER (WHERE vs.id IS NOT NULL), 
          '[]'
        ) as staff_asignado
      FROM viajes v
      LEFT JOIN viaje_staff vs ON v.id = vs.viaje_id
      LEFT JOIN staff s ON vs.staff_id = s.id
      WHERE v.agencia_id = ${idSafe} AND v.estado != 'archivado'
      GROUP BY v.id
      ORDER BY v.fecha_viaje ASC, v.hora_viaje ASC
    `;
  },

  // 2. Crear Viaje (Escritura: Recibe client para transacción)

  create: async (data: CreateViajeParams) => {
    const nuevoViaje = await prisma.viajes.create({
      data: {
        agencia_id: data.agenciaId,
        cliente_nombre: data.cliente,
        origen: data.origen,
        
        // CORRECCIÓN 1: Convertimos el Array a String aquí (Responsabilidad de DB)
        destinos: JSON.stringify(data.destinos), 
        
        fecha_viaje: data.fecha,
        hora_viaje: data.hora,
        
        // CORRECCIÓN 2: Usamos el estado que ya viene calculado
        estado: data.estado, 
        
        precio_final: 0, // Default hardcodeado por ahora
        chofer_id: data.choferId,
        tipo_camioneta: data.tipoCamioneta,
        tipo_tarifa: data.tipoTarifa
      }
    });
    return nuevoViaje.id
  },

  // 3. Agregar Staff a un Viaje (Reutilizable)

  async addStaff(viajeId: number, staffId: number, rol: 'chofer' | 'peon') {
    await prisma.viaje_staff.create({
      data: {
        viaje_id: viajeId,
        staff_id: staffId,
        rol: rol
      }
    })
  },

  // 4. Actualizar Viaje (Cabecera)
  async update(viajeId: number, agenciaId: number, data: UpdateViajeData) {

    const result = await prisma.viajes.updateMany({
      where: {
        id: viajeId,
        agencia_id: agenciaId, // Condición de seguridad (WHERE id AND agencia_id)
      },
      data: {
        cliente_nombre: data.cliente,
        origen: data.origen,
        destinos: data.destinos,
        fecha_viaje: data.fecha,
        hora_viaje: data.hora,
        estado: data.estado,
        chofer_id: data.choferId,
        tipo_camioneta: data.tipoCamioneta,
      },
    });
    return result.count;
  },

  // 5. Eliminar todo el staff de un viaje (Para actualizaciones)
  async clearStaff(viajeId: number) {
    await prisma.viaje_staff.deleteMany({
      where: {
        viaje_id: viajeId
      },
    });
  },

  // 6. Cerrar Viaje
  async close(viajeId: number, agenciaId: number, data: CloseViajeData) {
    const result = await prisma.viajes.updateMany({
      where: {
        id: viajeId,
        agencia_id: agenciaId, // Condición de seguridad (WHERE id AND agencia_id)
      },
      data: {
        estado: 'cerrado',
        horas_reales: data.horasReales,
        peajes: data.peajes,
        precio_final: data.precioFinalCliente
      },
    });
    return result.count;
  },

  // 7. Actualizar Monto a Cobrar (Para cierre de viaje)
  async updateStaffPaymentAmount(viajeId: number, staffId: number, monto: number) {
    await prisma.viaje_staff.updateMany({
      where: {
        viaje_id: viajeId,
        staff_id: staffId,
      },
      data: {
        monto_a_cobrar: monto,
      },
    });
  },

  // 8. Archivar
  async archive(viajeId: number, agenciaId: number) {
    const result = await prisma.viajes.updateMany({
      where: {
        id: viajeId,
        agencia_id: agenciaId, // Condición de seguridad (WHERE id AND agencia_id)
      },
      data: {
        estado: 'archivado',
      },
    });
    return result.count;
  },

  // 9. Eliminar (Hard Delete)
  async delete(viajeId: number, agenciaId: number) {
    const result = await prisma.viajes.deleteMany({
      where: {
        id: viajeId,
        agencia_id: agenciaId,
      }
    })
    return result.count;
  },

  // 10. Marcar Pagado (Staff)
  async markPaid(viajeId: number, staffId: number, agenciaId: number) {
    const result = await prisma.viaje_staff.updateMany({
      where: {
        viaje_id: viajeId,
        staff_id: staffId,
        viajes: {
          agencia_id: agenciaId
        }
      },
      data: {
        pagado: true,
        fecha_pago: new Date()
      }
    })
    return result.count;
  },

  // 11. Obtener Histórico (Con filtros dinámicos)
  async findHistory(agenciaId: number, fechaInicio?: string, fechaFin?: string) {
  // Construimos el filtro de fechas antes de la consulta
  let fechaFilter: Prisma.DateTimeNullableFilter | Date | string | undefined;

  if (fechaInicio && fechaFin) {
    fechaFilter = {
      gte: new Date(fechaInicio), // Mayor o igual
      lte: new Date(fechaFin)     // Menor o igual
    };
  } else {
    // Lógica de "hace 30 días" usando JavaScript nativo
    const hace30dias = new Date();
    hace30dias.setDate(hace30dias.getDate() - 30);
    
    fechaFilter = {
      gte: hace30dias
    };
  }

  // 2. La Consulta 
  const viajesRaw = await prisma.viajes.findMany({
    where: {
      agencia_id: agenciaId,
      estado: 'archivado', // Tu filtro fijo
      fecha_viaje: fechaFilter
    },
    // Ordenamiento múltiple (igual que tu SQL)
    orderBy: [
      { fecha_viaje: 'desc' },
      { hora_viaje: 'asc' }
    ],
    // Traemos las relaciones (el equivalente a tus JOINs)
    include: {
      viaje_staff: {
        include: {
          staff: true // Para sacar el nombre y alias del staff
        }
      }
    }
  });

  // 3. Transformación (Mapping) 
  // Prisma devuelve objetos anidados. 
  // Vamos a convertirlo para que el Frontend reciba JSON
  const result = viajesRaw.map(v=> ({
    id: v.id,
    cliente_nombre: v.cliente_nombre,
    origen: v.origen,
    destinos: v.destinos,
    precio_final: v.precio_final,
    estado: v.estado,
    peajes: v.peajes,
    horas_reales: v.horas_reales,
    tipo_camioneta: v.tipo_camioneta,
    tipo_tarifa: v.tipo_tarifa,
    // Formateo manual de fechas (si lo necesitas como string)
    fecha: v.fecha_viaje?.toISOString().split('T')[0], 
    hora: v.hora_viaje?.toISOString().split('T')[1].substring(0, 5), // 'HH:mm'
    
    // Aquí reconstruimos tu 'json_agg'
    staff_asignado: v.viaje_staff.map(vs => ({
      staff_id: vs.staff_id,
      nombre: vs.staff?.nombre,     // El ? protege si staff es null
      rol: vs.rol,
      monto_a_cobrar: vs.monto_a_cobrar,
      pagado: vs.pagado,
      alias_pago: vs.staff?.cbu_alias,
      es_externo: vs.staff?.es_externo
    }))
  }));

  return result;
}

};