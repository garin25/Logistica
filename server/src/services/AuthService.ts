import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
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

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Crear Agencia
      const agenciaId = await AuthRepository.createAgency(client, nombreAgencia);

      // 2. Hashear Password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Crear Usuario
      await AuthRepository.createUser(client, {
        nombre,
        email,
        password: hashedPassword,
        agenciaId
      });

      // 4. Crear Tarifas Default
      await AuthRepository.createDefaultTariffs(client, agenciaId);

      await client.query('COMMIT');
      return { success: true };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
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