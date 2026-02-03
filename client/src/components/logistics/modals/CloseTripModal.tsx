import React, { useState } from "react";
import { X } from "lucide-react";
import { useTripCalculator } from "../../../hooks/useTripCalculator";
import type { Config, ConfirmData, Viaje } from "../../../types";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";

interface CloseTripModalProps {
  trip: Viaje;
  config: Config;
  onClose: () => void;
  onConfirm: (data: ConfirmData) => void;
}

export const CloseTripModal: React.FC<CloseTripModalProps> = ({
  trip,
  config,
  onClose,
  onConfirm,
}) => {
  // 1. Hook de Cálculos
  const {
    horas,
    peajes,
    montos,
    chofer,
    peones,
    aplicaComision,
    updateHoras,
    updatePeajes,
    updatePrecioPeonUnitario,
    updatePagoChofer,
    updateTotalCliente
  } = useTripCalculator(trip, config);

  // 2. Estado local para Observaciones
  const [observaciones, setObservaciones] = useState("");

  const handleConfirm = () => {
    // --- CORRECCIÓN CRÍTICA AQUÍ ---
    // Mapeamos el staff asignado a la estructura EXACTA que espera Zod/Backend
    // { staffId: number, monto: number, rol: string }
    const pagosFormateados = trip.staff_asignado.map((s) => {
      const esChofer = s.rol === "chofer";
      return {
        staffId: s.staff_id, // Asegúrate que en tu tipo 'Viaje' sea staff_id
        monto: esChofer ? montos.pagoChofer : montos.pagoPeonUnitario,
        rol: s.rol 
      };
    });

    // Enviamos el objeto ConfirmData limpio
    onConfirm({
      precioFinal: montos.totalCliente,
      peajes: peajes,
      horasReales: horas,
      observaciones: observaciones,
      pagos: pagosFormateados,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center shrink-0 rounded-t-xl">
          <div>
            <h3 className="text-white font-bold text-lg">Cerrar Viaje #{trip.id}</h3>
            <p className="text-blue-100 text-xs">{trip.cliente_nombre} - {trip.origen}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Badge de Tarifa */}
          <div className="bg-blue-50 border border-blue-100 p-2 rounded text-center">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Tarifa: {trip.tipo_tarifa || "PARTICULAR"}
            </span>
          </div>

          {/* Inputs Variables (Horas y Peajes) */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Horas Reales"
              type="number"
              min="0"
              step="0.5"
              value={horas}
              onChange={(e) => updateHoras(Number(e.target.value))}
              autoFocus
            />
            <Input
              label="Peajes ($)"
              type="number"
              min="0"
              value={peajes}
              onChange={(e) => updatePeajes(Number(e.target.value))}
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">
              Liquidación de Staff
            </h4>

            {/* Fila Chofer */}
            {chofer ? (
              <div className={`p-3 rounded-lg mb-3 border ${aplicaComision ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-700">
                    Chofer: {chofer.nombre}
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-white/50 border border-black/5">
                    {aplicaComision ? "Externo" : "Admin"}
                  </span>
                </div>
                <Input
                  label="Monto a Pagar"
                  type="number"
                  value={montos.pagoChofer}
                  onChange={(e) => updatePagoChofer(Number(e.target.value))}
                />
              </div>
            ) : (
              <p className="text-red-500 text-xs italic mb-2">⚠️ Este viaje no tiene chofer asignado</p>
            )}

            {/* Fila Peones */}
            {peones.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <div className="text-xs font-bold text-slate-700 mb-2 flex justify-between">
                  <span>PEONES ({peones.length})</span>
                  <span className="font-normal text-slate-500">Pago por persona</span>
                </div>
                <Input
                  label="Monto Unitario"
                  type="number"
                  value={montos.pagoPeonUnitario}
                  onChange={(e) => updatePrecioPeonUnitario(Number(e.target.value))}
                />
                <div className="mt-2 text-right text-xs text-slate-500">
                  Total Peones: <strong>${(montos.pagoPeonUnitario * peones.length).toLocaleString()}</strong>
                </div>
              </div>
            )}

            {/* Input Observaciones (NUEVO) */}
            <div className="mt-4">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observaciones</label>
               <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={2}
                  placeholder="Detalles adicionales del cierre..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
               />
            </div>

            {/* Total Cliente */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
              <Input
                label="TOTAL A COBRAR CLIENTE"
                type="number"
                value={montos.totalCliente}
                onChange={(e) => updateTotalCliente(Number(e.target.value))}
                style={{ fontSize: "1.25rem", fontWeight: "800", color: "#16a34a" }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 shrink-0 rounded-b-xl border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm}>Confirmar Cierre</Button>
        </div>
      </div>
    </div>
  );
};