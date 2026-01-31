import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import 'dotenv/config'; 

// Creamos la instancia del Pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Opcional: Un log para saber si se conectó bien cuando arranca (solo en desarrollo)
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔌 Base de datos conectada exitosamente');
  }
});

// Opcional: Manejo de errores global del pool
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el cliente de PG', err);
  process.exit(-1);
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Opcional: Esto te muestra las queries en la consola (útil para debug)
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
/*const prisma = new PrismaClient()

export default prisma*/