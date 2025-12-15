import React, { useEffect, useState } from "react";
import {
  LayoutGrid,
  AlertCircle,
  Calendar,
  Wallet,
  Archive,
  Settings,
  Plus,
  LogOut,
  Truck,
} from "lucide-react";

import { api } from "../services/api";
import { useLogisticsData } from "../hooks/useLogisticsData";
import { useTripActions } from "../hooks/useTripActions";

// Componentes UI
import { Button } from "./ui/Button";

// Vistas
import { Dashboard } from "./logistics/Dashboard";
import { Agenda } from "./logistics/Agenda";
import { PaymentCenter } from "./logistics/PaymentCenter";
import { Resources } from "./logistics/Resources";
import { Archived } from "./logistics/Archived";

// Modales
import NuevoViajeForm, { type NuevoViajeData } from "../components/NuevoViajeForm";
import TripDetailsModal from "../components/TripDetailsModal";
import { CloseTripModal } from "./logistics/modals/CloseTripModal";
import { VoucherModal } from "./logistics/modals/VoucherModal";

// Tipos
import type { Viaje, ConfirmData } from "../types";

// --- PROPS ---
interface LogisticsAppProps {
  onLogout: () => void;
}

export default function LogisticsApp({ onLogout }: LogisticsAppProps) {
  // --- ESTADOS DE UI (Vistas y Navegación) ---
  const [view, setView] = useState<"dashboard" | "agenda" | "tomables" | "caja" | "archivados" | "recursos">("agenda");
  
  // --- ESTADOS DE MODALES ---
  const [closingTrip, setClosingTrip] = useState<Viaje | null>(null);
  const [voucherTrip, setVoucherTrip] = useState<Viaje | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Viaje | null>(null);
  
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [formDataForEdit, setFormDataForEdit] = useState<NuevoViajeData | undefined>(undefined);

  // --- ESTADOS LOCALES (Histórico y Filtros) ---
  // Estos son específicos de la vista "Archivados", está bien que vivan aquí por ahora.
  const [historicoTrips, setHistoricoTrips] = useState<Viaje[]>([]);
  const [filtroHistorico, setFiltroHistorico] = useState<"semana" | "mes" | "3meses" | "custom">("mes");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // --- HOOKS DE DATOS Y ACCIONES ---
  const { 
    trips, 
    config, 
    loading, 
    loadData, 
    dashboardStats,
    // 👇 IMPORTANTE: Usamos el estado del año del hook, no uno local
    dashboardYear, 
    setDashboardYear 
  } = useLogisticsData();

  const { deleteTrip, markPaid, archiveTrip, closeTrip } = useTripActions(loadData);

  // --- EFECTOS ---

  // NOTA: Borré el useEffect del Dashboard porque el hook 'useLogisticsData' 
  // ya tiene un useEffect interno que recarga cuando cambia 'dashboardYear'.

  // Cargar histórico al cambiar filtros
  useEffect(() => {
    if (view === "archivados") {
        cargarHistorico(filtroHistorico);
    }
  }, [view, filtroHistorico]);

  const cargarHistorico = async (filtro: string) => {
    if (filtro === "custom" && (!fechaInicio || !fechaFin)) return;
    
    let inicio = new Date();
    let fInicioStr = "";
    let fFinStr = new Date().toISOString().split("T")[0];

    if (filtro === "custom") {
      fInicioStr = fechaInicio;
      fFinStr = fechaFin;
    } else {
      if (filtro === "semana") inicio.setDate(inicio.getDate() - 7);
      else if (filtro === "mes") inicio.setMonth(inicio.getMonth() - 1);
      else if (filtro === "3meses") inicio.setMonth(inicio.getMonth() - 3);
      fInicioStr = inicio.toISOString().split("T")[0];
    }

    try {
      const data = await api.getHistorico(fInicioStr, fFinStr);
      // Mapeo simple para asegurar compatibilidad con la UI de Archivados
      const mapeados = data.map((v: any) => ({
         ...v,
         cliente_nombre: v.cliente_nombre || v.cliente || "Cliente",
         total_cliente: Number(v.precio_final || 0),
         destino: Array.isArray(v.destinos) ? v.destinos[0] : v.destinos,
         tipo_camioneta: v.tipo_camioneta
      }));
      setHistoricoTrips(mapeados);
    } catch {
      alert("Error cargando histórico");
    }
  };

  // --- LÓGICA DE NEGOCIO LOCAL (Preparación de datos) ---

  const assignDriverToTakable = (tripId: number) => {
    const tripToEdit = trips.find((t) => t.id === tripId);
    if (!tripToEdit) return;

    // Uso de ?. para evitar crash si config aun no cargó
    const clienteEncontrado = config.clientes_disponibles?.find(
      (c) => c.nombre === tripToEdit.cliente_nombre
    );
    
    const initialData: NuevoViajeData = {
      clienteId: clienteEncontrado ? clienteEncontrado.id.toString() : "",
      tipoTarifa: tripToEdit.tipo_tarifa || "particular",
      fecha: tripToEdit.fecha,
      hora: tripToEdit.hora,
      origen: tripToEdit.origen,
      destinos: tripToEdit.destino2 ? [tripToEdit.destino, tripToEdit.destino2] : [tripToEdit.destino],
      vehiculoId: tripToEdit.tipo_camioneta || "",
      // Optional chaining vital aquí también
      choferId: tripToEdit.staff_asignado?.find(s => s.rol === "chofer")?.staff_id.toString() || "",
      peonesIds: tripToEdit.staff_asignado?.filter(s => s.rol === "peon").map(s => s.staff_id.toString()) || [],
      estado: tripToEdit.estado === "tomable" ? "TOMABLE" : "AGENDA",
    };

    setEditingTripId(tripId);
    setFormDataForEdit(initialData);
    setIsNewTripModalOpen(true);
  };

  const handleCreateOrUpdateTrip = async (data: NuevoViajeData) => {
    try {
        const clienteObj = config.clientes_disponibles?.find(c => c.id === Number(data.clienteId));
        const payload = {
            cliente: clienteObj ? clienteObj.nombre : "Cliente Desconocido",
            origen: data.origen,
            destinos: data.destinos,
            fecha: data.fecha,
            hora: data.hora,
            tipoCamioneta: data.vehiculoId,
            choferId: data.choferId ? Number(data.choferId) : undefined,
            peonesIds: data.peonesIds.map(Number),
            tipoTarifa: data.tipoTarifa
        };

        if (editingTripId) {
            await api.updateViaje(editingTripId, payload);
        } else {
            await api.createViaje(payload);
        }
        
        await loadData(); // Recargar datos globales
        setIsNewTripModalOpen(false);
        setEditingTripId(null);
        setFormDataForEdit(undefined);

    } catch (e) {
        alert("Error al guardar el viaje");
    }
  };

  const handleCloseConfirm = async (data: ConfirmData) => {
    if (closingTrip) {
      await closeTrip(closingTrip, data); // Usamos la acción del hook
      setClosingTrip(null);
    }
  };

  // --- RENDER ---

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">Cargando sistema...</div>;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col h-full flex-shrink-0">
        <div className="p-6 shrink-0">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="text-blue-400" /> Logística
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
           <Button variant={view === "dashboard" ? "primary" : "secondary"} onClick={() => setView("dashboard")} className="w-full justify-start"><LayoutGrid className="mr-2" size={18}/> Dashboard</Button>
           <Button variant={view === "tomables" ? "primary" : "secondary"} onClick={() => setView("tomables")} className="w-full justify-start"><AlertCircle className="mr-2" size={18}/> Tomables</Button>
           <Button variant={view === "agenda" ? "primary" : "secondary"} onClick={() => setView("agenda")} className="w-full justify-start"><Calendar className="mr-2" size={18}/> Agenda</Button>
           <Button variant={view === "caja" ? "primary" : "secondary"} onClick={() => setView("caja")} className="w-full justify-start"><Wallet className="mr-2" size={18}/> Caja</Button>
           <Button variant={view === "archivados" ? "primary" : "secondary"} onClick={() => setView("archivados")} className="w-full justify-start"><Archive className="mr-2" size={18}/> Archivados</Button>
           <Button variant={view === "recursos" ? "primary" : "secondary"} onClick={() => setView("recursos")} className="w-full justify-start"><Settings className="mr-2" size={18}/> Recursos</Button>
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0 space-y-2">
           <button onClick={() => { setEditingTripId(null); setFormDataForEdit(undefined); setIsNewTripModalOpen(true); }} className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold flex justify-center gap-2"><Plus size={18}/> Nuevo Viaje</button>
           <button onClick={onLogout} className="w-full bg-slate-800 text-slate-300 py-2 rounded-lg text-xs flex justify-center gap-2"><LogOut size={16}/> Salir</button>
        </div>
      </aside>

      {/* HEADER MÓVIL (Simple para ahorrar espacio en este ejemplo) */}
      <header className="md:hidden bg-white border-b p-3 flex justify-between">
         <span className="font-bold">Logística</span>
         <button onClick={onLogout}><LogOut size={20}/></button>
         {/* ... (Aquí irían tus botones de menú móvil) ... */}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 relative">
        
        {view === "dashboard" && (
          <Dashboard 
            stats={dashboardStats} 
            year={dashboardYear} 
            onYearChange={setDashboardYear} 
          />
        )}

        {view === "agenda" && (
          <Agenda 
            trips={trips} 
            filter="pendiente"
            onDelete={deleteTrip}
            onAssign={assignDriverToTakable}
            onCloseTrip={setClosingTrip}
          />
        )}

        {view === "tomables" && (
          <Agenda 
            trips={trips} 
            filter="tomable"
            onDelete={deleteTrip}
            onAssign={assignDriverToTakable}
            onCloseTrip={setClosingTrip}
          />
        )}

        {view === "caja" && (
          <PaymentCenter
             trips={trips}
             onMarkPaid={markPaid}
             onArchiveTrip={archiveTrip}
             onShowVoucher={setVoucherTrip}
          />
        )}

        {view === "recursos" && (
           <Resources config={config} onUpdate={loadData} />
        )}

        {view === "archivados" && (
           <Archived 
             trips={historicoTrips}
             filtro={filtroHistorico}
             setFiltro={setFiltroHistorico}
             fechaInicio={fechaInicio}
             setFechaInicio={setFechaInicio}
             fechaFin={fechaFin}
             setFechaFin={setFechaFin}
             onSearch={() => cargarHistorico("custom")}
             onViewDetails={setViewingTrip}
           />
        )}
      </main>

      {/* MODALES GLOBALES */}
      {closingTrip && (
        <CloseTripModal trip={closingTrip} config={config} onClose={() => setClosingTrip(null)} onConfirm={handleCloseConfirm} />
      )}
      
      {voucherTrip && (
        <VoucherModal trip={voucherTrip} onClose={() => setVoucherTrip(null)} />
      )}

      {isNewTripModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col">
              <NuevoViajeForm 
                onClose={() => setIsNewTripModalOpen(false)} 
                onSubmit={handleCreateOrUpdateTrip}
                initialData={formDataForEdit}
                clientesDisponibles={config.clientes_disponibles || []}
                staffDisponible={config.staff_disponible || []}
                vehiculosDisponibles={config.tarifas || []}
              />
           </div>
        </div>
      )}

      {viewingTrip && (
         <TripDetailsModal trip={viewingTrip} onClose={() => setViewingTrip(null)} />
      )}
    </div>
  );
}