import React from 'react';
import { Calendar, DollarSign, MapPin, Truck, User, X } from "lucide-react";
import type { Viaje } from './LogisticsApp';
// Asegúrate de que la ruta sea correcta. Si Viaje está en LogisticsApp.tsx o App.tsx:

interface TripDetailsModalProps {
  trip: Viaje;
  onClose: () => void;
}

// 1. Agregamos 'export default' para solucionar el error de Fast Refresh
export default function TripDetailsModal({ trip, onClose }: TripDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Truck size={20} className="text-blue-400"/> 
              Viaje #{trip.id}
            </h3>
            <p className="text-slate-400 text-sm">{trip.cliente_nombre}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto">
          
          {/* Fila 1: Fecha y Vehículo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Fecha</span>
              <div className="flex items-center gap-2 font-medium text-gray-800">
                <Calendar size={16} className="text-blue-500"/> {trip.fecha}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Hora</span>
              <div className="font-medium text-gray-800">{trip.hora}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 col-span-2">
              <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Vehículo</span>
              <div className="flex items-center gap-2 font-medium text-gray-800 uppercase">
                <Truck size={16} className="text-orange-500"/> {trip.tipo_camioneta || 'No especificado'}
              </div>
            </div>
          </div>

          {/* Fila 2: Ruta */}
          <div className="mb-6 space-y-3">
             <h4 className="font-bold text-gray-800 border-b pb-2">Hoja de Ruta</h4>
             <div className="flex items-start gap-3">
                <MapPin className="text-green-600 mt-1 shrink-0" size={18} />
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase">Origen</span>
                  <p className="text-gray-800 font-medium">{trip.origen}</p>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <MapPin className="text-red-600 mt-1 shrink-0" size={18} />
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase">Destino Principal</span>
                  <p className="text-gray-800 font-medium">{trip.destino}</p>
                </div>
             </div>
             {trip.destino2 && (
               <div className="flex items-start gap-3 pl-8">
                  <div className="border-l-2 border-gray-200 pl-3">
                    <span className="text-xs text-gray-400 font-bold uppercase">Destino Secundario</span>
                    <p className="text-gray-800 font-medium">{trip.destino2}</p>
                  </div>
               </div>
             )}
          </div>

          {/* Fila 3: Finanzas y Staff */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Staff */}
            <div>
              <h4 className="font-bold text-gray-800 border-b pb-2 mb-3 flex items-center gap-2">
                <User size={16}/> Staff y Pagos
              </h4>
              <div className="space-y-2">
                {trip.staff_asignado.map(s => (
                  <div key={s.staff_id} className="flex justify-between items-center text-sm p-2 rounded bg-gray-50">
                     <div>
                        <span className={`font-bold ${s.rol === 'chofer' ? 'text-blue-700' : 'text-gray-700'}`}>
                          {s.nombre}
                        </span>
                        <span className="text-xs text-gray-400 block">{s.rol}</span>
                     </div>
                     <div className="text-right">
                        <span className="block font-mono font-medium">${s.monto_a_cobrar.toLocaleString()}</span>
                        {s.pagado ? (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded font-bold">PAGADO</span>
                        ) : (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded font-bold">PENDIENTE</span>
                        )}
                     </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div>
               <h4 className="font-bold text-gray-800 border-b pb-2 mb-3 flex items-center gap-2">
                <DollarSign size={16}/> Balance del Viaje
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Horas Reales:</span>
                    <span className="font-bold">{trip.horas_reales} hs</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Peajes:</span>
                    <span className="font-bold">${trip.peajes?.toLocaleString()}</span>
                 </div>
                 <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center">
                    <span className="text-slate-600 font-bold">Total Cliente:</span>
                    <span className="text-xl font-bold text-green-600 font-mono">${trip.total_cliente?.toLocaleString()}</span>
                 </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end shrink-0 border-t">
          {/* 2. SOLUCIÓN AL BOTÓN: Usamos un button HTML normal con clases Tailwind 
             en lugar del componente de MUI que importaste */}
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};