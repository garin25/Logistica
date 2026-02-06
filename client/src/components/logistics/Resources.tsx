import React, { useState } from "react";
import { Truck, User, Building2, Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/Button"; // Asegúrate de que la ruta sea correcta
import { api } from "../../services/api"; // Importamos la API aquí
import type { Config, Tarifa } from "../../types"; // Importamos los tipos
import { toast } from "sonner";

interface ResourcesProps {
  config: Config;
  onUpdate: () => void; // Función para recargar la data en el padre
}

export const Resources: React.FC<ResourcesProps> = ({ config, onUpdate }) => {
  // --- ESTADOS INTERNOS (Formularios) ---

  // 1. Estados para Vehículos
  const [editingVehiculoId, setEditingVehiculoId] = useState<number | null>(
    null
  );
  const [newVehiculoName, setNewVehiculoName] = useState("");
  const [newPrecioParticular, setNewPrecioParticular] = useState("");
  const [newPrecioFabrica, setNewPrecioFabrica] = useState("");

  // 2. Estados para Staff
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("chofer");
  const [newStaffAlias, setNewStaffAlias] = useState("");
  const [newStaffExterno, setNewStaffExterno] = useState(false);

  // 3. Estados para Clientes
  const [newClientName, setNewClientName] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [newClientTarifa, setNewClientTarifa] = useState("particular");

  // --- HANDLERS VEHÍCULOS ---

  const handleAddVehiculo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehiculoName || !newPrecioParticular) return;

    // 1. Definimos la promesa con toda la lógica
    const saveAction = async () => {
      if (editingVehiculoId) {
        await api.updateVehiculo(editingVehiculoId, {
          nombre: newVehiculoName,
          precioParticular: Number(newPrecioParticular),
          precioFabrica: Number(newPrecioFabrica),
        });
        setEditingVehiculoId(null);
      } else {
        await api.createVehiculo({
          nombre: newVehiculoName,
          precioParticular: Number(newPrecioParticular),
          precioFabrica: Number(newPrecioFabrica),
        });
      }

      // Limpieza de estados
      setNewVehiculoName("");
      setNewPrecioParticular("");
      setNewPrecioFabrica("");

      // Recargar datos (Esperamos a que termine para mostrar el éxito)
      await onUpdate();
    };

    // 2. Ejecutamos el Toast
    toast.promise(saveAction(), {
      loading: editingVehiculoId ? "Actualizando vehículo..." : "Creando vehículo...",
      success: "Vehículo guardado correctamente",
      error: "Error al guardar vehículo",
    });
  };

  const handleDeleteVehiculo = (id: number) => {
    // El confirm nativo sigue siendo útil para prevenir clics accidentales
    if (!confirm("¿Estás seguro de borrar este vehículo?")) return;

    const deleteAction = async () => {
      await api.deleteVehiculo(id);
      await onUpdate();
    };

    toast.promise(deleteAction(), {
      loading: "Eliminando...",
      success: "Vehículo eliminado",
      error: "No se puede borrar (posiblemente esté en uso)",
    });
  };

  const startEditingVehiculo = (t: Tarifa) => {
    setNewVehiculoName(t.nombre_vehiculo);
    setNewPrecioParticular(String(t.precio_particular));
    setNewPrecioFabrica(String(t.precio_fabrica));
    setEditingVehiculoId(t.id);
  };

  // --- HANDLERS STAFF ---

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName) return;

    const createAction = async () => {
      await api.createStaff({
        nombre: newStaffName,
        rol: newStaffRole,
        alias: newStaffAlias,
        esExterno: newStaffExterno,
      });

      setNewStaffName("");
      setNewStaffAlias("");
      setNewStaffExterno(false);
      await onUpdate();
    };

    toast.promise(createAction(), {
      loading: "Registrando personal...",
      success: "Personal creado con éxito",
      error: "Error al crear personal",
    });
  };

  const handleDeleteStaff = (id: number) => {
    if (!confirm("¿Borrar personal?")) return;

    toast.promise(
      (async () => { // Truco: Función anónima autoejecutable si prefieres no declarar variable
        await api.deleteStaff(id);
        await onUpdate();
      })(),
      {
        loading: "Eliminando...",
        success: "Personal eliminado",
        error: "No se puede borrar (tiene viajes asignados)",
      }
    );
  };

  // --- HANDLERS CLIENTES ---

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    const createAction = async () => {
      await api.createCliente({
        nombre: newClientName,
        direccion: newClientAddress,
        tipoTarifa: newClientTarifa,
      });

      setNewClientName("");
      setNewClientAddress("");
      setNewClientTarifa("particular");
      await onUpdate();
    };

    toast.promise(createAction(), {
      loading: "Guardando cliente...",
      success: "Cliente creado correctamente",
      error: "Error al crear cliente",
    });
  };

  const handleDeleteClient = (id: number) => {
    if (!confirm("¿Borrar cliente?")) return;

    toast.promise(
      async () => { // También puedes pasar la función async directa así
        await api.deleteCliente(id);
        await onUpdate();
      },
      {
        loading: "Eliminando...",
        success: "Cliente eliminado",
        error: "No se puede borrar (tiene historial de viajes)",
      }
    );
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0 animate-in fade-in duration-300">
      {/* 1. SECCIÓN VEHÍCULOS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
          <Truck className="text-orange-500" /> Gestión de Vehículos y Tarifas
        </h3>

        <form
          onSubmit={handleAddVehiculo}
          className={`p-4 rounded-lg mb-6 border border-gray-100 grid gap-4 md:grid-cols-4 items-end transition-colors ${editingVehiculoId ? "bg-blue-50 border-blue-200" : "bg-gray-50"
            }`}
        >
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Vehículo
            </label>
            <input
              className="w-full p-2 border rounded text-sm bg-white"
              value={newVehiculoName}
              onChange={(e) => setNewVehiculoName(e.target.value)}
              placeholder="Ej: Partner"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Precio Particular
            </label>
            <input
              className="w-full p-2 border rounded text-sm bg-white"
              type="number"
              value={newPrecioParticular}
              onChange={(e) => setNewPrecioParticular(e.target.value)}
              placeholder="$"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Precio Fábrica
            </label>
            <input
              className="w-full p-2 border rounded text-sm bg-white"
              type="number"
              value={newPrecioFabrica}
              onChange={(e) => setNewPrecioFabrica(e.target.value)}
              placeholder="$"
            />
          </div>
          <Button
            type="submit"
            variant={editingVehiculoId ? "primary" : "success"}
          >
            {editingVehiculoId ? "Actualizar" : "Agregar"}
          </Button>
        </form>

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
              {config.tarifas?.map((t) => (
                <tr
                  key={t.id}
                  className={`transition-colors ${editingVehiculoId === t.id ? "bg-blue-50" : ""
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
                    <button
                      onClick={() => startEditingVehiculo(t)}
                      className="text-blue-400 hover:text-blue-600 p-1 bg-blue-50 rounded hover:bg-blue-100"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteVehiculo(t.id)}
                      className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded hover:bg-red-100"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {(!config.tarifas || config.tarifas.length === 0) && (
                <tr>...No hay vehículos...</tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. SECCIÓN STAFF */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
          <User className="text-blue-500" /> Gestión de Personal
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
              className="w-full p-2 border rounded text-sm bg-white"
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
              className="w-full p-2 border rounded text-sm bg-white"
              value={newStaffRole}
              onChange={(e) => setNewStaffRole(e.target.value)}
            >
              <option value="chofer">Chofer</option>
              <option value="peon">Peón</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Alias (CBU)
            </label>
            <input
              className="w-full p-2 border rounded text-sm bg-white"
              value={newStaffAlias}
              onChange={(e) => setNewStaffAlias(e.target.value)}
              placeholder="juan.mp"
            />
          </div>
          <div className="flex items-center gap-2 pb-3">
            <input
              type="checkbox"
              id="ext"
              checked={newStaffExterno}
              onChange={(e) => setNewStaffExterno(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="ext" className="text-sm font-medium text-gray-700">
              ¿Es Externo?
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
              {config.staff_disponible?.map((s) => (
                <tr key={s.id}>
                  <td className="p-3 font-medium">{s.nombre}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${s.rol === "chofer"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                        }`}
                    >
                      {s.rol.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{s.alias || "-"}</td>
                  <td className="p-3 text-gray-500">
                    {/* @ts-ignore: Si tu backend devuelve es_externo a veces y otras no */}
                    {s.es_externo || s.rol === "peon" ? "Externo" : "Agencia"}
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

        <form
          onSubmit={handleAddClient}
          className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 grid gap-4 md:grid-cols-4 items-end"
        >
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Nombre
            </label>
            <input
              className="w-full p-2 border rounded text-sm bg-white"
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
              className="w-full p-2 border rounded text-sm bg-white"
              value={newClientAddress}
              onChange={(e) => setNewClientAddress(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Tarifa
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
            {config.clientes_disponibles?.map((c) => (
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
