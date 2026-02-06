import { useEffect } from "react";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Truck, User, Users, X } from "lucide-react";

// --- INTERFACES (Tu contrato con el Backend se mantiene igual) ---
export interface NuevoViajeData {
  clienteId: string;
  tipoTarifa: string;
  fecha: string;
  hora: string;
  origen: string;
  destinos: string[]; // El backend sigue esperando strings
  vehiculoId: string;
  choferId: string;
  peonesIds: string[];
  estado: "TOMABLE" | "AGENDA";
}

interface NuevoViajeFormProps {
  onClose: () => void;
  onSubmit: (data: NuevoViajeData) => void;
  clientesDisponibles: { id: number; nombre: string; tipo_tarifa?: string }[];
  staffDisponible: { id: number; nombre: string; rol: string }[];
  vehiculosDisponibles: { nombre_vehiculo: string; precio_particular: number }[];
  initialData?: NuevoViajeData;
}

// --- SCHEMA ---
// CAMBIO CLAVE 1: Destinos ahora es un array de OBJETOS internamente
const viajeSchema = z.object({
  clienteId: z.string().min(1, "Seleccione un cliente"),
  tipoTarifa: z.string().min(1, "Requerido"),
  fecha: z.string().min(1, "Requerido"),
  hora: z.string().min(1, "Requerido"),
  origen: z.string().min(1, "Requerido"),
  
  // Validamos un objeto con propiedad 'value'
  destinos: z.array(
    z.object({
      value: z.string().min(1, "Destino requerido")
    })
  ).min(1, "Al menos un destino"),

  peonesIds: z.array(z.string()),
  vehiculoId: z.string(),
  choferId: z.string(),
});

type ViajeFormValues = z.infer<typeof viajeSchema>;

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

  // Preparar destinos iniciales (Convertir String -> Objeto)
  const destinosIniciales = (initialData?.destinos && initialData.destinos.length > 0)
    ? initialData.destinos.map(d => ({ value: d })) // "Lomas" -> { value: "Lomas" }
    : [{ value: "" }];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ViajeFormValues>({
    resolver: zodResolver(viajeSchema),
    defaultValues: {
      clienteId: initialData?.clienteId || "",
      tipoTarifa: initialData?.tipoTarifa || "particular",
      fecha: initialData?.fecha || "",
      hora: initialData?.hora || "",
      origen: initialData?.origen || "",
      
      // Usamos la versión transformada
      destinos: destinosIniciales,

      peonesIds: initialData?.peonesIds || [],
      vehiculoId: initialData?.vehiculoId || "",
      choferId: initialData?.choferId || "",
    },
  });

  // 2. useFieldArray (¡Ahora funciona nativo sin trucos!)
  const { 
    fields: destinosFields, 
    append: appendDestino, 
    remove: removeDestino 
  } = useFieldArray({
    control,
    name: "destinos",
  });

  // Observadores
  const watchedChoferId = watch("choferId");
  const watchedVehiculoId = watch("vehiculoId");
  const watchedClienteId = watch("clienteId");
  const watchedPeonesIds = watch("peonesIds");

  const estadoViaje = (watchedChoferId && watchedVehiculoId) ? "AGENDA" : "TOMABLE";
  const esEdicion = !!initialData;

  // Efecto Tarifa
  useEffect(() => {
    if (watchedClienteId) {
      const clienteSeleccionado = clientesDisponibles.find(
        (c) => c.id === Number(watchedClienteId)
      );
      if (clienteSeleccionado && clienteSeleccionado.tipo_tarifa) {
        setValue("tipoTarifa", clienteSeleccionado.tipo_tarifa);
      }
    }
  }, [watchedClienteId, clientesDisponibles, setValue]);

  // Submit Handler
  const onFormSubmit: SubmitHandler<ViajeFormValues> = (data) => {
    const estadoFinal: "TOMABLE" | "AGENDA" = (data.choferId && data.vehiculoId) ? "AGENDA" : "TOMABLE";

    // CAMBIO CLAVE 2: Transformar de vuelta (Objeto -> String) antes de enviar
    const destinosLimpios = data.destinos.map(d => d.value);

    const payload: NuevoViajeData = {
      ...data,
      destinos: destinosLimpios, // Aquí enviamos string[] como quiere el backend
      vehiculoId: data.vehiculoId || "",
      choferId: data.choferId || "",
      peonesIds: data.peonesIds || [],
      estado: estadoFinal,
    };

    onSubmit(payload);
  };

  // Helpers Peones
  const addPeonSlot = () => {
    const current = watch("peonesIds") || [];
    setValue("peonesIds", [...current, ""]);
  };

  const removePeonSlot = (index: number) => {
    const current = watch("peonesIds") || [];
    setValue("peonesIds", current.filter((_, i) => i !== index));
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
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CLIENTE */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Cliente</label>
              <select
                {...register("clienteId")}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Seleccione Cliente</option>
                {clientesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {errors.clienteId && <p className="text-red-500 text-xs">{errors.clienteId.message}</p>}
            </div>

            {/* TIPO TARIFA */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Tipo de Tarifa</label>
              <select
                {...register("tipoTarifa")}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="particular">Particular</option>
                <option value="fabrica">Fábrica</option>
              </select>
            </div>

            {/* FECHA y HORA */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input type="date" {...register("fecha")} className="w-full p-2 border rounded" />
              {errors.fecha && <p className="text-red-500 text-xs">{errors.fecha.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Hora</label>
              <input type="time" {...register("hora")} className="w-full p-2 border rounded" />
              {errors.hora && <p className="text-red-500 text-xs">{errors.hora.message}</p>}
            </div>
          </section>

          {/* --- SECCIÓN RUTA --- */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold">Ruta</h3>
            
            {/* ORIGEN */}
            <div className="w-full">
                <input
                type="text"
                {...register("origen")}
                placeholder="Origen"
                className="w-full p-2 border rounded"
                />
                {errors.origen && <p className="text-red-500 text-xs">{errors.origen.message}</p>}
            </div>

            {/* DESTINOS */}
            {destinosFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="w-full">
                  {/* CAMBIO CLAVE 3: Registramos la propiedad .value */}
                  <input
                    {...register(`destinos.${index}.value` as const)}
                    className="w-full p-2 border rounded"
                    placeholder={`Destino ${index + 1}`}
                  />
                  {/* Acceso al error: destinos[index].value */}
                  {errors.destinos?.[index]?.value && <p className="text-red-500 text-xs">Requerido</p>}
                </div>

                {destinosFields.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeDestino(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}

            {/* CAMBIO CLAVE 4: Append agregando un objeto */}
            <button
              type="button"
              onClick={() => appendDestino({ value: "" })}
              className="text-blue-600 flex items-center gap-1 font-medium hover:underline mt-2"
            >
              <Plus size={16} /> Agregar destino
            </button>
          </section>

          {/* SECCIÓN RECURSOS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Truck size={16} className="inline mr-1" /> Vehículo
              </label>
              <select {...register("vehiculoId")} className="w-full p-2 border rounded">
                <option value="">-- Sin asignar --</option>
                {vehiculosDisponibles.map((v, idx) => (
                  <option key={idx} value={v.nombre_vehiculo}>{v.nombre_vehiculo}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <User size={16} className="inline mr-1" /> Chofer
              </label>
              <select {...register("choferId")} className="w-full p-2 border rounded">
                <option value="">-- Sin Chofer (Tomable) --</option>
                {choferesReales.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </section>

          {/* SECCIÓN PEONES */}
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

            {watchedPeonesIds?.map((_, idx) => (
              <div key={idx} className="flex gap-2">
                <select
                  {...register(`peonesIds.${idx}` as const)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="">Seleccione peón...</option>
                  {peonesReales.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
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
              <span className={`font-bold text-lg ${estadoViaje === "AGENDA" ? "text-green-600" : "text-orange-500"}`}>
                {estadoViaje}
              </span>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-8 py-3 rounded-lg font-bold shadow-lg"
            >
              {esEdicion ? "Guardar Cambios" : "Crear Viaje"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}