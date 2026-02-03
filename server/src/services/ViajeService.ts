import { ViajeRepository } from '../repositories/ViajeRepository';

// DTOs (Data Transfer Objects)
export interface CreateViajeDTO {
  cliente: string;
  origen: string;
  destinos: string[];
  fecha: Date;
  hora: Date;
  choferId?: number | undefined;
  peonesIds?: any;
  tipoCamioneta: string | undefined;
  tipoTarifa?: string | undefined;
}

interface CloseViajeDTO {
  horasReales: number;
  peajes: number;
  precioFinalCliente: number;
  pagos: { staffId: number; monto: number; rol: string }[];
}

export const ViajeService = {

  // 1. Obtener Viajes Activos
  getActiveViajes: async (agenciaId: number) => {
    const rows = await ViajeRepository.findAllActive(agenciaId);

    // Convertimos el JSON string de destinos a objeto JS real
    return rows.map(row => ({
      ...row,
      destinos: typeof row.destinos === 'string' ? JSON.parse(row.destinos) : row.destinos
    }));
  },

  // 2. Crear Viaje
  createViaje: async (agenciaId: number, data: CreateViajeDTO) => {
    try {

      // Lógica de negocio
      const choferIdSafe = data.choferId && Number(data.choferId) > 0 ? Number(data.choferId) : null;
      const estado = choferIdSafe ? 'pendiente' : 'tomable';
      const tipoTarifaSafe = data.tipoTarifa || 'particular';

      // Guardar cabecera usando Repository

      const viajeId = await ViajeRepository.create({
        ...data,
        choferId: choferIdSafe,
        estado,
        tipoTarifa: tipoTarifaSafe,
        agenciaId: agenciaId,
        destinos: data.destinos,
        tipoCamioneta: data.tipoCamioneta
      });

      if (choferIdSafe) {
        await ViajeRepository.addStaff(viajeId, choferIdSafe, 'chofer');
      }

      if (data.peonesIds && data.peonesIds.length > 0) {
        for (const pid of data.peonesIds) {
          if (Number(pid) !== choferIdSafe) {
            await ViajeRepository.addStaff(viajeId, Number(pid), 'peon');
          }
        }
      }

      return viajeId;

    } catch (error) {
      console.error("Error al crear el viaje:", error);
      // Aquí podrías borrar el viaje creado  (rollback manual),
      throw new Error('Hubo un error al crear el viaje. Intente nuevamente.');
    }
  },

  // 3. Actualizar Viaje
  updateViaje: async (agenciaId: number, viajeId: number, data: CreateViajeDTO) => {
    try {

      const choferIdSafe = data.choferId && Number(data.choferId) > 0 ? Number(data.choferId) : null;
      const estado = choferIdSafe ? 'pendiente' : 'tomable';
      const destinosStr = JSON.stringify(data.destinos);

      // Actualizar datos básicos
      const rowCount = await ViajeRepository.update(viajeId, agenciaId, {
        cliente: data.cliente,
        origen: data.origen,
        destinos: destinosStr,
        fecha: data.fecha,
        hora: data.hora,
        estado,
        choferId: choferIdSafe,
        tipoCamioneta: data.tipoCamioneta
      });

      if (rowCount === 0) {
        throw new Error('Viaje no encontrado o no autorizado');
      }

      // Re-hacer staff (Borrar viejo -> Poner nuevo)
      await ViajeRepository.clearStaff(viajeId);

      if (choferIdSafe) {
        await ViajeRepository.addStaff(viajeId, choferIdSafe, 'chofer');
      }

      if (data.peonesIds && data.peonesIds.length > 0) {
        for (const pid of data.peonesIds) {
          if (Number(pid) !== choferIdSafe) {
            await ViajeRepository.addStaff(viajeId, Number(pid), 'peon');
          }
        }
      }

    } catch (error) {
      console.error("Error al actualizar el viaje:", error);
      // Aquí podrías borrar el viaje creado  (rollback manual),
      throw new Error('Hubo un error al actualizar el viaje. Intente nuevamente.');
    }
  },

  // 4. Cerrar Viaje
  closeViaje: async (agenciaId: number, viajeId: number, data: CloseViajeDTO) => {
    try {

      // Actualizar estado y precios finales
      const rowCount = await ViajeRepository.close(viajeId, agenciaId, {
        horasReales: data.horasReales,
        peajes: data.peajes,
        precioFinalCliente: data.precioFinalCliente
      });

      if (rowCount === 0) {
        throw new Error('Viaje no encontrado o no autorizado');
      }

      // Actualizar pagos individuales del staff
      const listaPagos = data.pagos || [];

      for (const pago of listaPagos) {
        await ViajeRepository.updateStaffPaymentAmount(viajeId, pago.staffId, pago.monto);
      }

    } catch (error) {
      console.error("Error al cerrar el viaje:", error);
      // Aquí podrías borrar el viaje creado  (rollback manual),
      throw new Error('Hubo un error al cerrar el viaje. Intente nuevamente.');
    }
  },

  // 5. Archivar
  archiveViaje: async (agenciaId: number, viajeId: number) => {
    const rowCount = await ViajeRepository.archive(viajeId, agenciaId);
    if (rowCount === 0) throw new Error('Viaje no encontrado');
  },

  // 6. Eliminar
  deleteViaje: async (agenciaId: number, viajeId: number) => {
    const rowCount = await ViajeRepository.delete(viajeId, agenciaId);
    if (rowCount === 0) throw new Error('Viaje no encontrado');
  },

  // 7. Marcar Pago
  markStaffPayment: async (agenciaId: number, viajeId: number, staffId: number) => {
    const rowCount = await ViajeRepository.markPaid(viajeId, staffId, agenciaId);
    if (rowCount === 0) throw new Error('No se pudo marcar pago. Verifique datos.');
  },

  // 8. Histórico
  getHistory: async (agenciaId: number, fechaInicio?: string, fechaFin?: string) => {
    const rows = await ViajeRepository.findHistory(agenciaId, fechaInicio, fechaFin);

    return rows.map(row => ({
      ...row,
      destinos: typeof row.destinos === 'string' ? JSON.parse(row.destinos) : row.destinos
    }));
  }
};