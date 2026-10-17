// types/index.ts — NutriCESFAM Integrado

// ── Auth / Profile ─────────────────────────────────────────
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'intern' | 'nutricionista' | 'supervisor';
  institution?: string;
  avatar_url?: string;
  created_at: string;
}

// ── Patient ────────────────────────────────────────────────
export interface Patient {
  id?: string;
  user_id?: string;
  full_name: string;
  rut?: string;
  birth_date?: string;
  age: number;
  sex: 'M' | 'F' | '';
  phone?: string;
  address?: string;
  commune?: string;
  insurance: string;
  notes?: string;
  is_active?: boolean;
  avatar_storage_path?: string;
  created_at?: string;
  updated_at?: string;
  
  // computed/extra
  visit_count?: number;
  last_bmi?: number;
  last_bmi_status?: string;
  last_visit?: string;
}

// ── Clinical Record ────────────────────────────────────────
export interface ClinicalRecord {
  id?: string;
  patient_id?: string;
  user_id?: string;
  record_date?: string;

  // Antropometría
  weight_kg?: number;
  height_cm?: number;
  waist_cm?: number;
  hip_cm?: number;

  // Pliegues Faulkner
  fold_triceps?: number;
  fold_subscapular?: number;
  fold_supraspinal?: number;
  fold_abdominal?: number;

  // Calculados
  bmi?: number;
  bmi_status?: string;
  ideal_weight?: number;
  fat_percent?: number;
  fat_mass_kg?: number;
  lean_mass_kg?: number;
  ict?: number;
  cv_risk?: string;

  // Signos vitales
  systolic_bp?: number;
  diastolic_bp?: number;
  bp_status?: string;
  heart_rate?: number;
  temperature?: number;
  oxygen_sat?: number;

  // Metabólico
  activity_factor?: number;
  bmr_kcal?: number;
  tdee_kcal?: number;
  water_liters?: number;

  // Macros
  macro_prot_pct?: number;
  macro_cho_pct?: number;
  macro_fat_pct?: number;

  // Laboratorio
  creatinine?: number;
  gfr?: number;
  kdigo_stage?: string;
  glucose_mg?: number;
  hba1c?: number;
  total_chol?: number;
  hdl?: number;
  ldl?: number;
  triglycerides?: number;
  hemoglobin?: number;
  ferritin?: number;
  albumin?: number;

  // Anamnesis
  pathologies?: string[];
  allergies?: string[];
  diet_type?: string;
  liquid_intake?: string;
  digestion_status?: string;
  supplements?: string;
  observations?: string;

  // IA
  ai_analysis?: string;
  ai_model?: string;
  ai_generated_at?: string;

  // V2/V3 / Sports Additions
  vgs_status?: 'A' | 'B' | 'C';
  mna_score?: number;
  muscle_mass_kg?: number;
  somatotype?: { endo: number; meso: number; ecto: number; x?: number; y?: number };
  
  grip_strength_kg?: number;
  calf_circumference_cm?: number;
  knee_height_cm?: number;
  usual_weight_kg?: number;
  weight_loss_weeks?: number;
  med_dose_mg_kg?: number;
  med_conc_mg_ml?: number;
  professional_indications?: string;
  
  created_at?: string;
}

// ── Meal Plan ──────────────────────────────────────────────
export interface MealPlan {
  id?: string;
  patient_id: string;
  record_id?: string;
  title?: string;
  kcal_target?: number;
  protein_target?: number;
  cho_target?: number;
  fat_target?: number;
  portions?: {
    dairy_low_fat: number;
    dairy_high_fat: number;
    meat_low_fat: number;
    meat_med_fat: number;
    meat_high_fat: number;
    legumes: number;
    cereals_no_fat: number;
    cereals_fat: number;
    vegetables_general: number;
    vegetables_free: number;
    fruits: number;
    fats_no_cho: number;
    fats_cho: number;
    sugar: number;
  };
  plan_json?: MealPlanDay[];
  notes?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export interface MealPlanDay {
  day: string;
  meals: Meal[];
}

export interface Meal {
  name: string;
  time?: string;
  foods: Food[];
}

export interface Food {
  name: string;
  quantity_g: number;
  kcal: number;
  prot_g?: number;
  cho_g?: number;
  fat_g?: number;
}

// ── Clinical Calculations ──────────────────────────────────
export interface CalculationResult {
  bmi: number | null;
  bmiStatus: string | null;
  bmiColor: string;
  idealWeight: number | null;
  adjustedWeight: number | null;
  bmr: number | null;
  bmrCunningham?: number | null;
  tdee: number | null;
  waterLiters: number | null;
  cvRisk: string | null;
  cvColor: string;
  ict: number | null;
  bpStatus: string | null;
  bpColor: string;
  fatPercent: number | null;
  fatMassKg: number | null;
  leanMassKg: number | null;
  foldSum: number | null;
  gfr: number | null;
  kdigoStage: string | null;
  estimatedHeight: number | null;
  weightLossPct: number | null;
  weightLossRisk: string | null;
  macros: MacroResult | null;
  somatotype?: { endo: number; meso: number; ecto: number; x: number; y: number } | null;
  sarcopeniaRisk?: string | null;
}

export interface MacroResult {
  protG: number;
  choG: number;
  fatG: number;
  protGkg: number;
  choGkg: number;
  fatGkg: number;
}

// ── AI Analysis ────────────────────────────────────────────
export interface AIAnalysis {
  summary: string;
  alerts: ClinicalAlert[];
  recommendations: string[];
  nutritional_diagnosis: string;
  metabolic_syndrome_risk?: string;
  renal_hepatic_profile?: string;
  pharmacological_interactions?: string;
  goals: string[];
  meal_plan_hints?: string;
  education_topics?: string[];
  follow_up: string;
  raw_text: string;
}

export interface ClinicalAlert {
  severity: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
  icon: string;
}

// ── Form State ─────────────────────────────────────────────
export interface RecordFormData {
  weight_kg: string;
  height_cm: string;
  waist_cm: string;
  hip_cm: string;

  fold_triceps: string;
  fold_subscapular: string;
  fold_supraspinal: string;
  fold_abdominal: string;

  systolic_bp: string;
  diastolic_bp: string;
  heart_rate: string;
  temperature: string;
  oxygen_sat: string;

  activity_factor: string;
  macro_prot_pct: string;
  macro_cho_pct: string;
  macro_fat_pct: string;

  creatinine: string;
  glucose_mg: string;
  hba1c: string;
  total_chol: string;
  hdl: string;
  ldl: string;
  triglycerides: string;
  hemoglobin: string;
  albumin: string;
  ferritin: string;

  pathologies: string[];
  allergies: string[];
  diet_type: string;
  liquid_intake: string;
  digestion_status: string;
  supplements: string;
  observations: string;

  knee_height_cm: string;
  usual_weight_kg: string;
  weight_loss_weeks: string;
  
  m_kcal?: string;
  med_dose?: string;
  med_conc?: string;
  grip_strength_kg: string;
  calf_circumference_cm: string;
  
  diameter_humerus?: string;
  diameter_femur?: string;
  perimeter_arm?: string;
  perimeter_calf?: string;
  
  mna_score?: number;
  vgs_status?: 'A' | 'B' | 'C';
  muscle_mass_kg?: string;
  professional_indications?: string;
}

export interface PatientFormData {
  full_name: string;
  rut: string;
  birth_date: string;
  sex: 'M' | 'F' | '';
  phone: string;
  commune: string;
  insurance: string;
  notes: string;
}
