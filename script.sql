-- BLOQUE DE LIMPIEZA (Ejecutar solo si quieres reiniciar la DB de cero)
DROP TABLE IF EXISTS viaje_staff CASCADE;
DROP TABLE IF EXISTS viajes CASCADE;
DROP TABLE IF EXISTS tarifas CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS agencias CASCADE;

-- 1. TABLAS MAESTRAS (Sin dependencias)

CREATE TABLE agencias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email_contacto VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- 2. TABLAS DEPENDIENTES DE AGENCIA

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    agencia_id INT REFERENCES agencias(id) ON DELETE CASCADE,
    nombre VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Se guarda encriptada (hash)
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tarifas (
    id SERIAL PRIMARY KEY,
    agencia_id INT REFERENCES agencias(id) ON DELETE CASCADE,
    nombre_vehiculo VARCHAR(50),
    precio_fabrica DECIMAL(10,2) DEFAULT 0,
    precio_particular DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    agencia_id INT REFERENCES agencias(id) ON DELETE CASCADE,
    nombre VARCHAR(100),
    rol VARCHAR(20) CHECK (rol IN ('chofer', 'peon', 'admin')),
    es_externo BOOLEAN DEFAULT FALSE,
    cbu_alias VARCHAR(100)
);

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    agencia_id INT REFERENCES agencias(id) ON DELETE CASCADE,
    nombre VARCHAR(100),
    direccion_defecto VARCHAR(200)
);

-- 3. TABLAS TRANSACCIONALES (Viajes)

CREATE TABLE viajes (
    id SERIAL PRIMARY KEY,
    agencia_id INT REFERENCES agencias(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(100),
    origen VARCHAR(200),
    destinos TEXT, -- Guardamos JSON o texto
    tipo_camioneta VARCHAR(50), -- Columna agregada integrada
    precio_final DECIMAL(12,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'pendiente', -- 'tomable', 'pendiente', 'cerrado', 'archivado'
    peajes DECIMAL(10,2) DEFAULT 0,
    horas_reales DECIMAL(4,1) DEFAULT 0,
    fecha_viaje DATE,
    hora_viaje TIME,
    chofer_id INT REFERENCES staff(id), -- Referencia opcional para búsquedas rápidas
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE viaje_staff (
    id SERIAL PRIMARY KEY,
    viaje_id INT REFERENCES viajes(id) ON DELETE CASCADE,
    staff_id INT REFERENCES staff(id),
    rol VARCHAR(20), -- 'chofer' o 'peon' (redundante pero útil para histórico)
    monto_a_cobrar DECIMAL(10,2) DEFAULT 0,
    pagado BOOLEAN DEFAULT FALSE,
    fecha_pago TIMESTAMP
);

-- 4. ÍNDICES (Para optimizar búsquedas)
CREATE INDEX idx_viajes_fecha ON viajes(fecha_viaje);
CREATE INDEX idx_viajes_agencia ON viajes(agencia_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- tarifa me habia olvidado:
ALTER TABLE clientes 
ADD COLUMN tipo_tarifa VARCHAR(20) DEFAULT 'particular' CHECK (tipo_tarifa IN ('particular', 'fabrica'));

ALTER TABLE viajes ADD COLUMN tipo_tarifa VARCHAR(20) DEFAULT 'particular';