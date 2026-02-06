import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { Button } from "../../ui/Button";

// --- 1. SCHEMA ---
const staffSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    rol: z.string().min(1, "El rol es obligatorio"),
    alias: z.string().optional(), // Puede ser opcional
    // z.boolean() no lleva mensaje de error como primer parametro.
    esExterno: z.boolean().default(true)
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffFormProps {
    onSuccess: () => void;
}

export const StaffForm = ({ onSuccess }: StaffFormProps) => {

    const {
        register,
        handleSubmit,
        reset,
        //setValue, // Necesario si vas a editar
        formState: { errors }
    } = useForm({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            nombre: "",
            rol: "chofer", // Mejor poner un valor por defecto válido
            alias: "",
            esExterno: false
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
    const onSubmit = (data: StaffFormValues) => {
        const action = async () => {
            await api.createStaff(data);

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
            className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 grid gap-4 md:grid-cols-5 items-end"
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

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                    Rol
                </label>
                <select
                    {...register("rol")}
                    className="w-full p-2 border rounded text-sm bg-white"
                >
                    <option value="chofer">Chofer</option>
                    <option value="peon">Peón</option>
                </select>
                {errors.rol && <span className="text-red-500 text-xs">{errors.rol.message}</span>}
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                    Alias (CBU)
                </label>
                <input
                    {...register("alias")}
                    className="w-full p-2 border rounded text-sm bg-white"
                    placeholder="juan.mp"
                />
            </div>

            <div className="flex items-center gap-2 pb-3">
                <input
                    type="checkbox"
                    id="ext"
                    {...register("esExterno")}
                    className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="ext" className="text-sm font-medium text-gray-700 cursor-pointer">
                    ¿Es Externo?
                </label>
            </div>

            <Button type="submit" variant="primary" className="w-full">
                {"Agregar"}
            </Button>
        </form>
    );
};