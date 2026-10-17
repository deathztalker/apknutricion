-- ============================================================
-- NutriCESFAM — Supabase Schema Update V4 (Missing Fields)
-- ============================================================

-- ── 1. ACTUALIZAR TABLA clinical_records ────────────────────
-- Añadir campos que estaban en el frontend pero faltaban en la BD
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS somatotype JSONB;
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS muscle_mass_kg NUMERIC(5,2);
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS knee_height_cm NUMERIC(4,1);
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS usual_weight_kg NUMERIC(5,2);
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS weight_loss_weeks SMALLINT;
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS professional_indications TEXT;
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS med_dose_mg_kg NUMERIC(6,3);
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS med_conc_mg_ml NUMERIC(6,3);

-- ── 2. ASEGURAR QUE LAS POLÍTICAS CUBRAN LOS NUEVOS CAMPOS ──
-- (Las políticas existentes para clinical_records ya deberían cubrir esto 
-- al usar ALL o ser relativas a user_id, pero refrescamos por seguridad si fuera necesario)
