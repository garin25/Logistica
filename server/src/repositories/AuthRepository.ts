import { PoolClient } from 'pg';
import { pool } from '../db';

export const AuthRepository = {
  
  // Buscar usuario por email (para login y evitar duplicados)
  async findUserByEmail(email: string) {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  // --- REGISTRO (Transaccional) ---

  // 1. Crear Agencia
  async createAgency(client: PoolClient, nombreAgencia: string) {
    const res = await client.query(
      'INSERT INTO agencias (nombre) VALUES ($1) RETURNING id',
      [nombreAgencia]
    );
    return res.rows[0].id;
  },

  // 2. Crear Usuario
  async createUser(client: PoolClient, usuarioData: any) {
    const { nombre, email, password, agenciaId } = usuarioData;
    await client.query(
      'INSERT INTO usuarios (nombre, email, password, agencia_id) VALUES ($1, $2, $3, $4)',
      [nombre, email, password, agenciaId]
    );
  },

  // 3. Crear Tarifas por Defecto
  async createDefaultTariffs(client: PoolClient, agenciaId: number) {
    await client.query(
      `INSERT INTO tarifas (agencia_id, nombre_vehiculo, precio_particular, precio_fabrica) 
       VALUES ($1, 'Fiorino', 15000, 12000), ($1, 'Partner', 15000, 12000)`, 
      [agenciaId]
    );
  },

  // --- CONFIGURACIÓN INICIAL (GET /api/config) ---
  
  async getInitialData(agenciaId: number) {
    // Ejecutamos las 3 consultas en paralelo para mayor velocidad
    const [tarifasRes, staffRes, clientesRes] = await Promise.all([
      pool.query('SELECT * FROM tarifas WHERE agencia_id = $1', [agenciaId]),
      pool.query('SELECT id, nombre, rol, es_externo, cbu_alias FROM staff WHERE agencia_id = $1 ORDER BY nombre', [agenciaId]),
      pool.query('SELECT id, nombre, direccion_defecto, tipo_tarifa FROM clientes WHERE agencia_id = $1 ORDER BY nombre', [agenciaId])
    ]);

    return {
      tarifas: tarifasRes.rows,
      staff: staffRes.rows,
      clientes: clientesRes.rows
    };
  }
};