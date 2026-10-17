-- ============================================================
-- NutriCESFAM — Supabase Schema
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES (nutricionistas) ──────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT DEFAULT 'intern' CHECK (role IN ('intern','nutricionista','supervisor')),
  institution TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── PATIENTS ───────────────────────────────────────────────
CREATE TABLE patients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  rut             TEXT,
  birth_date      DATE,
  sex             CHAR(1) CHECK (sex IN ('M','F')),
  phone           TEXT,
  address         TEXT,
  commune         TEXT,
  insurance       TEXT DEFAULT 'FONASA' CHECK (insurance IN ('FONASA','ISAPRE','NINGUNA','OTRO')),
  notes           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── CLINICAL RECORDS ───────────────────────────────────────
CREATE TABLE clinical_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id),
  record_date       TIMESTAMPTZ DEFAULT NOW(),

  -- Antropometría
  weight_kg         NUMERIC(5,2),
  height_cm         NUMERIC(5,1),
  waist_cm          NUMERIC(5,1),
  hip_cm            NUMERIC(5,1),

  -- Pliegues Faulkner (mm)
  fold_triceps      NUMERIC(4,1),
  fold_subscapular  NUMERIC(4,1),
  fold_supraspinal  NUMERIC(4,1),
  fold_abdominal    NUMERIC(4,1),

  -- Calculados (server-side o client)
  bmi               NUMERIC(4,1),
  bmi_status        TEXT,
  ideal_weight      NUMERIC(5,2),
  fat_percent       NUMERIC(4,1),
  fat_mass_kg       NUMERIC(5,2),
  lean_mass_kg      NUMERIC(5,2),
  ict               NUMERIC(4,3),
  cv_risk           TEXT,

  -- Signos vitales
  systolic_bp       SMALLINT,
  diastolic_bp      SMALLINT,
  bp_status         TEXT,
  heart_rate        SMALLINT,
  temperature       NUMERIC(3,1),
  oxygen_sat        SMALLINT,

  -- Metabólico
  activity_factor   NUMERIC(3,2) DEFAULT 1.2,
  bmr_kcal          SMALLINT,
  tdee_kcal         SMALLINT,
  water_liters      NUMERIC(3,1),

  -- Macros (%)
  macro_prot_pct    SMALLINT DEFAULT 15,
  macro_cho_pct     SMALLINT DEFAULT 55,
  macro_fat_pct     SMALLINT DEFAULT 30,

  -- Laboratorio
  creatinine        NUMERIC(4,2),
  gfr               NUMERIC(5,1),
  kdigo_stage       TEXT,
  glucose_mg        SMALLINT,
  hba1c             NUMERIC(3,1),
  total_chol        SMALLINT,
  hdl               SMALLINT,
  ldl               SMALLINT,
  triglycerides     SMALLINT,
  hemoglobin        NUMERIC(3,1),
  ferritin          NUMERIC(6,1),
  albumin           NUMERIC(3,1),

  -- Anamnesis
  pathologies       TEXT[],
  allergies         TEXT[],
  diet_type         TEXT,
  liquid_intake     TEXT,
  digestion_status  TEXT,
  supplements       TEXT,
  observations      TEXT,

  -- IA
  ai_analysis       TEXT,
  ai_model          TEXT,
  ai_generated_at   TIMESTAMPTZ,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── MEAL PLANS ─────────────────────────────────────────────
CREATE TABLE meal_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id),
  record_id     UUID REFERENCES clinical_records(id),
  title         TEXT NOT NULL,
  total_kcal    SMALLINT,
  prot_g        NUMERIC(5,1),
  cho_g         NUMERIC(5,1),
  fat_g         NUMERIC(5,1),
  plan_json     JSONB NOT NULL DEFAULT '{}',
  notes         TEXT,
  start_date    DATE,
  end_date      DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI INTERACTIONS LOG ────────────────────────────────────
CREATE TABLE ai_interactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  patient_id    UUID REFERENCES patients(id),
  record_id     UUID REFERENCES clinical_records(id),
  prompt        TEXT NOT NULL,
  response      TEXT NOT NULL,
  model         TEXT DEFAULT 'claude-sonnet-4-20250514',
  tokens_used   INTEGER,
  interaction_type TEXT DEFAULT 'clinical_analysis',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions  ENABLE ROW LEVEL SECURITY;

-- Profiles: ver y editar el propio
CREATE POLICY "Own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- Patients: solo los propios del nutricionista
CREATE POLICY "Own patients" ON patients FOR ALL USING (auth.uid() = user_id);

-- Clinical records
CREATE POLICY "Own records" ON clinical_records FOR ALL USING (auth.uid() = user_id);

-- Meal plans
CREATE POLICY "Own meal plans" ON meal_plans FOR ALL USING (auth.uid() = user_id);

-- AI interactions
CREATE POLICY "Own ai" ON ai_interactions FOR ALL USING (auth.uid() = user_id);

-- ── INDEXES ────────────────────────────────────────────────
CREATE INDEX idx_patients_user      ON patients(user_id);
CREATE INDEX idx_patients_name      ON patients(full_name);
CREATE INDEX idx_records_patient    ON clinical_records(patient_id);
CREATE INDEX idx_records_date       ON clinical_records(record_date DESC);
CREATE INDEX idx_meal_patient       ON meal_plans(patient_id);

-- ── TRIGGER: updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_upd  BEFORE UPDATE ON profiles  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_upd  BEFORE UPDATE ON patients  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── FUNCTION: get_patient_summary ──────────────────────────
CREATE OR REPLACE FUNCTION get_patient_summary(p_id UUID)
RETURNS TABLE(
  visit_count     BIGINT,
  last_bmi        NUMERIC,
  last_bmi_status TEXT,
  last_kcal       SMALLINT,
  last_visit      TIMESTAMPTZ,
  bmi_trend       NUMERIC[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    (SELECT bmi FROM clinical_records WHERE patient_id=p_id ORDER BY record_date DESC LIMIT 1),
    (SELECT bmi_status FROM clinical_records WHERE patient_id=p_id ORDER BY record_date DESC LIMIT 1),
    (SELECT tdee_kcal FROM clinical_records WHERE patient_id=p_id ORDER BY record_date DESC LIMIT 1),
    (SELECT record_date FROM clinical_records WHERE patient_id=p_id ORDER BY record_date DESC LIMIT 1),
    ARRAY(SELECT bmi FROM clinical_records WHERE patient_id=p_id AND bmi IS NOT NULL ORDER BY record_date ASC LIMIT 6)
  FROM clinical_records WHERE patient_id=p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
