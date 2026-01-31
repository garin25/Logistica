import { prisma } from "../db";

export const ClienteRepository = {
  async create(agenciaId: number, data: { nombre: string, direccion: string, tipoTarifa: string }) {
    const {nombre,direccion,tipoTarifa} = data
    await prisma.clientes.create(
       {data:{
        agencia_id:agenciaId,
        nombre:nombre,
        direccion_defecto:direccion,
        tipo_tarifa:tipoTarifa
      }}
    );
  },

  async delete(id: number, agenciaId: number) {
    const result = await prisma.clientes.deleteMany({where:{ id:id ,agencia_id :agenciaId}})
    return result.count;
  }
};