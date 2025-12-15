// src/hooks/useTripCalculator.ts
import { useState } from 'react';
import type { Viaje, Config } from '../types';

export const useTripCalculator = (trip: Viaje, config: Config) => {
  // 1. Derivar datos estáticos del viaje
  const chofer = trip.staff_asignado.find((s) => s.rol === "chofer");
  const peones = trip.staff_asignado.filter((s) => s.rol === "peon");
  const aplicaComision = chofer?.es_externo === true;

  // 2. Estado local del cálculo
  const [horas, setHoras] = useState(0);
  const [peajes, setPeajes] = useState(0);
  const [montos, setMontos] = useState({
    totalCliente: 0,
    pagoChofer: 0,
    pagoPeonUnitario: 0
  });

  // 3. Helpers Internos
  const getPrecioHoraVehiculo = () => {
    const tarifa = config.tarifas.find(
      (t) => t.nombre_vehiculo === trip.tipo_camioneta
    );
    if (!tarifa) return 35000; // Default
    return trip.tipo_tarifa === "fabrica"
      ? tarifa.precio_fabrica
      : tarifa.precio_particular;
  };

  // Función pura de cálculo (sin efectos secundarios)
  const calculate = (h: number, p: number, peonUnitario?: number) => {
    const precioHoraVehiculo = getPrecioHoraVehiculo();

    // Si no pasamos peonUnitario (undefined), usamos el sugerido: h * 18000
    const precioPeonFinal = peonUnitario !== undefined ? peonUnitario : (h * 18000);

    const subtotalVehiculo = h * precioHoraVehiculo;
    const subtotalPeones = precioPeonFinal * peones.length;
    const comision = aplicaComision ? subtotalVehiculo * 0.1 : 0;

    const pagoChofer = subtotalVehiculo - comision + p;
    const totalCliente = subtotalVehiculo + subtotalPeones + p;

    return { totalCliente, pagoChofer, pagoPeonUnitario: precioPeonFinal };
  };

  // 4. Handlers Expuestos (Acciones)
  
  const updateHoras = (val: number) => {
    setHoras(val);
    // Al cambiar horas, reseteamos el precio del peón al sugerido (undefined)
    setMontos(calculate(val, peajes, undefined)); 
  };

  const updatePeajes = (val: number) => {
    setPeajes(val);
    // Al cambiar peajes, mantenemos el precio de peón actual
    setMontos(calculate(horas, val, montos.pagoPeonUnitario));
  };

  const updatePrecioPeonUnitario = (val: number) => {
    // Al cambiar precio manual, mantenemos las horas y peajes actuales
    setMontos(calculate(horas, peajes, val));
  };

  const updatePagoChofer = (val: number) => {
     setMontos(prev => ({ ...prev, pagoChofer: val }));
  };
  
  const updateTotalCliente = (val: number) => {
     setMontos(prev => ({ ...prev, totalCliente: val }));
  };

  return {
    // Valores
    horas,
    peajes,
    montos,
    chofer,
    peones,
    aplicaComision,
    // Acciones
    updateHoras,
    updatePeajes,
    updatePrecioPeonUnitario,
    updatePagoChofer,
    updateTotalCliente
  };
};