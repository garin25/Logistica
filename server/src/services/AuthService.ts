import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/AuthRepository';

// Aseguramos la clave secreta
const SECRET_KEY = process.env.JWT_SECRET || 'clave_fallback_insegura';

export const AuthService = {

  // 1. Registro de Agencia + Usuario
  register: async (data: any) => {
    const { nombre, email, password, nombreAgencia } = data;

    // Validación básica
    const existingUser = await AuthRepository.findUserByEmail(email);
    if (existingUser) {
      throw new Error('El email ya está registrado'); // Mensaje seguro para el usuario
    }

    try {
      // 1. Crear Agencia
      const nuevaAgencia = await AuthRepository.createAgency(nombreAgencia);

      // 2. Hashear Password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Crear Usuario
      await AuthRepository.createUser({
        nombre,
        email,
        password: hashedPassword,
        agenciaId :nuevaAgencia.id
      });

      // 4. Crear Tarifas Default
      await AuthRepository.createDefaultTariffs(nuevaAgencia.id);

      return { success: true };

    } catch (error) {
      console.error("Error en registro:", error);
      // Aquí podrías borrar la agencia creada si falla el usuario (rollback manual),
      throw new Error('Hubo un error al procesar el registro. Intente nuevamente.');
    }
  },

  // 2. Login
  login: async (email: string, passwordPlain: string) => {
    const user = await AuthRepository.findUserByEmail(email);
    
    if (!user) {
      throw new Error('Credenciales inválidas'); // No digas "Usuario no encontrado" por seguridad
    }

    const validPassword = await bcrypt.compare(passwordPlain, user.password);
    if (!validPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Generar Token
    const token = jwt.sign(
      { id: user.id, email: user.email, agenciaId: user.agencia_id }, 
      SECRET_KEY, 
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        agenciaId: user.agencia_id
      }
    };
  },

  // 3. Configuración Inicial
  getConfig: async (agenciaId: number) => {
    return await AuthRepository.getInitialData(agenciaId);
  }
};