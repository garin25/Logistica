import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Health Check del Servidor', () => {
  
  it('GET /ping debería responder pong y status 200', async () => {
    const response = await request(app).get('/ping');
    
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('pong');
  });

});


  