-- ============================================================
-- NutriCESFAM — Supabase Schema Update V2 (OVERHAUL)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── BIOCHEMICAL RECORDS (Laboratorios) ──────────────────────
CREATE TABLE biochemical_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id),
  exam_date       TIMESTAMPTZ DEFAULT NOW(),
  
  -- Glucémico
  glucose_mg      SMALLINT,
  hba1c           NUMERIC(3,1),
  insulin_u       NUMERIC(5,2),
  homa_ir         NUMERIC(5,2),

  -- Lipídico
  total_chol      SMALLINT,
  hdl             SMALLINT,
  ldl             SMALLINT,
  triglycerides   SMALLINT,

  -- Renal / Hepático
  creatinine      NUMERIC(4,2),
  gfr             NUMERIC(5,1),
  ureic_nitrogen  SMALLINT,
  albumin         NUMERIC(3,1),
  sgot_ast        SMALLINT,
  sgpt_alt        SMALLINT,

  -- Otros
  hemoglobin      NUMERIC(3,1),
  ferritin        NUMERIC(6,1),
  tsh             NUMERIC(5,2),
  vitamin_d       NUMERIC(5,2),

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── LIFESTYLE RECORDS (Anamnesis Pro) ───────────────────────
CREATE TABLE lifestyle_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id),
  record_date       TIMESTAMPTZ DEFAULT NOW(),

  -- Hábitos
  sleep_hours       NUMERIC(3,1),
  sleep_quality     TEXT CHECK (sleep_quality IN ('excelente','buena','regular','mala')),
  stress_level      SMALLINT CHECK (stress_level BETWEEN 1 AND 10),
  physical_activity TEXT, -- Detallado
  
  -- Digestión
  bristol_scale     SMALLINT CHECK (bristol_scale BETWEEN 1 AND 7),
  bowel_frequency   TEXT,
  gas_bloating      BOOLEAN DEFAULT FALSE,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY V2 ──────────────────────────────────
ALTER TABLE biochemical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_records   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own biochemical" ON biochemical_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own lifestyle"   ON lifestyle_records   FOR ALL USING (auth.uid() = user_id);

-- ── INDEXES V2 ──────────────────────────────────────────────
CREATE INDEX idx_biochem_patient ON biochemical_records(patient_id);
CREATE INDEX idx_biochem_date    ON biochemical_records(exam_date DESC);
CREATE INDEX idx_lifestyle_patient ON lifestyle_records(patient_id);

-- ── UPDATE patients TABLE ──────────────────────────────────
-- Añadir campos para meta-información adicional si no existen
ALTER TABLE patients ADD COLUMN IF NOT EXISTS activity_level_id TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS target_weight NUMERIC(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS avatar_storage_path TEXT;

-- ── FUNCTION: get_patient_trends ────────────────────────────
-- Nueva función para obtener tendencias combinadas
CREATE OR REPLACE FUNCTION get_patient_trends(p_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'weight', (SELECT jsonb_agg(d) FROM (SELECT record_date, weight_kg FROM clinical_records WHERE patient_id=p_id ORDER BY record_date ASC) d),
    'glucose', (SELECT jsonb_agg(d) FROM (SELECT exam_date as record_date, glucose_mg FROM biochemical_records WHERE patient_id=p_id ORDER BY exam_date ASC) d),
    'hba1c', (SELECT jsonb_agg(d) FROM (SELECT exam_date as record_date, hba1c FROM biochemical_records WHERE patient_id=p_id ORDER BY exam_date ASC) d)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
