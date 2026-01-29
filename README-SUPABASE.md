# Sistema de Asistencia Manuelita - Supabase Edition

## Estructura Final (Solo 3 archivos necesarios)

```
asistencia/
├── frontend/
│   ├── admin.html      ← Panel de administración
│   └── marcar.html     ← Página para marcar asistencia
└── supabase-setup.sql  ← SQL para configurar Supabase
```

## Puedes ELIMINAR la carpeta `backend/` completa
Ya no es necesaria porque todo se conecta directamente a Supabase.

---

## Pasos para Configurar

### 1. Crear Proyecto en Supabase (GRATIS)

1. Ve a https://supabase.com
2. Crea una cuenta (puedes usar GitHub)
3. Crea un nuevo proyecto
4. Espera a que se inicialice (~2 minutos)

### 2. Obtener Credenciales

En tu proyecto de Supabase, ve a **Settings > API**:

- **Project URL**: `https://xxxx.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Crear las Tablas

1. En Supabase, ve a **SQL Editor**
2. Copia todo el contenido de `supabase-setup.sql`
3. Pégalo y haz clic en **Run**

### 4. Crear Usuario Administrador

1. Ve a **Authentication > Users**
2. Clic en **Add User**
3. Ingresa:
   - Email: `admin@tuempresa.com`
   - Password: `TuContraseñaSegura123`
4. Clic en **Create User**

5. Luego ve a **SQL Editor** y ejecuta:
```sql
-- Reemplaza 'EL-UUID-DEL-USUARIO' con el ID del usuario que creaste
INSERT INTO user_profiles (id, username, nombre, rol)
VALUES ('EL-UUID-DEL-USUARIO', 'admin', 'Administrador', 'super_admin');
```
(El UUID lo encuentras en Authentication > Users, es el ID del usuario)

### 5. Subir Archivos a tu Hosting

Solo sube estos 2 archivos a tu hosting:
- `frontend/admin.html`
- `frontend/marcar.html`

### 6. Configurar el Sistema

1. Abre `admin.html` en tu navegador
2. Te pedirá las credenciales de Supabase:
   - URL: `https://xxxx.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Inicia sesión con el email/password del paso 4

---

## Flujo de Uso

1. **Administrador** accede a `admin.html`
   - Configura puntos de marcación (ubicación GPS + radio permitido)
   - Agrega empleados manualmente o deja que se auto-registren
   - Genera códigos QR para cada punto

2. **Empleados** escanean el código QR
   - Se abre `marcar.html?punto=PUNTO_ID`
   - Verificación de ubicación GPS automática
   - Marcan entrada/salida con su DNI

---

## Límites del Plan Gratuito de Supabase

- 500 MB de base de datos
- 1 GB de transferencia/mes
- 50,000 usuarios autenticados/mes
- Ideal para empresas pequeñas/medianas

---

## Troubleshooting

### "Sistema no configurado"
- Abre `admin.html` primero y configura las credenciales de Supabase

### "No hay puntos configurados"
- Ve a admin.html > Puntos QR > Agregar Punto

### "Fuera del área permitida"
- El empleado está muy lejos del punto configurado
- Verifica las coordenadas y el radio en la configuración del punto

### Los códigos QR no funcionan
- Asegúrate de que la URL base sea correcta
- El formato es: `https://tudominio.com/marcar.html?punto=PUNTO_ID`
