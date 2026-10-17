-- ============================================================
-- NutriCESFAM — Supabase Schema Update V3
-- Ejecutar en Supabase SQL Editor o a través de 'supabase db push'
-- ============================================================

-- ── 1. ACTUALIZAR TABLA clinical_records ────────────────────
-- Añadir campos para medición de Sarcopenia y Riesgo Nutricional (MNA)
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS grip_strength_kg NUMERIC(4,1);
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS calf_circumference_cm NUMERIC(4,1);
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS mna_score NUMERIC(4,1);
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS vgs_status VARCHAR(1) CHECK (vgs_status IN ('A', 'B', 'C'));

-- ── 2. ACTUALIZAR TABLA biochemical_records ─────────────────
-- Añadir Ácido Úrico
ALTER TABLE biochemical_records ADD COLUMN IF NOT EXISTS uric_acid NUMERIC(4,1);
