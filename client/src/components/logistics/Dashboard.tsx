import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Truck, User } from "lucide-react";

interface DashboardProps {
  stats: any[];
  year: number;
  onYearChange: (year: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, year, onYearChange }) => {
  
  // 1. DIAGNÓSTICO RÁPIDO (Abre la consola y mira qué sale aquí)
  console.log("DASHBOARD STATS RECIBIDOS:", stats);

  // 2. MAPEO DE SEGURIDAD (Critical Fix)
  // Convertimos strings a números para que el gráfico no falle silenciosamente
  const chartData = stats.map((item) => ({
    name: item.name || item.mes || "Mes", // Asegura que haya un nombre para el eje X
    admin: Number(item.admin || item.ganancia_admin || 0), // Convierte "100.00" a 100
    comision: Number(item.comision || item.ganancia_comision || 0),
  }));

  // Calculamos totales
  const totalAnualAdmin = chartData.reduce((acc, curr) => acc + curr.admin, 0);
  const totalAnualComision = chartData.reduce((acc, curr) => acc + curr.comision, 0);

  // Totales del mes actual (aprox)
  const currentMonthIndex = new Date().getMonth();
  const currentMonthStats = chartData[currentMonthIndex] || { admin: 0, comision: 0 };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      
      {/* CABECERA CON FILTRO DE AÑO */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">Resumen Financiero</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 font-medium">Año:</span>
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </div>

      {/* TARJETAS DE RESUMEN (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TARJETA 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">
              Ganancia Admin (Propia)
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              ${totalAnualAdmin.toLocaleString()}
              <span className="text-xs font-normal text-gray-400"> / Año</span>
            </h3>
            <p className="text-sm text-blue-600 font-medium mt-1">
              Este mes: ${currentMonthStats.admin.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-full text-blue-600">
            <Truck size={24} />
          </div>
        </div>

        {/* TARJETA 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">
              Ganancia por Comisiones
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              ${totalAnualComision.toLocaleString()}
              <span className="text-xs font-normal text-gray-400"> / Año</span>
            </h3>
            <p className="text-sm text-green-600 font-medium mt-1">
              Este mes: ${currentMonthStats.comision.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-full text-green-600">
            <User size={24} />
          </div>
        </div>
      </div>

      {/* GRÁFICO 1: EVOLUCIÓN GANANCIA ADMIN */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-6 text-gray-700 flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div> Evolución Ganancia Admin
        </h3>
        
        {/* IMPORTANTE: El contenedor debe tener altura (h-64) */}
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatYAxis}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Ganancia"]}
                />
                <Bar
                  dataKey="admin"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              No hay datos para mostrar en este año
            </div>
          )}
        </div>
      </div>

      {/* GRÁFICO 2: EVOLUCIÓN COMISIONES */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-6 text-gray-700 flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div> Evolución Comisiones
        </h3>
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatYAxis}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Comisión"]}
                />
                <Bar
                  dataKey="comision"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              No hay datos para mostrar
            </div>
          )}
        </div>
      </div>
    </div>
  );
};