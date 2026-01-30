-- =====================================================
-- SISTEMA DE ASISTENCIA MANUELITA - SETUP SUPABASE
-- =====================================================
-- Ejecutar este SQL en: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. TABLA EMPLEADOS
CREATE TABLE IF NOT EXISTS empleados (
  dni VARCHAR(8) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  area VARCHAR(100) NOT NULL,
  fecha_registro TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA ASISTENCIAS
CREATE TABLE IF NOT EXISTS asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dni VARCHAR(8) NOT NULL REFERENCES empleados(dni) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
  fecha VARCHAR(10) NOT NULL,
  hora VARCHAR(8) NOT NULL,
  punto VARCHAR(100),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_dni_fecha ON asistencias(dni, fecha);

-- 3. TABLA PUNTOS QR
CREATE TABLE IF NOT EXISTS qr_points (
  id VARCHAR(100) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radio INTEGER DEFAULT 150,
  activo BOOLEAN DEFAULT TRUE,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA CONFIGURACIÓN
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL
);

-- 5. TABLA PERFILES DE USUARIO (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  rol VARCHAR(20) DEFAULT 'admin' CHECK (rol IN ('admin', 'super_admin')),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- EMPLEADOS: Lectura pública, escritura solo autenticados
CREATE POLICY "empleados_select" ON empleados FOR SELECT USING (true);
CREATE POLICY "empleados_insert" ON empleados FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "empleados_update" ON empleados FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "empleados_delete" ON empleados FOR DELETE USING (auth.role() = 'authenticated');

-- ASISTENCIAS: Lectura pública, inserción pública (para marcar), update/delete autenticados
CREATE POLICY "asistencias_select" ON asistencias FOR SELECT USING (true);
CREATE POLICY "asistencias_insert" ON asistencias FOR INSERT WITH CHECK (true);
CREATE POLICY "asistencias_update" ON asistencias FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "asistencias_delete" ON asistencias FOR DELETE USING (auth.role() = 'authenticated');

-- QR POINTS: Lectura pública, escritura solo autenticados
CREATE POLICY "qr_points_select" ON qr_points FOR SELECT USING (true);
CREATE POLICY "qr_points_insert" ON qr_points FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "qr_points_update" ON qr_points FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "qr_points_delete" ON qr_points FOR DELETE USING (auth.role() = 'authenticated');

-- SYSTEM CONFIG: Solo autenticados
CREATE POLICY "config_select" ON system_config FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "config_insert" ON system_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "config_update" ON system_config FOR UPDATE USING (auth.role() = 'authenticated');

-- USER PROFILES: Lectura para autenticados, escritura para super_admin
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND rol = 'super_admin')
);
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (
  id = auth.uid() OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND rol = 'super_admin')
);

-- 6. TABLA REGISTRO DE ACTIVIDADES (AUDITORÍA)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username VARCHAR(100),
  accion VARCHAR(50) NOT NULL,
  detalle TEXT,
  seccion VARCHAR(50),
  ip VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_accion ON audit_log(accion);

-- AUDIT LOG: Inserción para autenticados, lectura solo super_admin, sin update/delete
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND rol = 'super_admin')
  );

-- =====================================================
-- FUNCIÓN PARA CREAR USUARIO ADMIN INICIAL
-- =====================================================
-- NOTA: Después de crear el proyecto, crea un usuario manualmente:
-- 1. Ve a Authentication > Users > Add User
-- 2. Email: admin@tuempresa.com
-- 3. Password: (tu contraseña segura)
-- 4. Luego ejecuta este INSERT reemplazando el UUID:

-- INSERT INTO user_profiles (id, username, nombre, rol)
-- VALUES ('UUID-DEL-USUARIO-CREADO', 'admin', 'Administrador', 'super_admin');

-- =====================================================
-- CONFIGURACIÓN INICIAL (OPCIONAL)
-- =====================================================
INSERT INTO system_config (key, value) VALUES ('sheets_sync_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
