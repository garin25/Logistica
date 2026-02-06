import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "../../../services/api"; 
import type { Tarifa } from "../../../types"; 

// --- . DEFINICIÓN DEL SCHEMA (Aquí vive la validación) ---
const vehiculoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  precioParticular: z.coerce.number().min(0, "No puede ser negativo"),
  precioFabrica: z.coerce.number().min(0, "No puede ser negativo"),
});

type VehiculoFormValues = z.infer<typeof vehiculoSchema>;

// --- PROPS DEL COMPONENTE ---
interface VehiculoFormProps {
  onSuccess: () => void; // Para recargar la tabla en el padre
  editingData: Tarifa | null; // El vehículo que estamos editando (o null)
  onCancelEdit: () => void; // Para limpiar el modo edición
}

export const VehiculoForm = ({ onSuccess, editingData, onCancelEdit }: VehiculoFormProps) => {
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: {
      nombre: "",
      precioParticular: 0,
      precioFabrica: 0
    }
  });

  // --- EFECTO: DETECTAR CAMBIO A MODO EDICIÓN ---
  // Si el padre nos pasa un vehículo para editar, rellenamos el form
  useEffect(() => {
    if (editingData) {
      setValue("nombre", editingData.nombre_vehiculo);
      setValue("precioParticular", editingData.precio_particular);
      setValue("precioFabrica", editingData.precio_fabrica);
    } else {
      reset({ nombre: "", precioParticular: 0, precioFabrica: 0 });
    }
  }, [editingData, setValue, reset]);

  // --- SUBMIT ---
  const onSubmit = (data: VehiculoFormValues) => {
    const action = async () => {
      if (editingData) {
        await api.updateVehiculo(editingData.id, data);
        onCancelEdit(); // Salimos del modo edición
      } else {
        await api.createVehiculo(data);
        reset(); // Limpiamos el form solo si es creación
      }
      await onSuccess(); // Recargamos la tabla padre
    };

    toast.promise(action(), {
      loading: editingData ? "Actualizando..." : "Creando vehículo...",
      success: editingData ? "Vehículo actualizado" : "Vehículo creado",
      error: "Error al guardar"
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-start bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
      
      {/* Nombre */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
        <input {...register("nombre")} className="border p-2 rounded text-sm w-32" placeholder="Modelo..." />
        {errors.nombre && <span className="text-red-500 text-[10px]">{errors.nombre.message}</span>}
      </div>

      {/* Precio Particular */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Particular ($)</label>
        <input type="number" {...register("precioParticular")} className="border p-2 rounded text-sm w-24" />
        {errors.precioParticular && <span className="text-red-500 text-[10px]">Requerido</span>}
      </div>

      {/* Precio Fábrica */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Fábrica ($)</label>
        <input type="number" {...register("precioFabrica")} className="border p-2 rounded text-sm w-24" />
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-2 mt-6"> {/* Ajuste de margen para alinear con inputs */}
        <button 
          type="submit" 
          className="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-800 font-bold transition-colors"
        >
          {editingData ? "Guardar" : "Agregar"}
        </button>
        
        {editingData && (
          <button 
            type="button" 
            onClick={() => {
              onCancelEdit();
              reset({ nombre: "", precioParticular: 0, precioFabrica: 0 });
            }}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-200 font-bold transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};