import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('POST /api/login (Validaciones)', () => {

 it('Debería fallar si faltan datos (400 o 401)', async () => {
    const usuarioIncompleto = {
      email: 'usuario@prueba.com'
    };

    const response = await request(app)
      .post('/api/login')
      .send(usuarioIncompleto);

    // Aceptamos 400 o 401
    expect([400, 401]).toContain(response.statusCode);
  });

  // (Credenciales inválidas)
  it('Debería rechazar credenciales falsas (401 o 400)', async () => {
    const usuarioFalso = {
      email: 'emailque_no_existe_jamasss@gmail.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/login')
      .send(usuarioFalso);

    // Aquí esperamos que la seguridad rechace al intruso
    expect([400, 401]).toContain(response.statusCode);
  });
});