const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Helper para obtener el token guardado
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("logistics_token");

  // 1. Definimos los headers base que siempre van
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // 2. Si hay token, agregamos la autorización
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// Helper para manejar respuestas
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    if (res.status === 401) {
      // Si el token venció o es inválido, cerramos sesión forzoso
      localStorage.removeItem("logistics_token");
      localStorage.removeItem("logistics_user");
      window.location.reload();
      throw new Error("Sesión expirada");
    }
    const errorData = await res.json();
    throw new Error(errorData.error || "Error en la petición");
  }
  return res.json();
};

export const api = {
  // --- AUTENTICACIÓN ---
  register: (data: any) =>
    fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Buscamos tanto 'error' como 'message'
      throw new Error(data.error || data.message || "Error al iniciar sesión");
    }

    return data;
  },

  // --- DATOS (Ahora usan getAuthHeaders) ---

  getViajes: () =>
    fetch(`${API_URL}/viajes`, { headers: getAuthHeaders() }).then(
      handleResponse
    ),

  getConfig: () =>
    fetch(`${API_URL}/config`, { headers: getAuthHeaders() }).then(
      handleResponse
    ),

  createViaje: (data: any) =>
    fetch(`${API_URL}/viajes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data), // El backend debe leer agenciaId del token, no del body
    }).then(handleResponse),

  updateViaje: (id: number, data: any) =>
    fetch(`${API_URL}/viajes/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteViaje: (id: number) =>
    fetch(`${API_URL}/viajes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    }).then(handleResponse),

  closeViaje: (id: number, data: any) =>
    fetch(`${API_URL}/viajes/${id}/cerrar`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  markPaid: (viajeId: number, staffId: number) =>
    fetch(`${API_URL}/viajes/${viajeId}/pagos/${staffId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
    }).then(handleResponse),

  archiveViaje: (id: number) =>
    fetch(`${API_URL}/viajes/${id}/archivar`, {
      method: "PUT",
      headers: getAuthHeaders(),
    }).then(handleResponse),
  // CLIENTES
 createCliente: (data: { nombre: string; direccion?: string; tipoTarifa: string }) => // <--- Agregado tipoTarifa
    fetch(`${API_URL}/clientes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteCliente: (id: number) =>
    fetch(`${API_URL}/clientes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // STAFF
  createStaff: (data: {
    nombre: string;
    rol: string;
    alias?: string | undefined;
    esExterno: boolean;
  }) =>
    fetch(`${API_URL}/staff`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteStaff: (id: number) =>
    fetch(`${API_URL}/staff/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // VEHÍCULOS
  createVehiculo: (data: {
    nombre: string;
    precioParticular: number;
    precioFabrica: number;
  }) =>
    fetch(`${API_URL}/vehiculos`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteVehiculo: (id: number) =>
    fetch(`${API_URL}/vehiculos/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    }).then(handleResponse),

  getDashboardStats: (year: number) =>
    fetch(`${API_URL}/stats/dashboard?year=${year}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  updateVehiculo: (id: number, data: { nombre: string; precioParticular: number; precioFabrica: number }) =>
    fetch(`${API_URL}/vehiculos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getHistorico: (fechaInicio?: string, fechaFin?: string) => {
    let url = `${API_URL}/viajes/historico`;
    if (fechaInicio && fechaFin) {
      url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    }
    return fetch(url, { headers: getAuthHeaders() }).then(handleResponse);
  },
};

