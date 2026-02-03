import { useEffect, useState } from "react";
import { Archive } from "lucide-react";
import { Button } from "../ui/Button"; // Ajusta ruta
import type { Viaje } from "../../types"; // Ajusta ruta
import { api } from "../../services/api";

interface ArchivedProps {
  onViewDetails: (viaje: Viaje) => void;
}

export const Archived = ({ onViewDetails }: ArchivedProps) => {
  // --- ESTADO INTERNO ---
  const [historicoTrips, setHistoricoTrips] = useState<Viaje[]>([]);
  const [filtro, setFiltro] = useState<"semana" | "mes" | "3meses" | "custom">("mes");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  
  // Estado de carga
  const [loading, setLoading] = useState(false);

  // --- EFECTO ---
  useEffect(() => {
    cargarHistorico();
  }, [filtro]);

  const cargarHistorico = async () => {
    if (filtro === "custom" && (!fechaInicio || !fechaFin)) return;

    setLoading(true); // 1. Activar carga
    setHistoricoTrips([]); // Opcional: Limpiar tabla anterior para que no se vea data vieja

    let inicio = new Date();
    let fInicioStr = "";
    let fFinStr = new Date().toISOString().split("T")[0];

    if (filtro === "custom") {
      fInicioStr = fechaInicio;
      fFinStr = fechaFin;
    } else {
      if (filtro === "semana") inicio.setDate(inicio.getDate() - 7);
      else if (filtro === "mes") inicio.setMonth(inicio.getMonth() - 1);
      else if (filtro === "3meses") inicio.setMonth(inicio.getMonth() - 3);
      fInicioStr = inicio.toISOString().split("T")[0];
    }

    try {
      const data = await api.getHistorico(fInicioStr, fFinStr);
      const mapeados = data.map((v: any) => ({
        ...v,
        cliente_nombre: v.cliente_nombre || v.cliente || "Cliente",
        total_cliente: Number(v.precio_final || 0),
        destino: Array.isArray(v.destinos) ? v.destinos[0] : v.destinos,
        tipo_camioneta: v.tipo_camioneta,
      }));
      setHistoricoTrips(mapeados);
    } catch (error) {
      console.error(error);
      alert("Error cargando histórico");
    } finally {
      setLoading(false); // 2. Desactivar carga
    }
  };
  
  return (
    <div>
      {/* --- HEADER Y FILTROS (Siempre visibles) --- */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Archive className="text-gray-500" /> Historial Archivado
          </h2>

          <div className="flex bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto max-w-full">
            {(["semana", "mes", "3meses", "custom"] as const).map((f) => (
              <button
                key={f}
                disabled={loading} // Deshabilitar botones mientras carga
                onClick={() => setFiltro(f)}
                className={`px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors capitalize ${
                  filtro === f
                    ? "bg-blue-100 text-blue-700 font-bold"
                    : "text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                }`}
              >
                {f === "3meses" ? "3 Meses" : f}
              </button>
            ))}
          </div>
        </div>

        {filtro === "custom" && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col sm:flex-row gap-4 items-end animate-in slide-in-from-top-2">
            <div className="w-full sm:w-auto">
              <label className="text-xs font-bold text-blue-800 uppercase block mb-1">Desde</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-xs font-bold text-blue-800 uppercase block mb-1">Hasta</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              onClick={cargarHistorico}
              disabled={loading || !fechaInicio || !fechaFin}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              {loading ? "Buscando..." : "Buscar Viajes"}
            </Button>
          </div>
        )}
      </div>

      {/* --- ZONA DE CONTENIDO (Condicional) --- */}

      {/* 1. ESTADO DE CARGA */}
      {loading ? (
         <div className="flex flex-col justify-center items-center py-20 bg-white rounded-xl border border-gray-200 animate-pulse">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Buscando archivos...</p>
         </div>
      ) : historicoTrips.length === 0 ? (
        /* 2. ESTADO VACÍO */
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400">
            No se encontraron viajes archivados en este periodo.
          </p>
        </div>
      ) : (
        /* 3. TABLA DE RESULTADOS */
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
              {historicoTrips.map((t) => (
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