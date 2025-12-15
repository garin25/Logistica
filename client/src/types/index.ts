//api.ts
export interface Tarifa {
  id: number;
  nombre_vehiculo: string;
  precio_particular: number;
  precio_fabrica: number;
}
export interface StaffBackend {
  id: number;
  nombre: string;
  rol: string;
  es_externo: boolean;
  cbu_alias: string;
}
//logisticsApp.tsx
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

// --- TIPO DE DATOS ---
export type RolStaff = "chofer" | "peon";
export type EstadoViaje = "tomable" | "pendiente" | "cerrado" | "archivado";

// Compartidas
export interface ConfirmData {
  horas_reales: number;
  peajes: number;
  total_cliente: number;
  staff_asignado: StaffAsignado[];
}

export interface Tarifa {
  id: number;
  nombre_vehiculo: string;
  precio_particular: number;
  precio_fabrica: number;
}
export interface StaffBackend {
  id: number;
  nombre: string;
  rol: string;
  es_externo: boolean;
  cbu_alias: string;
}
