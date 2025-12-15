import { PoolClient, QueryResult } from 'pg';
import { pool } from '../db';

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
  fecha: string;
  hora: string;
  estado: string;
  choferId: number | null;
  tipoCamioneta: string;
}

interface CloseViajeData {
  horasReales: number;
  peajes: number;
  precioFinalCliente: number;
}

export const ViajeRepository = {

  // 1. Obtener Viajes Activos (Lectura: Usa pool directo)
  async findAllActive(agenciaId: number) {
    const query = `
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
      WHERE v.agencia_id = $1 AND v.estado != 'archivado'
      GROUP BY v.id
      ORDER BY v.fecha_viaje ASC, v.hora_viaje ASC
    `;
    const result = await pool.query(query, [agenciaId]);
    return result.rows;
  },

  // 2. Crear Viaje (Escritura: Recibe client para transacción)
  async create(client: PoolClient, data: ViajeData) {
    const query = `
      INSERT INTO viajes (
        agencia_id, cliente_nombre, origen, destinos, fecha_viaje, hora_viaje, 
        estado, precio_final, chofer_id, tipo_camioneta, tipo_tarifa
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10)
      RETURNING id
    `;
    const values = [
      data.agenciaId, data.cliente, data.origen, data.destinos, 
      data.fecha, data.hora, data.estado, data.choferId, 
      data.tipoCamioneta, data.tipoTarifa
    ];
    const res = await client.query(query, values);
    return res.rows[0].id;
  },

  // 3. Agregar Staff a un Viaje (Reutilizable)
  async addStaff(client: PoolClient, viajeId: number, staffId: number, rol: 'chofer' | 'peon') {
    const query = `INSERT INTO viaje_staff (viaje_id, staff_id, rol) VALUES ($1, $2, $3)`;
    await client.query(query, [viajeId, staffId, rol]);
  },

  // 4. Actualizar Viaje (Cabecera)
  async update(client: PoolClient, viajeId: number, agenciaId: number, data: UpdateViajeData) {
    const query = `
      UPDATE viajes SET 
        cliente_nombre = $1, origen = $2, destinos = $3, fecha_viaje = $4, 
        hora_viaje = $5, estado = $6, chofer_id = $7, tipo_camioneta = $8
      WHERE id = $9 AND agencia_id = $10
    `;
    const values = [
      data.cliente, data.origen, data.destinos, data.fecha, data.hora, 
      data.estado, data.choferId, data.tipoCamioneta, viajeId, agenciaId
    ];
    const result = await client.query(query, values);
    return result.rowCount; // Retorna 0 si no encontró nada
  },

  // 5. Eliminar todo el staff de un viaje (Para actualizaciones)
  async clearStaff(client: PoolClient, viajeId: number) {
    await client.query('DELETE FROM viaje_staff WHERE viaje_id = $1', [viajeId]);
  },

  // 6. Cerrar Viaje
  async close(client: PoolClient, viajeId: number, agenciaId: number, data: CloseViajeData) {
    const query = `
      UPDATE viajes SET estado = 'cerrado', horas_reales = $1, peajes = $2, precio_final = $3 
      WHERE id = $4 AND agencia_id = $5
    `;
    const result = await client.query(query, [data.horasReales, data.peajes, data.precioFinalCliente, viajeId, agenciaId]);
    return result.rowCount;
  },

  // 7. Actualizar Monto a Cobrar (Para cierre de viaje)
  async updateStaffPaymentAmount(client: PoolClient, viajeId: number, staffId: number, monto: number) {
    const query = `UPDATE viaje_staff SET monto_a_cobrar = $1 WHERE viaje_id = $2 AND staff_id = $3`;
    await client.query(query, [monto, viajeId, staffId]);
  },

  // 8. Archivar
  async archive(viajeId: number, agenciaId: number) {
    const query = `UPDATE viajes SET estado = 'archivado' WHERE id = $1 AND agencia_id = $2`;
    const result = await pool.query(query, [viajeId, agenciaId]);
    return result.rowCount;
  },

  // 9. Eliminar (Hard Delete)
  async delete(viajeId: number, agenciaId: number) {
    const query = 'DELETE FROM viajes WHERE id = $1 AND agencia_id = $2';
    const result = await pool.query(query, [viajeId, agenciaId]);
    return result.rowCount;
  },

  // 10. Marcar Pagado (Staff)
  async markPaid(viajeId: number, staffId: number, agenciaId: number) {
    // CAMBIO: Usamos una subquery EXISTS en lugar de JOIN. 
    // Es más "a prueba de balas" para actualizaciones.
    const query = `
      UPDATE viaje_staff
      SET pagado = TRUE, fecha_pago = NOW()
      WHERE viaje_id = $1 
        AND staff_id = $2
        AND EXISTS (
          SELECT 1 FROM viajes v
          WHERE v.id = viaje_staff.viaje_id
          AND v.agencia_id = $3
        )
    `;
    
    const result = await pool.query(query, [viajeId, staffId, agenciaId]);
    return result.rowCount;
  },

  // 11. Obtener Histórico (Con filtros dinámicos)
  async findHistory(agenciaId: number, fechaInicio?: string, fechaFin?: string) {
    let query = `
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
      WHERE v.agencia_id = $1 AND v.estado = 'archivado'
    `;

    const params: any[] = [agenciaId];
    let paramIndex = 2; // $1 ya está usado

    if (fechaInicio && fechaFin) {
        query += ` AND v.fecha_viaje BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(fechaInicio, fechaFin);
    } else {
        query += ` AND v.fecha_viaje >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    query += ` GROUP BY v.id ORDER BY v.fecha_viaje DESC, v.hora_viaje ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  }
};