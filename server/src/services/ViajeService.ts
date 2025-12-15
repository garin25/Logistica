import { pool } from '../db';
import { ViajeRepository } from '../repositories/ViajeRepository';

// DTOs (Data Transfer Objects)
interface CreateViajeDTO {
  cliente: string;
  origen: string;
  destinos: string[];
  fecha: string;
  hora: string;
  choferId?: number;
  peonesIds?: number[];
  tipoCamioneta: string;
  tipoTarifa?: string;
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // Inicio Transacción

      // Lógica de negocio
      const choferIdSafe = data.choferId && Number(data.choferId) > 0 ? Number(data.choferId) : null;
      const estado = choferIdSafe ? 'pendiente' : 'tomable';
      const tipoTarifaSafe = data.tipoTarifa || 'particular';
      const destinosStr = JSON.stringify(data.destinos);

      // Guardar cabecera usando Repository
      const viajeId = await ViajeRepository.create(client, {
        agenciaId,
        cliente: data.cliente,
        origen: data.origen,
        destinos: destinosStr,
        fecha: data.fecha,
        hora: data.hora,
        estado,
        choferId: choferIdSafe,
        tipoCamioneta: data.tipoCamioneta,
        tipoTarifa: tipoTarifaSafe
      });

      // Guardar Staff usando Repository
      if (choferIdSafe) {
        await ViajeRepository.addStaff(client, viajeId, choferIdSafe, 'chofer');
      }
      
      if (data.peonesIds && data.peonesIds.length > 0) {
        for (const pid of data.peonesIds) {
          if (Number(pid) !== choferIdSafe) {
             await ViajeRepository.addStaff(client, viajeId, Number(pid), 'peon');
          }
        }
      }

      await client.query('COMMIT'); // Fin Transacción
      return viajeId;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 3. Actualizar Viaje
  updateViaje: async (agenciaId: number, viajeId: number, data: CreateViajeDTO) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const choferIdSafe = data.choferId && Number(data.choferId) > 0 ? Number(data.choferId) : null;
      const estado = choferIdSafe ? 'pendiente' : 'tomable';
      const destinosStr = JSON.stringify(data.destinos);

      // Actualizar datos básicos
      const rowCount = await ViajeRepository.update(client, viajeId, agenciaId, {
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
      await ViajeRepository.clearStaff(client, viajeId);

      if (choferIdSafe) {
        await ViajeRepository.addStaff(client, viajeId, choferIdSafe, 'chofer');
      }

      if (data.peonesIds && data.peonesIds.length > 0) {
        for (const pid of data.peonesIds) {
          if (Number(pid) !== choferIdSafe) {
            await ViajeRepository.addStaff(client, viajeId, Number(pid), 'peon');
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 4. Cerrar Viaje
  closeViaje: async (agenciaId: number, viajeId: number, data: CloseViajeDTO) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Actualizar estado y precios finales
      const rowCount = await ViajeRepository.close(client, viajeId, agenciaId, {
        horasReales: data.horasReales,
        peajes: data.peajes,
        precioFinalCliente: data.precioFinalCliente
      });

      if (rowCount === 0) {
        throw new Error('Viaje no encontrado o no autorizado');
      }

      // Actualizar pagos individuales del staff
      for (const pago of data.pagos) {
        await ViajeRepository.updateStaffPaymentAmount(client, viajeId, pago.staffId, pago.monto);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
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