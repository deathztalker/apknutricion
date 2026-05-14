-- ============================================================
-- NutriCESFAM — Supabase Storage & RLS Update
-- Ejecutar en Supabase SQL Editor o a través de 'supabase db push'
-- ============================================================

-- ── 1. STORAGE BUCKET ───────────────────────────────────────
-- Crear el bucket 'avatars' para las fotos de los pacientes/usuarios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS en la tabla de objetos de Storage si no está habilitada
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- (Comentado para evitar error de owner en Supabase Cloud)

-- ── 2. STORAGE RLS POLICIES ─────────────────────────────────
-- Permitir lectura pública (Cualquier usuario de la app puede ver los avatares)
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
CREATE POLICY "Avatar Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Permitir a usuarios autenticados subir avatares en su propia carpeta (UID)
DROP POLICY IF EXISTS "Avatar Upload for Authenticated Users" ON storage.objects;
CREATE POLICY "Avatar Upload for Authenticated Users" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir actualizar avatares propios
DROP POLICY IF EXISTS "Avatar Update for Authenticated Users" ON storage.objects;
CREATE POLICY "Avatar Update for Authenticated Users" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir eliminar avatares propios
DROP POLICY IF EXISTS "Avatar Delete for Authenticated Users" ON storage.objects;
CREATE POLICY "Avatar Delete for Authenticated Users" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ── 3. REVISIÓN Y REFUERZO DE RLS (Biochemical & Lifestyle) ──
-- Asegurar que las políticas FOR ALL creadas anteriormente protejan las inserciones y modificaciones correctamente.
-- Las políticas de la V2 ya incluyen "USING (auth.uid() = user_id)" que funciona para todo (CRUD).
-- Añadimos la cláusula explícita WITH CHECK para mayor robustez en inserciones y actualizaciones.

DROP POLICY IF EXISTS "Own biochemical" ON biochemical_records;
CREATE POLICY "Own biochemical" ON biochemical_records 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own lifestyle" ON lifestyle_records;
CREATE POLICY "Own lifestyle" ON lifestyle_records 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
