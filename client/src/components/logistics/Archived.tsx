import React from "react";
import { Archive} from "lucide-react";
import { Button } from "../ui/Button"; // Ajusta ruta
import type { Viaje } from "../../types"; // Ajusta ruta

// Definimos qué necesita este componente para funcionar
interface ArchivedProps {
  trips: Viaje[]; // Son los 'historicoTrips'
  
  // Estado de Filtros
  filtro: "semana" | "mes" | "3meses" | "custom";
  setFiltro: (filtro: "semana" | "mes" | "3meses" | "custom") => void;
  
  // Fechas Custom
  fechaInicio: string;
  setFechaInicio: (date: string) => void;
  fechaFin: string;
  setFechaFin: (date: string) => void;
  
  // Acciones
  onSearch: () => void; // Para disparar la búsqueda custom
  onViewDetails: (trip: Viaje) => void; // Para ver el detalle
}

export const Archived: React.FC<ArchivedProps> = ({
  trips,
  filtro,
  setFiltro,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  onSearch,
  onViewDetails,
}) => {
  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Archive className="text-gray-500" /> Historial Archivado
          </h2>

          {/* BOTONES DE FILTRO RÁPIDO */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto max-w-full">
            {(["semana", "mes", "3meses", "custom"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors capitalize ${
                  filtro === f
                    ? "bg-blue-100 text-blue-700 font-bold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f === "3meses" ? "3 Meses" : f}
              </button>
            ))}
          </div>
        </div>

        {/* SELECTOR DE FECHAS (Solo visible si es 'custom') */}
        {filtro === "custom" && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col sm:flex-row gap-4 items-end animate-in slide-in-from-top-2">
            <div className="w-full sm:w-auto">
              <label className="text-xs font-bold text-blue-800 uppercase block mb-1">
                Desde
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-xs font-bold text-blue-800 uppercase block mb-1">
                Hasta
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              onClick={onSearch}
              disabled={!fechaInicio || !fechaFin}
              className="w-full sm:w-auto"
            >
              Buscar Viajes
            </Button>
          </div>
        )}
      </div>

      {/* TABLA DE RESULTADOS */}
      {trips.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400">
            No se encontraron viajes archivados en este periodo.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[600px] md:min-w-0">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Vehículo</th>
                <th className="p-4">Total</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr
                  key={t.id}
                  className="border-t hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => onViewDetails(t)}
                >
                  <td className="p-4 whitespace-nowrap">{t.fecha}</td>
                  <td className="p-4 font-bold">
                    {t.cliente_nombre}
                    <div className="text-xs text-gray-400 font-normal truncate max-w-[150px]">
                      {t.origen}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 uppercase">
                    {t.tipo_camioneta}
                  </td>
                  <td className="p-4 text-green-600 font-mono font-bold">
                    ${t.total_cliente?.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                      ARCHIVADO
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};