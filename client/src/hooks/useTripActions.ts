import { api } from "../services/api";
import type { ConfirmData, Viaje } from "../types";

export const useTripActions = (reloadTrips: () => void) => {
  
  const closeTrip = async (trip: Viaje, data: ConfirmData) => {
    try {
      await api.closeViaje(trip.id, {
        horasReales: data.horas_reales,
        peajes: data.peajes,
        precioFinalCliente: data.total_cliente,
        pagos: data.staff_asignado.map((s) => ({
          staffId: s.staff_id,
          monto: s.monto_a_cobrar,
          rol: s.rol,
        })),
      });
      await reloadTrips();
    } catch (error) {
      alert("Error al cerrar viaje");
      throw error; // Relanzamos para que el modal sepa
    }
  };

  const markPaid = async (tripId: number, staffId: number) => {
    try {
      await api.markPaid(tripId, staffId);
      await reloadTrips();
    } catch (error) {
      alert("Error marcando pago");
    }
  };

  const archiveTrip = async (tripId: number) => {
    try {
      await api.archiveViaje(tripId);
      await reloadTrips();
    } catch (error) {
      alert("Error al archivar");
    }
  };

  const deleteTrip = async (tripId: number) => {
    if (!window.confirm("¿Estás seguro de que quieres ELIMINAR este viaje?")) return;
    try {
      await api.deleteViaje(tripId);
      await reloadTrips();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  return { closeTrip, markPaid, archiveTrip, deleteTrip };
};