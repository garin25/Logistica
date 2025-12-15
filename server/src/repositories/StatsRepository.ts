import { pool } from '../db';

export const StatsRepository = {
  async getDashboardStats(agenciaId: number, year: number) {
    const query = `
      SELECT 
        EXTRACT(MONTH FROM v.fecha_viaje) as mes,
        SUM(
          CASE WHEN s.es_externo = TRUE 
          THEN (
            v.precio_final 
            - v.peajes 
            - (SELECT COALESCE(SUM(monto_a_cobrar),0) FROM viaje_staff WHERE viaje_id = v.id)
          )
          ELSE 0 END
        ) as ganancia_comision,
        SUM(
          CASE WHEN s.es_externo = FALSE 
          THEN (
            v.precio_final 
            - v.peajes 
            - (SELECT COALESCE(SUM(monto_a_cobrar),0) FROM viaje_staff WHERE viaje_id = v.id AND rol != 'chofer')
          )
          ELSE 0 END
        ) as ganancia_admin
      FROM viajes v
      LEFT JOIN staff s ON v.chofer_id = s.id
      WHERE v.agencia_id = $1 
        AND v.estado IN ('cerrado', 'archivado')
        AND EXTRACT(YEAR FROM v.fecha_viaje) = $2
      GROUP BY mes
      ORDER BY mes ASC;
    `;
    
    const result = await pool.query(query, [agenciaId, year]);
    return result.rows;
  }
};