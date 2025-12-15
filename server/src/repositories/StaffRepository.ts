import { pool } from '../db';

export const StaffRepository = {
  async create(agenciaId: number, data: { nombre: string, rol: string, alias: string, esExterno: boolean }) {
    await pool.query(
      'INSERT INTO staff (agencia_id, nombre, rol, cbu_alias, es_externo) VALUES ($1, $2, $3, $4, $5)',
      [agenciaId, data.nombre, data.rol, data.alias, data.esExterno]
    );
  },

  async delete(id: number, agenciaId: number) {
    const result = await pool.query('DELETE FROM staff WHERE id = $1 AND agencia_id = $2', [id, agenciaId]);
    return result.rowCount;
  }
};