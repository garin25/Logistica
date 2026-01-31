import { prisma } from "../db";

export const StatsRepository = {
  async getDashboardStats(agenciaId: number, year: number) {
     const idSafe = Number(agenciaId);
     const yearSafe = Number(year);
  // Prisma usa "Tagged Templates" (las comillas invertidas ``) para seguridad
  const result = await prisma.$queryRaw`
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
      WHERE v.agencia_id = ${idSafe} 
        AND v.estado IN ('cerrado', 'archivado')
        AND EXTRACT(YEAR FROM v.fecha_viaje) = ${yearSafe}
      GROUP BY mes
      ORDER BY mes ASC;
  `;

  // IMPORTANTE: Postgres devuelve los SUM y COUNT como BigInt (123n).
  // JSON.stringify no sabe leer BigInt, así que hay que convertirlos a Number.
  const stats = (result as any[]).map(row => ({
    mes: Number(row.mes),
    ganancia_comision: Number(row.ganancia_comision || 0),
    ganancia_admin: Number(row.ganancia_admin || 0)
  }));

  return stats;
}
};