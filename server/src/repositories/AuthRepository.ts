import { prisma } from "../db";

export const AuthRepository = {

  // Buscar usuario por email (para login y evitar duplicados)
   async findUserByEmail(email: string) {
    const result = await prisma.usuarios.findUnique({
      where: { email: email }
    })
    return result;
  },

  // --- REGISTRO (Transaccional) ---

  // 1. Crear Agencia
  async createAgency(nombreAgencia: string) {
   return await prisma.agencias.create({
      data: {
        nombre: nombreAgencia
      }
    })
  },

  // 2. Crear Usuario
  async createUser(usuarioData: any) {
    const { nombre, email, password, agenciaId } = usuarioData;
    await prisma.usuarios.create(
      {data:{
        nombre:nombre,
        email:email,
        password:password,
        agencia_id:agenciaId
      }}
    );
  },

  // 3. Crear Tarifas por Defecto
  async createDefaultTariffs(agenciaId: number) {
    await prisma.tarifas.create({data:{
      agencia_id:agenciaId,
      nombre_vehiculo:'Fiorino',
      precio_particular:15000,
      precio_fabrica:12000
    }}
    );
  },

  // --- CONFIGURACIÓN INICIAL (GET /api/config) ---

  async getInitialData(agenciaId: number) {
    // Mantenemos el Promise.all para que sea ultra rápido (paralelo)
    const [tarifas, staff, clientes] = await Promise.all([
      prisma.tarifas.findMany({
        where: { agencia_id: agenciaId }
      }),

      prisma.staff.findMany({
        where: { agencia_id: agenciaId },
        select: {
          id: true,
          nombre: true,
          rol: true,
          es_externo: true,
          cbu_alias: true
          // Al no seleccionar 'password' u otros campos, es más seguro y rápido
        },
        orderBy: { nombre: 'asc' }
      }),

      prisma.clientes.findMany({
        where: { agencia_id: agenciaId },
        select: {
          id: true,
          nombre: true,
          direccion_defecto: true,
          tipo_tarifa: true
        },
        orderBy: { nombre: 'asc' }
      })
    ]);
    return {
      tarifas,
      staff,
      clientes
    };
}
};