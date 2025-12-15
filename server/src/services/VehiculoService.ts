import { VehiculoRepository } from '../repositories/VehiculoRepository';

export const VehiculoService = {
  create: async (agenciaId: number, data: any) => {
    await VehiculoRepository.create(agenciaId, data);
  },

  update: async (agenciaId: number, id: number, data: any) => {
    const count = await VehiculoRepository.update(id, agenciaId, data);
    if (count === 0) throw new Error('Vehículo no encontrado');
  },

  delete: async (agenciaId: number, id: number) => {
    const count = await VehiculoRepository.delete(id, agenciaId);
    if (count === 0) throw new Error('Vehículo no encontrado');
  }
};