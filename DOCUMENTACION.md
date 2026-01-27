# Sistema de Asistencia - MANUELITA

## Documentación Técnica Completa

**Versión:** 3.0
**Stack:** Node.js + Express + PostgreSQL + Prisma
**Última actualización:** Enero 2026

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Modelo de Datos](#5-modelo-de-datos)
6. [API REST - Referencia Completa](#6-api-rest---referencia-completa)
7. [Autenticación y Autorización](#7-autenticación-y-autorización)
8. [Reglas de Negocio](#8-reglas-de-negocio)
9. [Frontend](#9-frontend)
10. [Variables de Entorno](#10-variables-de-entorno)
11. [Evaluación de Buenas Prácticas](#11-evaluación-de-buenas-prácticas)
12. [Guía de Despliegue en VPS con Subdominio](#12-guía-de-despliegue-en-vps-con-subdominio)
13. [Integración con n8n](#13-integración-con-n8n)
14. [Mantenimiento y Operaciones](#14-mantenimiento-y-operaciones)

---

## 1. Descripción General

Sistema de control de asistencia diseñado para la empresa agrícola Manuelita. Permite registrar entradas y salidas de trabajadores mediante códigos QR con validación geográfica.

### Flujo Principal

```
Trabajador escanea QR → Valida ubicación GPS → Ingresa DNI → Marca ENTRADA/SALIDA
                                                                      │
                                                                      ▼
                                                          PostgreSQL (persistencia)
                                                                      │
                                                                      ▼
                                                  Admin revisa desde Panel de Control
```

### Usuarios del Sistema

| Rol | Acceso | Funciones |
|-----|--------|-----------|
| **Trabajador** | `marcar.html` (vía QR) | Marcar asistencia, auto-registrarse |
| **Admin** | `admin.html` (login) | Ver dashboard, gestionar empleados, ver asistencias, exportar PDF |
| **Super Admin** | `admin.html` (login) | Todo lo anterior + gestionar usuarios, configurar puntos QR, ajustes del sistema |

---

## 2. Arquitectura del Sistema

### Diagrama de Arquitectura

```
                    ┌─────────────────────────────────┐
                    │           INTERNET               │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │        Nginx (Reverse Proxy)     │
                    │   asistencia.tudominio.com:443   │
                    │   SSL/TLS + Headers seguridad    │
                    └──────┬───────────┬──────────────┘
                           │           │
              ┌────────────▼───┐  ┌────▼────────────────┐
              │  Static Files  │  │  Node.js (Express)   │
              │  /frontend/*   │  │  localhost:3000       │
              │  admin.html    │  │  /api/*               │
              │  marcar.html   │  └────────┬─────────────┘
              └────────────────┘           │
                                 ┌─────────▼──────────┐
                                 │   PostgreSQL        │
                                 │   localhost:5432    │
                                 │   DB: manuelita     │
                                 └─────────┬──────────┘
                                           │
                              ┌────────────▼────────────┐
                              │   n8n (Automatización)   │
                              │   n8n.tudominio.com      │
                              │   Webhooks + Workflows   │
                              └─────────────────────────┘
```

### Patrón Arquitectónico

El backend sigue una **arquitectura en capas**:

```
Routes → Middleware (auth, validate) → Controllers → Prisma ORM → PostgreSQL
```

| Capa | Responsabilidad |
|------|-----------------|
| **Routes** | Definir endpoints HTTP y encadenar middleware |
| **Middleware** | Autenticación JWT, validación Zod, manejo de errores |
| **Controllers** | Lógica de negocio y orquestación de queries |
| **Schemas** | Definición de validación de entrada (Zod) |
| **Services** | Integraciones externas (Google Sheets sync) |
| **Prisma ORM** | Abstracción de acceso a datos |

---

## 3. Stack Tecnológico

| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| Runtime | Node.js | 20 LTS | Entorno de ejecución |
| Lenguaje | TypeScript | 5.7 | Tipado estático |
| Framework | Express | 4.21 | Servidor HTTP / API REST |
| Base de datos | PostgreSQL | 15+ | Persistencia de datos |
| ORM | Prisma | 6.x | Modelado y queries |
| Auth | jsonwebtoken | 9.x | Tokens JWT |
| Hashing | bcrypt | 5.x | Hash de contraseñas |
| Validación | Zod | 3.24 | Validación de esquemas |
| Seguridad HTTP | helmet | latest | Headers de seguridad (X-Frame-Options, etc.) |
| Rate Limiting | express-rate-limit | latest | Protección anti brute-force |
| Logging | pino + pino-http | latest | Logs estructurados JSON |
| Sync (opcional) | googleapis | 144.x | Google Sheets API |
| Process Manager | PM2 | latest | Producción |
| Reverse Proxy | Nginx | latest | SSL, proxy, static files |
| Automatización | n8n | latest | Workflows automatizados |

### Dependencias Frontend (CDN)

| Librería | Uso |
|----------|-----|
| jsPDF + AutoTable | Exportación de PDF |
| QRCode.js | Generación de códigos QR |
| Inter (Google Fonts) | Tipografía |

---

## 4. Estructura del Proyecto

```
asistencia/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelos de base de datos
│   │   └── seed.ts                # Datos iniciales (admin default)
│   ├── src/
│   │   ├── server.ts              # Entry point
│   │   ├── app.ts                 # Express app + middleware + rutas
│   │   ├── config/
│   │   │   └── env.ts             # Carga de variables de entorno
│   │   ├── lib/
│   │   │   ├── prisma.ts          # PrismaClient singleton
│   │   │   └── logger.ts          # Logger Pino (JSON estructurado)
│   │   ├── middleware/
│   │   │   ├── asyncHandler.ts    # Wrapper try-catch para controllers async
│   │   │   ├── auth.ts            # JWT verify + roles (requireAuth, requireRole)
│   │   │   ├── errorHandler.ts    # Manejo global de errores con logging
│   │   │   └── validate.ts        # Validación con Zod (body y query)
│   │   ├── routes/
│   │   │   ├── index.ts           # Agregador: monta todas las subrutas
│   │   │   ├── auth.routes.ts     # POST /api/auth/login
│   │   │   ├── employees.routes.ts
│   │   │   ├── attendance.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   └── config.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── employees.controller.ts
│   │   │   ├── attendance.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   └── config.controller.ts
│   │   ├── schemas/
│   │   │   ├── auth.schema.ts     # loginSchema
│   │   │   ├── employee.schema.ts # createEmployeeSchema, updateEmployeeSchema
│   │   │   ├── attendance.schema.ts
│   │   │   ├── user.schema.ts
│   │   │   └── config.schema.ts
│   │   └── services/
│   │       └── sheets-sync.service.ts  # Google Sheets sync (opcional)
│   ├── dist/                      # Compilación TypeScript → JavaScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── ecosystem.config.js        # PM2 config
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── admin.html                 # Panel administrativo (SPA vanilla JS)
│   └── marcar.html                # Marcación de asistencia (SPA vanilla JS)
├── nginx.conf                     # Configuración de Nginx
├── google-apps-script.js          # Referencia (sistema anterior)
└── DOCUMENTACION.md               # Este archivo
```

---

## 5. Modelo de Datos

### Diagrama Entidad-Relación

```
┌──────────────┐       ┌──────────────────┐
│   Employee   │       │    Attendance     │
│ (empleados)  │       │  (asistencias)    │
├──────────────┤       ├──────────────────┤
│ PK dni       │──1:N──│ PK id (cuid)     │
│ nombre       │       │ FK dni           │
│ cargo        │       │ nombre           │
│ area         │       │ cargo            │
│ fecha_registro│      │ tipo (ENUM)      │
└──────────────┘       │ fecha            │
                       │ hora             │
┌──────────────┐       │ punto            │
│    User      │       │ lat, lng         │
│ (usuarios)   │       │ timestamp        │
├──────────────┤       └──────────────────┘
│ PK id (cuid) │
│ username (UQ)│       ┌──────────────────┐
│ password_hash│       │     QrPoint      │
│ nombre       │       │ (configuracion)  │
│ rol (ENUM)   │       ├──────────────────┤
│ fecha_creacion│      │ PK id            │
│ activo       │       │ nombre           │
└──────────────┘       │ lat, lng         │
                       │ radio            │
┌──────────────┐       │ activo           │
│ SystemConfig │       │ fecha_actualizacion│
│(system_config)│      └──────────────────┘
├──────────────┤
│ PK key       │
│ value (TEXT)  │
└──────────────┘
```

### Enums

```
AttendanceType: ENTRADA | SALIDA
UserRole:       admin | super_admin
```

### Índices

| Tabla | Columnas | Tipo |
|-------|----------|------|
| asistencias | `fecha` | B-tree |
| asistencias | `dni, fecha` | Compuesto |
| usuarios | `username` | Unique |

---

## 6. API REST - Referencia Completa

**Base URL:** `https://asistencia.tudominio.com/api`

**Formato de respuesta estándar:**

```json
// Éxito
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Mensaje descriptivo" }

// Error de validación
{ "success": false, "error": "Datos de entrada inválidos", "details": [...] }
```

---

### 6.1 Health Check

```
GET /api/health
```

**Auth:** Ninguna
**Respuesta:** `200`

```json
{ "success": true, "data": { "status": "ok", "timestamp": "2026-01-27T..." } }
```

---

### 6.2 Autenticación

```
POST /api/auth/login
```

**Auth:** Ninguna
**Body:**

```json
{ "username": "admin", "password": "Admin123" }
```

**Respuesta exitosa:** `200`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
      "id": "cm...",
      "username": "admin",
      "nombre": "Administrador Principal",
      "rol": "super_admin",
      "createdAt": "2026-01-27T..."
    }
  }
}
```

**Error:** `401`

```json
{ "success": false, "error": "Usuario o contraseña incorrectos" }
```

---

### 6.3 Empleados

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/employees` | No | Listar todos los empleados |
| `POST` | `/api/employees` | No | Crear empleado (auto-registro) |
| `PUT` | `/api/employees/:dni` | JWT | Editar empleado |
| `DELETE` | `/api/employees/:dni` | JWT | Eliminar empleado (hard delete) |

**POST /api/employees - Body:**

```json
{
  "DNI": "12345678",
  "NOMBRE": "JUAN PÉREZ GARCÍA",
  "CARGO": "OPERARIO",
  "AREA": "COSECHA"
}
```

**Validación Zod:**
- `DNI`: exactamente 8 dígitos numéricos
- `NOMBRE`: 1-200 caracteres
- `CARGO`: 1-100 caracteres
- `AREA`: 1-100 caracteres

---

### 6.4 Asistencias

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/attendance?date=YYYY-MM-DD` | No | Listar registros (filtro opcional) |
| `POST` | `/api/attendance` | No | Registrar asistencia |

**POST /api/attendance - Body:**

```json
{
  "dni": "12345678",
  "nombre": "JUAN PÉREZ GARCÍA",
  "cargo": "OPERARIO",
  "tipo": "ENTRADA",
  "date": "2026-01-27",
  "time": "08:30:45",
  "punto": "ENTRADA_PRINCIPAL",
  "lat": -14.0678,
  "lng": -75.7286
}
```

**Regla de negocio:** Máximo 1 ENTRADA + 1 SALIDA por DNI por día. Devuelve `409` si se excede.

---

### 6.5 Usuarios Admin

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/users` | JWT + super_admin | Listar usuarios activos |
| `POST` | `/api/users` | JWT + super_admin | Crear usuario |
| `PUT` | `/api/users/:id` | JWT + super_admin | Editar usuario |
| `DELETE` | `/api/users/:id` | JWT + super_admin | Desactivar usuario (soft delete) |

**POST /api/users - Body:**

```json
{
  "username": "supervisor1",
  "password": "contraseñaSegura123",
  "nombre": "María García López",
  "rol": "admin"
}
```

---

### 6.6 Configuración

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/config/points` | No | Obtener puntos QR activos |
| `PUT` | `/api/config/points` | JWT + super_admin | Guardar puntos QR (reemplaza todos) |
| `GET` | `/api/config/settings` | JWT + super_admin | Obtener configuración del sistema |
| `PUT` | `/api/config/settings` | JWT + super_admin | Actualizar configuración |

**PUT /api/config/points - Body:**

```json
[
  {
    "id": "ENTRADA_PRINCIPAL",
    "nombre": "Entrada Principal",
    "lat": -14.0678,
    "lng": -75.7286,
    "radio": 150,
    "activo": true
  }
]
```

**PUT /api/config/settings - Body:**

```json
{ "sheets_sync_enabled": "true" }
```

---

## 7. Autenticación y Autorización

### Flujo JWT

```
1. POST /api/auth/login → { username, password }
2. Server valida con bcrypt (12 salt rounds)
3. Server genera JWT con payload: { userId, username, rol }
4. JWT expira en 24h (configurable)
5. Cliente almacena token en localStorage
6. Cada request protegido envía: Authorization: Bearer <token>
```

### Middleware de Autenticación

```
requireAuth     → Verifica que el token sea válido
requireRole()   → Verifica que el usuario tenga el rol necesario
```

### Matriz de Permisos

| Recurso | Sin auth | admin | super_admin |
|---------|----------|-------|-------------|
| Health check | ✅ | ✅ | ✅ |
| Login | ✅ | - | - |
| Listar empleados | ✅ | ✅ | ✅ |
| Crear empleado | ✅ | ✅ | ✅ |
| Editar/Eliminar empleado | ❌ | ✅ | ✅ |
| Ver asistencias | ✅ | ✅ | ✅ |
| Registrar asistencia | ✅ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |
| Ver puntos QR | ✅ | ✅ | ✅ |
| Gestionar puntos QR | ❌ | ❌ | ✅ |
| Configuración sistema | ❌ | ❌ | ✅ |

---

## 8. Reglas de Negocio

| Regla | Descripción |
|-------|-------------|
| DNI único | Exactamente 8 dígitos numéricos, PK en tabla empleados |
| Límite diario | Máximo 1 ENTRADA + 1 SALIDA por empleado por día |
| Auto-detección | Si ya hay ENTRADA hoy → siguiente marcación es SALIDA |
| Geofencing | Validación Haversine en frontend (no en backend) |
| Soft delete usuarios | `activo = false`, nunca se eliminan físicamente |
| Hard delete empleados | Se eliminan junto con sus asistencias (CASCADE) |
| Contraseñas | bcrypt con 12 rounds de salt |
| Sesión | JWT con expiración de 24h |
| Usuario default | `admin` / `Admin123` (super_admin) |
| Formato fecha | `YYYY-MM-DD` (string en DB) |
| Formato hora | `HH:MM:SS` formato locale (string en DB) |

---

## 9. Frontend

### admin.html — Panel Administrativo

**Páginas internas (SPA):**

| Página | Descripción |
|--------|-------------|
| Dashboard | Estadísticas del día: presentes, entradas, salidas, actividad reciente |
| Trabajadores | CRUD de empleados, búsqueda, exportar PDF |
| Asistencias | Tabla filtrable por fecha/tipo/búsqueda, exportar PDF |
| Puntos QR | Crear puntos con coordenadas, generar/descargar QR |
| Usuarios Admin | CRUD de usuarios (solo super_admin) |
| Configuración | URL base, toggle Google Sheets sync |

**Objeto API (JavaScript):**

```javascript
const API = {
    get(path)        // GET con Authorization header
    post(path, body) // POST con Authorization header
    put(path, body)  // PUT con Authorization header
    del(path)        // DELETE con Authorization header
}
```

### marcar.html — Marcación de Asistencia

**Flujo de pantallas:**

```
Verificar ubicación GPS
    ├── Fuera del área → screenBlocked
    └── Dentro del área
        ├── DNI guardado → screenQuickMark (marcar con 1 tap)
        │   ├── Ya marcó hoy → screenAlreadyMarked
        │   └── Marca → screenSuccess (countdown 10s → reset)
        └── Sin DNI guardado → screenDni (teclado numérico)
            ├── Empleado existe → markAttendance → screenSuccess
            └── No existe → screenRegister → markAttendance → screenSuccess
```

**Parámetros URL:**

```
marcar.html?punto=ENTRADA_PRINCIPAL&api=https://asistencia.tudominio.com/api
```

| Parámetro | Obligatorio | Descripción |
|-----------|-------------|-------------|
| `punto` | Sí | ID del punto QR |
| `api` | No | URL base de la API (default: `window.location.origin + '/api'`) |

---

## 10. Variables de Entorno

Crear archivo `backend/.env` basándose en `.env.example`:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://manuelita_user:ContraseñaSegura123@localhost:5432/manuelita

# Servidor
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=genera-un-string-aleatorio-de-64-caracteres-aqui-usa-openssl-rand
JWT_EXPIRATION=24h

# CORS - dominio específico en producción
CORS_ORIGIN=https://asistencia.tudominio.com

# Google Sheets Sync (opcional)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SPREADSHEET_ID=
```

**Generar JWT_SECRET seguro:**

```bash
openssl rand -hex 32
```

---

## 11. Evaluación de Buenas Prácticas

### Lo que el proyecto implementa correctamente

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Arquitectura en capas | ✅ | Routes → Middleware → Controllers → Prisma |
| Validación de entrada | ✅ | Zod schemas en todos los endpoints |
| ORM seguro | ✅ | Prisma previene SQL injection |
| Hash de contraseñas | ✅ | bcrypt con 12 rounds |
| Autenticación JWT | ✅ | Tokens con expiración configurable |
| Autorización por roles | ✅ | `requireAuth` + `requireRole` |
| Soft delete usuarios | ✅ | No se pierde historial |
| TypeScript estricto | ✅ | Tipado estático en todo el backend |
| Singleton Prisma | ✅ | Una sola conexión a DB |
| Respuestas consistentes | ✅ | `{ success, data/error }` uniforme |
| Headers de seguridad | ✅ | Helmet con protección contra clickjacking, MIME sniffing, XSS |
| Rate limiting | ✅ | Global (100 req/15min) + Login estricto (10 req/15min) |
| Política de contraseñas | ✅ | Min. 8 chars + mayúscula + minúscula + número |
| Validación de entorno | ✅ | Zod valida `.env` al arrancar, falla rápido si faltan variables |
| Error handling robusto | ✅ | `asyncHandler` en todas las rutas, errores delegados al handler global |
| Logging estructurado | ✅ | Pino con formato JSON, pino-http para requests |
| Google Sheets sync | ✅ | Conectado a controllers, sync async non-blocking |

### Mejoras de seguridad implementadas

#### 1. Helmet — Headers HTTP seguros

```typescript
// app.ts
app.use(helmet({ contentSecurityPolicy: false }));
```

Protege contra: clickjacking (`X-Frame-Options`), MIME sniffing (`X-Content-Type-Options`), XSS reflection (`X-XSS-Protection`). CSP deshabilitado porque el frontend usa scripts inline.

#### 2. Rate limiting — Prevención de brute-force

```typescript
// app.ts — Limiter global
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// auth.routes.ts — Limiter estricto para login
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
```

#### 3. Política de contraseñas fuerte

```typescript
// schemas/user.schema.ts
const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');
```

> **Nota:** El schema de login (`auth.schema.ts`) solo valida `min(1)` para no bloquear el login del usuario seed `Admin123` creado antes de esta política. Los nuevos usuarios creados vía la API sí se validan con la política fuerte.

#### 4. Validación de entorno con Zod

```typescript
// config/env.ts
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  // ... más validaciones
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) { process.exit(1); }
```

El servidor no arranca si faltan variables críticas.

#### 5. asyncHandler — try-catch automático

```typescript
// middleware/asyncHandler.ts
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// En todas las rutas:
router.get('/', asyncHandler(getEmployees));
```

Cualquier error no capturado en un controller se delega automáticamente al error handler global con logging.

#### 6. Logging estructurado con Pino

```typescript
// lib/logger.ts — JSON logs con timestamps ISO
// Usado en: server.ts, errorHandler.ts, auth.controller.ts, users.controller.ts,
//           config.controller.ts, sheets-sync.service.ts
// pino-http en app.ts para logging automático de requests HTTP
```

#### 7. Google Sheets sync conectado

Los controllers de employees, attendance y config ahora invocan las funciones de sync después de cada operación de escritura (async, non-blocking):

```typescript
// Ejemplo en employees.controller.ts
res.status(201).json({ success: true });
syncEmployeesToSheets().catch(() => {}); // No bloquea la respuesta
```

### Pendiente — Calidad

| Aspecto | Estado | Recomendación |
|---------|--------|---------------|
| Tests | ❌ Ausente | Agregar Jest con tests de integración |
| API docs | ❌ Ausente | Agregar Swagger/OpenAPI |
| Migraciones | ❌ No versionadas | Ejecutar `prisma migrate dev` y commitear carpeta `migrations/` |
| Monitoreo | ⚠️ Básico | Health check existe, extender con estado de DB |
| Audit trail | ❌ Ausente | Log de quién hizo qué cambio y cuándo |
| CORS producción | ⚠️ Pendiente | Configurar `CORS_ORIGIN` en `.env` con dominio real |
| Empleados públicos | ⚠️ Por diseño | `POST /api/employees` es público para auto-registro desde `marcar.html` |

---

### Resumen de Madurez

```
 Funcionalidad core     ████████████████████  90%  (funcional)
 Seguridad              ████████████████░░░░  80%  (helmet, rate limit, passwords, env validation)
 Observabilidad         ████████████░░░░░░░░  60%  (pino logs + pino-http)
 Testing                ░░░░░░░░░░░░░░░░░░░░   0%  (sin tests)
 Documentación          ████████████████░░░░  80%  (este documento)
```

---

## 12. Guía de Despliegue en VPS con Subdominio

### Prerrequisitos

Tu VPS necesita:

- **Ubuntu 22.04+** (u otra distribución Linux)
- **Acceso SSH** como root o usuario con sudo
- **Subdominio DNS** apuntando al IP del VPS (ej: `asistencia.tudominio.com`)
- n8n ya instalado (lo integraremos después)

### Paso 1: Configurar el subdominio DNS

En el panel de tu proveedor de dominio (Hostinger, Cloudflare, etc.):

```
Tipo: A
Nombre: asistencia
Valor: <IP_DE_TU_VPS>
TTL: 3600
```

Si también quieres n8n en un subdominio:

```
Tipo: A
Nombre: n8n
Valor: <IP_DE_TU_VPS>
TTL: 3600
```

Espera a que propaguen los DNS (puede tardar de minutos a horas).

**Verificar propagación:**

```bash
ping asistencia.tudominio.com
```

---

### Paso 2: Instalar dependencias del sistema

```bash
# Conectar al VPS
ssh root@IP_DEL_VPS

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verificar versiones
node -v    # v20.x.x
npm -v     # 10.x.x

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar Nginx
apt install -y nginx

# Instalar PM2 globalmente
npm install -g pm2

# Instalar Certbot (SSL)
apt install -y certbot python3-certbot-nginx

# Instalar Git
apt install -y git
```

---

### Paso 3: Configurar PostgreSQL

```bash
# Entrar como usuario postgres
sudo -u postgres psql

# Crear base de datos y usuario
CREATE USER manuelita_user WITH PASSWORD 'TuContraseñaSegura2026';
CREATE DATABASE manuelita OWNER manuelita_user;
GRANT ALL PRIVILEGES ON DATABASE manuelita TO manuelita_user;

# Salir
\q
```

---

### Paso 4: Desplegar el proyecto

```bash
# Crear directorio
mkdir -p /var/www/asistencia
cd /var/www/asistencia

# Subir los archivos (opción 1: Git)
git clone https://tu-repositorio.git .

# Subir los archivos (opción 2: SCP desde tu PC)
# Desde tu PC Windows:
# scp -r C:\Users\adolf\Downloads\asistencia\backend root@IP:/var/www/asistencia/
# scp -r C:\Users\adolf\Downloads\asistencia\frontend root@IP:/var/www/asistencia/
# scp C:\Users\adolf\Downloads\asistencia\nginx.conf root@IP:/var/www/asistencia/

# Instalar dependencias del backend
cd /var/www/asistencia/backend
npm install --omit=dev

# Crear archivo .env
cp .env.example .env
nano .env
```

**Contenido del `.env`:**

```env
DATABASE_URL=postgresql://manuelita_user:TuContraseñaSegura2026@localhost:5432/manuelita
PORT=3000
NODE_ENV=production
JWT_SECRET=PEGA_AQUI_EL_RESULTADO_DE_openssl_rand_hex_32
JWT_EXPIRATION=24h
CORS_ORIGIN=https://asistencia.tudominio.com
```

Generar el JWT_SECRET:

```bash
openssl rand -hex 32
# Copiar el resultado y pegarlo en el .env
```

---

### Paso 5: Inicializar la base de datos

```bash
cd /var/www/asistencia/backend

# Generar el cliente Prisma
npx prisma generate

# Ejecutar migraciones (crear tablas)
npx prisma migrate deploy
# Si es primera vez y no hay migraciones:
npx prisma db push

# Ejecutar seed (crear admin default)
npx tsx prisma/seed.ts
```

---

### Paso 6: Compilar y arrancar con PM2

```bash
cd /var/www/asistencia/backend

# Compilar TypeScript
npm run build

# Arrancar con PM2
pm2 start ecosystem.config.js

# Verificar que está corriendo
pm2 status
pm2 logs manuelita-api

# Guardar configuración para auto-inicio
pm2 save
pm2 startup
# (ejecutar el comando que PM2 te muestre)
```

**Verificar que funciona:**

```bash
curl http://localhost:3000/api/health
# Debería responder: {"success":true,"data":{"status":"ok",...}}
```

---

### Paso 7: Configurar Nginx

```bash
# Crear configuración del sitio
nano /etc/nginx/sites-available/asistencia
```

**Contenido:**

```nginx
server {
    listen 80;
    server_name asistencia.tudominio.com;

    # Certbot completará la redirección HTTPS automáticamente

    # Frontend - archivos estáticos
    root /var/www/asistencia/frontend;
    index admin.html;

    # Archivos estáticos con cache
    location ~* \.(html|css|js|png|jpg|ico|svg|woff2)$ {
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }

    # API - proxy reverso a Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
    }

    # URLs amigables
    location = /admin {
        try_files /admin.html =404;
    }

    location = /marcar {
        try_files /marcar.html =404;
    }

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

```bash
# Activar el sitio
ln -s /etc/nginx/sites-available/asistencia /etc/nginx/sites-enabled/

# Verificar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

---

### Paso 8: Obtener certificado SSL (HTTPS)

```bash
certbot --nginx -d asistencia.tudominio.com
# Seguir las instrucciones interactivas
# Seleccionar "redirect" cuando pregunte

# Verificar renovación automática
certbot renew --dry-run
```

---

### Paso 9: Verificación final

Abrir en el navegador:

| URL | Resultado esperado |
|-----|--------------------|
| `https://asistencia.tudominio.com/admin.html` | Login del panel admin |
| `https://asistencia.tudominio.com/api/health` | `{"success":true,...}` |
| `https://asistencia.tudominio.com/marcar.html?punto=TEST&api=https://asistencia.tudominio.com/api` | Página de marcación |

**Login:**
- Usuario: `admin`
- Contraseña: `Admin123`

> **Cambiar la contraseña del admin inmediatamente después del primer login.**

---

### Estructura final en el VPS

```
/var/www/asistencia/
├── backend/
│   ├── dist/           # Compilación JS (lo que ejecuta PM2)
│   ├── node_modules/
│   ├── prisma/
│   ├── src/            # Código fuente TS
│   ├── .env            # Variables de entorno (NO commitear)
│   ├── ecosystem.config.js
│   └── package.json
├── frontend/
│   ├── admin.html
│   └── marcar.html
└── nginx.conf          # Referencia (la config real está en /etc/nginx/)
```

---

## 13. Integración con n8n

### Qué es n8n y su rol en la arquitectura

n8n es una plataforma de automatización de workflows. En el contexto de este sistema, n8n actúa como **capa de automatización** que reacciona a eventos del sistema de asistencia y ejecuta acciones automáticas.

```
┌─────────────────────────────────────────────────────┐
│                  ARQUITECTURA COMPLETA               │
│                                                      │
│  [Trabajador]──QR──▶[marcar.html]──▶[API Express]   │
│                                          │           │
│                                   [PostgreSQL]       │
│                                          │           │
│  [Admin]──login──▶[admin.html]──▶[API Express]      │
│                                          │           │
│                                   ┌──────▼──────┐   │
│                                   │    n8n       │   │
│                                   │  Webhooks    │   │
│                                   └──────┬──────┘   │
│                                          │           │
│                          ┌───────────────┼───────┐   │
│                          ▼               ▼       ▼   │
│                     [Email]      [WhatsApp]  [Sheets] │
│                     [Telegram]   [Reportes]  [Slack]  │
└─────────────────────────────────────────────────────┘
```

### Paso 1: Configurar subdominio para n8n

Si n8n ya está corriendo en tu VPS (generalmente en puerto 5678):

```bash
# DNS (en tu proveedor de dominio):
# Tipo: A | Nombre: n8n | Valor: IP_VPS

# Nginx config para n8n
nano /etc/nginx/sites-available/n8n
```

```nginx
server {
    listen 80;
    server_name n8n.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        chunked_transfer_encoding off;
        proxy_buffering off;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
certbot --nginx -d n8n.tudominio.com
```

### Paso 2: Configurar n8n para usar con la API

En la configuración de n8n (`.env` o variables de entorno):

```env
N8N_HOST=n8n.tudominio.com
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.tudominio.com
```

### Paso 3: Workflows recomendados

#### Workflow 1: Notificación de asistencia por Telegram/WhatsApp

**Trigger:** Webhook (POST desde la API)
**Propósito:** Notificar al supervisor cuando un trabajador marca entrada/salida.

```
[Webhook] → [IF tipo=ENTRADA] → [Telegram: "✅ Juan Pérez llegó a las 08:30"]
                               → [Telegram: "👋 Juan Pérez salió a las 17:30"]
```

**Implementación en el backend:**

Agregar al controller de attendance después de crear el registro:

```typescript
// attendance.controller.ts - después de crear el registro
// Enviar webhook a n8n (async, no bloquea la respuesta)
fetch('https://n8n.tudominio.com/webhook/asistencia', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    evento: 'nueva_asistencia',
    dni: record.dni,
    nombre: record.nombre,
    tipo: record.tipo,
    fecha: record.fecha,
    hora: record.hora,
    punto: record.punto
  })
}).catch(() => {}); // No bloquear si falla
```

---

#### Workflow 2: Reporte diario automático

**Trigger:** Cron (lunes a viernes a las 18:00)
**Propósito:** Enviar resumen diario de asistencia.

```
[Cron 18:00] → [HTTP Request: GET /api/attendance?date=HOY]
             → [Procesar datos: contar entradas, salidas, ausentes]
             → [Email/Telegram: "Resumen 27/01: 45 entradas, 43 salidas, 2 sin marcar"]
```

**Configuración en n8n:**

1. Nodo **Schedule Trigger**: Cron `0 18 * * 1-5`
2. Nodo **HTTP Request**:
   - URL: `https://asistencia.tudominio.com/api/attendance?date={{$today.format('yyyy-MM-dd')}}`
   - Method: GET
3. Nodo **Code** (JavaScript):
   ```javascript
   const data = $input.first().json.data;
   const entradas = data.filter(r => r.tipo === 'ENTRADA').length;
   const salidas = data.filter(r => r.tipo === 'SALIDA').length;
   return [{
     json: {
       mensaje: `📊 Resumen del día:\n✅ Entradas: ${entradas}\n👋 Salidas: ${salidas}`
     }
   }];
   ```
4. Nodo **Telegram** o **Email**: Enviar el mensaje

---

#### Workflow 3: Alerta de empleado sin salida

**Trigger:** Cron (lunes a viernes a las 19:00)
**Propósito:** Detectar empleados que marcaron entrada pero no salida.

```
[Cron 19:00] → [GET /api/attendance?date=HOY]
             → [Filtrar: tiene ENTRADA pero no SALIDA]
             → [Telegram: "⚠️ 3 empleados no marcaron salida: ..."]
```

---

#### Workflow 4: Backup semanal a Google Drive

**Trigger:** Cron (domingos a las 02:00)
**Propósito:** Exportar datos semanales y guardar en Google Drive.

```
[Cron dominical] → [GET /api/employees]
                 → [GET /api/attendance] (última semana)
                 → [Convertir a CSV]
                 → [Google Drive: subir archivo]
```

---

#### Workflow 5: Sincronización con Google Sheets

**Trigger:** Webhook (POST desde la API)
**Propósito:** Reemplazar la sincronización directa con Sheets.

En lugar de usar `googleapis` directamente en el backend, delegar a n8n:

```
[Webhook: nueva_asistencia] → [Google Sheets: Append Row]
[Webhook: nuevo_empleado]   → [Google Sheets: Append Row]
```

Esto es mejor que la integración directa porque:
- n8n maneja las credenciales de Google
- No necesitas service account en el backend
- Puedes activar/desactivar sin tocar código
- n8n reintenta automáticamente si falla

---

### Paso 4: Seguridad de los webhooks

Para evitar que alguien envíe datos falsos a tus webhooks de n8n:

**Opción A: Header secreto**

```typescript
// En el backend, al enviar webhook:
fetch('https://n8n.tudominio.com/webhook/asistencia', {
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': 'tu-secreto-compartido'
  },
  body: JSON.stringify(data)
});
```

En n8n, agregar un nodo IF que verifique el header.

**Opción B: Webhook con autenticación básica**

n8n soporta autenticación básica en webhooks. Configurar usuario/contraseña en el nodo Webhook y enviar desde el backend con:

```typescript
headers: {
  'Authorization': 'Basic ' + Buffer.from('user:pass').toString('base64')
}
```

---

### Diagrama de conectividad final

```
                         ┌──────────────────┐
    Puerto 443 (HTTPS)   │                  │
    ┌────────────────────▶│     Nginx        │
    │                     │  (reverse proxy) │
    │                     └──┬──────────┬───┘
    │                        │          │
    │               /api/*   │          │  todo lo demás
    │                        ▼          ▼
    │               ┌────────────┐  ┌────────────┐
    │               │ Node.js    │  │ Frontend   │
    │               │ :3000      │  │ /frontend/ │
    │               └─────┬──────┘  └────────────┘
    │                     │
    │                     ▼
    │               ┌────────────┐
    │               │ PostgreSQL │
    │               │ :5432      │
    │               └────────────┘
    │
    │  n8n.tudominio.com
    │               ┌────────────┐
    └──────────────▶│   n8n      │
                    │   :5678    │◄──webhooks── Node.js
                    └──────┬─────┘
                           │
                    ┌──────▼──────┐
                    │  Servicios  │
                    │  externos   │
                    │  Telegram   │
                    │  Email      │
                    │  Sheets     │
                    └─────────────┘
```

---

## 14. Mantenimiento y Operaciones

### Comandos útiles

```bash
# ─── PM2 ───
pm2 status                    # Ver estado
pm2 logs manuelita-api        # Ver logs en tiempo real
pm2 restart manuelita-api     # Reiniciar
pm2 reload manuelita-api      # Reload sin downtime

# ─── Actualizar código ───
cd /var/www/asistencia/backend
git pull                       # Si usas Git
npm install --omit=dev
npm run build
pm2 restart manuelita-api

# ─── Base de datos ───
npx prisma migrate deploy     # Aplicar nuevas migraciones
npx prisma studio             # UI visual para ver datos (dev)

# ─── Backup de PostgreSQL ───
pg_dump -U manuelita_user -h localhost manuelita > backup_$(date +%Y%m%d).sql

# ─── Restaurar backup ───
psql -U manuelita_user -h localhost manuelita < backup_20260127.sql

# ─── SSL ───
certbot renew                 # Renovar certificados
certbot certificates          # Ver estado de certificados

# ─── Nginx ───
nginx -t                      # Verificar config
systemctl restart nginx       # Reiniciar

# ─── Monitoreo ───
htop                          # Uso de CPU/RAM
df -h                         # Espacio en disco
pm2 monit                     # Monitor de PM2
```

### Backup automático con cron

```bash
crontab -e
```

Agregar:

```cron
# Backup diario a las 3 AM
0 3 * * * pg_dump -U manuelita_user -h localhost manuelita > /var/backups/manuelita/backup_$(date +\%Y\%m\%d).sql 2>&1

# Limpiar backups > 30 días
0 4 * * * find /var/backups/manuelita/ -name "*.sql" -mtime +30 -delete
```

```bash
mkdir -p /var/backups/manuelita
```

### Checklist de deploy

- [ ] Subdominio DNS configurado y propagado
- [ ] PostgreSQL instalado y base de datos creada
- [ ] Archivos del proyecto copiados al VPS
- [ ] `.env` configurado con valores de producción
- [ ] `JWT_SECRET` generado con `openssl rand -hex 32`
- [ ] Migraciones de Prisma aplicadas
- [ ] Seed ejecutado (admin default creado)
- [ ] TypeScript compilado (`npm run build`)
- [ ] PM2 arrancado y configurado para auto-inicio
- [ ] Nginx configurado con proxy inverso
- [ ] SSL activado con Certbot
- [ ] Contraseña del admin cambiada desde el panel
- [ ] Primer punto QR creado desde Configuración
- [ ] QR descargado y probado desde celular
- [ ] n8n accesible en su subdominio
- [ ] Workflows de n8n configurados (opcionales)
- [ ] Backup de base de datos programado
