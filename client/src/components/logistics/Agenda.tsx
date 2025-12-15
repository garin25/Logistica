import React from "react";
import { Calendar, CheckCircle2, MapPin, Plus, Trash2, Truck, User } from "lucide-react";
import { Button } from "../ui/Button"; 
// Asegúrate de importar los tipos correctos o usa 'any' temporalmente si los tipos te dan error
import type { Viaje, EstadoViaje } from "../../types"; 

interface AgendaProps {
  trips: any[]; // Usamos any temporalmente para que no te falle el build mientras arreglas los tipos
  filter: EstadoViaje;
  onDelete: (id: number) => void;
  onAssign: (id: number) => void;
  onCloseTrip: (trip: any) => void;
}

export const Agenda: React.FC<AgendaProps> = ({
  trips,
  filter,
  onDelete,
  onAssign,
  onCloseTrip,
}) => {
  const filteredTrips = trips.filter((t) => t.estado === filter);
  const isTomable = filter === "tomable";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-20 md:pb-0">
      {filteredTrips.length === 0 && (
        <div className="col-span-full text-center py-10 text-gray-400">
          No hay viajes en esta sección.
        </div>
      )}
      
      {filteredTrips.map((trip) => {
        // --- LOGICA DE VISUALIZACIÓN SEGURA ---
        // Aquí arreglamos el problema de "destinos" (Array) vs "destino" (String)
        const destinoMostrable = Array.isArray(trip.destinos) 
            ? trip.destinos[0] // Si es array, toma el primero
            : trip.destino || "Sin destino"; // Si es string o no existe

        const segundoDestino = Array.isArray(trip.destinos) && trip.destinos.length > 1
            ? trip.destinos[1]
            : trip.destino2;

        return (
          <div
            key={trip.id}
            className={`bg-white rounded-xl shadow-sm p-5 transition-all hover:shadow-md relative group ${
              isTomable
                ? "border-2 border-dashed border-yellow-400 bg-yellow-50/30"
                : "border border-gray-200"
            }`}
          >
            <button
              onClick={() => onDelete(trip.id)}
              className="absolute top-3 right-3 z-50 bg-white text-gray-400 hover:text-red-600 p-2 rounded-full shadow-sm border border-gray-100 hover:bg-red-50 transition-all"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>

            <div className="flex justify-between items-start mb-3 pr-12">
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  isTomable
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {trip.hora || "--:--"}
              </span>
              {isTomable && (
                <span className="text-xs font-bold text-yellow-600 animate-pulse">
                  DISPONIBLE
                </span>
              )}
            </div>

            {/* Título: Cliente */}
            <h3
              className="font-bold text-gray-800 text-lg mb-1 truncate"
              title={trip.cliente_nombre}
            >
              {trip.cliente_nombre || "Cliente Desconocido"}
            </h3>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {/* Fecha */}
              <div className="flex items-center gap-2">
                <Calendar size={14} /> {trip.fecha || "--/--/--"}
              </div>

              {/* Vehículo */}
              <div className="flex items-center gap-2">
                <Truck size={14} />{" "}
                {trip.tipo_camioneta || (
                  <span className="text-gray-400 italic">
                    Vehículo no definido
                  </span>
                )}
              </div>

              {/* Origen */}
              <div className="flex items-center gap-2 truncate" title={trip.origen}>
                <MapPin size={14} className="text-green-500 flex-shrink-0" />{" "}
                {trip.origen || "Sin origen"}
              </div>

              {/* Destino 1 (CORREGIDO) */}
              <div className="flex items-center gap-2 truncate" title={destinoMostrable}>
                <MapPin size={14} className="text-red-500 flex-shrink-0" />{" "}
                {destinoMostrable}
              </div>
              
              {/* Destino 2 (Opcional) */}
              {segundoDestino && (
                 <div className="flex items-center gap-2 truncate text-xs text-gray-500 ml-5">
                    + {segundoDestino}
                 </div>
              )}

              {/* Staff */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-gray-500 uppercase">
                  <User size={14} /> Staff:
                </div>
                <div className="flex flex-wrap gap-1">
                  {trip.staff_asignado && trip.staff_asignado.length > 0 ? (
                    trip.staff_asignado.map((s: any) => (
                      <span
                        key={s.staff_id || Math.random()}
                        className={`text-xs px-2 py-0.5 rounded border ${
                          s.rol === "chofer"
                            ? "bg-blue-50 border-blue-100 text-blue-700 font-bold"
                            : "bg-gray-50 border-gray-100 text-gray-600"
                        }`}
                      >
                        {s.nombre ? s.nombre.split(" ")[0] : "?"}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-orange-400 italic">
                      Sin asignar
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {isTomable ? (
                <Button
                  variant="warning"
                  className="w-full"
                  onClick={() => onAssign(trip.id)}
                >
                  <Plus size={16} /> Tomar / Editar
                </Button>
              ) : (
                <Button className="w-full" onClick={() => onCloseTrip(trip)}>
                  <CheckCircle2 size={16} /> Cerrar Viaje
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};