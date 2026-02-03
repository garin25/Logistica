import { useState } from "react";
import {
  LayoutGrid, AlertCircle, Calendar, Wallet, Archive,
  Settings, Plus, LogOut, Truck,
} from "lucide-react";

// Hooks
import { useLogisticsData } from "../hooks/useLogisticsData";
import { useTripActions } from "../hooks/useTripActions";

// Componentes
import { FullPageLoader } from "./ui/FullPageLoader";
import { Button } from "./ui/Button";

// Vistas
import { Dashboard } from "./logistics/Dashboard";
import { Agenda } from "./logistics/Agenda";
import { PaymentCenter } from "./logistics/PaymentCenter";
import { Resources } from "./logistics/Resources";
import { Archived } from "./logistics/Archived"; // <--- Ahora este componente maneja su propia data

// Modales
import NuevoViajeForm, { type NuevoViajeData } from "../components/NuevoViajeForm";
import TripDetailsModal from "../components/TripDetailsModal";
import { CloseTripModal } from "./logistics/modals/CloseTripModal";
import { VoucherModal } from "./logistics/modals/VoucherModal";
import type { Viaje, ConfirmData } from "../types";

// --- CONFIGURACIÓN DE NAVEGACIÓN ---
// Sacamos esto fuera del componente para que sea estático y limpio
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "tomables", label: "Tomables", icon: AlertCircle },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "caja", label: "Caja", icon: Wallet },
  { id: "archivados", label: "Archivados", icon: Archive },
  { id: "recursos", label: "Recursos", icon: Settings },
] as const;

type ViewType = typeof NAV_ITEMS[number]["id"];

interface LogisticsAppProps {
  onLogout: () => void;
}

export default function LogisticsApp({ onLogout }: LogisticsAppProps) {
  // Estados UI
  const [view, setView] = useState<ViewType>("agenda");
  
  // Estados Modales
  const [closingTrip, setClosingTrip] = useState<Viaje | null>(null);
  const [voucherTrip, setVoucherTrip] = useState<Viaje | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Viaje | null>(null);
  
  // Estados Formulario (Crear/Editar)
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [formDataForEdit, setFormDataForEdit] = useState<NuevoViajeData | undefined>(undefined);

  // Hooks de Datos
  const { 
    trips, config, loading, loadData, 
    dashboardStats, dashboardYear, setDashboardYear 
  } = useLogisticsData();

  // Ahora saveTrip incluye la lógica de create/update que tenías aquí
  const { deleteTrip, markPaid, archiveTrip, closeTrip, saveTrip } = useTripActions(loadData, config);

  // --- HANDLERS ---

  const handleOpenCreateModal = () => {
    setEditingTripId(null);
    setFormDataForEdit(undefined);
    setIsNewTripModalOpen(true);
  };

  const assignDriverToTakable = (tripId: number) => {
    const tripToEdit = trips.find((t) => t.id === tripId);
    if (!tripToEdit) return;

    // Lógica de mapeo extraída para limpieza
    const clienteEncontrado = config.clientes_disponibles?.find(
      (c) => c.nombre === tripToEdit.cliente_nombre
    );
    
    setEditingTripId(tripId);
    setFormDataForEdit({
      clienteId: clienteEncontrado ? clienteEncontrado.id.toString() : "",
      tipoTarifa: tripToEdit.tipo_tarifa || "particular",
      fecha: tripToEdit.fecha,
      hora: tripToEdit.hora,
      origen: tripToEdit.origen,
      destinos: tripToEdit.destino2 ? [tripToEdit.destino, tripToEdit.destino2] : [tripToEdit.destino],
      vehiculoId: tripToEdit.tipo_camioneta || "",
      choferId: tripToEdit.staff_asignado?.find(s => s.rol === "chofer")?.staff_id.toString() || "",
      peonesIds: tripToEdit.staff_asignado?.filter(s => s.rol === "peon").map(s => s.staff_id.toString()) || [],
      estado: tripToEdit.estado === "tomable" ? "TOMABLE" : "AGENDA",
    });
    setIsNewTripModalOpen(true);
  };

  const handleFormSubmit = async (data: NuevoViajeData) => {
    // Delegamos la lógica al hook useTripActions
    const success = await saveTrip(data, editingTripId);
    if (success) {
      setIsNewTripModalOpen(false);
      setEditingTripId(null);
      setFormDataForEdit(undefined);
    }
  };

  const handleCloseConfirm = async (data: ConfirmData) => {
    if (closingTrip) {
      await closeTrip(closingTrip, data);
      setClosingTrip(null);
    }
  };

  // --- RENDER CONTENT ---
  // Un switch hace el return principal más limpio
  const renderContent = () => {
    switch (view) {
      case "dashboard":
        return <Dashboard stats={dashboardStats} year={dashboardYear} onYearChange={setDashboardYear} />;
      case "agenda":
        return <Agenda trips={trips} filter="pendiente" onDelete={deleteTrip} onAssign={assignDriverToTakable} onCloseTrip={setClosingTrip} />;
      case "tomables":
        return <Agenda trips={trips} filter="tomable" onDelete={deleteTrip} onAssign={assignDriverToTakable} onCloseTrip={setClosingTrip} />;
      case "caja":
        return <PaymentCenter trips={trips} onMarkPaid={markPaid} onArchiveTrip={archiveTrip} onShowVoucher={setVoucherTrip} />;
      case "recursos":
        return <Resources config={config} onUpdate={loadData} />;
      case "archivados":
        // El componente Archived ahora se encarga de su propio fetch
        return <Archived onViewDetails={setViewingTrip} />;
      default:
        return null;
    }
  };

  if (loading) return <FullPageLoader />;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 flex flex-col md:flex-row">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col h-full flex-shrink-0">
        <div className="p-6 shrink-0">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="text-blue-400" /> Logística
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
           {NAV_ITEMS.map((item) => (
             <Button 
               key={item.id}
               variant={view === item.id ? "primary" : "secondary"} 
               onClick={() => setView(item.id)} 
               className="w-full justify-start"
             >
               <item.icon className="mr-2" size={18}/> {item.label}
             </Button>
           ))}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0 space-y-2">
           <button onClick={handleOpenCreateModal} className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold flex justify-center gap-2">
             <Plus size={18}/> Nuevo Viaje
           </button>
           <button onClick={onLogout} className="w-full bg-slate-800 text-slate-300 py-2 rounded-lg text-xs flex justify-center gap-2">
             <LogOut size={16}/> Salir
           </button>
        </div>
      </aside>

      {/* HEADER MÓVIL */}
      <header className="md:hidden bg-white border-b p-3 flex justify-between items-center sticky top-0 z-30 shadow-sm shrink-0 h-14">
         <span className="font-bold flex items-center gap-2 text-slate-700">
            <Truck size={20} className="text-blue-600"/> Logística
         </span>
         <button onClick={onLogout} className="text-gray-500 hover:text-red-500">
            <LogOut size={20}/>
         </button>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 relative pb-24 md:pb-8">
        {renderContent()}
      </main>

      {/* NAV MÓVIL */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between items-center px-2 py-2 z-40 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center w-full py-1 rounded-lg transition-colors ${
              view === item.id ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <item.icon size={20} strokeWidth={view === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* FAB (Floating Action Button) */}
      <button
        onClick={handleOpenCreateModal}
        className="fixed bottom-20 right-4 md:hidden z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg shadow-blue-600/30 active:scale-90 transition-all border-2 border-white"
        title="Nuevo Viaje"
      >
        <Plus size={24} />
      </button>

      {/* MODALES */}
      {closingTrip && (
        <CloseTripModal trip={closingTrip} config={config} onClose={() => setClosingTrip(null)} onConfirm={handleCloseConfirm} />
      )}
      
      {voucherTrip && (
        <VoucherModal trip={voucherTrip} onClose={() => setVoucherTrip(null)} />
      )}
      
      {viewingTrip && (
        <TripDetailsModal trip={viewingTrip} onClose={() => setViewingTrip(null)} />
      )}

      {isNewTripModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col">
              <NuevoViajeForm 
                onClose={() => setIsNewTripModalOpen(false)} 
                onSubmit={handleFormSubmit}
                initialData={formDataForEdit}
                clientesDisponibles={config.clientes_disponibles || []}
                staffDisponible={config.staff_disponible || []}
                vehiculosDisponibles={config.tarifas || []}
              />
           </div>
        </div>
      )}
    </div>
  );
}