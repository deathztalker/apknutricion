export interface Patient {
  id?: string;
  full_name: string;
  birth_date: string;
  sex: 'M' | 'F' | '';
  insurance: string;
}

export interface ClinicalRecord {
  id?: string;
  patient_id?: string;
  record_date?: string;
  weight_kg?: number;
  height_cm?: number;
  waist_cm?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  oxygen_sat?: number;
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
  pathologies?: string[];
  allergies?: string[];
  diet_type?: string;
  supplements?: string;
  observations?: string;
  macro_prot_pct?: number;
  macro_cho_pct?: number;
  macro_fat_pct?: number;
  ai_model?: string;
  
  // New fields for Overhaul
  vgs_status?: 'A' | 'B' | 'C'; // Valoración Global Subjetiva
  mna_score?: number;           // Mini Nutritional Assessment
  muscle_mass_kg?: number;      // For Cunningham
  somatotype?: { endo: number; meso: number; ecto: number };
}

export interface RecordFormData extends Partial<ClinicalRecord> {
  activity_factor?: string;
  fold_triceps?: string;
  fold_subscapular?: string;
  fold_supraspinal?: string;
  fold_abdominal?: string;
  knee_height?: string;
  usual_weight?: string;
  weight_loss_weeks?: string;
  // Overrides for parsing
  weight_kg?: any;
  height_cm?: any;
  waist_cm?: any;
  systolic_bp?: any;
  macro_prot_pct?: any;
  macro_cho_pct?: any;
  macro_fat_pct?: any;
  creatinine?: any;
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
  goals: string[];
  follow_up: string;
  raw_text: string;
}
