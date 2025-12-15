# 🚛 Sistema de Gestión de Logística y Fletes

Una aplicación web completa "Full Stack" para la administración de agencias de fletes. Permite la gestión integral de viajes, choferes, peones, cálculo de tarifas dinámicas y seguimiento financiero en tiempo real.


## 📸 Galería de Capturas

| Vista General | Detalles |
|:---:|:---:|
| ![Imagen 1](./assets/1.png) | ![Imagen 2](./assets/2.png) |
| **Sección 3** | **Sección 4** |
| ![Imagen 3](./assets/3.png) | ![Imagen 4](./assets/4.png) |
| **Sección 5** | **Sección 6** |
| ![Imagen 5](./assets/5.png) | ![Imagen 6](./assets/6.png) |
| **Sección 7** | **Sección 8** |
| ![Imagen 7](./assets/7.png) | ![Imagen 8](./assets/8.png) |
## 🚀 Características Principales

* **Dashboard Inteligente:** Gráficos dinámicos de ganancias netas vs comisiones, filtrados por año.
* **Gestión de Viajes:** Ciclo de vida completo (Tomables, Agendados, Cerrados, Archivados).
* **Tarifas Dinámicas:** Selección automática de precios (Particular vs Fábrica) basada en el cliente.
* **Cálculo de Costos:** Cierre de viajes con cálculo automático de comisiones para choferes externos y costos de peones.
* **Gestión de Recursos:** ABM (Alta, Baja, Modificación) de Clientes, Vehículos y Personal.
* **Caja y Deudas:** Control de pagos pendientes a staff y registro de cobros.
* **Seguridad:** Autenticación JWT y contraseñas encriptadas.
* **Histórico:** Buscador avanzado de viajes pasados.

## 🛠️ Tecnologías Utilizadas

**Frontend (Carpeta `/client`):**
* React + Vite
* Tailwind CSS (Estilos)
* Recharts (Gráficos)
* Lucide React (Iconos)

**Backend (Carpeta `/server`):**
* Node.js & Express
* PostgreSQL (Base de datos)
* Node-Postgres (pg)
* JWT (Autenticación)

---

## ⚙️ Instalación y Configuración

Sigue estos pasos para ejecutar el proyecto en tu entorno local.

### 1. Clonar el repositorio
```bash
git clone [https://github.com/TU_USUARIO/TU_REPO.git](https://github.com/TU_USUARIO/TU_REPO.git)
cd TU_REPO

2. Configuración de Base de Datos
Necesitas tener PostgreSQL instalado.

Crea una base de datos (ej: logistica_db).

Ejecuta el script de creación de tablas (Schema) en tu gestor SQL (pgAdmin, DBeaver, etc.).

3. Configuración del Backend (server)
Bash

cd server
npm install
Crea un archivo .env en la carpeta server copiando el ejemplo:


PORT=3000
DATABASE_URL=postgres://usuario:password@localhost:5432/logistica_db
JWT_SECRET=tu_clave_secreta_segura
FRONTEND_URL=http://localhost:5173

Inicia el servidor:

npm run dev

4. Configuración del Frontend (client)
Abre una nueva terminal en la raíz del proyecto:


cd client
npm install
Crea un archivo .env en la carpeta client:

VITE_API_URL=http://localhost:3000/api

Inicia la aplicación:

npm run dev
📂 Estructura del Proyecto
Bash

/
├── server/          # Backend (Node/Express)
│   ├── src/
│   │   ├── index.ts # Entry point y rutas API
│   │   └── db.ts    # Conexión DB
│   └── .env         # Variables de entorno (NO SUBIR)
│
├── client/          # Frontend (React/Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.tsx
│   └── .env         # Variables de entorno (NO SUBIR)
│
└── README.md        # Documentación
