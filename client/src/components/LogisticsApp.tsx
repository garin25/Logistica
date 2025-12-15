import React, { useEffect, useState } from "react";
import {
  Truck,
  User,
  DollarSign,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Printer,
  Archive,
  Plus,
  FileText,
  Wallet,
  X,
  LayoutGrid,
  Trash2,
  LogOut,
  Settings,
  Building2, 
  Pencil,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { api, type StaffBackend, type Tarifa } from "../services/api";

import NuevoViajeForm, {
  type NuevoViajeData,
} from "../components/NuevoViajeForm";
import TripDetailsModal from "../components/TripDetailsModal";

// --- TIPO DE DATOS ---
export type RolStaff = "chofer" | "peon";
export type EstadoViaje = "tomable" | "pendiente" | "cerrado" | "archivado";

export interface StaffAsignado {
  staff_id: number;
  nombre: string;
  rol: RolStaff;
  monto_a_cobrar: number;
  pagado: boolean;
  es_externo: boolean;
  alias_pago?: string;
}

export interface Viaje {
  id: number;
  cliente_nombre: string;
  fecha: string;
  hora: string;
  origen: string;
  destino: string;
  destino2?: string;
  tipo_camioneta: string;
  tipo_tarifa: string;
  estado: EstadoViaje;
  staff_asignado: StaffAsignado[];
  horas_reales?: number;
  peajes?: number;
  total_cliente?: number;
  comision_admin?: number;
}

export interface Config {
  tarifas: Tarifa[];
  staff_disponible: {
    id: number;
    nombre: string;
    alias: string;
    rol: string;
    // Agregamos propiedad opcional para manejar la UI correctamente si el backend cambia
    es_externo?: boolean;
  }[];
  clientes_disponibles: { id: number; nombre: string }[];
}

// --- COMPONENTES UI ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "warning"
    | "outline";
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
  ...props
}) => {
  const baseStyle =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm";
  const variants: Record<string, string> = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    warning:
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300 border-dashed",
    outline: "border border-gray-300 text-gray-600 hover:bg-gray-50",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      {...props}
    >
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, className = "", ...props }) => (
  <div className="mb-3">
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
      {label}
    </label>
    <input
      className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${className}`}
      {...props}
    />
  </div>
);

// --- MODAL DE CIERRE DE VIAJE ---
interface ConfirmData {
  horas_reales: number;
  peajes: number;
  total_cliente: number;
  staff_asignado: StaffAsignado[];
}

interface CloseTripModalProps {
  trip: Viaje;
  config: Config;
  onClose: () => void;
  onConfirm: (data: ConfirmData) => void;
}

const CloseTripModal: React.FC<CloseTripModalProps> = ({ trip, config, onClose, onConfirm }) => {
  const [horas, setHoras] = useState(0);
  const [peajes, setPeajes] = useState(0);
  const [montos, setMontos] = useState({ totalCliente: 0, pagoChofer: 0, pagoPeonUnitario: 0 });

  const chofer = trip.staff_asignado.find((s) => s.rol === "chofer");
  const peones = trip.staff_asignado.filter((s) => s.rol === "peon");
  const aplicaComision = chofer?.es_externo === true;

  // Helper para obtener el precio de la hora del vehículo según tarifa
  const getPrecioHoraVehiculo = () => {
    const tarifa = config.tarifas.find((t) => t.nombre_vehiculo === trip.tipo_camioneta);
    if (!tarifa) return 35000; // Default
    return trip.tipo_tarifa === 'fabrica' ? tarifa.precio_fabrica : tarifa.precio_particular;
  };

  const calculateCosts = (h: number, p: number, peonUnitario?: number) => {
    const precioHoraVehiculo = getPrecioHoraVehiculo();
    
    // Si no pasamos un precio de peón específico, calculamos el sugerido por hora (18000 default)
    // Si YA tenemos un precio de peón en el estado (porque el usuario lo editó), tratamos de mantenerlo o recalcularlo base horas.
    // Para simplificar: al cambiar horas, reseteamos al sugerido. Al cambiar precio peón, mantenemos horas.
    const precioPeonFinal = peonUnitario !== undefined ? peonUnitario : (h * 18000);

    const subtotalVehiculo = h * precioHoraVehiculo;
    const subtotalPeones = precioPeonFinal * peones.length;
    const comision = aplicaComision ? subtotalVehiculo * 0.1 : 0;

    const pagoChofer = subtotalVehiculo - comision + p; // El peaje se reintegra al chofer
    const totalCliente = subtotalVehiculo + subtotalPeones + p;

    return { totalCliente, pagoChofer, pagoPeonUnitario: precioPeonFinal };
  };

  const handleHorasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setHoras(val);
    // Al cambiar horas, recalculamos todo (incluido el sugerido de peones)
    setMontos(calculateCosts(val, peajes));
  };

  const handlePeajesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setPeajes(val);
    // Al cambiar peajes, usamos el precio de peón que ya esté en pantalla
    setMontos(calculateCosts(horas, val, montos.pagoPeonUnitario));
  };

  // 👇 NUEVA FUNCIÓN: Actualiza el Total Cliente cuando tocas el precio del peón
  const handlePeonPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoPrecioPeon = Number(e.target.value);
    
    // 1. Recalculamos el costo del vehículo (Flete Base)
    const precioHoraVehiculo = getPrecioHoraVehiculo();
    const subtotalVehiculo = horas * precioHoraVehiculo;
    
    // 2. Calculamos el nuevo total de peones
    const subtotalPeones = nuevoPrecioPeon * peones.length;

    // 3. Sumamos todo para el cliente
    const nuevoTotalCliente = subtotalVehiculo + subtotalPeones + peajes;

    // 4. Actualizamos estado (El pago del chofer NO cambia al mover el precio del peón)
    setMontos(prev => ({
        ...prev,
        pagoPeonUnitario: nuevoPrecioPeon,
        totalCliente: nuevoTotalCliente
    }));
  };

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
        
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center shrink-0 rounded-t-xl">
          <h3 className="text-white font-bold text-lg">Cerrar Viaje</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Indicador de Tarifa */}
          <div className="bg-blue-50 p-2 rounded border border-blue-100 text-center">
            <span className="text-xs font-bold text-blue-600 uppercase">
                TARIFA APLICADA: {trip.tipo_tarifa || 'PARTICULAR'} 
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Horas Reales" type="number" min="0" value={horas} onChange={handleHorasChange} autoFocus />
            <Input label="Peajes ($)" type="number" min="0" value={peajes} onChange={handlePeajesChange} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Costos Calculados</h4>
            
            {/* INPUT CHOFER */}
            {chofer ? (
              <div className={`p-3 rounded-lg mb-3 ${aplicaComision ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold">{chofer.nombre} ({aplicaComision ? "Externo" : "Admin"})</span>
                </div>
                <Input label="A Pagar Chofer" type="number" value={montos.pagoChofer} onChange={(e) => setMontos({ ...montos, pagoChofer: Number(e.target.value) })} />
              </div>
            ) : <p className="text-red-500 text-sm">Sin chofer asignado</p>}
            
            {/* INPUT PEONES (CON EL NUEVO HANDLER) */}
            {peones.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="text-xs font-bold text-blue-800 mb-2">PEONES x{peones.length}</div>
                <Input 
                    label="Pago Unitario Peón" 
                    type="number" 
                    value={montos.pagoPeonUnitario} 
                    onChange={handlePeonPriceChange} // <--- AQUÍ ESTÁ EL CAMBIO
                />
              </div>
            )}

            {/* TOTAL CLIENTE (AUTO-CALCULADO) */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Input 
                label="TOTAL A COBRAR CLIENTE" 
                type="number" 
                value={montos.totalCliente} 
                onChange={(e) => setMontos({ ...montos, totalCliente: Number(e.target.value) })} 
                style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#16a34a" }} 
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 shrink-0 rounded-b-xl border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar Cierre</Button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL VOUCHER ---
interface VoucherModalProps {
  trip: Viaje;
  onClose: () => void;
}

const VoucherModal: React.FC<VoucherModalProps> = ({ trip, onClose }) => {
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

// --- COMPONENTE PRINCIPAL APP ---
interface ChartData {
  name: string;
  facturado: number;
  costos: number;
}
interface PaymentItem extends StaffAsignado {
  tripData: Viaje;
}

interface LogisticsAppProps {
  onLogout: () => void;
}

export default function LogisticsApp({ onLogout }: LogisticsAppProps) {
  // --- ESTADOS GLOBALES DE LA APP ---
  const [view, setView] = useState<
    "dashboard" | "agenda" | "tomables" | "caja" | "archivados" | "recursos"
  >("agenda");
  const [trips, setTrips] = useState<Viaje[]>([]);
  const [config, setConfig] = useState<Config>({
    tarifas: [],
    staff_disponible: [],
    clientes_disponibles: [],
  });
  const [loading, setLoading] = useState(true);
  const [historicoTrips, setHistoricoTrips] = useState<Viaje[]>([]);
  const [filtroHistorico, setFiltroHistorico] = useState<
    "semana" | "mes" | "3meses" | "custom"
  >("mes");
  // Estados para fechas custom si quieres implementarlo luego
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // --- ESTADOS DE RECURSOS (MOVIDOS AQUÍ ARRIBA PARA EVITAR ERROR DE HOOKS) ---
  const [newClientName, setNewClientName] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");

  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"chofer" | "peon">("chofer");
  const [newStaffAlias, setNewStaffAlias] = useState("");
  const [newStaffExterno, setNewStaffExterno] = useState(false);
  const [newVehiculoName, setNewVehiculoName] = useState("");
  const [newPrecioParticular, setNewPrecioParticular] = useState("");
  const [newPrecioFabrica, setNewPrecioFabrica] = useState("");

  // Modales
  const [closingTrip, setClosingTrip] = useState<Viaje | null>(null);
  const [voucherTrip, setVoucherTrip] = useState<Viaje | null>(null);
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [formDataForEdit, setFormDataForEdit] = useState<
    NuevoViajeData | undefined
  >(undefined);
  const [viewingTrip, setViewingTrip] = useState<Viaje | null>(null);
  //Para los graficos
  const [dashboardYear, setDashboardYear] = useState(new Date().getFullYear());
  const [dashboardStats, setDashboardStats] = useState<any[]>([]);
  const [editingVehiculoId, setEditingVehiculoId] = useState<number | null>(
    null
  ); // <--- NUEVO
  const [newClientTarifa, setNewClientTarifa] = useState("particular");

  useEffect(() => {
    if (view === "dashboard") {
      const fetchStats = async () => {
        try {
          const data = await api.getDashboardStats(dashboardYear);
          setDashboardStats(data);
        } catch (e) {
          console.error("Error dashboard");
        }
      };
      fetchStats();
    }
  }, [view, dashboardYear]); // Se ejecuta al entrar al dashboard o cambiar el año

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [viajesData, configData] = await Promise.all([
        api.getViajes(),
        api.getConfig(),
      ]);
      const viajesMapeados = viajesData.map((v: any) => ({
        ...v,
        total_cliente: Number(v.precio_final || 0),
        destino: Array.isArray(v.destinos) ? v.destinos[0] : v.destinos,
        destino2:
          Array.isArray(v.destinos) && v.destinos.length > 1
            ? v.destinos[1]
            : undefined,
        tipo_camioneta: v.tipo_camioneta,
      }));
      setTrips(viajesMapeados);
      setConfig({
        tarifas: configData.tarifas.map((t: any) => ({
          id: t.id,
          nombre_vehiculo: t.nombre_vehiculo,
          precio_particular: Number(t.precio_particular),
          precio_fabrica: Number(t.precio_fabrica),
        })),
        staff_disponible: configData.staff.map((s: StaffBackend) => ({
          id: s.id,
          nombre: s.nombre,
          rol: s.rol,
          alias: s.cbu_alias,
          es_externo: s.es_externo,
        })),
        clientes_disponibles: configData.clientes,
      });
    } catch (error) {
      console.error(error);
      alert("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorico = async (filtro: string) => {
    // Si es custom y no hay fechas seleccionadas, no hacemos nada aún (esperamos al botón Buscar)
    if (filtro === "custom" && (!fechaInicio || !fechaFin)) return;

    setLoading(true);
    let inicio = new Date();
    let fin = new Date(); // Hoy

    let fInicioStr = "";
    let fFinStr = "";

    if (filtro === "custom") {
      // Usamos los valores de los inputs
      fInicioStr = fechaInicio;
      fFinStr = fechaFin;
    } else {
      // Lógica automática para los botones rápidos
      if (filtro === "semana") {
        inicio.setDate(inicio.getDate() - 7);
      } else if (filtro === "mes") {
        inicio.setMonth(inicio.getMonth() - 1);
      } else if (filtro === "3meses") {
        inicio.setMonth(inicio.getMonth() - 3);
      }
      fInicioStr = inicio.toISOString().split("T")[0];
      fFinStr = fin.toISOString().split("T")[0];
    }

    try {
      const data = await api.getHistorico(fInicioStr, fFinStr);

      const viajesMapeados = data.map((v: any) => ({
        ...v,
        total_cliente: Number(v.precio_final || 0),
        destino: Array.isArray(v.destinos) ? v.destinos[0] : v.destinos,
        destino2:
          Array.isArray(v.destinos) && v.destinos.length > 1
            ? v.destinos[1]
            : undefined,
        tipo_camioneta: v.tipo_camioneta,
      }));
      setHistoricoTrips(viajesMapeados);
    } catch (e) {
      alert("Error cargando histórico");
    } finally {
      setLoading(false);
    }
  };

  // useEffect para recargar cuando cambie el filtro
  useEffect(() => {
    if (view === "archivados") {
      cargarHistorico(filtroHistorico);
    }
  }, [view, filtroHistorico]);

  const handleCloseTripConfirm = async (data: ConfirmData) => {
    if (!closingTrip) return;
    try {
      await api.closeViaje(closingTrip.id, {
        horasReales: data.horas_reales,
        peajes: data.peajes,
        precioFinalCliente: data.total_cliente,
        pagos: data.staff_asignado.map((s) => ({
          staffId: s.staff_id,
          monto: s.monto_a_cobrar,
          rol: s.rol,
        })),
      });
      await loadData();
      setClosingTrip(null);
    } catch (error) {
      alert("Error al cerrar viaje");
    }
  };

  const handleMarkPaid = async (tripId: number, staffId: number) => {
    try {
      await api.markPaid(tripId, staffId);
      setTrips(
        trips.map((t) => {
          if (t.id !== tripId) return t;
          return {
            ...t,
            staff_asignado: t.staff_asignado.map((s) =>
              s.staff_id === staffId ? { ...s, pagado: true } : s
            ),
          };
        })
      );
    } catch (error) {
      alert("Error marcando pago");
    }
  };

  const archiveTrip = async (tripId: number) => {
    try {
      await api.archiveViaje(tripId);
      setTrips(
        trips.map((t) => (t.id === tripId ? { ...t, estado: "archivado" } : t))
      );
    } catch (error) {
      alert("Error al archivar");
    }
  };

  const handleDeleteTrip = async (tripId: number) => {
    if (
      !window.confirm(
        "¿Estás seguro de que quieres CANCELAR y ELIMINAR este viaje?"
      )
    )
      return;
    try {
      await api.deleteViaje(tripId);
      await loadData();
    } catch (error) {
      alert("Error al eliminar el viaje");
    }
  };

  // --- HANDLERS DE RECURSOS (MOVIDOS AQUÍ) ---
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;
    try {
      await api.createCliente({
        nombre: newClientName,
        direccion: newClientAddress,
        tipoTarifa: newClientTarifa, // <--- Enviamos el dato
      });
      setNewClientName("");
      setNewClientAddress("");
      setNewClientTarifa("particular"); // Reset
      await loadData();
    } catch (e) {
      alert("Error al crear cliente");
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!confirm("¿Borrar cliente?")) return;
    try {
      await api.deleteCliente(id);
      await loadData();
    } catch {
      alert("No se puede borrar (tiene viajes).");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName) return;
    try {
      await api.createStaff({
        nombre: newStaffName,
        rol: newStaffRole,
        alias: newStaffAlias,
        esExterno: newStaffExterno,
      });
      setNewStaffName("");
      setNewStaffAlias("");
      await loadData();
    } catch (e) {
      alert("Error al crear personal");
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm("¿Borrar personal?")) return;
    try {
      await api.deleteStaff(id);
      await loadData();
    } catch {
      alert("No se puede borrar (tiene viajes).");
    }
  };

  const handleAddVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehiculoName || !newPrecioParticular) return;

    try {
      if (editingVehiculoId) {
        // --- MODO EDICIÓN ---
        await api.updateVehiculo(editingVehiculoId, {
          nombre: newVehiculoName,
          precioParticular: Number(newPrecioParticular),
          precioFabrica: Number(newPrecioFabrica),
        });
        setEditingVehiculoId(null); // Salir del modo edición
      } else {
        // --- MODO CREACIÓN ---
        await api.createVehiculo({
          nombre: newVehiculoName,
          precioParticular: Number(newPrecioParticular),
          precioFabrica: Number(newPrecioFabrica),
        });
      }

      // Limpiar formulario y recargar
      setNewVehiculoName("");
      setNewPrecioParticular("");
      setNewPrecioFabrica("");
      await loadData();
    } catch (e) {
      alert("Error al guardar vehículo");
    }
  };

  // Función para cargar los datos en el formulario al tocar el lápiz
  const startEditingVehiculo = (t: any) => {
    setNewVehiculoName(t.nombre_vehiculo);
    setNewPrecioParticular(t.precio_particular);
    setNewPrecioFabrica(t.precio_fabrica);
    setEditingVehiculoId(t.id);
  };

  // Función para cancelar la edición
  const cancelEditingVehiculo = () => {
    setNewVehiculoName("");
    setNewPrecioParticular("");
    setNewPrecioFabrica("");
    setEditingVehiculoId(null);
  };

  const handleDeleteVehiculo = async (id: number) => {
    if (!confirm("¿Borrar vehículo?")) return;
    try {
      await api.deleteVehiculo(id);
      await loadData();
    } catch {
      alert("No se puede borrar (está en uso).");
    }
  };

  const assignDriverToTakable = (tripId: number) => {
    const tripToEdit = trips.find((t) => t.id === tripId);
    if (!tripToEdit) return;
    const clienteEncontrado = config.clientes_disponibles.find(
      (c) => c.nombre === tripToEdit.cliente_nombre
    );
    const clienteIdStr = clienteEncontrado
      ? clienteEncontrado.id.toString()
      : "";
    const chofer = tripToEdit.staff_asignado.find((s) => s.rol === "chofer");
    const choferIdStr = chofer ? chofer.staff_id.toString() : "";
    const peonesIdsStr = tripToEdit.staff_asignado
      .filter((s) => s.rol === "peon")
      .map((s) => s.staff_id.toString());

    const initialData: NuevoViajeData = {
      clienteId: clienteIdStr,
      tipoTarifa: "particular",
      fecha: tripToEdit.fecha,
      hora: tripToEdit.hora,
      origen: tripToEdit.origen,
      destinos: tripToEdit.destino2
        ? [tripToEdit.destino, tripToEdit.destino2]
        : [tripToEdit.destino],
      vehiculoId: tripToEdit.tipo_camioneta || "",
      choferId: choferIdStr,
      peonesIds: peonesIdsStr,
      estado: tripToEdit.estado === "tomable" ? "TOMABLE" : "AGENDA",
    };
    setEditingTripId(tripId);
    setFormDataForEdit(initialData);
    setIsNewTripModalOpen(true);
  };

  const handleCreateViajeReal = async (data: NuevoViajeData) => {
    try {
      const clienteObj = config.clientes_disponibles.find(
        (c) => c.id === Number(data.clienteId)
      );
      const clienteNombre = clienteObj
        ? clienteObj.nombre
        : "Cliente Desconocido";
      const choferIdNum =
        data.choferId && data.choferId !== ""
          ? Number(data.choferId)
          : undefined;
      const peonesIdsNum = data.peonesIds.map((id) => Number(id));

      const payload = {
        cliente: clienteNombre,
        origen: data.origen,
        destinos: data.destinos,
        fecha: data.fecha,
        hora: data.hora,
        tipoCamioneta: data.vehiculoId,
        choferId: choferIdNum,
        peonesIds: peonesIdsNum,
        tipoTarifa: data.tipoTarifa, // <--- ¡FALTABA ESTA LÍNEA!
      };

      await api.createViaje(payload);
      await loadData();
      setIsNewTripModalOpen(false);
    } catch (error) {
      alert("Error al crear el viaje.");
    }
  };

  const handleEditViajeReal = async (id: number, data: NuevoViajeData) => {
    try {
      const clienteObj = config.clientes_disponibles.find(
        (c) => c.id === Number(data.clienteId)
      );
      const clienteNombre = clienteObj
        ? clienteObj.nombre
        : "Cliente Desconocido";
      const choferIdNum =
        data.choferId && data.choferId !== ""
          ? Number(data.choferId)
          : undefined;
      const peonesIdsNum = data.peonesIds.map((id) => Number(id));

      const payload = {
        cliente: clienteNombre,
        origen: data.origen,
        destinos: data.destinos,
        fecha: data.fecha,
        hora: data.hora,
        tipoCamioneta: data.vehiculoId,
        choferId: choferIdNum,
        peonesIds: peonesIdsNum,
        tipoTarifa: data.tipoTarifa, // <--- ¡AQUÍ TAMBIÉN FALTABA!
      };

      await api.updateViaje(id, payload);
      await loadData();
      setIsNewTripModalOpen(false);
      setEditingTripId(null);
      setFormDataForEdit(undefined);
    } catch (error) {
      alert("Error al editar el viaje.");
    }
  };

  const handleSubmitForm = async (data: NuevoViajeData) => {
    if (editingTripId) {
      await handleEditViajeReal(editingTripId, data);
    } else {
      await handleCreateViajeReal(data);
    }
  };

  // --- RENDERIZADO DE VISTAS ---

  const renderDashboard = () => {
    // Calculamos totales anuales
    const totalAnualAdmin = dashboardStats.reduce(
      (acc, curr) => acc + curr.admin,
      0
    );
    const totalAnualComision = dashboardStats.reduce(
      (acc, curr) => acc + curr.comision,
      0
    );

    // Calculamos totales del mes actual
    const currentMonthIndex = new Date().getMonth();
    const currentMonthStats = dashboardStats[currentMonthIndex] || {
      admin: 0,
      comision: 0,
    };

    // Función para formatear dinero en el Eje Y (K = Miles, M = Millones)
    const formatYAxis = (value: number) => {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
      return `$${value}`;
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
        {/* CABECERA CON FILTRO DE AÑO */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">
            Resumen Financiero
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Año:</span>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              value={dashboardYear}
              onChange={(e) => setDashboardYear(Number(e.target.value))}
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>

        {/* TARJETAS DE RESUMEN (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TARJETA 1: GANANCIA ADMIN (Operativa) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase mb-1">
                Ganancia Admin (Propia)
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                ${totalAnualAdmin.toLocaleString()}{" "}
                <span className="text-xs font-normal text-gray-400">/ Año</span>
              </h3>
              <p className="text-sm text-blue-600 font-medium mt-1">
                Este mes: ${currentMonthStats.admin.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
              <Truck size={24} />
            </div>
          </div>

          {/* TARJETA 2: GANANCIA COMISIÓN (Tercerizada) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase mb-1">
                Ganancia por Comisiones
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                ${totalAnualComision.toLocaleString()}{" "}
                <span className="text-xs font-normal text-gray-400">/ Año</span>
              </h3>
              <p className="text-sm text-green-600 font-medium mt-1">
                Este mes: ${currentMonthStats.comision.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-full text-green-600">
              <User size={24} />
            </div>
          </div>
        </div>

        {/* GRÁFICO 1: EVOLUCIÓN GANANCIA ADMIN (DINÁMICO) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-6 text-gray-700 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div> Evolución
            Ganancia Admin
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />

                {/* 👇 ESCALA DINÁMICA: domain={[0, 'auto']} */}
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatYAxis}
                  domain={[0, "auto"]}
                />

                <RechartsTooltip
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    "Ganancia",
                  ]}
                />
                <Bar
                  dataKey="admin"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: EVOLUCIÓN COMISIONES (DINÁMICO) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-6 text-gray-700 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div> Evolución
            Comisiones
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />

                {/* 👇 ESCALA DINÁMICA: domain={[0, 'auto']} */}
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatYAxis}
                  domain={[0, "auto"]}
                />

                <RechartsTooltip
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    "Comisión",
                  ]}
                />
                <Bar
                  dataKey="comision"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderResources = () => {
    return (
      <div className="space-y-8 pb-20 md:pb-0 animate-in fade-in duration-300">
        {/* 1. SECCIÓN VEHÍCULOS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Truck className="text-orange-500" /> Gestión de Vehículos y Tarifas
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-500">
                <tr>
                  <th className="p-3">Vehículo</th>
                  <th className="p-3">Precio Particular</th>
                  <th className="p-3">Precio Fábrica</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {config.tarifas.map((t) => (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      editingVehiculoId === t.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="p-3 font-bold text-gray-700">
                      {t.nombre_vehiculo}
                    </td>
                    <td className="p-3 text-green-600 font-mono">
                      ${t.precio_particular?.toLocaleString()}
                    </td>
                    <td className="p-3 text-blue-600 font-mono">
                      ${t.precio_fabrica?.toLocaleString()}
                    </td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      {/* Botón Editar */}
                      <button
                        onClick={() => startEditingVehiculo(t)}
                        className="text-blue-400 hover:text-blue-600 p-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      {/* Botón Eliminar */}
                      <button
                        onClick={() => handleDeleteVehiculo(t.id)}
                        className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded hover:bg-red-100 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {config.tarifas.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-gray-400 italic"
                    >
                      No hay vehículos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. SECCIÓN STAFF */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <User className="text-blue-500" /> Gestión de Personal (Choferes y
            Peones)
          </h3>

          <form
            onSubmit={handleAddStaff}
            className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 grid gap-4 md:grid-cols-5 items-end"
          >
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Nombre
              </label>
              <input
                className="w-full p-2 border rounded text-sm"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="Ej: Juan Perez"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Rol
              </label>
              <select
                className="w-full p-2 border rounded text-sm"
                value={newStaffRole}
                onChange={(e: any) => setNewStaffRole(e.target.value)}
              >
                <option value="chofer">Chofer</option>
                <option value="peon">Peón / Ayudante</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                CBU / Alias
              </label>
              <input
                className="w-full p-2 border rounded text-sm"
                value={newStaffAlias}
                onChange={(e) => setNewStaffAlias(e.target.value)}
                placeholder="juan.mp"
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="ext"
                checked={newStaffExterno}
                onChange={(e) => setNewStaffExterno(e.target.checked)}
                className="w-4 h-4"
              />
              <label
                htmlFor="ext"
                className="text-sm font-medium text-gray-700"
              >
                Es Externo?
              </label>
            </div>
            <Button type="submit" variant="primary" className="w-full">
              Agregar
            </Button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-500">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Alias</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {config.staff_disponible.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-medium">{s.nombre}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          s.rol === "chofer"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {s.rol.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{s.alias || "-"}</td>
                    <td className="p-3 text-gray-500">
                      {
                        // @ts-ignore
                        s.es_externo || s.rol === "peon" ? "Externo" : "Agencia"
                      }
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteStaff(s.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. SECCIÓN CLIENTES */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Building2 className="text-green-500" /> Gestión de Clientes
          </h3>
          {/* El formulario cambia de color si estamos editando (Azul) o creando (Naranja) */}
          <form
            onSubmit={handleAddClient}
            className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 grid gap-4 md:grid-cols-4 items-end"
          >
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Nombre Cliente
              </label>
              <input
                className="w-full p-2 border rounded text-sm"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Ej: Distribuidora Sur"
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Dirección
              </label>
              <input
                className="w-full p-2 border rounded text-sm"
                value={newClientAddress}
                onChange={(e) => setNewClientAddress(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            {/* NUEVO SELECTOR DE TARIFA */}
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Tarifa Preferida
              </label>
              <select
                className="w-full p-2 border rounded text-sm bg-white"
                value={newClientTarifa}
                onChange={(e) => setNewClientTarifa(e.target.value)}
              >
                <option value="particular">Particular</option>
                <option value="fabrica">Fábrica</option>
              </select>
            </div>

            <Button type="submit" variant="success" className="w-full">
              Agregar
            </Button>
          </form>

          <div className="max-h-64 overflow-y-auto">
            <ul className="divide-y divide-gray-100">
              {config.clientes_disponibles.map((c) => (
                <li
                  key={c.id}
                  className="p-3 flex justify-between items-center hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-700">{c.nombre}</span>
                  <button
                    onClick={() => handleDeleteClient(c.id)}
                    className="text-red-400 hover:text-red-600 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };
  const renderAgenda = (filter: EstadoViaje) => {
    const filteredTrips = trips.filter((t) => t.estado === filter);
    const isTomable = filter === "tomable";
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-20 md:pb-0">
        {filteredTrips.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-400">
            No hay viajes en esta sección.
          </div>
        )}
        {filteredTrips.map((trip) => (
          <div
            key={trip.id}
            className={`bg-white rounded-xl shadow-sm p-5 transition-all hover:shadow-md relative group ${
              isTomable
                ? "border-2 border-dashed border-yellow-400 bg-yellow-50/30"
                : "border border-gray-200"
            }`}
          >
            <button
              onClick={() => handleDeleteTrip(trip.id)}
              className="absolute top-3 right-3 z-50 bg-white text-gray-400 hover:text-red-600 p-2 rounded-full shadow-sm border border-gray-100 hover:bg-red-50 transition-all"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
            <div className="flex justify-between items-start mb-3 pr-12">
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  isTomable
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {trip.hora}
              </span>
              {isTomable && (
                <span className="text-xs font-bold text-yellow-600 animate-pulse">
                  DISPONIBLE
                </span>
              )}
            </div>
            <h3
              className="font-bold text-gray-800 text-lg mb-1 truncate"
              title={trip.cliente_nombre}
            >
              {trip.cliente_nombre}
            </h3>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={14} /> {trip.fecha}
              </div>
              <div className="flex items-center gap-2">
                <Truck size={14} />{" "}
                {trip.tipo_camioneta || (
                  <span className="text-gray-400 italic">
                    Vehículo no definido
                  </span>
                )}
              </div>
              <div
                className="flex items-center gap-2 truncate"
                title={trip.origen}
              >
                <MapPin size={14} className="text-green-500 flex-shrink-0" />{" "}
                {trip.origen}
              </div>
              <div
                className="flex items-center gap-2 truncate"
                title={trip.destino}
              >
                <MapPin size={14} className="text-red-500 flex-shrink-0" />{" "}
                {trip.destino}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-gray-500 uppercase">
                  <User size={14} /> Staff:
                </div>
                <div className="flex flex-wrap gap-1">
                  {trip.staff_asignado.length > 0 ? (
                    trip.staff_asignado.map((s) => (
                      <span
                        key={s.staff_id}
                        className={`text-xs px-2 py-0.5 rounded border ${
                          s.rol === "chofer"
                            ? "bg-blue-50 border-blue-100 text-blue-700 font-bold"
                            : "bg-gray-50 border-gray-100 text-gray-600"
                        }`}
                      >
                        {s.nombre.split(" ")[0]}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-orange-400 italic">
                      Sin asignar
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {isTomable ? (
                <Button
                  variant="warning"
                  className="w-full"
                  onClick={() => assignDriverToTakable(trip.id)}
                >
                  <Plus size={16} /> Tomar / Editar
                </Button>
              ) : (
                <Button className="w-full" onClick={() => setClosingTrip(trip)}>
                  <CheckCircle2 size={16} /> Cerrar Viaje
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPaymentCenter = () => {
    const closedTrips = trips.filter((t) => t.estado === "cerrado");

    // Aplanamos la lista de staff para las tablas de arriba
    const payments: PaymentItem[] = closedTrips.flatMap((trip) =>
      trip.staff_asignado.map((staff) => ({ ...staff, tripData: trip }))
    );
    const choferPayments = payments.filter((p) => p.rol === "chofer");
    const peonPayments = payments.filter((p) => p.rol === "peon");

    // Componente auxiliar para las filas de las tablas
    const PaymentRow = ({ p }: { p: PaymentItem }) => (
      <tr
        key={`${p.tripData.id}-${p.staff_id}`}
        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
          p.pagado ? "opacity-50" : ""
        }`}
      >
        <td className="py-3 px-4 font-medium text-gray-800">
          {p.nombre}
          <div className="text-xs text-gray-400 font-normal">
            {p.alias_pago}
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
              onClick={() => handleMarkPaid(p.tripData.id, p.staff_id)}
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
                  choferPayments.map((p) => (
                    <PaymentRow p={p} key={`${p.tripData.id}-${p.staff_id}`} />
                  ))
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
                  peonPayments.map((p) => (
                    <PaymentRow p={p} key={`${p.tripData.id}-${p.staff_id}`} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. SECCIÓN RECUPERADA: GESTIÓN DE VIAJES (ARCHIVAR) */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-green-600" /> Gestión de Viajes
            Finalizados
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
                      onClick={() => setVoucherTrip(trip)}
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
                      onClick={() => allPaid && archiveTrip(trip.id)}
                      disabled={!allPaid}
                      title={
                        allPaid
                          ? "Archivar Viaje"
                          : "Paga a todos para archivar"
                      }
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

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        Cargando sistema...
      </div>
    );

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 flex flex-col md:flex-row">
      {/* SIDEBAR DE ESCRITORIO */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col h-full flex-shrink-0">
        <div className="p-6 shrink-0">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="text-blue-400" /> Logística
          </h1>
          <p className="text-slate-400 text-xs mt-1">Gestión de Fletes</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setView("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              view === "dashboard"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <LayoutGrid size={18} /> Dashboard
          </button>
          <div className="pt-4 pb-2 px-2 text-xs font-bold text-slate-500 uppercase">
            Operaciones
          </div>
          <button
            onClick={() => setView("tomables")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              view === "tomables"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertCircle
                size={18}
                className={
                  trips.some((t) => t.estado === "tomable")
                    ? "text-yellow-400"
                    : ""
                }
              />{" "}
              Tomables
            </div>
            {trips.filter((t) => t.estado === "tomable").length > 0 && (
              <span className="bg-yellow-500 text-black text-xs font-bold px-2 rounded-full">
                {trips.filter((t) => t.estado === "tomable").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setView("agenda")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              view === "agenda"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar size={18} /> Agenda
            </div>
            <span className="bg-slate-700 text-xs font-bold px-2 rounded-full">
              {trips.filter((t) => t.estado === "pendiente").length}
            </span>
          </button>
          <div className="pt-4 pb-2 px-2 text-xs font-bold text-slate-500 uppercase">
            Finanzas
          </div>
          <button
            onClick={() => setView("caja")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              view === "caja"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <Wallet size={18} /> Caja y Pagos
            </div>
            {trips.filter((t) => t.estado === "cerrado").length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 rounded-full">
                {trips.filter((t) => t.estado === "cerrado").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setView("archivados")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              view === "archivados"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Archive size={18} /> Archivados
          </button>
          <div className="pt-4 pb-2 px-2 text-xs font-bold text-slate-500 uppercase">
            Configuración
          </div>
          <button
            onClick={() => setView("recursos")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              view === "recursos"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Settings size={18} /> Recursos
          </button>
        </nav>
        {/* Footer del Sidebar (Escritorio) */}
        <div className="p-4 border-t border-slate-800 shrink-0 space-y-2">
          <button
            onClick={() => {
              setEditingTripId(null);
              setFormDataForEdit(undefined);
              setIsNewTripModalOpen(true);
            }}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} /> Nuevo Viaje
          </button>
          <button
            onClick={onLogout}
            className="w-full bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-xs"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* NAVEGACIÓN MÓVIL SUPERIOR (STICKY) */}
      <header className="md:hidden bg-white border-b border-gray-200 flex items-center justify-between p-3 sticky top-0 z-40 shrink-0 shadow-sm">
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full items-center">
          <Button
            variant={view === "dashboard" ? "primary" : "secondary"}
            onClick={() => setView("dashboard")}
            className="shrink-0"
          >
            <LayoutGrid size={20} />
          </Button>
          <Button
            variant={view === "tomables" ? "primary" : "secondary"}
            onClick={() => setView("tomables")}
            className="shrink-0 relative"
          >
            <AlertCircle size={20} />
            {trips.filter((t) => t.estado === "tomable").length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 w-3 h-3 rounded-full animate-pulse border-2 border-white"></span>
            )}
          </Button>
          <Button
            variant={view === "agenda" ? "primary" : "secondary"}
            onClick={() => setView("agenda")}
            className="shrink-0"
          >
            <Calendar size={20} />
          </Button>
          <Button
            variant={view === "caja" ? "primary" : "secondary"}
            onClick={() => setView("caja")}
            className="shrink-0"
          >
            <Wallet size={20} />
          </Button>
          <Button
            variant={view === "archivados" ? "primary" : "secondary"}
            onClick={() => setView("archivados")}
            className="shrink-0"
          >
            <Archive size={20} />
          </Button>
          <Button
            variant={view === "recursos" ? "primary" : "secondary"}
            onClick={() => setView("recursos")}
            className="shrink-0"
          >
            <Settings size={20} />
          </Button>

          {/* Divisor */}
          <div className="h-6 w-px bg-gray-300 mx-1 shrink-0"></div>

          {/* Botón Salir Móvil */}
          <Button
            variant="danger"
            onClick={onLogout}
            className="shrink-0 px-2 bg-red-50 text-red-500 border-red-100 hover:bg-red-100"
          >
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 relative">
        {view === "dashboard" && renderDashboard()}
        {view === "agenda" && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
              <Calendar className="text-blue-600" /> Agenda
            </h2>
            {renderAgenda("pendiente")}
          </div>
        )}
        {view === "tomables" && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
              <AlertCircle className="text-yellow-500" /> Tomables
            </h2>
            {renderAgenda("tomable")}
          </div>
        )}
        {view === "caja" && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
              <Wallet className="text-green-600" /> Pagos
            </h2>
            {renderPaymentCenter()}
          </div>
        )}
        {view === "recursos" && renderResources()}
        {view === "archivados" && (
          <div>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-800">
                  <Archive className="text-gray-500" /> Historial Archivado
                </h2>

                {/* BOTONES DE FILTRO RÁPIDO */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto max-w-full">
                  <button
                    onClick={() => setFiltroHistorico("semana")}
                    className={`px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors ${
                      filtroHistorico === "semana"
                        ? "bg-blue-100 text-blue-700 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Semana
                  </button>
                  <button
                    onClick={() => setFiltroHistorico("mes")}
                    className={`px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors ${
                      filtroHistorico === "mes"
                        ? "bg-blue-100 text-blue-700 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Mes
                  </button>
                  <button
                    onClick={() => setFiltroHistorico("3meses")}
                    className={`px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors ${
                      filtroHistorico === "3meses"
                        ? "bg-blue-100 text-blue-700 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    3 Meses
                  </button>
                  <button
                    onClick={() => setFiltroHistorico("custom")}
                    className={`px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors ${
                      filtroHistorico === "custom"
                        ? "bg-blue-100 text-blue-700 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* SELECTOR DE FECHAS (Solo visible si es 'custom') */}
              {filtroHistorico === "custom" && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col sm:flex-row gap-4 items-end animate-in slide-in-from-top-2">
                  <div className="w-full sm:w-auto">
                    <label className="text-xs font-bold text-blue-800 uppercase block mb-1">
                      Desde
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <label className="text-xs font-bold text-blue-800 uppercase block mb-1">
                      Hasta
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => cargarHistorico("custom")}
                    disabled={!fechaInicio || !fechaFin}
                    className="w-full sm:w-auto"
                  >
                    Buscar Viajes
                  </Button>
                </div>
              )}
            </div>

            {/* TABLA DE RESULTADOS (Esto sigue igual que antes) */}
            {historicoTrips.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-400">
                  No se encontraron viajes archivados en este periodo.
                </p>
              </div>
            ) : (
              // ... Tu tabla existente ...
              <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px] md:min-w-0">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-4">Fecha</th>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Vehículo</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicoTrips.map((t) => (
                      <tr
                        key={t.id}
                        className="border-t hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => setViewingTrip(t)}
                      >
                        <td className="p-4 whitespace-nowrap">{t.fecha}</td>
                        <td className="p-4 font-bold">
                          {t.cliente_nombre}
                          <div className="text-xs text-gray-400 font-normal truncate max-w-[150px]">
                            {t.origen}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600 uppercase">
                          {t.tipo_camioneta}
                        </td>
                        <td className="p-4 text-green-600 font-mono font-bold">
                          ${t.total_cliente?.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                            ARCHIVADO
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* BOTÓN FLOTANTE */}
      <button
        onClick={() => {
          setEditingTripId(null);
          setFormDataForEdit(undefined);
          setIsNewTripModalOpen(true);
        }}
        className="fixed bottom-6 right-6 md:hidden z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 active:scale-90 transition-all"
        title="Nuevo Viaje"
      >
        <Plus size={24} />
      </button>

      {/* MODALES */}
      {closingTrip && (
        <CloseTripModal
          trip={closingTrip}
          config={config}
          onClose={() => setClosingTrip(null)}
          onConfirm={handleCloseTripConfirm}
        />
      )}
      {voucherTrip && (
        <VoucherModal trip={voucherTrip} onClose={() => setVoucherTrip(null)} />
      )}
      {isNewTripModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col">
            <NuevoViajeForm
              onClose={() => {
                setIsNewTripModalOpen(false);
                setEditingTripId(null);
                setFormDataForEdit(undefined);
              }}
              onSubmit={handleSubmitForm}
              initialData={formDataForEdit}
              clientesDisponibles={config.clientes_disponibles}
              staffDisponible={config.staff_disponible}
              vehiculosDisponibles={config.tarifas}
            />
          </div>
        </div>
      )}
      {viewingTrip && (
        <TripDetailsModal
          trip={viewingTrip}
          onClose={() => setViewingTrip(null)}
        />
      )}
    </div>
  );
}
