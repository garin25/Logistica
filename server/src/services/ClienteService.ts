import { ClienteRepository } from "../repositories/ClientRepository";

export const ClienteService = {
  create: async (agenciaId: number, data: any) => {
    // Validamos tarifa default si viene vacía
    const tarifaSafe = (data.tipoTarifa === 'fabrica') ? 'fabrica' : 'particular';
    await ClienteRepository.create(agenciaId, { ...data, tipoTarifa: tarifaSafe });
  },

  delete: async (agenciaId: number, id: number) => {
    const count = await ClienteRepository.delete(id, agenciaId);
    if (count === 0) throw new Error('Cliente no encontrado');
  }
};