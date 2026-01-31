import React, { useEffect, useState } from "react";
import { Plus, Trash2, Truck, User, Users, X } from "lucide-react";

// --- INTERFACES ---
interface Tarifa {
  id: number;
  nombre_vehiculo: string;
  precio_particular: number;
}

export interface NuevoViajeData {
  clienteId: string;
  tipoTarifa: string;
  fecha: string;
  hora: string;
  origen: string;
  destinos: string[];
  vehiculoId: string;
  choferId: string;
  peonesIds: string[];
  estado: "TOMABLE" | "AGENDA";
}

// NUEVAS PROPS: Recibimos las listas reales desde el padre
interface NuevoViajeFormProps {
  onClose: () => void;
  onSubmit: (data: NuevoViajeData) => void;
  // Aceptamos tipo_tarifa opcional en el cliente
  clientesDisponibles: { id: number; nombre: string; tipo_tarifa?: string }[];
  staffDisponible: { id: number; nombre: string; rol: string }[];
  vehiculosDisponibles: {
    nombre_vehiculo: string;
    precio_particular: number;
  }[];
  initialData?: NuevoViajeData;
}

export default function NuevoViajeForm({
  onClose,
  onSubmit,
  clientesDisponibles,
  staffDisponible,
  vehiculosDisponibles,
  initialData,
}: NuevoViajeFormProps) {
  const choferesReales = staffDisponible.filter((s) => s.rol === "chofer");
  const peonesReales = staffDisponible.filter((s) => s.rol === "peon");

  // Inicializar estado
  const [formData, setFormData] = useState({
    clienteId: initialData?.clienteId || "",
    tipoTarifa: initialData?.tipoTarifa || "particular",
    fecha: initialData?.fecha || "",
    hora: initialData?.hora || "",
    origen: initialData?.origen || "",
    destinos: initialData?.destinos || [""],
    vehiculoId: initialData?.vehiculoId || "",
    choferId: initialData?.choferId || "",
    peonesIds: initialData?.peonesIds || ([] as string[]),
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (initialData) {
      setFormData({
        clienteId: initialData.clienteId || "",
        tipoTarifa: initialData.tipoTarifa || "particular",
        fecha: initialData.fecha || "",
        hora: initialData.hora || "",
        origen: initialData.origen || "",
        destinos: initialData.destinos || [""],
        vehiculoId: initialData.vehiculoId || "",
        choferId: initialData.choferId || "",
        peonesIds: initialData.peonesIds || [],
      });
    }
  }, [initialData]);

  // --- AUTOMATIZACIÓN DE TARIFA ---
  // Cuando cambia el cliente, buscamos su preferencia y actualizamos el form
  useEffect(() => {
    if (formData.clienteId) {
      const clienteSeleccionado = clientesDisponibles.find(
        (c) => c.id === Number(formData.clienteId)
      );
      if (clienteSeleccionado && clienteSeleccionado.tipo_tarifa) {
        setFormData((prev) => ({
          ...prev,
          tipoTarifa: clienteSeleccionado.tipo_tarifa!,
        }));
      }
    }
  }, [formData.clienteId, clientesDisponibles]);

  const esEdicion = !!initialData;

  const estadoViaje =
    formData.choferId !== "" && formData.vehiculoId !== ""
      ? "AGENDA"
      : "TOMABLE";

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDestinoChange = (index: number, value: string) => {
    const newDestinos = [...formData.destinos];
    newDestinos[index] = value;
    setFormData((prev) => ({ ...prev, destinos: newDestinos }));
  };

  const addDestino = () =>
    setFormData((prev) => ({ ...prev, destinos: [...prev.destinos, ""] }));

  const removeDestino = (index: number) => {
    if (formData.destinos.length > 1) {
      const d = formData.destinos.filter((_, i) => i !== index);
      setFormData((p) => ({ ...p, destinos: d }));
    }
  };

  const addPeonSlot = () =>
    setFormData((prev) => ({ ...prev, peonesIds: [...prev.peonesIds, ""] }));

  const removePeonSlot = (index: number) => {
    const p = formData.peonesIds.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, peonesIds: p }));
  };

  const updatePeonSlot = (index: number, val: string) => {
    const p = [...formData.peonesIds];
    p[index] = val;
    setFormData((prev) => ({ ...prev, peonesIds: p }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: NuevoViajeData = {
      ...formData,
      estado: estadoViaje,
      peonesIds: formData.peonesIds.filter((id) => id !== ""),
      destinos: formData.destinos.filter((d) => d.trim() !== ""),
    };

    console.log(payload);
    onSubmit(payload);
  };

  return (
    <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
      <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-start">
        <h2 className="text-2xl font-bold text-gray-800">Nuevo Viaje</h2>
        <button type="button" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CLIENTE */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Cliente
              </label>
              <select
                name="clienteId"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.clienteId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione Cliente</option>
                {clientesDisponibles.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* TIPO TARIFA (AUTOMÁTICA O MANUAL) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Tarifa
              </label>
              <select
                name="tipoTarifa"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.tipoTarifa}
                onChange={handleChange}
              >
                <option value="particular">Particular</option>
                <option value="fabrica">Fábrica</option>
              </select>
            </div>

            {/* FECHA */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                className="w-full p-2 border rounded"
                value={formData.fecha}
                onChange={handleChange}
                required
              />
            </div>

            {/* HORA */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Hora
              </label>
              <input
                type="time"
                name="hora"
                className="w-full p-2 border rounded"
                value={formData.hora}
                onChange={handleChange}
                required
              />
            </div>
          </section>

          {/* RUTA */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold">Ruta</h3>
            <input
              type="text"
              name="origen"
              placeholder="Origen"
              className="w-full p-2 border rounded"
              value={formData.origen}
              onChange={handleChange}
              required
            />
            {formData.destinos.map((d, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={d}
                  onChange={(e) => handleDestinoChange(i, e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Destino"
                  required
                />
                <button type="button" onClick={() => removeDestino(i)}>
                  <Trash2 className="text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addDestino}
              className="text-blue-600 flex items-center gap-1 font-medium hover:underline"
            >
              <Plus size={16} /> Agregar destino
            </button>
          </section>

          {/* RECURSOS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* VEHICULO */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Truck size={16} className="inline mr-1" /> Vehículo
              </label>
              <select
                name="vehiculoId"
                className="w-full p-2 border rounded"
                value={formData.vehiculoId}
                onChange={handleChange}
              >
                <option value="">-- Sin asignar --</option>
                {vehiculosDisponibles.map((v, idx) => (
                  <option key={idx} value={v.nombre_vehiculo}>
                    {v.nombre_vehiculo}
                  </option>
                ))}
              </select>
            </div>

            {/* CHOFER */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <User size={16} className="inline mr-1" /> Chofer
              </label>
              <select
                name="choferId"
                className="w-full p-2 border rounded"
                value={formData.choferId}
                onChange={handleChange}
              >
                <option value="">-- Sin Chofer (Tomable) --</option>
                {choferesReales.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* PEONES */}
          <section className="space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold flex gap-2 text-gray-700">
                <Users size={16} /> Peones / Ayudantes
              </h3>
              <button 
                type="button" 
                onClick={addPeonSlot}
                className="bg-white border border-gray-300 rounded-full p-1 hover:bg-gray-100"
              >
                <Plus size={16} className="text-gray-600" />
              </button>
            </div>
            
            {formData.peonesIds.length === 0 && (
                <p className="text-xs text-gray-400 italic">No hay peones asignados.</p>
            )}

            {formData.peonesIds.map((id, idx) => (
              <div key={idx} className="flex gap-2">
                <select
                  value={id}
                  onChange={(e) => updatePeonSlot(idx, e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="">Seleccione peón...</option>
                  {peonesReales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => removePeonSlot(idx)}>
                  <Trash2 className="text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </section>

          {/* FOOTER */}
          <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-between items-center">
            <div>
                <span className="text-xs text-gray-400 block uppercase font-bold">Estado Final:</span>
                <span
                className={`font-bold text-lg ${
                    estadoViaje === "AGENDA" ? "text-green-600" : "text-orange-500"
                }`}
                >
                {estadoViaje}
                </span>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-blue-200"
            >
              {esEdicion ? "Guardar Cambios" : "Crear Viaje"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}