import { prisma } from "../db";

export const VehiculoRepository = {
  async create(agenciaId: number, data: { nombre: string, precioParticular: number, precioFabrica: number }) {
    await prisma.tarifas.create({
      data:{
        agencia_id:agenciaId,
        nombre_vehiculo:data.nombre,
        precio_particular:data.precioParticular,
        precio_fabrica:data.precioFabrica
      }
    }
    );
  },

  async update(id: number, agenciaId: number, data: { nombre: string, precioParticular: number, precioFabrica: number }) {
    const result = await prisma.tarifas.updateMany({
      where: {
        id: id,
        agencia_id: agenciaId, // Condición de seguridad (WHERE id AND agencia_id)
      },
      data: {
        // Mapeamos tus datos a las columnas de la DB
        nombre_vehiculo: data.nombre,
        precio_particular: data.precioParticular,
        precio_fabrica: data.precioFabrica,
      },
    });

    // Prisma devuelve un objeto { count: 1 }, que es equivalente a result.rowCount
    return result.count; 
  },

  async delete(id: number, agenciaId: number) {
    const result = await prisma.tarifas.deleteMany({
      where: {
        id: id,
        agencia_id: agenciaId,
      },
    });

    return result.count;
  }
};