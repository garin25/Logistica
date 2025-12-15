import { useEffect, useState } from "react";
import type { Viaje } from "../../../types";
import { FileText, Printer, X } from "lucide-react";
import { Button } from "../../ui/Button";

// --- MODAL VOUCHER ---
interface VoucherModalProps {
  trip: Viaje;
  onClose: () => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({ trip, onClose }) => {
  const [text, setText] = useState("");

  useEffect(() => {
    const chofer = trip.staff_asignado.find((s) => s.rol === "chofer");
    const peones = trip.staff_asignado.filter((s) => s.rol === "peon");
    const totalPeones = peones.reduce(
      (acc, p) => acc + Number(p.monto_a_cobrar),
      0
    );
    const montoPeajes = Number(trip.peajes || 0);
    const totalCliente = Number(trip.total_cliente || 0);
    const costoCamion = totalCliente - totalPeones - montoPeajes;

    let draft = `Fecha: ${trip.fecha} ${trip.hora}\n`;
    draft += `Cliente: ${trip.cliente_nombre}\n`;
    draft += `Chofer: ${chofer?.nombre || "Sin asignar (Tomable)"}\n`;
    draft += `Origen: ${trip.origen}\n`;
    draft += `Destino: ${trip.destino}\n`;
    if (trip.destino2) draft += `Destino 2: ${trip.destino2}\n`;
    draft += `\n--------------------------------\n`;
    draft += `Flete (${
      trip.tipo_camioneta || "Vehículo"
    }): $${costoCamion.toLocaleString()}\n`;
    if (montoPeajes > 0) draft += `Peajes: $${montoPeajes.toLocaleString()}\n`;
    if (peones.length > 0) {
      draft += `Ayudantes:\n`;
      peones.forEach((p) => {
        draft += `- ${p.nombre}: $${Number(
          p.monto_a_cobrar
        ).toLocaleString()}\n`;
      });
    }
    draft += `--------------------------------\n`;
    draft += `TOTAL: $${totalCliente.toLocaleString()}`;
    setText(draft);
  }, [trip]);

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=600,height=600");
    if (printWindow) {
      printWindow.document.write(
        `<pre style="font-family: monospace; font-size: 14px; white-space: pre-wrap;">${text}</pre>`
      );
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <FileText size={18} /> Voucher
          </h3>
          <button onClick={onClose}>
            <X size={18} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            className="w-full h-64 p-3 border rounded-md font-mono text-sm bg-gray-50 focus:bg-white outline-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handlePrint}>
            <Printer size={16} /> Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
};