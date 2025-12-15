import express, { Request, Response ,NextFunction} from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from './db';


dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || 'clave_fallback_insegura';

const app = express();
const port = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());

// --- TIPOS DE DATOS (DTOs) ---
interface CreateTripBody {
  agenciaId: number;
  cliente: string;
  origen: string;
  destinos: string[];
  fecha: string;
  hora: string;
  choferId?: number; 
  peonesIds: number[];
  tipoCamioneta: string;
}

interface CloseTripBody {
  horasReales: number;
  peajes: number;
  precioFinalCliente: number;
  pagos: { staffId: number; monto: number; rol: string }[];
}

// --- MIDDLEWARE DE AUTENTICACIÓN ---
// Este "portero" verifica que el token sea válido y extrae los datos del usuario
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

  if (token == null) return res.sendStatus(401); // No hay token

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.sendStatus(403); // Token inválido o expirado
    (req as any).user = user; // Guardamos los datos del usuario en la request
    next(); // Dejamos pasar
  });
};

// --- ENDPOINTS ---
// --- REGISTRO DE NUEVA AGENCIA Y USUARIO ---
app.post('/api/register', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { nombre, email, password, nombreAgencia } = req.body;

    const userCheck = await client.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    await client.query('BEGIN');

    // Crear Agencia
    const resAgencia = await client.query(
      'INSERT INTO agencias (nombre) VALUES ($1) RETURNING id',
      [nombreAgencia]
    );
    const agenciaId = resAgencia.rows[0].id;

    // Encriptar y Crear Usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query(
      'INSERT INTO usuarios (nombre, email, password, agencia_id) VALUES ($1, $2, $3, $4)',
      [nombre, email, hashedPassword, agenciaId]
    );

    // Datos por defecto
    await client.query(
        `INSERT INTO tarifas (agencia_id, nombre_vehiculo, precio_particular, precio_fabrica) 
         VALUES ($1, 'Fiorino', 15000, 12000), ($1, 'Partner', 15000, 12000)`, 
         [agenciaId]
    );

    await client.query('COMMIT');

    // CAMBIO: NO devolvemos token. Solo éxito.
    res.json({ message: 'Usuario registrado correctamente. Por favor inicia sesión.' });

  } catch (error: unknown) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  } finally {
    client.release();
  }
});


app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar usuario
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // AQUÍ ESTABA EL SILENCIO: Ahora devolvemos 404 claro
      return res.status(404).json({ error: 'Usuario no encontrado. Regístrate primero.' });
    }

    const user = result.rows[0];

    // 2. Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) { 
        return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // 3. Generar Token
    const token = jwt.sign(
      { id: user.id, email: user.email, agenciaId: user.agencia_id }, 
      SECRET_KEY, 
      { expiresIn: '8h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        nombre: user.nombre, 
        email: user.email,
        agenciaId: user.agencia_id 
      } 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// 1. Configuración Inicial (PROTEGIDO)
// Cambiamos la ruta para no pedir ID en URL 👇
app.get('/api/config', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Sacamos el ID del token
    const agenciaId = (req as any).user.agenciaId;

    const tarifas = await pool.query('SELECT * FROM tarifas WHERE agencia_id = $1', [agenciaId]);
    const staff = await pool.query('SELECT id, nombre, rol, es_externo, cbu_alias FROM staff WHERE agencia_id = $1 ORDER BY nombre', [agenciaId]);
    const clientes = await pool.query(
    'SELECT id, nombre, direccion_defecto, tipo_tarifa FROM clientes WHERE agencia_id = $1 ORDER BY nombre', 
    [agenciaId]
);

    res.json({ 
        tarifas: tarifas.rows, 
        staff: staff.rows,
        clientes: clientes.rows 
    });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});
// 2. Obtener Viajes (PROTEGIDO)
// Agregamos 'authenticateToken' como segundo argumento 👇
app.get('/api/viajes', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const agenciaId = req.user.agenciaId;
    
    const result = await pool.query(`
      SELECT 
        v.id, 
        v.cliente_nombre, 
        v.origen, 
        v.destinos, 
        v.precio_final, 
        v.estado, 
        v.peajes, 
        v.horas_reales, 
        v.tipo_camioneta, 
        
        v.tipo_tarifa,  -- <--- ¡ESTO ES LO QUE FALTA! AGREGALO AQUÍ
        
        to_char(v.fecha_viaje, 'YYYY-MM-DD') as fecha, 
        to_char(v.hora_viaje, 'HH24:MI') as hora,
        COALESCE(
          json_agg(
            json_build_object(
              'staff_id', vs.staff_id, 
              'nombre', s.nombre, 
              'rol', vs.rol,
              'monto_a_cobrar', vs.monto_a_cobrar, 
              'pagado', vs.pagado,
              'alias_pago', s.cbu_alias,
              'es_externo', s.es_externo
            ) 
          ) FILTER (WHERE vs.id IS NOT NULL), 
          '[]'
        ) as staff_asignado
      FROM viajes v
      LEFT JOIN viaje_staff vs ON v.id = vs.viaje_id
      LEFT JOIN staff s ON vs.staff_id = s.id
      WHERE v.agencia_id = $1 AND v.estado != 'archivado'
      GROUP BY v.id
      ORDER BY v.fecha_viaje ASC, v.hora_viaje ASC
    `, [agenciaId]);


    const processedRows = result.rows.map(row => ({
        ...row,
        destinos: typeof row.destinos === 'string' ? JSON.parse(row.destinos) : row.destinos
    }));

    res.json(processedRows);
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo viajes' });
  }
});

// 3. Crear Viaje (PROTEGIDO y ACTUALIZADO con TARIFA)
app.post('/api/viajes', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Sacamos el ID de la agencia del Token
    const agenciaId = (req as any).user.agenciaId; 
    
    // 👇 Agregamos tipoTarifa al destructuring
    const { cliente, origen, destinos, fecha, hora, choferId, peonesIds, tipoCamioneta, tipoTarifa } = req.body;

    const choferIdSafe = choferId && Number(choferId) > 0 ? Number(choferId) : null;
    const estado = choferIdSafe ? 'pendiente' : 'tomable';
    const destinosStr = JSON.stringify(destinos);
    
    // 👇 Validamos que si viene vacío, sea 'particular'
    const tipoTarifaSafe = tipoTarifa || 'particular';

    // 👇 SQL ACTUALIZADO: Agregamos columna tipo_tarifa y el valor $10
    const insertViaje = `
      INSERT INTO viajes (
        agencia_id, cliente_nombre, origen, destinos, fecha_viaje, hora_viaje, 
        estado, precio_final, chofer_id, tipo_camioneta, tipo_tarifa
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10)
      RETURNING id
    `;
    
    // 👇 ARRAY ACTUALIZADO: Agregamos tipoTarifaSafe al final
    const resViaje = await client.query(insertViaje, [
        agenciaId, cliente, origen, destinosStr, fecha, hora, 
        estado, choferIdSafe, tipoCamioneta, tipoTarifaSafe
    ]);
    const viajeId = resViaje.rows[0].id;

    // ... (El resto de la lógica de insertar staff sigue igual) ...
    if (choferIdSafe) {
      await client.query(`INSERT INTO viaje_staff (viaje_id, staff_id, rol) VALUES ($1, $2, 'chofer')`, [viajeId, choferIdSafe]);
    }
    
    if (peonesIds && peonesIds.length > 0) {
      for (const pid of peonesIds) {
        if (Number(pid) !== choferIdSafe) {
            await client.query(`INSERT INTO viaje_staff (viaje_id, staff_id, rol) VALUES ($1, $2, 'peon')`, [viajeId, pid]);
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Viaje creado', id: viajeId });
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Error creando viaje' });
  } finally {
    client.release();
  }
});

// 4. Cerrar Viaje (PROTEGIDO)
app.put('/api/viajes/:id/cerrar', authenticateToken, async (req: Request<{id: string}, {}, CloseTripBody>, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    // 👇 SEGURIDAD: Obtenemos la agencia del token
    const agenciaId = (req as any).user.agenciaId;
    
    const { horasReales, peajes, precioFinalCliente, pagos } = req.body;

    // 👇 SEGURIDAD: Agregamos "AND agencia_id = $5" para asegurar que sea nuestro viaje
    const result = await client.query(
      `UPDATE viajes SET estado = 'cerrado', horas_reales = $1, peajes = $2, precio_final = $3 
       WHERE id = $4 AND agencia_id = $5`,
      [horasReales, peajes, precioFinalCliente, id, agenciaId]
    );

    // Si no se actualizó ninguna fila, es porque el ID no existe o no es de tu agencia
    if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Viaje no encontrado o no autorizado' });
    }

    for (const pago of pagos) {
      // Aquí también validamos viaje_id, y como el viaje ya se validó arriba, es seguro.
      await client.query(
        `UPDATE viaje_staff SET monto_a_cobrar = $1 WHERE viaje_id = $2 AND staff_id = $3`,
        [pago.monto, id, pago.staffId]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Viaje cerrado correctamente' });
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Error cerrando viaje' });
  } finally {
    client.release();
  }
});
// 5. Marcar Pago (PROTEGIDO)
app.put('/api/pagos/:viajeId/:staffId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { viajeId, staffId } = req.params;
    // @ts-ignore
    const agenciaId = req.user.agenciaId; 

    // CORRECCIÓN SQL: Hacemos Join con la tabla 'viajes' (v) para verificar la agencia
    const query = `
      UPDATE viaje_staff vs
      SET pagado = TRUE, fecha_pago = NOW()
      FROM viajes v
      WHERE vs.viaje_id = v.id 
        AND vs.viaje_id = $1 
        AND vs.staff_id = $2 
        AND v.agencia_id = $3
    `;

    const result = await pool.query(query, [viajeId, staffId, agenciaId]);

    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'No se encontró el registro o no tienes permiso' });
    }

    res.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: 'Error marcando pago' });
  }
});

// 6. Archivar (PROTEGIDO)
app.put('/api/viajes/:id/archivar', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const agenciaId = req.user.agenciaId; 
    
    const result = await pool.query(
        `UPDATE viajes SET estado = 'archivado' WHERE id = $1 AND agencia_id = $2`, 
        [id, agenciaId]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Viaje no encontrado o no autorizado' });
    }

    res.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: 'Error archivando' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor PostgreSQL corriendo en http://localhost:${port}`);
});

// 7. Editar Viaje Completo (PROTEGIDO)
app.put('/api/viajes/:id', authenticateToken, async (req: Request<{id: string}, {}, CreateTripBody>, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    // 👇 SEGURIDAD: Obtenemos la agencia del token
    const agenciaId = (req as any).user.agenciaId;

    const { cliente, origen, destinos, fecha, hora, choferId, peonesIds, tipoCamioneta } = req.body;

    const choferIdSafe = choferId && Number(choferId) > 0 ? Number(choferId) : null;
    const estado = choferIdSafe ? 'pendiente' : 'tomable';
    const destinosStr = JSON.stringify(destinos);

    // 1. Actualizar Tabla Viajes (Con filtro de seguridad)
    // 👇 Agregamos "AND agencia_id = $10" al final
    const updateResult = await client.query(
      `UPDATE viajes SET 
        cliente_nombre = $1, origen = $2, destinos = $3, fecha_viaje = $4, 
        hora_viaje = $5, estado = $6, chofer_id = $7, tipo_camioneta = $8
       WHERE id = $9 AND agencia_id = $10`,
      [cliente, origen, destinosStr, fecha, hora, estado, choferIdSafe, tipoCamioneta, id, agenciaId]
    );

    if (updateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Viaje no encontrado o no autorizado' });
    }

    // 2. Actualizar Staff
    await client.query(`DELETE FROM viaje_staff WHERE viaje_id = $1`, [id]);

    if (choferIdSafe) {
      await client.query(
        `INSERT INTO viaje_staff (viaje_id, staff_id, rol) VALUES ($1, $2, 'chofer')`,
        [id, choferIdSafe]
      );
    }

    if (peonesIds && peonesIds.length > 0) {
      for (const pid of peonesIds) {
        if (Number(pid) !== choferIdSafe) {
            await client.query(
              `INSERT INTO viaje_staff (viaje_id, staff_id, rol) VALUES ($1, $2, 'peon')`,
              [id, pid]
            );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Viaje actualizado correctamente' });
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Error actualizando viaje' });
  } finally {
    client.release();
  }
});
/*8. Eliminar Viaje (Cancelar definitivamente)(PROTEGIDO)
la tabla viaje_staff con ON DELETE CASCADE en el SQL inicial,
  al borrar el viaje, Postgres borrará automáticamente a los choferes/peones asignados a ese viaje.*/
app.delete('/api/viajes/:id', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    // @ts-ignore
    const agenciaId = req.user.agenciaId; 
    
    // Al filtrar por agencia_id, si el viaje no es tuyo, no borra nada.
    const result = await client.query(
        'DELETE FROM viajes WHERE id = $1 AND agencia_id = $2', 
        [id, agenciaId]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Viaje no encontrado o no autorizado' });
    }

    res.json({ message: 'Viaje eliminado correctamente' });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: 'Error eliminando viaje' });
  } finally {
    client.release();
  }
});

// 9. Crear Cliente (Actualizado con Tarifa)
app.post('/api/clientes', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Agregamos tipoTarifa al body
    const { nombre, direccion, tipoTarifa } = req.body; 
    // @ts-ignore
    const agenciaId = req.user.agenciaId;

    // Validamos que sea uno de los dos valores, sino default 'particular'
    const tarifaSafe = (tipoTarifa === 'fabrica') ? 'fabrica' : 'particular';

    await pool.query(
      'INSERT INTO clientes (agencia_id, nombre, direccion_defecto, tipo_tarifa) VALUES ($1, $2, $3, $4)',
      [agenciaId, nombre, direccion, tarifaSafe]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando cliente' });
  }
});

// 10. Eliminar Cliente
app.delete('/api/clientes/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const agenciaId = req.user.agenciaId;

    const result = await pool.query('DELETE FROM clientes WHERE id = $1 AND agencia_id = $2', [id, agenciaId]);
    
    if (result.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando cliente (quizás tiene viajes asociados)' });
  }
});

// --- GESTIÓN DE STAFF (Choferes/Peones) ---

// 11. Crear Staff
app.post('/api/staff', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { nombre, rol, alias, esExterno } = req.body;
    // @ts-ignore
    const agenciaId = req.user.agenciaId;

    await pool.query(
      'INSERT INTO staff (agencia_id, nombre, rol, cbu_alias, es_externo) VALUES ($1, $2, $3, $4, $5)',
      [agenciaId, nombre, rol, alias, esExterno]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando staff' });
  }
});

// 12. Eliminar Staff
app.delete('/api/staff/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const agenciaId = req.user.agenciaId;

    const result = await pool.query('DELETE FROM staff WHERE id = $1 AND agencia_id = $2', [id, agenciaId]);
    
    if (result.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando staff (quizás tiene viajes asociados)' });
  }
});

// --- GESTIÓN DE VEHÍCULOS (TARIFAS) ---

// 13. Crear Vehículo
app.post('/api/vehiculos', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { nombre, precioParticular, precioFabrica } = req.body;
    // @ts-ignore
    const agenciaId = req.user.agenciaId;

    await pool.query(
      'INSERT INTO tarifas (agencia_id, nombre_vehiculo, precio_particular, precio_fabrica) VALUES ($1, $2, $3, $4)',
      [agenciaId, nombre, precioParticular, precioFabrica]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando vehículo' });
  }
});

// 14. Eliminar Vehículo
app.delete('/api/vehiculos/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const agenciaId = req.user.agenciaId;

    const result = await pool.query('DELETE FROM tarifas WHERE id = $1 AND agencia_id = $2', [id, agenciaId]);
    
    if (result.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando vehículo (quizás tiene viajes asociados)' });
  }
});

// 15. Obtener Histórico de Viajes (Con Filtros)
app.get('/api/viajes/historico', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const agenciaId = req.user.agenciaId;
    const { fechaInicio, fechaFin } = req.query; // Esperamos formato YYYY-MM-DD

    let query = `
      SELECT 
        v.id, v.cliente_nombre, v.origen, v.destinos, v.precio_final, 
        v.estado, v.peajes, v.horas_reales, v.tipo_camioneta,
        to_char(v.fecha_viaje, 'YYYY-MM-DD') as fecha, 
        to_char(v.hora_viaje, 'HH24:MI') as hora,
        -- ... (resto de campos igual que el endpoint principal) ...
        COALESCE(
          json_agg(
            json_build_object(
              'staff_id', vs.staff_id, 
              'nombre', s.nombre, 
              'rol', vs.rol,
              'monto_a_cobrar', vs.monto_a_cobrar, 
              'pagado', vs.pagado,
              'alias_pago', s.cbu_alias,
              'es_externo', s.es_externo
            ) 
          ) FILTER (WHERE vs.id IS NOT NULL), 
          '[]'
        ) as staff_asignado
      FROM viajes v
      LEFT JOIN viaje_staff vs ON v.id = vs.viaje_id
      LEFT JOIN staff s ON vs.staff_id = s.id
      WHERE v.agencia_id = $1 AND v.estado = 'archivado'
    `;

    const params: any[] = [agenciaId];

    if (fechaInicio && fechaFin) {
        query += ` AND v.fecha_viaje BETWEEN $2 AND $3`;
        params.push(fechaInicio, fechaFin);
    } else {
        // Por defecto, si no hay fechas, traer últimos 30 días de archivados
        query += ` AND v.fecha_viaje >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    query += ` GROUP BY v.id ORDER BY v.fecha_viaje DESC, v.hora_viaje ASC`;

    const result = await pool.query(query, params);
    
    // Procesar destinos (igual que antes)
    const processedRows = result.rows.map(row => ({
        ...row,
        destinos: typeof row.destinos === 'string' ? JSON.parse(row.destinos) : row.destinos
    }));

    res.json(processedRows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo histórico' });
  }
});
// 16. Estadísticas para Dashboard (Ganancia Admin vs Comisión) CORREGIDO
app.get('/api/stats/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const agenciaId = req.user.agenciaId;
    const year = req.query.year || new Date().getFullYear();

    const query = `
      SELECT 
        EXTRACT(MONTH FROM v.fecha_viaje) as mes,
        
        -- 1. GANANCIA POR COMISIÓN (Choferes Externos)
        -- Fórmula: Precio - Peajes - (Pago Chofer + Pago Peones)
        -- Es decir, lo que "sobra" para la agencia.
        SUM(
          CASE WHEN s.es_externo = TRUE 
          THEN (
            v.precio_final 
            - v.peajes 
            - (SELECT COALESCE(SUM(monto_a_cobrar),0) FROM viaje_staff WHERE viaje_id = v.id)
          )
          ELSE 0 END
        ) as ganancia_comision,

        -- 2. GANANCIA ADMIN (Chofer Interno)
        -- Fórmula: Precio - Peajes - (Solo Pago Peones)
        -- NO restamos el pago del chofer porque el chofer es la propia empresa.
        SUM(
          CASE WHEN s.es_externo = FALSE 
          THEN (
            v.precio_final 
            - v.peajes 
            - (SELECT COALESCE(SUM(monto_a_cobrar),0) FROM viaje_staff WHERE viaje_id = v.id AND rol != 'chofer')
          )
          ELSE 0 END
        ) as ganancia_admin

      FROM viajes v
      LEFT JOIN staff s ON v.chofer_id = s.id
      WHERE v.agencia_id = $1 
        AND v.estado IN ('cerrado', 'archivado')
        AND EXTRACT(YEAR FROM v.fecha_viaje) = $2
      GROUP BY mes
      ORDER BY mes ASC;
    `;

    const result = await pool.query(query, [agenciaId, year]);
    
    // Formateamos para que el frontend lo lea fácil (mes 1 a 12)
    const stats = Array.from({ length: 12 }, (_, i) => {
      const row = result.rows.find((r: any) => Number(r.mes) === i + 1);
      return {
        name: new Date(0, i).toLocaleString('es-ES', { month: 'short' }), // Ene, Feb...
        comision: row ? Number(row.ganancia_comision) : 0,
        admin: row ? Number(row.ganancia_admin) : 0,
        total: row ? Number(row.ganancia_comision) + Number(row.ganancia_admin) : 0
      };
    });

    res.json(stats);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error calculando estadísticas' });
  }
});

// 17. Editar Vehículo (Tarifa)
app.put('/api/vehiculos/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, precioParticular, precioFabrica } = req.body;
    // @ts-ignore
    const agenciaId = req.user.agenciaId;

    const result = await pool.query(
      `UPDATE tarifas 
       SET nombre_vehiculo = $1, precio_particular = $2, precio_fabrica = $3 
       WHERE id = $4 AND agencia_id = $5`,
      [nombre, precioParticular, precioFabrica, id, agenciaId]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error actualizando vehículo' });
  }
});