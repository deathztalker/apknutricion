// lib/ai.ts — Motor IA Clínica: Gemini 1.5 Flash + Reglas MINSAL Chile
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClinicalRecord, Patient, AIAnalysis, ClinicalAlert, CalculationResult } from '@/types';
import { COLORS } from '@/constants/theme';

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// ══════════════════════════════════════════════════════════
// REGLAS CLÍNICAS HARDCODEADAS — MINSAL Chile 2024
// Siempre disponibles offline, sin API key
// ══════════════════════════════════════════════════════════
export function generateRuleBasedAlerts(
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  age: number,
  sex: 'M' | 'F' | ''
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ── IMC ────────────────────────────────────────────────
  if (calc.bmi !== null && calc.bmi !== undefined) {
    if (calc.bmi < 18.5)
      alerts.push({ severity: 'warning', icon: '⚖️', title: 'Bajo Peso',
        description: `IMC ${calc.bmi} — Riesgo de desnutrición. Evaluar causa e indicadores bioquímicos (albúmina, Hb).` });
    if (calc.bmi >= 30 && calc.bmi < 35)
      alerts.push({ severity: 'warning', icon: '🔶', title: 'Obesidad I',
        description: `IMC ${calc.bmi} — Plan hipocalórico con déficit 500–750 kcal/día. Evaluar comorbilidades.` });
    if (calc.bmi >= 35)
      alerts.push({ severity: 'danger', icon: '🚨', title: 'Obesidad II–III',
        description: `IMC ${calc.bmi} — Derivar a equipo multidisciplinario. Evaluar criterios bariátricos GES.` });
  }

  // ── Riesgo CV / Cintura ────────────────────────────────
  if (calc.cvRisk === 'Riesgo alto')
    alerts.push({ severity: 'danger', icon: '❤️', title: 'Riesgo CV Alto',
      description: 'Cintura elevada. Reducción de grasa visceral: dieta mediterránea + AF ≥150 min/sem.' });
  if (calc.ict !== null && calc.ict !== undefined && calc.ict >= 0.5)
    alerts.push({ severity: 'warning', icon: '📏', title: `ICT Elevado (${calc.ict})`,
      description: 'ICT ≥ 0.5 indica adiposidad abdominal con riesgo cardiometabólico.' });

  // ── HTA ─────────────────────────────────────────────────
  if (record.systolic_bp && record.systolic_bp >= 140)
    alerts.push({ severity: 'danger', icon: '💉', title: 'HTA Confirmada',
      description: `PA ${record.systolic_bp}/${record.diastolic_bp} mmHg. Dieta DASH: Na <2g/día, ↑K, ↑Mg.` });
  else if (record.systolic_bp && record.systolic_bp >= 130)
    alerts.push({ severity: 'warning', icon: '💉', title: 'Presión Normal Alta',
      description: `PA ${record.systolic_bp}/${record.diastolic_bp} mmHg. Intervención preventiva DASH.` });

  // ── Grasa corporal ──────────────────────────────────────
  if (calc.fatPercent !== null && calc.fatPercent !== undefined) {
    const lim = sex === 'F' ? 32 : 25;
    if (calc.fatPercent > lim)
      alerts.push({ severity: 'warning', icon: '🧬', title: 'Exceso % Grasa',
        description: `% grasa ${calc.fatPercent}% > límite (${lim}%). PRO ≥1.2 g/kg + resistencia.` });
  }

  // ── Glucosa / DM ─────────────────────────────────────────
  if (record.glucose_mg) {
    if (record.glucose_mg >= 126)
      alerts.push({ severity: 'danger', icon: '🩸', title: 'Glucemia: Diabetes',
        description: `Glucosa ${record.glucose_mg} mg/dL. Restricción HC simples, IG bajo, 5–6 tiempos.` });
    else if (record.glucose_mg >= 100)
      alerts.push({ severity: 'warning', icon: '🩸', title: 'Prediabetes',
        description: `Glucosa ${record.glucose_mg} mg/dL. ↓HC simples, ↑fibra, AF ≥150 min/sem.` });
  }
  if (record.hba1c && record.hba1c >= 6.5)
    alerts.push({ severity: 'danger', icon: '📊', title: 'HbA1c Elevada',
      description: `HbA1c ${record.hba1c}% — Control deficiente. Meta <7% (individualizar AM).` });

  // ── Lípidos ──────────────────────────────────────────────
  if (record.total_chol && record.total_chol > 200)
    alerts.push({ severity: 'warning', icon: '🫀', title: 'Hipercolesterolemia',
      description: `CT ${record.total_chol} mg/dL. ↓Grasas sat/trans, ↑omega-3, ↑fibra soluble.` });
  if (record.ldl && record.ldl > 100)
    alerts.push({ severity: 'warning', icon: '🫀', title: 'LDL Elevado',
      description: `LDL ${record.ldl} mg/dL. Grasas sat <7% VCT. ↑AOVE, frutos secos.` });
  if (record.triglycerides && record.triglycerides > 150)
    alerts.push({ severity: 'warning', icon: '🫀', title: 'Hipertrigliceridemia',
      description: `TG ${record.triglycerides} mg/dL. ↓Azúcares simples y alcohol.` });

  // ── Anemia ────────────────────────────────────────────────
  if (record.hemoglobin) {
    const limHb = sex === 'F' ? 12 : 13;
    if (record.hemoglobin < limHb)
      alerts.push({ severity: 'warning', icon: '🩸', title: 'Anemia Probable',
        description: `Hb ${record.hemoglobin} g/dL. ↑hierro hem + vit C. Evaluar ferritina.` });
  }

  // ── Albúmina ──────────────────────────────────────────────
  if (record.albumin && record.albumin < 3.5)
    alerts.push({ severity: 'danger', icon: '⚠️', title: 'Hipoalbuminemia',
      description: `Albúmina ${record.albumin} g/dL. Desnutrición proteica. PRO 1.2–1.5 g/kg.` });

  // ── Función Renal ─────────────────────────────────────────
  if (calc.kdigoStage && !calc.kdigoStage.startsWith('G1') && !calc.kdigoStage.startsWith('G2')) {
    const prot = calc.kdigoStage.startsWith('G4') || calc.kdigoStage.startsWith('G5') ? '0.6–0.8' : '0.8–1.0';
    alerts.push({ severity: 'danger', icon: '🫘', title: `ERC ${calc.kdigoStage}`,
      description: `TFG ${calc.gfr} ml/min. PRO ${prot} g/kg/día. Control P, K, Na. Derivar nefrología.` });
  }

  // ── Pérdida de peso ───────────────────────────────────────
  if (calc.weightLossRisk?.includes('Severo'))
    alerts.push({ severity: 'danger', icon: '📉', title: 'Pérdida de Peso Severa',
      description: 'Pérdida >10% peso corporal. Evaluar causa y soporte nutricional especializado.' });

  if (alerts.length === 0 && calc.bmi !== null)
    alerts.push({ severity: 'info', icon: '✅', title: 'Parámetros Adecuados',
      description: 'Indicadores dentro de rangos normales según criterios MINSAL Chile.' });

  return alerts;
}

// ══════════════════════════════════════════════════════════
// GEMINI — Análisis Narrativo Profundo
// ══════════════════════════════════════════════════════════
function buildPrompt(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  alerts: ClinicalAlert[]
): string {
  return `Eres una nutricionista clínica chilena experta. Analiza este caso y responde SOLO con JSON válido sin markdown.

PACIENTE: ${patient.full_name || 'Paciente'} | ${patient.sex === 'F' ? 'Femenino' : 'Masculino'} | Previsión: ${patient.insurance || 'FONASA'}
IMC: ${calc.bmi || '—'} (${calc.bmiStatus || '—'}) | Peso: ${record.weight_kg || '—'} kg | Talla: ${record.height_cm || '—'} cm
Cintura: ${record.waist_cm || '—'} cm | ICT: ${calc.ict || '—'} | Riesgo CV: ${calc.cvRisk || '—'}
% Grasa: ${calc.fatPercent || '—'}% | Masa magra: ${calc.leanMassKg || '—'} kg
TMB: ${calc.bmr || '—'} kcal | VCT: ${calc.tdee || '—'} kcal | Agua: ${calc.waterLiters || '—'} L/día
PRO: ${calc.macros?.protG || '—'}g | CHO: ${calc.macros?.choG || '—'}g | LIP: ${calc.macros?.fatG || '—'}g
PA: ${record.systolic_bp || '—'}/${record.diastolic_bp || '—'} mmHg (${calc.bpStatus || '—'})
Glucosa: ${record.glucose_mg || '—'} | HbA1c: ${record.hba1c || '—'}% | CT: ${record.total_chol || '—'} | LDL: ${record.ldl || '—'} | TG: ${record.triglycerides || '—'}
Hb: ${record.hemoglobin || '—'} | Albúmina: ${record.albumin || '—'} | TFG: ${calc.gfr || '—'} (${calc.kdigoStage || '—'})
Patologías: ${record.pathologies?.join(', ') || '—'} | Dieta: ${record.diet_type || '—'}
Alertas: ${alerts.map(a => `[${a.severity}] ${a.title}`).join(' | ')}

JSON exacto requerido:
{"nutritional_diagnosis":"string","summary":"string 3-4 oraciones","recommendations":["r1","r2","r3","r4","r5"],"goals":["meta SMART 1","meta 2","meta 3"],"meal_plan_hints":"string","follow_up":"string","education_topics":["t1","t2","t3"]}`;
}

export async function analyzeWithGemini(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult
): Promise<AIAnalysis> {
  const age = patient.birth_date
    ? Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    : (patient.age || 0);
  const ruleAlerts = generateRuleBasedAlerts(record, calc, age, patient.sex || '');

  if (GEMINI_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(buildPrompt(patient, record, calc, ruleAlerts));
      const rawText = result.response.text();
      const clean = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return {
        summary: parsed.summary || '',
        alerts: ruleAlerts,
        recommendations: parsed.recommendations || [],
        nutritional_diagnosis: parsed.nutritional_diagnosis || '',
        goals: parsed.goals || [],
        follow_up: parsed.follow_up || '',
        raw_text: rawText,
      };
    } catch (err) {
      console.warn('Gemini falló, usando reglas:', err);
    }
  }

  return buildRuleBasedAnalysis(patient, record, calc, ruleAlerts);
}

function buildRuleBasedAnalysis(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  alerts: ClinicalAlert[]
): AIAnalysis {
  const bmi = calc.bmi;
  let diag = `Paciente de sexo ${patient.sex === 'F' ? 'femenino' : 'masculino'}`;
  if (bmi) diag += ` con ${calc.bmiStatus?.toLowerCase() || 'estado nutricional evaluado'}`;
  if (calc.cvRisk === 'Riesgo alto') diag += ', riesgo cardiovascular elevado';
  diag += '. Requiere intervención nutricional personalizada según MINSAL.';

  let summary = 'Estado nutricional evaluado. ';
  if (bmi && bmi >= 25) summary += `Exceso de peso (IMC ${bmi}), factor de riesgo cardiometabólico. `;
  else if (bmi && bmi < 18.5) summary += `Bajo peso (IMC ${bmi}), posible déficit nutricional. `;
  else if (bmi) summary += `IMC en rango normal (${bmi}). `;
  if (calc.tdee) summary += `Requerimiento energético: ${calc.tdee} kcal/día. `;
  summary += 'Se recomienda seguimiento y adherencia al plan.';

  const recs = [
    bmi && bmi >= 25
      ? `Déficit calórico 500 kcal/día (${(calc.tdee || 2000) - 500} kcal/día) para pérdida gradual`
      : 'Mantener aporte calórico actual con distribución equilibrada',
    'Fraccionamiento en 5–6 comidas para glucemia estable',
    '5 porciones de frutas y verduras diarias (Guías MINSAL Chile)',
    `Ingesta hídrica de ${calc.waterLiters || 2} L de agua al día`,
    'Reducir ultraprocesados y alimentos con sellos de advertencia',
    calc.cvRisk !== 'Sin riesgo' ? 'AF aeróbica ≥150 min/semana (OMS/MINSAL)' : 'Mantener actividad física regular',
  ];

  return {
    summary,
    alerts,
    recommendations: recs,
    nutritional_diagnosis: diag,
    goals: [
      bmi && bmi >= 25
        ? `Reducir 5% del peso en 3 meses (~${Math.round((record.weight_kg || 70) * 0.05 * 10) / 10} kg)`
        : 'Mantener peso actual con alimentación equilibrada',
      `Ingesta hídrica ${calc.waterLiters || 2} L/día`,
      'Adherencia ≥80% al plan en el primer mes',
    ],
    follow_up: `Control en 4 semanas. Monitorear peso, ICC y adherencia. ${bmi && bmi >= 30 ? 'Solicitar perfil lipídico y glucemia.' : ''}`,
    raw_text: '[Análisis basado en reglas MINSAL — configura GEMINI_API_KEY para IA narrativa]',
  };
}

// ══════════════════════════════════════════════════════════
// RESPUESTA OFFLINE — base de conocimiento MINSAL
// ══════════════════════════════════════════════════════════
export function generateOfflineAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('imc') || q.includes('obesidad'))
    return '**IMC — MINSAL Chile:**\n• < 18.5: Bajo Peso\n• 18.5–24.9: Normal ✓\n• 25–29.9: Sobrepeso\n• 30–34.9: Obesidad I\n• 35–39.9: Obesidad II\n• ≥ 40: Obesidad III\n\n⚠️ AM ≥65 años: Normal 23–27.9, Sobrepeso 28–31.9.';
  if (q.includes('mifflin') || q.includes('tmb') || q.includes('metabolismo') || q.includes('vct'))
    return '**Mifflin-St Jeor (MINSAL recomendada):**\n♂ TMB = (10×kg) + (6.25×cm) − (5×edad) + 5\n♀ TMB = (10×kg) + (6.25×cm) − (5×edad) − 161\n\nVCT = TMB × Factor actividad\n• Sedentario: ×1.2 · Ligero: ×1.375 · Moderado: ×1.55 · Activo: ×1.725 · Muy activo: ×1.9';
  if (q.includes('proteína') || q.includes('proteina'))
    return '**Proteínas MINSAL:**\n• Adultos sanos: 0.8–1.0 g/kg/día\n• AM ≥65 años: 1.0–1.2 g/kg/día\n• Sarcopenia/trauma: 1.2–1.5 g/kg/día\n• ERC G3b-G4 sin diálisis: 0.6–0.8 g/kg/día\n• ERC en diálisis: 1.2–1.5 g/kg/día\n• Obesidad: usar peso ajustado = PI + 0.25×(PA−PI)';
  if (q.includes('diabetes') || q.includes('glucosa') || q.includes('dm2'))
    return '**Dietoterapia DM2 (GES MINSAL):**\n• CHO: 45–60% VCT, IG bajo\n• Fibra: ≥25 g/día\n• Fraccionamiento: 5–6 tiempos\n• Restricción: azúcares simples, alcohol\n• Meta HbA1c: <7% (individualizar AM)\n• AF: ≥150 min/sem aeróbico';
  if (q.includes('faulkner') || q.includes('pliegue') || q.includes('grasa') || q.includes('composición'))
    return '**Faulkner 1983:**\n% Grasa = (Σ4 pliegues × 0.153) + 5.783\nΣ = Tríceps + Subescapular + Supraespinal + Abdominal\n\n**% saludable ACSM:**\n♀ Atlético <20% · Fitness 21–24% · Aceptable 25–31% · Obeso >32%\n♂ Atlético <13% · Fitness 14–17% · Aceptable 18–25% · Obeso >25%';
  if (q.includes('presión') || q.includes('hta') || q.includes('dash') || q.includes('hipertens'))
    return '**PA — ESC/ESH 2023:**\n• Óptima: <120/80\n• Normal: 120–129/80–84\n• Normal Alta: 130–139/85–89\n• HTA G1: 140–159/90–99\n• HTA G2: 160–179/100–109\n• HTA G3: ≥180/≥110\n\n**Dieta DASH:** Na <2g/día, ↑K, ↑Mg, ↑Ca, ↑fibra.';
  if (q.includes('cockcroft') || q.includes('renal') || q.includes('creatinina') || q.includes('tfg'))
    return '**Cockcroft-Gault:**\nTFG = [(140−edad) × peso] / (72 × creatinina) × 0.85 si mujer\n\n**KDIGO 2022:**\n• G1: ≥90 ml/min (Normal)\n• G2: 60–89 (Leve)\n• G3a: 45–59 · G3b: 30–44\n• G4: 15–29 (Grave)\n• G5: <15 (Falla renal)';
  if (q.includes('chumlea') || q.includes('rodilla') || q.includes('talla estim'))
    return '**Chumlea 1985 (talla estimada):**\n♂ = 64.19 − (0.04 × edad) + (2.02 × alt.rodilla)\n♀ = 84.88 − (0.24 × edad) + (1.83 × alt.rodilla)\n\nUso: pacientes postrados, AM, con escoliosis.';
  if (q.includes('cintura') || q.includes('cv') || q.includes('cardiovascular') || q.includes('ict'))
    return '**Cintura MINSAL 2023:**\n♀: <80 sin riesgo · 80–87 aumentado · ≥88 alto\n♂: <94 sin riesgo · 94–101 aumentado · ≥102 alto\n\n**ICT:** Cintura/Talla. <0.5 = bajo riesgo · ≥0.5 = riesgo aumentado';
  if (q.includes('minsal') || q.includes('guía') || q.includes('sello'))
    return '**Guías MINSAL Chile 2024:**\n• 5 porciones frutas/verduras diarias\n• Alimentos naturales y mínimamente procesados\n• Evitar sellos de advertencia (ALTO EN)\n• Agua como bebida principal\n• AF ≥150 min/sem adultos\n• Reducir azúcar, sal y grasas saturadas';
  if (q.includes('adulto mayor') || q.includes('geriatr') || q.includes('sarcopenia'))
    return '**Nutrición Adulto Mayor (MINSAL):**\n• IMC: Normal 23–27.9 (distinto al adulto)\n• PRO: 1.0–1.2 g/kg/día (↑ si sarcopenia)\n• Ca: 1200 mg/día · Vit D: 800–1000 UI/día\n• Agua: 30 ml/kg (riesgo de deshidratación)\n• MNA para screening nutricional';
  return 'Configura tu GEMINI_API_KEY para respuestas más detalladas. Puedes preguntarme sobre: IMC, TMB/VCT, proteínas, DM2, HTA/DASH, Faulkner, Cockcroft-Gault, Chumlea, cintura/ICT, adulto mayor, guías MINSAL. 🐱';
}
