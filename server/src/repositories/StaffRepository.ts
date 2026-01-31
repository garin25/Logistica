import { prisma } from "../db";

export const StaffRepository = {
  async create(agenciaId: number, data: { nombre: string, rol: string, alias: string, esExterno: boolean }) {
    await prisma.staff.create({
      data:{
        agencia_id:agenciaId,
        nombre:data.nombre,
        rol:data.rol,
        cbu_alias:data.alias,
        es_externo:data.esExterno
      }   
    }
    );
  },

  async delete(id: number, agenciaId: number) {
    const result = await prisma.staff.deleteMany({
      where: {
        id: id,
        agencia_id: agenciaId,
      },
    });

    return result.count;
  }
};