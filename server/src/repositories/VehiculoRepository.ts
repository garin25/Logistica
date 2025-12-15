import { pool } from '../db';

export const VehiculoRepository = {
  async create(agenciaId: number, data: { nombre: string, precioParticular: number, precioFabrica: number }) {
    await pool.query(
      'INSERT INTO tarifas (agencia_id, nombre_vehiculo, precio_particular, precio_fabrica) VALUES ($1, $2, $3, $4)',
      [agenciaId, data.nombre, data.precioParticular, data.precioFabrica]
    );
  },

  async update(id: number, agenciaId: number, data: { nombre: string, precioParticular: number, precioFabrica: number }) {
    const result = await pool.query(
      `UPDATE tarifas 
       SET nombre_vehiculo = $1, precio_particular = $2, precio_fabrica = $3 
       WHERE id = $4 AND agencia_id = $5`,
      [data.nombre, data.precioParticular, data.precioFabrica, id, agenciaId]
    );
    return result.rowCount;
  },

  async delete(id: number, agenciaId: number) {
    const result = await pool.query('DELETE FROM tarifas WHERE id = $1 AND agencia_id = $2', [id, agenciaId]);
    return result.rowCount;
  }
};