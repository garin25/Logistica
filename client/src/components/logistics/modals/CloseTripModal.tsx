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
  // Usamos el Hook: Toda la lógica compleja vive aquí dentro
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

  const handleConfirm = () => {
    const updatedStaff = trip.staff_asignado.map((s) => {
      if (s.rol === "chofer") return { ...s, monto_a_cobrar: montos.pagoChofer };
      return { ...s, monto_a_cobrar: montos.pagoPeonUnitario };
    });

    onConfirm({
      horas_reales: horas,
      peajes,
      total_cliente: montos.totalCliente,
      staff_asignado: updatedStaff,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center shrink-0 rounded-t-xl">
          <h3 className="text-white font-bold text-lg">Cerrar Viaje</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Tarifa Badge */}
          <div className="bg-blue-50 p-2 rounded border border-blue-100 text-center">
            <span className="text-xs font-bold text-blue-600 uppercase">
              TARIFA APLICADA: {trip.tipo_tarifa || "PARTICULAR"}
            </span>
          </div>

          {/* Inputs Principales */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Horas Reales"
              type="number"
              min="0"
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
              Costos Calculados
            </h4>

            {/* Input Chofer */}
            {chofer ? (
              <div className={`p-3 rounded-lg mb-3 ${aplicaComision ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold">
                    {chofer.nombre} ({aplicaComision ? "Externo" : "Admin"})
                  </span>
                </div>
                <Input
                  label="A Pagar Chofer"
                  type="number"
                  value={montos.pagoChofer}
                  onChange={(e) => updatePagoChofer(Number(e.target.value))}
                />
              </div>
            ) : (
              <p className="text-red-500 text-sm">Sin chofer asignado</p>
            )}

            {/* Input Peones */}
            {peones.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="text-xs font-bold text-blue-800 mb-2">
                  PEONES x{peones.length}
                </div>
                <Input
                  label="Pago Unitario Peón"
                  type="number"
                  value={montos.pagoPeonUnitario}
                  onChange={(e) => updatePrecioPeonUnitario(Number(e.target.value))}
                />
              </div>
            )}

            {/* Total Cliente */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Input
                label="TOTAL A COBRAR CLIENTE"
                type="number"
                value={montos.totalCliente}
                onChange={(e) => updateTotalCliente(Number(e.target.value))}
                style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#16a34a" }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 shrink-0 rounded-b-xl border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar Cierre</Button>
        </div>
      </div>
    </div>
  );
};