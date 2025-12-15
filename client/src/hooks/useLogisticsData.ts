import { useState, useEffect, useCallback } from 'react';
import type { Config, Viaje } from '../types';
import { api } from '../services/api';

export const useLogisticsData = () => {
  const [trips, setTrips] = useState<Viaje[]>([]);
  // Inicializamos config con arrays vacíos para evitar errores de "undefined"
  const [config, setConfig] = useState<Config>({ 
    tarifas: [], 
    staff_disponible: [], 
    clientes_disponibles: [] 
  });
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any[]>([]);
  const [dashboardYear, setDashboardYear] = useState(new Date().getFullYear());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [viajesData, configData] = await Promise.all([api.getViajes(), api.getConfig()]);
      
      // === MAPEO EXACTO BASADO EN TU LOG ===
      const viajesMapeados = viajesData.map((v: any) => ({
        // Copiamos todo lo original (id, estado, etc.)
        ...v, 
        
        // 1. Strings directos (Backend -> Frontend)
        cliente_nombre: v.cliente_nombre || "Cliente Desconocido",
        tipo_camioneta: v.tipo_camioneta || "Vehículo s/n",
        fecha: v.fecha || "--/--",
        hora: v.hora || "--:--",
        origen: v.origen || "Sin origen",

        // 2. Transformación de Destinos (Array -> String)
        // Tu UI espera 'destino' (singular), pero el backend manda 'destinos' (array)
        destino: Array.isArray(v.destinos) ? v.destinos[0] : (v.destino || "Sin destino"),
        destino2: Array.isArray(v.destinos) && v.destinos.length > 1 ? v.destinos[1] : undefined,

        // 3. Conversión de Números (Vienen como string "0.00")
        total_cliente: parseFloat(v.precio_final || "0"),
        peajes: parseFloat(v.peajes || "0"),
        horas_reales: parseFloat(v.horas_reales || "0"),

        // 4. Staff (Protección)
        staff_asignado: Array.isArray(v.staff_asignado) ? v.staff_asignado : [],
      }));

      setTrips(viajesMapeados); 
      
      // Protección para Config
      setConfig({
        tarifas: configData.tarifas || [],
        staff_disponible: configData.staff || configData.staff_disponible || [],
        clientes_disponibles: configData.clientes || configData.clientes_disponibles || []
      });

    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Carga de Dashboard
  useEffect(() => {
     const fetchStats = async () => {
        try {
          const data = await api.getDashboardStats(dashboardYear);
          setDashboardStats(data || []);
        } catch (e) {
          console.error("Error dashboard", e);
        }
     };
     fetchStats();
  }, [dashboardYear]);

  return { 
    trips, 
    setTrips, 
    config, 
    loading, 
    loadData, 
    dashboardStats, 
    dashboardYear, 
    setDashboardYear 
  };
};