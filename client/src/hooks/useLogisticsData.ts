import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Config, Viaje } from '../types';
import { api } from '../services/api';

export const useLogisticsData = () => {
  const queryClient = useQueryClient();
  const [dashboardYear, setDashboardYear] = useState(new Date().getFullYear());

  // 1. QUERY DE CONFIGURACIÓN
  // Se encarga solo de traer tarifas, staff y clientes.
  const configQuery = useQuery({
    queryKey: ['config'],
    queryFn: api.getConfig,
    // StaleTime alto porque la config no cambia a cada segundo
    staleTime: 1000 * 60 * 10, 
  });

  // 2. QUERY DE VIAJES (Aquí está la magia del Mapeo)
  const viajesQuery = useQuery({
    queryKey: ['viajes'],
    queryFn: api.getViajes,
    // La propiedad 'select' ejecuta tu lógica de transformación.
    // Solo se recalcula si la data del backend cambia.
    select: (viajesData: any[]): Viaje[] => {
      return viajesData.map((v: any) => ({
        ...v,
        // --- TU LÓGICA DE MAPEO EXACTA ---
        cliente_nombre: v.cliente_nombre || "Cliente Desconocido",
        tipo_camioneta: v.tipo_camioneta || "Vehículo s/n",
        fecha: v.fecha || "--/--",
        hora: v.hora || "--:--",
        origen: v.origen || "Sin origen",

        // Arrays y Destinos
        destino: Array.isArray(v.destinos) ? v.destinos[0] : (v.destino || "Sin destino"),
        destino2: Array.isArray(v.destinos) && v.destinos.length > 1 ? v.destinos[1] : undefined,

        // Números
        total_cliente: parseFloat(v.precio_final || "0"),
        peajes: parseFloat(v.peajes || "0"),
        horas_reales: parseFloat(v.horas_reales || "0"),

        // Staff
        staff_asignado: Array.isArray(v.staff_asignado) ? v.staff_asignado : [],
      }));
    }
  });

  // 3. QUERY DEL DASHBOARD
  // Depende del año. Si cambias el año, se refectchea automático.
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', dashboardYear], // El año es parte de la clave
    queryFn: () => api.getDashboardStats(dashboardYear),
  });

  // 4. FUNCIÓN PARA RECARGAR TODO MANUALMENTE (loadData)
  const loadData = async () => {
    // Invalida las queries para forzar una recarga en segundo plano
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['viajes'] }),
      queryClient.invalidateQueries({ queryKey: ['config'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    ]);
  };

  // --- PREPARAR EL RETORNO (Manteniendo compatibilidad) ---
  
  // Combinamos los estados de carga
  const loading = configQuery.isLoading || viajesQuery.isLoading;

  // Preparamos la config con valores por defecto para evitar undefined
  const config: Config = {
    tarifas: configQuery.data?.tarifas || [],
    staff_disponible: configQuery.data?.staff || configQuery.data?.staff_disponible || [],
    clientes_disponibles: configQuery.data?.clientes || configQuery.data?.clientes_disponibles || []
  };

  return {
    trips: viajesQuery.data || [], // Ya viene mapeado gracias a 'select'
    // setTrips: NO SE DEBE EXPORTAR. Modifica la caché con mutaciones, no manualmente.
    config,
    loading,
    loadData,
    dashboardStats: dashboardQuery.data || [],
    dashboardYear,
    setDashboardYear
  };
};