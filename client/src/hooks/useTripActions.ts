// hooks/useTripActions.ts
import { api } from "../services/api";
import { toast } from "sonner";
import type { Viaje, ConfirmData, Config } from "../types"; 
import type { NuevoViajeData } from "../components/NuevoViajeForm";

export const useTripActions = (
  refreshData: () => Promise<void>, 
  config: Config 
) => {

  const deleteTrip = async (id: number) => {
    if (!confirm("¿Eliminar este viaje?")) return;
    toast.promise(api.deleteViaje(id), {
      loading: 'Eliminando viaje...',
      success: () => {
        refreshData(); // Recargamos datos si sale bien
        return 'Viaje eliminado correctamente';
      },
      error: 'Error al eliminar el viaje',
    });
  };

  const markPaid = async (viajeId: number, staffId: number) => {
       toast.promise(api.markPaid(viajeId,staffId), {
      loading: 'Pagando viaje...',
      success: () => {
        refreshData(); // Recargamos datos si sale bien
        return 'Viaje pagado correctamente';
      },
      error: 'Error al pagar el viaje',
    });
  };

  const archiveTrip = async (tripId: number) => {
    if (!confirm("¿Archivar este viaje? Desaparecerá de la lista activa.")) return;
      toast.promise(api.archiveViaje(tripId), {
      loading: 'Archivando viaje...',
      success: () => {
        refreshData(); // Recargamos datos si sale bien
        return 'Viaje archivado correctamente';
      },
      error: 'Error al archivar el viaje',
    });
  };

  const closeTrip = async (trip: Viaje, data: ConfirmData) => {
    toast.promise(api.closeViaje(trip.id, data), {
      loading: 'Cerrando viaje...',
      success: () => {
        refreshData(); // Recargamos datos si sale bien
        return 'Viaje cerrado correctamente';
      },
      error: 'Error al cerrar el viaje',
    });
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
      toast.success(editingId ? "Viaje actualizado" : "Viaje creado correctamente");
      return true;
    } catch (error) {
      console.error(error);
     toast.error("Error al guardar el viaje");
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