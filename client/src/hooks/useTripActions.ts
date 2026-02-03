// hooks/useTripActions.ts
import { api } from "../services/api";
import type { Viaje, ConfirmData, Config } from "../types"; 
import type { NuevoViajeData } from "../components/NuevoViajeForm";

export const useTripActions = (
  refreshData: () => Promise<void>, 
  config: Config 
) => {

  const deleteTrip = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este viaje?")) return;
    try {
      await api.deleteViaje(id);
      await refreshData();
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  const markPaid = async (viajeId: number, staffId: number) => {
    try {
      await api.markPaid(viajeId, staffId);
      await refreshData();
    } catch (e) {
      console.error(e);
      alert("Error al marcar como pagado");
    }
  };

  const archiveTrip = async (tripId: number) => {
    if (!confirm("¿Archivar este viaje? Desaparecerá de la lista activa.")) return;
    try {
      await api.archiveViaje(tripId);
      await refreshData();
    } catch (e) {
      alert("Error al archivar");
    }
  };

  const closeTrip = async (trip: Viaje, data: ConfirmData) => {
    try {
      await api.closeViaje(trip.id, data);
      await refreshData();
    } catch (e) {
      alert("Error al cerrar el viaje");
    }
  };

  // 👇 LA FUNCIÓN NUEVA QUE USA TU CONFIG
  const saveTrip = async (data: NuevoViajeData, editingId: number | null): Promise<boolean> => {
    try {
      // Usamos tu config.clientes_disponibles que ya tienes definida
      const clienteObj = config.clientes_disponibles?.find(
        (c) => c.id === Number(data.clienteId)
      );

      const payload = {
        cliente: clienteObj ? clienteObj.nombre : "Cliente Desconocido",
        origen: data.origen,
        destinos: data.destinos,
        fecha: data.fecha,
        hora: data.hora,
        tipoCamioneta: data.vehiculoId, 
        choferId: data.choferId ? Number(data.choferId) : undefined,
        peonesIds: data.peonesIds.map(Number),
        tipoTarifa: data.tipoTarifa,
      };

      if (editingId) {
        await api.updateViaje(editingId, payload);
      } else {
        await api.createViaje(payload);
      }

      await refreshData(); 
      return true;
    } catch (error) {
      console.error(error);
      alert("Error al guardar el viaje");
      return false;
    }
  };

  return {
    deleteTrip,
    markPaid,
    archiveTrip,
    closeTrip,
    saveTrip, 
  };
};