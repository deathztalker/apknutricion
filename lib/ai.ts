// lib/ai.ts — Motor IA Clínica: Gemini 1.5 Flash + Protocolo de Élite
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClinicalRecord, Patient, AIAnalysis, ClinicalAlert, CalculationResult } from '@/types';
import { COLORS } from '@/constants/theme';

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// ══════════════════════════════════════════════════════════
// REGLAS CLÍNICAS HARDCODEADAS — Estándar de Élite 2024
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
      alerts.push({ severity: 'warning', icon: '⚖️', title: 'Déficit Ponderal',
        description: `IMC ${calc.bmi} — Riesgo de desnutrición. Evaluar indicadores bioquímicos de criticidad.` });
    if (calc.bmi >= 30 && calc.bmi < 35)
      alerts.push({ severity: 'warning', icon: '🔶', title: 'Adiposidad Grado I',
        description: `IMC ${calc.bmi} — Plan hipocalórico estratégico. Déficit 500–750 kcal/día.` });
    if (calc.bmi >= 35)
      alerts.push({ severity: 'danger', icon: '🚨', title: 'Adiposidad Crítica',
        description: `IMC ${calc.bmi} — Intervención multidisciplinaria urgente. Evaluar criterios quirúrgicos.` });
  }

  // ── Riesgo CV / Cintura ────────────────────────────────
  if (calc.cvRisk === 'Riesgo alto')
    alerts.push({ severity: 'danger', icon: '❤️', title: 'Riesgo CV Crítico',
      description: 'Cintura elevada. Reducción de grasa visceral obligatoria: AF ≥150 min/sem.' });
  if (calc.ict !== null && calc.ict !== undefined && calc.ict >= 0.5)
    alerts.push({ severity: 'warning', icon: '📏', title: `ICT Elevado (${calc.ict})`,
      description: 'ICT ≥ 0.5 indica riesgo cardiometabólico por adiposidad abdominal.' });

  // ── HTA ─────────────────────────────────────────────────
  if (record.systolic_bp && record.systolic_bp >= 140)
    alerts.push({ severity: 'danger', icon: '💉', title: 'HTA Detectada',
      description: `PA ${record.systolic_bp}/${record.diastolic_bp} mmHg. Protocolo de reducción de Na.` });
  else if (record.systolic_bp && record.systolic_bp >= 130)
    alerts.push({ severity: 'warning', icon: '💉', title: 'Alerta Tensional',
      description: `PA ${record.systolic_bp}/${record.diastolic_bp} mmHg. Intervención preventiva inmediata.` });

  // ── Grasa corporal ──────────────────────────────────────
  if (calc.fatPercent !== null && calc.fatPercent !== undefined) {
    const lim = sex === 'F' ? 32 : 25;
    if (calc.fatPercent > lim)
      alerts.push({ severity: 'warning', icon: '🧬', title: 'Exceso de Masa Grasa',
        description: `% grasa ${calc.fatPercent}% excede límite biológico (${lim}%).` });
  }

  // ── Glucosa / DM ─────────────────────────────────────────
  if (record.glucose_mg) {
    if (record.glucose_mg >= 126)
      alerts.push({ severity: 'danger', icon: '🩸', title: 'Desorden Glucémico',
        description: `Glucosa ${record.glucose_mg} mg/dL. Restricción de carbohidratos de alta carga.` });
    else if (record.glucose_mg >= 100)
      alerts.push({ severity: 'warning', icon: '🩸', title: 'Alerta Metabólica',
        description: `Glucosa ${record.glucose_mg} mg/dL. Optimizar sensibilidad a la insulina.` });
  }

  // ── Lípidos ──────────────────────────────────────────────
  if (record.total_chol && record.total_chol > 200)
    alerts.push({ severity: 'warning', icon: '🫀', title: 'Hipercolesterolemia',
      description: `CT ${record.total_chol} mg/dL. Riesgo de placa aterogénica. Optimizar ácidos grasos.` });
  if (record.triglycerides && record.triglycerides > 150)
    alerts.push({ severity: 'warning', icon: '🫀', title: 'Hipertrigliceridemia',
      description: `TG ${record.triglycerides} mg/dL. Riesgo metabólico elevado. Restricción de azúcares.` });

  // ── Anemia y Proteínas ────────────────────────────────────
  if (record.hemoglobin) {
    const limHb = sex === 'F' ? 12 : 13;
    if (record.hemoglobin < limHb)
      alerts.push({ severity: 'warning', icon: '🩸', title: 'Déficit de Hemoglobina',
        description: `Hb ${record.hemoglobin} g/dL. Evaluar transporte de oxígeno y reserva de hierro.` });
  }
  if (record.albumin && record.albumin < 3.5)
    alerts.push({ severity: 'danger', icon: '⚠️', title: 'Hipoalbuminemia',
      description: `Albúmina ${record.albumin} g/dL. Estado de desnutrición proteica aguda detectado.` });

  // ── Función Renal ─────────────────────────────────────────
  if (calc.kdigoStage && !calc.kdigoStage.startsWith('G1') && !calc.kdigoStage.startsWith('G2')) {
    alerts.push({ severity: 'danger', icon: '🫘', title: `Disfunción Renal ${calc.kdigoStage}`,
      description: `TFG ${calc.gfr} ml/min. Protocolo proteico restrictivo y control electrolítico.` });
  }

  if (alerts.length === 0 && calc.bmi !== null)
    alerts.push({ severity: 'info', icon: '✅', title: 'Estatus Óptimo',
      description: 'Sujeto dentro de parámetros de excelencia clínica.' });

  return alerts;
}

// ══════════════════════════════════════════════════════════
// GEMINI — Análisis de Alta Densidad
// ══════════════════════════════════════════════════════════
function buildPrompt(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  alerts: ClinicalAlert[]
): string {
  return `Actúa como una Nutricionista Clínica de Élite. Realiza una DISECCIÓN NEURAL del siguiente caso biométrico.
Evita redundancias genéricas (no menciones guías MINSAL ni OMS). Tu objetivo es entregar valor clínico de alta densidad, estratégico y personalizado.

DATOS DEL SUJETO:
- Identidad: ${patient.full_name || 'Anónimo'} (${patient.sex === 'F' ? 'XX' : 'XY'}) | Edad: ${patient.age} años.
- Biometría: IMC ${calc.bmi} (${calc.bmiStatus}) | Cintura ${record.waist_cm}cm | ICT ${calc.ict} | Riesgo CV: ${calc.cvRisk}.
- Composición: %Grasa ${calc.fatPercent}% (Faulkner) | Masa Magra ${calc.leanMassKg}kg.
- Metabolismo: TMB ${calc.bmr} kcal | VCT ${calc.tdee} kcal.
- Objetivos Macro: PRO ${calc.macros?.protG}g (${calc.macros?.protGkg}g/kg) | CHO ${calc.macros?.choG}g | LIP ${calc.macros?.fatG}g.
- Bioquímica: Glucosa ${record.glucose_mg} | HbA1c ${record.hba1c}% | CT ${record.total_chol} | LDL ${record.ldl} | TG ${record.triglycerides} | TFG ${calc.gfr} (${calc.kdigoStage}).
- Patologías: ${record.pathologies?.join(', ') || 'Ninguna'}.
- Alertas: ${alerts.map(a => a.title).join(', ')}.

INSTRUCCIONES DE DISECCIÓN:
1. nutritional_diagnosis: Redacta un diagnóstico técnico formal de grado hospitalario, integrando estado nutricional y perfil metabólico.
2. summary: Análisis fisiopatológico crítico. Explica la interconexión entre los datos (ej: relación cintura/resistencia insulínica o impacto de composición en el metabolismo).
3. recommendations: Entrega 5 protocolos de intervención nutricional ESPECÍFICOS y TÁCTICOS. No digas "coma sano", di "priorizar ácidos grasos monoinsaturados y fibra soluble para optimizar perfil lipídico".
4. goals: Define 3 metas SMART ultra-específicas para este paciente.
5. meal_plan_hints: Sugerencias tácticas para la estructura de las comidas (ej: carga glucémica, tiempos de comida, suplementación específica).
6. follow_up: Justificación técnica del próximo control.

Responde ÚNICAMENTE con este JSON (sin markdown):
{"nutritional_diagnosis":"string","summary":"string","recommendations":["r1","r2","r3","r4","r5"],"goals":["g1","g2","g3"],"meal_plan_hints":"string","follow_up":"string","education_topics":["t1","t2","t3"]}`;
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
  let diag = `Sujeto de genotipo ${patient.sex === 'F' ? 'XX' : 'XY'}`;
  if (bmi) diag += ` con estatus de ${calc.bmiStatus?.toLowerCase() || 'evaluación metabólica completada'}`;
  if (calc.cvRisk === 'Riesgo alto') diag += ', criticidad cardiovascular elevada';
  diag += '. Requiere intervención nutricional de alta precisión.';

  let summary = 'Perfil biológico evaluado en el núcleo. ';
  if (bmi && bmi >= 25) summary += `Exceso de carga ponderal (IMC ${bmi}), factor de riesgo sistémico. `;
  else if (bmi && bmi < 18.5) summary += `Déficit de masa estructural (IMC ${bmi}), posible carencia nutricional profunda. `;
  else if (bmi) summary += `Índice en rango de excelencia (${bmi}). `;
  if (calc.tdee) summary += `Requerimiento energético total: ${calc.tdee} kcal/día. `;
  summary += 'Se recomienda monitoreo continuo de biomarcadores.';

  const recs = [
    bmi && bmi >= 25
      ? `Déficit calórico estratégico 500 kcal/día (${(calc.tdee || 2000) - 500} kcal/día)`
      : 'Mantener balance energético con optimización de macros',
    'Fraccionamiento táctico en 5–6 ingestas para estabilidad celular',
    'Incrementar densidad de fitonutrientes y antioxidantes estructurales',
    `Protocolo de saturación hídrica: ${calc.waterLiters || 2} Litros diarios`,
    'Eliminar ultraprocesados y agentes pro-inflamatorios del sistema',
    calc.cvRisk !== 'Sin riesgo' ? 'Actividad física aeróbica ≥150 min/semana' : 'Preservar régimen de acondicionamiento físico',
  ];

  return {
    summary,
    alerts,
    recommendations: recs,
    nutritional_diagnosis: diag,
    goals: [
      bmi && bmi >= 25
        ? `Reducir 5% de carga ponderal en 12 semanas (~${Math.round((record.weight_kg || 70) * 0.05 * 10) / 10} kg)`
        : 'Estabilizar parámetros actuales mediante nutrición de precisión',
      `Métrica hídrica: ${calc.waterLiters || 2} L/día`,
      'Adherencia al protocolo ≥80% en el primer ciclo de escaneo',
    ],
    follow_up: `Nueva evaluación de evolución en 30 días.`,
    raw_text: '[Análisis basado en Protocolo de Élite — configura GEMINI_API_KEY para IA narrativa]',
  };
}

// ══════════════════════════════════════════════════════════
// RESPUESTA OFFLINE — Base de Conocimiento de Élite
// ══════════════════════════════════════════════════════════
export function generateOfflineAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('imc') || q.includes('obesidad'))
    return '**Métrica IMC:**\n• < 18.5: Déficit Ponderal\n• 18.5–24.9: Rango Óptimo ✓\n• 25–29.9: Sobrepeso\n• 30–34.9: Obesidad I\n• 35–39.9: Obesidad II\n• ≥ 40: Obesidad III\n\n⚠️ Sujetos ≥65 años: Óptimo 23–27.9, Sobrepeso 28–31.9.';
  if (q.includes('mifflin') || q.includes('tmb') || q.includes('metabolismo') || q.includes('vct'))
    return '**Ecuación Mifflin-St Jeor (Precisión Metabólica):**\n♂ TMB = (10×kg) + (6.25×cm) − (5×edad) + 5\n♀ TMB = (10×kg) + (6.25×cm) − (5×edad) − 161\n\nVCT = TMB × Factor Actividad\n• Basal: ×1.2 · Ligero: ×1.375 · Moderado: ×1.55 · Intenso: ×1.725 · Élite: ×1.9';
  if (q.includes('proteína') || q.includes('proteina'))
    return '**Protocolos Proteicos:**\n• Adultos: 0.8–1.0 g/kg/día\n• Adulto Mayor: 1.0–1.2 g/kg/día\n• Sarcopenia/Hipertrofia: 1.2–2.0 g/kg/día\n• ERC (Prediálisis): 0.6–0.8 g/kg/día\n• Diálisis: 1.2–1.5 g/kg/día\n• Obesidad: utilizar peso ajustado para el cálculo.';
  if (q.includes('diabetes') || q.includes('glucosa') || q.includes('dm2'))
    return '**Gestión Glucémica DM2:**\n• CHO: 45–60% VCT (IG Bajo)\n• Fibra Soluble: ≥25 g/día\n• Fraccionamiento: 5–6 tiempos\n• Restricción: HC simples, alcohol\n• Meta HbA1c: <7% (Individualizar)\n• AF: ≥150 min/sem aeróbico + fuerza';
  if (q.includes('faulkner') || q.includes('pliegue') || q.includes('grasa') || q.includes('composición'))
    return '**Fórmula Faulkner (4 Pliegues):**\n% Grasa = (Σ4 pliegues × 0.153) + 5.783\nΣ = Tríceps + Subescapular + Supraespinal + Abdominal\n\n**Rangos de Excelencia:**\n♀ Atlético <20% · Fitness 21–24% · Normal 25–31%\n♂ Atlético <13% · Fitness 14–17% · Normal 18–25%';
  if (q.includes('presión') || q.includes('hta') || q.includes('dash') || q.includes('hipertens'))
    return '**Protocolo Tensional:**\n• Óptima: <120/80\n• Normal: 120–129/80–84\n• Normal Alta: 130–139/85–89\n• HTA G1: 140–159/90–99\n• HTA G2: 160–179/100–109\n\n**Estrategia DASH:** Na <2g/día, ↑K, ↑Mg, ↑Ca.';
  if (q.includes('cockcroft') || q.includes('renal') || q.includes('creatinina') || q.includes('tfg'))
    return '**TFG (Cockcroft-Gault):**\nTFG = [(140−edad) × peso] / (72 × creatinina) × 0.85 si mujer\n\n**Clasificación KDIGO:**\n• G1: ≥90 (Óptimo)\n• G2: 60–89 (Descenso Leve)\n• G3: 30–59 (Moderado)\n• G4: 15–29 (Grave)\n• G5: <15 (Falla)';
  if (q.includes('chumlea') || q.includes('rodilla') || q.includes('talla estim'))
    return '**Estimación Chumlea (Sujetos Postrados):**\n♂ = 64.19 − (0.04 × edad) + (2.02 × alt.rodilla)\n♀ = 84.88 − (0.24 × edad) + (1.83 × alt.rodilla)';
  if (q.includes('cintura') || q.includes('cv') || q.includes('cardiovascular') || q.includes('ict'))
    return '**Evaluación Cintura/ICT:**\n♀: <80 Normal · 80–87 Aumentado · ≥88 Crítico\n♂: <94 Normal · 94–101 Aumentado · ≥102 Crítico\n\n**ICT:** Cintura/Talla. <0.5 = Bajo Riesgo · ≥0.5 = Riesgo Cardiometabólico';
  return 'Configura tu GEMINI_API_KEY para análisis de alta densidad. Puedes consultar sobre: Composición Faulkner, Cockcroft-Gault, TMB Mifflin, Gestión DM2/HTA, Sarcopenia y Nutrición Gerontológica. 🐱';
}
