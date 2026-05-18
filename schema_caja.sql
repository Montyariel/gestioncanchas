-- 1. ESTRUCTURA DE USUARIOS Y ROLES
CREATE TYPE user_role AS ENUM ('empleado', 'encargado', 'dueño');

CREATE TABLE perfiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol user_role DEFAULT 'empleado',
  sucursal_id TEXT -- 'lanus' o 'belgrano', puede ser nulo para el dueño general
);

-- 2. LÓGICA DE APERTURA Y CIERRE DE CAJA
CREATE TABLE sesiones_caja (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users, -- Quién abrió la caja
  sucursal TEXT NOT NULL,
  fecha_apertura TIMESTAMPTZ DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ,
  monto_inicial NUMERIC NOT NULL,
  monto_final_esperado NUMERIC,
  monto_final_real NUMERIC,
  diferencia NUMERIC,
  estado TEXT DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada'))
);

-- 3. MOVIMIENTOS DE CAJA (El "Libro Diario")
CREATE TABLE movimientos_caja (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sesion_id UUID REFERENCES sesiones_caja(id),
  tipo TEXT CHECK (tipo IN ('ingreso', 'egreso')),
  categoria TEXT, -- ej. 'Venta Buffet', 'Alquiler Cancha', 'Limpieza', 'Adelanto Sueldo'
  monto NUMERIC NOT NULL,
  descripcion TEXT,
  creado_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración de seguridad RLS (Level Security) básica para lectura
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;

-- Por el momento, permitimos acceso completo a todas las tablas para facilitar el desarrollo, 
-- pero ya sentamos las bases para restringir por rol más adelante.
CREATE POLICY "Public profiles" ON perfiles FOR ALL USING (true);
CREATE POLICY "Public sesiones" ON sesiones_caja FOR ALL USING (true);
CREATE POLICY "Public movimientos" ON movimientos_caja FOR ALL USING (true);
