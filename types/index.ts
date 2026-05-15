export interface Patient {
  id?: string;
  full_name: string;
  age: number;
  birth_date: string;
  sex: 'M' | 'F' | '';
  insurance: string;
  rut?: string;
  phone?: string;
  address?: string;
  commune?: string;
  notes?: string;
  is_active?: boolean;
  activity_level_id?: string;
  target_weight?: number;
  avatar_storage_path?: string;
}

export interface ClinicalRecord {
  id?: string;
  patient_id?: string;
  user_id?: string;
  record_date?: string;
  weight_kg?: number;
  height_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
  
  // Pliegues
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

  // Macros (%)
  macro_prot_pct?: number;
  macro_cho_pct?: number;
  macro_fat_pct?: number;

  // Laboratorio (legacy/denormalized)
  glucose_mg?: number;
  hba1c?: number;
  total_chol?: number;
  hdl?: number;
  ldl?: number;
  triglycerides?: number;
  hemoglobin?: number;
  ferritin?: number;
  albumin?: number;
  creatinine?: number;
  gfr?: number;
  kdigo_stage?: string;

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
  
  // V2/V3 Additions
  vgs_status?: 'A' | 'B' | 'C'; // Valoración Global Subjetiva
  mna_score?: number;           // Mini Nutritional Assessment
  muscle_mass_kg?: number;      // For Cunningham
  somatotype?: { endo: number; meso: number; ecto: number };
  
  grip_strength_kg?: number;
  calf_circumference_cm?: number;
  knee_height_cm?: number;
  usual_weight_kg?: number;
  weight_loss_weeks?: number;
  med_dose_mg_kg?: number;
  med_conc_mg_ml?: number;
}

export interface RecordFormData extends Omit<Partial<ClinicalRecord>, 
  | 'weight_kg' | 'height_cm' | 'waist_cm' | 'systolic_bp' | 'diastolic_bp' 
  | 'macro_prot_pct' | 'macro_cho_pct' | 'macro_fat_pct' | 'creatinine'
  | 'fold_triceps' | 'fold_subscapular' | 'fold_supraspinal' | 'fold_abdominal'
  | 'activity_factor' | 'grip_strength_kg' | 'calf_circumference_cm'
  | 'knee_height_cm' | 'usual_weight_kg' | 'weight_loss_weeks'
> {
  activity_factor?: string;
  fold_triceps?: string;
  fold_subscapular?: string;
  fold_supraspinal?: string;
  fold_abdominal?: string;
  knee_height_cm?: string;
  usual_weight_kg?: string;
  weight_loss_weeks?: string;
  med_dose?: string;
  med_conc?: string;
  grip_strength_kg?: string;
  calf_circumference_cm?: string;
  // Overrides for parsing
  weight_kg?: string;
  height_cm?: string;
  waist_cm?: string;
  systolic_bp?: string;
  diastolic_bp?: string;
  macro_prot_pct?: string;
  macro_cho_pct?: string;
  macro_fat_pct?: string;
  creatinine?: string;

  // Diameter for somatotype (not in ClinicalRecord directly usually)
  diameter_humerus?: string;
  diameter_femur?: string;
  perimeter_arm?: string;
  perimeter_calf?: string;
}

export interface MacroResult {
  protG: number;
  choG: number;
  fatG: number;
  protGkg: number;
  choGkg: number;
  fatGkg: number;
}

export interface MealPlan {
  id?: string;
  patient_id: string;
  kcal_target: number;
  protein_target: number;
  cho_target: number;
  fat_target: number;
  portions: {
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
  notes?: string;
  created_at?: string;
}

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

export interface ClinicalAlert {
  severity: 'info' | 'warning' | 'danger';
  icon: string;
  title: string;
  description: string;
}

export interface AIAnalysis {
  summary: string;
  alerts: ClinicalAlert[];
  recommendations: string[];
  nutritional_diagnosis: string;
  metabolic_syndrome_risk?: string;
  renal_hepatic_profile?: string;
  pharmacological_interactions?: string;
  goals: string[];
  follow_up: string;
  raw_text: string;
}
