import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { Button } from "../../ui/Button";

// --- 1. SCHEMA ---
const clienteSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    direccion: z.string().optional(),
    tipoTarifa: z.string().min(1, "La tarifa es obligatoria"), 
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
    onSuccess: () => void;
}

export const ClienteForm = ({ onSuccess }: ClienteFormProps) => {

    const {
        register,
        handleSubmit,
        reset,
        //setValue, // Necesario si vas a editar
        formState: { errors }
    } = useForm({
        resolver: zodResolver(clienteSchema),
        defaultValues: {
            nombre: "",
            direccion: "", // Mejor poner un valor por defecto válido
            tipoTarifa: "",
        }
    });

    /* Modo edicion
    useEffect(() => {
      if (staffData) {
          setValue("nombre", staffData.nombre);
          setValue("rol", staffData.rol);
          setValue("alias", staffData.alias);
          setValue("esExterno", staffData.es_externo); // Ojo con el nombre de la variable en tu DB
      } else {
          reset();
      }
    }, [staffData, setValue, reset]);*/


    // --- 2. SUBMIT CORREGIDO ---
    const onSubmit = (data: ClienteFormValues) => {
        const action = async () => {
            await api.createCliente(data);

            reset(); // Limpia el form
            await onSuccess(); // Recarga la tabla del padre
        };

        // Ejecutamos el toast con la promesa
        toast.promise(action(), {
            loading: "Creando staff...",
            success: "Staff creado correctamente",
            error: "Error al guardar"
        });
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
           className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 grid gap-4 md:grid-cols-4 items-end"
        >
            <div className="md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                    Nombre
                </label>
                <input
                    {...register("nombre")}
                    className="w-full p-2 border rounded text-sm bg-white"
                    placeholder="Ej: Juan Perez"
                />
                {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
            </div>

            <div className="md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                    Dirección
                </label>
                <input
                    {...register("direccion")}
                    className="w-full p-2 border rounded text-sm bg-white"
                    placeholder="Ej: Juan Perez"
                />
                {errors.direccion && <span className="text-red-500 text-xs">{errors.direccion.message}</span>}
            </div>

            <div className="md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                   Tarifa
                </label>
                <select
                    {...register("tipoTarifa")}
                    className="w-full p-2 border rounded text-sm bg-white"
                >
                    <option value="particular">Particular</option>
                    <option value="fabrica">Fábrica</option>
                </select>
                {errors.tipoTarifa && <span className="text-red-500 text-xs">{errors.tipoTarifa.message}</span>}
            </div>

            <Button type="submit" variant="primary" className="w-full">
                {"Agregar"}
            </Button>
        </form>
    );
};