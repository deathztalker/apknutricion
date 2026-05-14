// utils/calculations.ts — Motor de Cálculos Clínicos MINSAL Chile
import { CalculationResult, MacroResult, RecordFormData } from '@/types';
import { COLORS } from '@/constants/theme';

const n = (v: string | undefined): number => parseFloat(v || '0') || 0;
const ni = (v: string | undefined): number => parseInt(v || '0') || 0;

// ── IMC ────────────────────────────────────────────────────
export function calcBMI(weight: number, height_cm: number): number | null {
  if (!weight || !height_cm) return null;
  const hm = height_cm / 100;
  return Math.round((weight / (hm * hm)) * 10) / 10;
}

export function bmiStatus(bmi: number, age: number): { status: string; color: string } {
  if (age < 18) return { status: 'Usar curvas OMS', color: COLORS.purple };

  if (age >= 65) {
    if (bmi < 23)  return { status: 'Bajo Peso', color: COLORS.sky };
    if (bmi < 28)  return { status: 'Normal ✓', color: COLORS.neon };
    if (bmi < 32)  return { status: 'Sobrepeso', color: COLORS.gold };
    return { status: 'Obesidad', color: COLORS.red };
  }

  if (bmi < 18.5) return { status: 'Bajo Peso', color: COLORS.sky };
  if (bmi < 25)   return { status: 'Normal ✓', color: COLORS.neon };
  if (bmi < 30)   return { status: 'Sobrepeso', color: COLORS.gold };
  if (bmi < 35)   return { status: 'Obesidad I', color: COLORS.red };
  if (bmi < 40)   return { status: 'Obesidad II', color: COLORS.red };
  return { status: 'Obesidad III', color: COLORS.red };
}

// ── Peso Ideal — Lorenz/Broca MINSAL ──────────────────────
export function calcIdealWeight(height_cm: number, sex: 'M' | 'F' | ''): number | null {
  if (!height_cm || !sex) return null;
  if (sex === 'M') return height_cm >= 152 ? 50 + 0.75 * (height_cm - 152) : height_cm - 100;
  return height_cm >= 152 ? 45.5 + 0.67 * (height_cm - 152) : height_cm - 105;
}

// Peso ajustado para obesidad (BEE Patterson)
export function calcAdjustedWeight(actual: number, ideal: number): number | null {
  if (!actual || !ideal || actual <= ideal) return null;
  return Math.round((ideal + 0.25 * (actual - ideal)) * 10) / 10;
}

// ── TMB — Mifflin-St Jeor (MINSAL recomendada) ────────────
export function calcBMR(weight: number, height_cm: number, age: number, sex: 'M' | 'F' | ''): number | null {
  if (!weight || !height_cm || !age || !sex) return null;
  const base = (10 * weight) + (6.25 * height_cm) - (5 * age);
  return Math.round(sex === 'M' ? base + 5 : base - 161);
}

// ── VCT ────────────────────────────────────────────────────
export function calcTDEE(bmr: number, activityFactor: number): number {
  return Math.round(bmr * activityFactor);
}

// ── Requerimiento Hídrico MINSAL ───────────────────────────
export function calcWater(weight: number, age: number): number | null {
  if (!weight) return null;
  const ml = age >= 65 ? weight * 30 : weight * 35;
  return Math.round(ml / 100) / 10;
}

// ── Macronutrientes ────────────────────────────────────────
export function calcMacros(kcal: number, protPct: number, choPct: number, fatPct: number, weight: number): MacroResult | null {
  if (!kcal || Math.abs(protPct + choPct + fatPct - 100) > 0.5) return null;
  const protG = Math.round(kcal * (protPct / 100) / 4);
  const choG  = Math.round(kcal * (choPct / 100) / 4);
  const fatG  = Math.round(kcal * (fatPct / 100) / 9);
  return {
    protG, choG, fatG,
    protGkg: weight ? Math.round((protG / weight) * 10) / 10 : 0,
    choGkg:  weight ? Math.round((choG  / weight) * 10) / 10 : 0,
    fatGkg:  weight ? Math.round((fatG  / weight) * 10) / 10 : 0,
  };
}

// ── Cintura / Riesgo CV — MINSAL 2023 ─────────────────────
export function calcCVRisk(waist: number, sex: 'M' | 'F' | ''): { risk: string; color: string } | null {
  if (!waist || !sex) return null;
  if (sex === 'F') {
    if (waist < 80)  return { risk: 'Sin riesgo', color: COLORS.neon };
    if (waist < 88)  return { risk: 'Riesgo aumentado', color: COLORS.gold };
    return { risk: 'Riesgo alto', color: COLORS.red };
  }
  if (waist < 94)  return { risk: 'Sin riesgo', color: COLORS.neon };
  if (waist < 102) return { risk: 'Riesgo aumentado', color: COLORS.gold };
  return { risk: 'Riesgo alto', color: COLORS.red };
}

// ── ICT (Índice Cintura-Talla) ─────────────────────────────
export function calcICT(waist: number, height_cm: number): number | null {
  if (!waist || !height_cm) return null;
  return Math.round((waist / height_cm) * 1000) / 1000;
}

// ── Presión Arterial — ESC/ESH 2023 / MINSAL ──────────────
export function bpStatus(pas: number, pad: number): { status: string; color: string } {
  if (!pas || !pad) return { status: '—', color: COLORS.muted };
  if (pas < 90 || pad < 60)   return { status: 'Hipotensión', color: COLORS.sky };
  if (pas < 120 && pad < 80)  return { status: 'Óptima ✓', color: COLORS.neon };
  if (pas < 130 && pad < 85)  return { status: 'Normal', color: COLORS.neon };
  if (pas < 140 && pad < 90)  return { status: 'Normal Alta', color: COLORS.gold };
  if (pas < 160 && pad < 100) return { status: 'HTA Grado 1', color: COLORS.red };
  if (pas < 180 && pad < 110) return { status: 'HTA Grado 2', color: COLORS.red };
  return { status: 'HTA Grado 3 / Crisis', color: COLORS.red };
}

// ── Composición Corporal — Faulkner 1983 ──────────────────
export function calcFaulkner(tri: number, sub: number, sup: number, abd: number, weight: number, sex: 'M' | 'F' | '') {
  if (!tri || !sub || !sup || !abd || !weight) return null;
  const sigma = tri + sub + sup + abd;
  const fatPct = Math.round((sigma * 0.153 + 5.783) * 10) / 10;
  const fatMass = Math.round(weight * (fatPct / 100) * 10) / 10;
  const leanMass = Math.round((weight - fatMass) * 10) / 10;

  let category = '';
  if (sex === 'M') {
    category = fatPct < 13 ? 'Atlético' : fatPct < 18 ? 'Fitness' : fatPct < 25 ? 'Aceptable' : 'Obesidad';
  } else if (sex === 'F') {
    category = fatPct < 20 ? 'Atlético' : fatPct < 25 ? 'Fitness' : fatPct < 32 ? 'Aceptable' : 'Obesidad';
  }

  return { sigma, fatPct, fatMass, leanMass, category };
}

// ── TFG — Cockcroft-Gault / KDIGO 2022 ────────────────────
export function calcGFR(creatinine: number, age: number, weight: number, sex: 'M' | 'F' | '') {
  if (!creatinine || !age || !weight || !sex) return null;
  let gfr = ((140 - age) * weight) / (72 * creatinine);
  if (sex === 'F') gfr *= 0.85;
  gfr = Math.round(gfr * 10) / 10;

  let stage = '';
  let color = COLORS.neon;
  if (gfr >= 90)       { stage = 'G1 — Normal'; color = COLORS.neon; }
  else if (gfr >= 60)  { stage = 'G2 — Leve'; color = COLORS.neon; }
  else if (gfr >= 45)  { stage = 'G3a — Mod-Leve'; color = COLORS.gold; }
  else if (gfr >= 30)  { stage = 'G3b — Mod-Grave'; color = COLORS.gold; }
  else if (gfr >= 15)  { stage = 'G4 — Grave'; color = COLORS.red; }
  else                  { stage = 'G5 — Falla Renal'; color = COLORS.red; }

  return { gfr, stage, color };
}

// ── Talla Estimada — Chumlea 1985 ─────────────────────────
export function calcChumlea(kneeHeight: number, age: number, sex: 'M' | 'F' | ''): number | null {
  if (!kneeHeight || !age || !sex) return null;
  if (sex === 'M') return Math.round((64.19 - (0.04 * age) + (2.02 * kneeHeight)) * 10) / 10;
  return Math.round((84.88 - (0.24 * age) + (1.83 * kneeHeight)) * 10) / 10;
}

// ── Pérdida de Peso (Screening) ────────────────────────────
export function calcWeightLoss(usual: number, current: number, weeks: number) {
  if (!usual || !current || usual <= current) return null;
  const pct = Math.round(((usual - current) / usual) * 1000) / 10;
  const kgPerWeek = weeks > 0 ? Math.round(((usual - current) / weeks) * 100) / 100 : null;

  let risk = '';
  let color = COLORS.neon;
  if (pct < 5)        { risk = 'Bajo'; color = COLORS.neon; }
  else if (pct < 10)  { risk = 'Moderado ⚠️'; color = COLORS.gold; }
  else                 { risk = 'Severo 🚨'; color = COLORS.red; }

  return { pct, kgPerWeek, risk, color };
}

// ── Laboratorio: clasificación ─────────────────────────────
export function labStatus(value: number | null | undefined, ranges: { low?: number; high?: number; optLow?: number; optHigh?: number }): { status: string; color: string } {
  if (!value) return { status: '—', color: COLORS.muted };
  const { low, high, optLow, optHigh } = ranges;
  if (low !== undefined && value < low)   return { status: 'Bajo', color: COLORS.sky };
  if (high !== undefined && value > high) return { status: 'Alto', color: COLORS.red };
  if (optLow !== undefined && optHigh !== undefined && value >= optLow && value <= optHigh) return { status: 'Óptimo ✓', color: COLORS.neon };
  return { status: 'Aceptable', color: COLORS.gold };
}

export const LAB_RANGES = {
  glucose:      { low: 70, high: 100, optLow: 70, optHigh: 99 },
  hba1c:        { high: 5.7 },
  total_chol:   { high: 200 },
  hdl_f:        { low: 50 },
  hdl_m:        { low: 40 },
  ldl:          { high: 100 },
  triglycerides:{ high: 150 },
  hemoglobin_f: { low: 12 },
  hemoglobin_m: { low: 13 },
  albumin:      { low: 3.5, optLow: 3.5, optHigh: 5.0 },
};

// ── MASTER CALCULATOR ──────────────────────────────────────
export function calculateAll(form: Partial<RecordFormData>, age: number, sex: 'M' | 'F' | ''): CalculationResult {
  const w    = n(form.weight_kg);
  const h    = n(form.height_cm);
  const waist= n(form.waist_cm);
  const act  = n(form.activity_factor) || 1.2;
  const pas  = ni(form.systolic_bp);
  const pad  = ni(form.diastolic_bp);
  const crea = n(form.creatinine);
  const pp   = ni(form.macro_prot_pct) || 15;
  const pc   = ni(form.macro_cho_pct) || 55;
  const pl   = ni(form.macro_fat_pct) || 30;
  const knee = n(form.knee_height);
  const uw   = n(form.usual_weight);
  const lwks = ni(form.weight_loss_weeks);

  const bmi    = calcBMI(w, h);
  const bmiSt  = bmi && age ? bmiStatus(bmi, age) : null;
  const ideal  = calcIdealWeight(h, sex);
  const adj    = bmi && bmi >= 30 && ideal ? calcAdjustedWeight(w, ideal) : null;
  const bmr    = calcBMR(w, h, age, sex);
  const tdee   = bmr ? calcTDEE(bmr, act) : null;
  const water  = calcWater(w, age);
  const cv     = calcCVRisk(waist, sex);
  const ict    = calcICT(waist, h);
  const bp     = pas && pad ? bpStatus(pas, pad) : null;
  const faulk  = calcFaulkner(n(form.fold_triceps), n(form.fold_subscapular), n(form.fold_supraspinal), n(form.fold_abdominal), w, sex);
  const gfr    = calcGFR(crea, age, w, sex);
  const estH   = calcChumlea(knee, age, sex);
  const wLoss  = calcWeightLoss(uw, w, lwks);
  const macros = tdee ? calcMacros(tdee, pp, pc, pl, w) : null;

  return {
    bmi,
    bmiStatus: bmiSt?.status ?? null,
    bmiColor: bmiSt?.color ?? COLORS.muted,
    idealWeight: ideal ? Math.round(ideal * 10) / 10 : null,
    adjustedWeight: adj,
    bmr,
    tdee,
    waterLiters: water,
    cvRisk: cv?.risk ?? null,
    ict,
    bpStatus: bp?.status ?? null,
    bpColor: bp?.color ?? COLORS.muted,
    fatPercent: faulk?.fatPct ?? null,
    fatMassKg: faulk?.fatMass ?? null,
    leanMassKg: faulk?.leanMass ?? null,
    foldSum: faulk?.sigma ?? null,
    gfr: gfr?.gfr ?? null,
    kdigoStage: gfr?.stage ?? null,
    estimatedHeight: estH,
    weightLossPct: wLoss?.pct ?? null,
    weightLossRisk: wLoss?.risk ?? null,
    macros,
  };
}

// ── Edad desde fecha ────────────────────────────────────────
export function calcAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Formato ─────────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}
