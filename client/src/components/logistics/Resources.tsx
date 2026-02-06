import React, { useState } from "react";
import { Truck, User, Building2, Pencil, Trash2 } from "lucide-react";
import { api } from "../../services/api"; 
import type { Config, Tarifa } from "../../types"; 
import { toast } from "sonner";
import { VehiculoForm } from "./forms/VehiculoForm";
import { StaffForm } from "./forms/StaffForm";
import { ClienteForm } from "./forms/ClienteForm";

interface ResourcesProps {
  config: Config;
  onUpdate: () => void; // Función para recargar la data en el padre
}

export const Resources: React.FC<ResourcesProps> = ({ config, onUpdate }) => {

  const [editingVehiculo, setEditingVehiculo] = useState<Tarifa | null>(null);

  const handleDeleteVehiculo = (id: number) => {
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

       <VehiculoForm 
          onSuccess={onUpdate} 
          editingData={editingVehiculo} 
          onCancelEdit={() => setEditingVehiculo(null)}
        />

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
                  className={`transition-colors ${editingVehiculo?.id === t.id ? "bg-blue-50" : ""
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
                      onClick={() => setEditingVehiculo(t)}
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

        <StaffForm onSuccess={onUpdate}/>

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

        <ClienteForm onSuccess={onUpdate}/>

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
