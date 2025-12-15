import { StaffRepository } from '../repositories/StaffRepository';

export const StaffService = {
  create: async (agenciaId: number, data: any) => {
    await StaffRepository.create(agenciaId, data);
  },

  delete: async (agenciaId: number, id: number) => {
    const count = await StaffRepository.delete(id, agenciaId);
    if (count === 0) throw new Error('Staff no encontrado');
  }
};