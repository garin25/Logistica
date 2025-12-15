import { pool } from '../db';

export const ClienteRepository = {
  async create(agenciaId: number, data: { nombre: string, direccion: string, tipoTarifa: string }) {
    await pool.query(
      'INSERT INTO clientes (agencia_id, nombre, direccion_defecto, tipo_tarifa) VALUES ($1, $2, $3, $4)',
      [agenciaId, data.nombre, data.direccion, data.tipoTarifa]
    );
  },

  async delete(id: number, agenciaId: number) {
    const result = await pool.query('DELETE FROM clientes WHERE id = $1 AND agencia_id = $2', [id, agenciaId]);
    return result.rowCount;
  }
};