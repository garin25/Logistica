import { StatsRepository } from "../repositories/StatsRepository";

export const StatsService = {
  getDashboard: async (agenciaId: number, yearInput?: any) => {
    const year = yearInput || new Date().getFullYear();
    const rows = await StatsRepository.getDashboardStats(agenciaId, year);

    // Formatear respuesta (Rellenar meses vacíos con 0)
    const stats = Array.from({ length: 12 }, (_, i) => {
      const mesIndex = i + 1;
      const row = rows.find((r: any) => Number(r.mes) === mesIndex);
      
      const comision = row ? Number(row.ganancia_comision) : 0;
      const admin = row ? Number(row.ganancia_admin) : 0;

      return {
        name: new Date(0, i).toLocaleString('es-ES', { month: 'short' }), // Ene, Feb...
        comision: comision,
        admin: admin,
        total: comision + admin
      };
    });

    return stats;
  }
};