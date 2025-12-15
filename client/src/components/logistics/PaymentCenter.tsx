import React from "react";
import { Archive, CheckCircle2, DollarSign, Printer, Truck, User } from "lucide-react";
import { Button } from "../ui/Button";
import type { Viaje, StaffAsignado } from "../../types"; // Importa tus tipos

// 1. Definimos un tipo auxiliar local para la tabla plana
// (Solo se usa aquí, así que no hace falta llevarlo al types global)
interface PaymentItem extends StaffAsignado {
  tripData: Viaje;
}

// 2. Definimos las Props que necesita el componente
interface PaymentCenterProps {
  trips: Viaje[];
  onMarkPaid: (tripId: number, staffId: number) => void;
  onArchiveTrip: (tripId: number) => void;
  onShowVoucher: (trip: Viaje) => void;
}

export const PaymentCenter: React.FC<PaymentCenterProps> = ({
  trips,
  onMarkPaid,
  onArchiveTrip,
  onShowVoucher,
}) => {
  // --- LÓGICA DE TRANSFORMACIÓN (Se queda aquí) ---
  const closedTrips = trips.filter((t) => t.estado === "cerrado");

  // Aplanamos la lista de staff
  const payments: PaymentItem[] = closedTrips.flatMap((trip) =>
    trip.staff_asignado.map((staff) => ({ ...staff, tripData: trip }))
  );
  
  const choferPayments = payments.filter((p) => p.rol === "chofer");
  const peonPayments = payments.filter((p) => p.rol === "peon");

  // --- SUB-COMPONENTE INTERNO (Para no repetir código en las tablas) ---
  // Lo definimos aquí dentro o fuera, pero recibir las funciones por props es clave
  const renderRow = (p: PaymentItem) => (
    <tr
      key={`${p.tripData.id}-${p.staff_id}`}
      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
        p.pagado ? "opacity-50" : ""
      }`}
    >
      <td className="py-3 px-4 font-medium text-gray-800">
        {p.nombre}
        <div className="text-xs text-gray-400 font-normal">
          {p.alias_pago || "-"}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm font-semibold">
          {p.tripData.cliente_nombre}
        </div>
        <div className="text-xs text-gray-500">{p.tripData.fecha}</div>
      </td>
      <td className="py-3 px-4 font-mono font-bold text-gray-700">
        ${p.monto_a_cobrar.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-right flex justify-end gap-2 items-center">
        {p.pagado ? (
          <span className="flex items-center text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full whitespace-nowrap">
            <CheckCircle2 size={14} className="mr-1" /> PAGADO
          </span>
        ) : (
          <Button
            variant="success"
            className="py-1 px-3 text-xs whitespace-nowrap"
            onClick={() => onMarkPaid(p.tripData.id, p.staff_id)}
          >
            <DollarSign size={14} /> PAGAR
          </Button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
      
      {/* 1. TABLA CHOFERES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Truck className="text-blue-500" /> Choferes Externos / Internos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2">Beneficiario</th>
                <th className="px-4 py-2">Viaje</th>
                <th className="px-4 py-2">Monto</th>
                <th className="px-4 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {choferPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Sin pagos pendientes
                  </td>
                </tr>
              ) : (
                choferPayments.map((p) => renderRow(p))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. TABLA PEONES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
          <h3 className="font-bold text-orange-800 flex items-center gap-2">
            <User className="text-orange-500" /> Peones / Ayudantes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2">Beneficiario</th>
                <th className="px-4 py-2">Viaje</th>
                <th className="px-4 py-2">Monto</th>
                <th className="px-4 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {peonPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Sin pagos pendientes
                  </td>
                </tr>
              ) : (
                peonPayments.map((p) => renderRow(p))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. GESTIÓN DE VIAJES (ARCHIVAR) */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <CheckCircle2 className="text-green-600" /> Gestión de Viajes Finalizados
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {closedTrips.length === 0 && (
            <p className="text-gray-400 col-span-full">
              No hay viajes cerrados pendientes de archivar.
            </p>
          )}

          {closedTrips.map((trip) => {
            const allPaid = trip.staff_asignado.every((s) => s.pagado);
            return (
              <div
                key={trip.id}
                className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm"
              >
                <div>
                  <div className="font-bold text-gray-800">
                    {trip.cliente_nombre}{" "}
                    <span className="text-gray-400 text-xs font-normal">
                      #{trip.id}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    Total Cliente:{" "}
                    <span className="font-bold text-green-600">
                      ${trip.total_cliente?.toLocaleString()}
                    </span>
                  </div>
                  {allPaid ? (
                    <span className="text-[10px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded border border-green-200">
                      100% PAGADO A STAFF
                    </span>
                  ) : (
                    <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200 animate-pulse">
                      PAGOS PENDIENTES
                    </span>
                  )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    className="px-3 flex-1 sm:flex-none"
                    onClick={() => onShowVoucher(trip)}
                    title="Imprimir Voucher"
                  >
                    <Printer size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    className={`px-3 flex-1 sm:flex-none ${
                      allPaid
                        ? "hover:bg-blue-50 text-blue-600 border-blue-200"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                    onClick={() => allPaid && onArchiveTrip(trip.id)}
                    disabled={!allPaid}
                    title={allPaid ? "Archivar Viaje" : "Paga a todos para archivar"}
                  >
                    <Archive size={16} className="mr-1" /> Archivar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};