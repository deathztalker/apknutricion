// lib/ai.ts — Motor de IA Clínica con Google Gemini + Reglas MINSAL
import { ClinicalRecord, Patient, AIAnalysis, ClinicalAlert, CalculationResult } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ══════════════════════════════════════════════════════════
// REGLAS CLÍNICAS HARDCODEADAS (fallback offline + capa base)
// ══════════════════════════════════════════════════════════
export function generateRuleBasedAlerts(
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  age: number,
  sex: 'M' | 'F' | ''
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ── IMC ────────────────────────────────────────────────
  if (calc.bmi !== null) {
    if (calc.bmi < 18.5) {
      alerts.push({ severity: 'warning', icon: '⚖️', title: 'Bajo Peso',
        description: `IMC ${calc.bmi} — Riesgo de desnutrición. Evaluar causa subyacente e indicadores bioquímicos (albúmina, hemoglobina).` });
    }
    if (calc.bmi >= 30 && calc.bmi < 35) {
      alerts.push({ severity: 'warning', icon: '🔶', title: 'Obesidad Grado I',
        description: `IMC ${calc.bmi} — Indicar plan de alimentación hipocalórico con déficit de 500–750 kcal/día. Evaluar comorbilidades.` });
    }
    if (calc.bmi >= 35) {
      alerts.push({ severity: 'danger', icon: '🚨', title: 'Obesidad Grado II–III',
        description: `IMC ${calc.bmi} — Derivar a equipo multidisciplinario. Evaluar riesgo quirúrgico y comorbilidades operativas.` });
    }
  }

  // ── CV Risk ─────────────────────────────────────────────
  if (calc.cvRisk === 'Riesgo alto') {
    alerts.push({ severity: 'danger', icon: '❤️', title: 'Riesgo Cardiovascular Alto',
      description: `Circunferencia de cintura elevada. Priorizar reducción de grasa visceral. Dieta mediterránea + actividad física gradual.` });
  }

  // ── ICT ─────────────────────────────────────────────────
  if (calc.ict !== null && calc.ict >= 0.5) {
    alerts.push({ severity: 'warning', icon: '📏', title: 'ICT Elevado (≥ 0.5)',
      description: `ICT ${calc.ict} indica adiposidad abdominal con riesgo cardiometabólico aumentado.` });
  }

  // ── HTA ─────────────────────────────────────────────────
  if (record.systolic_bp && record.systolic_bp >= 140) {
    alerts.push({ severity: 'danger', icon: '💉', title: 'HTA Confirmada',
      description: `PA ${record.systolic_bp}/${record.diastolic_bp} mmHg. Dieta DASH: reducir sodio a < 2g/día, aumentar potasio, magnesio y calcio.` });
  } else if (record.systolic_bp && record.systolic_bp >= 130) {
    alerts.push({ severity: 'warning', icon: '💉', title: 'Presión Normal Alta',
      description: `PA ${record.systolic_bp}/${record.diastolic_bp} mmHg. Intervención dietética preventiva. Dieta DASH, restricción de sodio.` });
  }

  // ── Grasa corporal ──────────────────────────────────────
  if (calc.fatPercent !== null) {
    const limit = sex === 'F' ? 32 : 25;
    if (calc.fatPercent > limit) {
      alerts.push({ severity: 'warning', icon: '🧬', title: 'Exceso de Grasa Corporal',
        description: `% grasa: ${calc.fatPercent}%. Supera el límite recomendado (${sex==='F'?32:25}%). Favorecer preservación de masa magra en plan calórico.` });
    }
  }

  // ── Lab: Glucosa ─────────────────────────────────────────
  if (record.glucose_mg) {
    if (record.glucose_mg >= 126) {
      alerts.push({ severity: 'danger', icon: '🩸', title: 'Glucemia Alterada (Diabetes)',
        description: `Glucosa: ${record.glucose_mg} mg/dL. Restricción de azúcares simples, fraccionamiento 5–6 comidas, índice glucémico bajo.` });
    } else if (record.glucose_mg >= 100) {
      alerts.push({ severity: 'warning', icon: '🩸', title: 'Prediabetes (Glucemia Límite)',
        description: `Glucosa: ${record.glucose_mg} mg/dL (100–125). Intervención nutricional preventiva. Reducir CHO simples y aumentar fibra.` });
    }
  }

  // ── HbA1c ────────────────────────────────────────────────
  if (record.hba1c && record.hba1c >= 6.5) {
    alerts.push({ severity: 'danger', icon: '📊', title: 'HbA1c — Control Glucémico Deficiente',
      description: `HbA1c ${record.hba1c}% — Control glucémico deficiente. Revisar adherencia al plan. Coordinar con médico tratante.` });
  }

  // ── Colesterol ───────────────────────────────────────────
  if (record.total_chol && record.total_chol > 200) {
    alerts.push({ severity: 'warning', icon: '🫀', title: 'Hipercolesterolemia',
      description: `Colesterol total: ${record.total_chol} mg/dL. Reducir grasas saturadas y trans. Aumentar omega-3, fibra soluble (avena, legumbres).` });
  }
  if (record.ldl && record.ldl > 100) {
    alerts.push({ severity: 'warning', icon: '🫀', title: 'LDL Elevado',
      description: `LDL: ${record.ldl} mg/dL. Dieta baja en grasas saturadas (< 7% VCT). Aumentar consumo de aceite de oliva y aguacate.` });
  }
  if (record.triglycerides && record.triglycerides > 150) {
    alerts.push({ severity: 'warning', icon: '🫀', title: 'Hipertrigliceridemia',
      description: `TG: ${record.triglycerides} mg/dL. Restricción de azúcares simples y alcohol. Omega-3 EPA/DHA 2–4 g/día si > 500 mg/dL.` });
  }

  // ── Hemoglobina / Anemia ──────────────────────────────────
  if (record.hemoglobin) {
    const limHb = sex === 'F' ? 12 : 13;
    if (record.hemoglobin < limHb) {
      alerts.push({ severity: 'warning', icon: '🩸', title: 'Anemia Probable',
        description: `Hb ${record.hemoglobin} g/dL — Bajo el punto de corte. Aumentar hierro hem (carnes rojas magras) + vitamina C. Evaluar causa.` });
    }
  }

  // ── Albúmina / Desnutrición ───────────────────────────────
  if (record.albumin && record.albumin < 3.5) {
    alerts.push({ severity: 'danger', icon: '⚠️', title: 'Hipoalbuminemia — Riesgo de Desnutrición',
      description: `Albúmina ${record.albumin} g/dL. Indicador de desnutrición proteica. Aumentar aporte proteico a 1.2–1.5 g/kg. Evaluar soporte nutricional.` });
  }

  // ── Función Renal ─────────────────────────────────────────
  if (calc.kdigoStage && (calc.kdigoStage.startsWith('G3') || calc.kdigoStage.startsWith('G4') || calc.kdigoStage.startsWith('G5'))) {
    const pctRec = calc.kdigoStage.startsWith('G4') || calc.kdigoStage.startsWith('G5') ? '0.6–0.8' : '0.8–1.0';
    alerts.push({ severity: 'danger', icon: '🫘', title: `ERC ${calc.kdigoStage}`,
      description: `TFG ${calc.gfr} ml/min. Restricción proteica ${pctRec} g/kg/día. Control de fósforo, potasio y sodio según estadio. Derivar a nefrólogo.` });
  }

  // ── Sarcopenia ────────────────────────────────────────────
  if (calc.sarcopeniaRisk && calc.sarcopeniaRisk.includes('Probable')) {
    alerts.push({ severity: 'danger', icon: '💪', title: 'Probable Sarcopenia',
      description: `Baja fuerza muscular (Grip: ${record.grip_strength_kg} kg). Aumentar aporte proteico a 1.2–1.5 g/kg y recomendar ejercicios de fuerza/resistencia.` });
  }

  // ── Screening Nutricional (MNA / VGS) ──────────────────────
  if (record.mna_score !== undefined && record.mna_score < 12) {
    const sev = record.mna_score < 8 ? 'danger' : 'warning';
    alerts.push({ severity: sev, icon: '📋', title: 'Riesgo Nutricional (MNA)',
      description: `Puntaje MNA: ${record.mna_score}. ${record.mna_score < 8 ? 'Desnutrición confirmada.' : 'Riesgo de desnutrición.'} Intervención inmediata necesaria.` });
  }

  if (record.vgs_status && record.vgs_status !== 'A') {
    alerts.push({ severity: 'danger', icon: '⚠️', title: `Desnutrición VGS Tipo ${record.vgs_status}`,
      description: `Valoración Global Subjetiva indica ${record.vgs_status === 'B' ? 'desnutrición moderada' : 'desnutrición severa'}. Priorizar soporte nutricional.` });
  }

  // ── Pérdida de peso ───────────────────────────────────────
  if (calc.weightLossRisk === 'Severo 🚨') {
    alerts.push({ severity: 'danger', icon: '📉', title: 'Pérdida de Peso Severa',
      description: `Pérdida > 10% peso corporal. Riesgo nutricional grave. Evaluar causa y considerar soporte nutricional especializado.` });
  }

  // ── Protección: sin alertas ───────────────────────────────
  if (alerts.length === 0 && calc.bmi !== null) {
    alerts.push({ severity: 'info', icon: '✅', title: 'Parámetros Generales Adecuados',
      description: 'Los indicadores evaluados se encuentran dentro de rangos normales según criterios MINSAL Chile.' });
  }

  return alerts;
}

// ══════════════════════════════════════════════════════════
// GEMINI API — Análisis Narrativo Profundo
// ══════════════════════════════════════════════════════════
function buildClinicalPrompt(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  ruleAlerts: ClinicalAlert[]
): string {
  const age = patient.age || 0;

  return `Eres una nutricionista clínica experta en Chile, con especialidad en dietoterapia y salud pública basada en normativa MINSAL. Tu tarea es realizar un análisis exhaustivo y detallado.

REGLAS CRÍTICAS:
1. NO RESUMAS NOMBRES NI CONCEPTOS. Si el paciente se llama "Juan Pérez", usa su nombre completo. Si el concepto es "Hipertensión Arterial", usa el término completo.
2. PROPORCIONA EL MÁXIMO DETALLE POSIBLE. No te limites a frases genéricas.
3. TODO EL CONTENIDO DEBE ESTAR EN ESPAÑOL.

DATOS DEL PACIENTE:
- Nombre Completo: ${patient.full_name || 'Paciente'}
- Edad: ${age} años | Sexo: ${patient.sex === 'F' ? 'Femenino' : 'Masculino'}
- Previsión: ${patient.insurance || 'FONASA'}

ANTROPOMETRÍA Y SIGNOS VITALES:
- Peso Actual: ${record.weight_kg || '—'} kg | Talla Actual: ${record.height_cm || '—'} cm
- IMC (Índice de Masa Corporal): ${calc.bmi || '—'} (${calc.bmiStatus || '—'})
- Circunferencia de Cintura: ${record.waist_cm || '—'} cm | ICT (Índice Cintura-Talla): ${calc.ict || '—'}
- Riesgo Cardiovascular: ${calc.cvRisk || '—'}
- Peso Ideal: ${calc.idealWeight || '—'} kg${calc.adjustedWeight ? ` | Peso Ajustado por Obesidad: ${calc.adjustedWeight} kg` : ''}
- Presión Arterial: ${record.systolic_bp || '—'}/${record.diastolic_bp || '—'} mmHg (${calc.bpStatus || '—'})

COMPOSICIÓN CORPORAL (Método Faulkner):
- Porcentaje de Grasa: ${calc.fatPercent || '—'}% | Masa Grasa: ${calc.fatMassKg || '—'} kg | Masa Magra: ${calc.leanMassKg || '—'} kg

ESTADO FUNCIONAL Y GERIATRÍA:
- Fuerza de Agarre (Dinamometría): ${record.grip_strength_kg || '—'} kg | Riesgo de Sarcopenia (EWGSOP2): ${calc.sarcopeniaRisk || '—'}
- Perímetro de Pantorrilla: ${record.calf_circumference_cm || '—'} cm
- Puntuación MNA (Mini Nutritional Assessment): ${record.mna_score || '—'} | VGS (Valoración Global Subjetiva): ${record.vgs_status || '—'}

METABOLISMO Y NUTRICIÓN:
- Tasa Metabólica Basal (Mifflin-St Jeor): ${calc.bmr || '—'} kcal | Gasto Energético Total (VCT): ${calc.tdee || '—'} kcal
- Requerimiento Hídrico Estimado: ${calc.waterLiters || '—'} L/día

MACRONUTRIENTES PRESCRITOS:
- Proteínas: ${calc.macros?.protG || '—'}g (${record.macro_prot_pct || 15}%) | Carbohidratos: ${calc.macros?.choG || '—'}g (${record.macro_cho_pct || 55}%) | Lípidos: ${calc.macros?.fatG || '—'}g (${record.macro_fat_pct || 30}%)
- Aporte Proteico por Kilo: ${calc.macros?.protGkg || '—'} g/kg/día

EXÁMENES DE LABORATORIO:
- Glucemia en Ayunas: ${record.glucose_mg || '—'} mg/dL | Hemoglobina Glicosilada (HbA1c): ${record.hba1c || '—'}%
- Perfil Lipídico: Colesterol Total ${record.total_chol || '—'}, HDL ${record.hdl || '—'}, LDL ${record.ldl || '—'}, Triglicéridos ${record.triglycerides || '—'} mg/dL
- Perfil Hematológico: Hemoglobina ${record.hemoglobin || '—'} g/dL, Ferritina ${record.ferritin || '—'} ng/mL
- Proteínas Viscerales: Albúmina Sérica ${record.albumin || '—'} g/dL
- Función Renal: TFG (Tasa de Filtración Glomerular) ${calc.gfr || '—'} ml/min, Estadio KDIGO ${calc.kdigoStage || '—'}

ANAMNESIS Y OBSERVACIONES:
- Patologías Base: ${record.pathologies?.join(', ') || 'No registradas'}
- Alergias e Intolerancias: ${record.allergies?.join(', ') || 'Ninguna'}
- Tipo de Dieta Actual: ${record.diet_type || '—'}
- Ingesta de Líquidos: ${record.liquid_intake || '—'}
- Estado de Digestión: ${record.digestion_status || '—'}
- Suplementación: ${record.supplements || '—'}
- Observaciones Clínicas: ${record.observations || '—'}

ALERTAS CLÍNICAS DETECTADAS POR EL SISTEMA:
${ruleAlerts.map(a => `[${a.severity.toUpperCase()}] ${a.title}: ${a.description}`).join('\n')}

Por favor, proporciona un análisis clínico nutricional completo, profesional y muy detallado estructurado en el siguiente formato JSON (sin markdown, solo JSON puro):

{
  "nutritional_diagnosis": "Diagnóstico nutricional detallado y completo utilizando terminología técnica adecuada (mínimo 3 oraciones)",
  "summary": "Análisis clínico integral y detallado del estado del paciente. Explica las relaciones entre los hallazgos antropométricos, de laboratorio y la anamnesis. No resumas excesivamente.",
  "recommendations": [
    "Recomendación dietoterapéutica específica 1",
    "Recomendación dietoterapéutica específica 2",
    "Recomendación de estilo de vida específica 3",
    "Recomendación de suplementación o derivación 4",
    "Otras recomendaciones detalladas..."
  ],
  "goals": [
    "Meta nutricional 1 (Formato SMART detallado)",
    "Meta nutricional 2...",
    "Meta nutricional 3..."
  ],
  "meal_plan_hints": "Directrices detalladas para la elaboración del plan de alimentación, incluyendo selección de alimentos, técnicas culinarias y fraccionamiento.",
  "follow_up": "Plan de seguimiento detallado indicando tiempos, indicadores críticos a reevaluar y posibles ajustes.",
  "education_topics": ["Tema de educación alimentaria detallado 1", "Tema 2...", "Tema 3..."]
}`;
}

export async function analyzeWithGemini(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult
): Promise<AIAnalysis> {
  const ruleAlerts = generateRuleBasedAlerts(record, calc, 0, patient.sex || '');

  if (GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = buildClinicalPrompt(patient, record, calc, ruleAlerts);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();

      // Parse JSON response
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
      console.warn('Gemini API falló, usando análisis basado en reglas:', err);
    }
  }

  // ── Fallback: Rule-based narrative ───────────────────────
  return generateRuleBasedAnalysis(patient, record, calc, ruleAlerts);
}

function generateRuleBasedAnalysis(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  alerts: ClinicalAlert[]
): AIAnalysis {
  const bmi = calc.bmi;
  const sex = patient.sex;

  // Diagnóstico nutricional
  let diagnosis = `Paciente de sexo ${sex === 'F' ? 'femenino' : 'masculino'}`;
  if (bmi) diagnosis += ` con ${calc.bmiStatus?.toLowerCase()}`;
  if (calc.cvRisk === 'Riesgo alto') diagnosis += ', riesgo cardiovascular elevado';
  if (calc.kdigoStage && !calc.kdigoStage.startsWith('G1')) diagnosis += `, compromiso renal ${calc.kdigoStage}`;
  diagnosis += '. Requiere intervención nutricional personalizada.';

  // Resumen
  let summary = `El estado nutricional evaluado muestra `;
  if (bmi && bmi >= 25) summary += `exceso de peso (IMC ${bmi}), lo que constituye un factor de riesgo cardiometabólico. `;
  else if (bmi && bmi < 18.5) summary += `bajo peso (IMC ${bmi}), con posible riesgo de déficit nutricional. `;
  else summary += `parámetros antropométricos dentro de rangos normales. `;
  if (calc.tdee) summary += `El requerimiento energético estimado es de ${calc.tdee} kcal/día. `;
  summary += `Se recomienda seguimiento nutricional periódico y adherencia al plan alimentario prescrito.`;

  // Recomendaciones según condición
  const recs: string[] = [];
  if (bmi && bmi >= 25) recs.push(`Déficit calórico moderado de 500 kcal/día sobre VCT (${(calc.tdee || 0) - 500} kcal/día) para pérdida de peso gradual`);
  if (bmi && bmi < 18.5) recs.push(`Aumentar aporte calórico en 300–500 kcal/día para recuperar peso saludable`);
  recs.push('Fraccionamiento en 5–6 comidas diarias para mantener glucemia estable y control del apetito');
  recs.push('Aumentar consumo de verduras y frutas a 5 porciones diarias (MINSAL recomendación)');
  recs.push(`Ingesta hídrica de ${calc.waterLiters || 2} litros de agua al día, preferentemente sin azúcar`);
  recs.push('Reducir consumo de ultraprocesados, alimentos con sellos de advertencia y azúcares añadidos');
  if (calc.cvRisk !== 'Sin riesgo') recs.push('Incorporar actividad física aeróbica mínimo 150 min/semana (OMS/MINSAL)');
  if (calc.macros) recs.push(`Distribución de macronutrientes: PRO ${record.macro_prot_pct || 15}% · CHO ${record.macro_cho_pct || 55}% · LIP ${record.macro_fat_pct || 30}%`);

  return {
    summary,
    alerts,
    recommendations: recs.slice(0, 6),
    nutritional_diagnosis: diagnosis,
    goals: [
      bmi && bmi >= 25 ? `Reducir peso corporal en 5% en 3 meses (~${Math.round((record.weight_kg || 70) * 0.05 * 10) / 10} kg)` : 'Mantener peso corporal actual con alimentación equilibrada',
      `Alcanzar ingesta hídrica de ${calc.waterLiters || 2} L/día en 2 semanas`,
      'Adherencia al plan alimentario ≥ 80% en el próximo mes',
      'Incorporar actividad física moderada 3 veces por semana',
    ],
    follow_up: `Control nutricional en 4 semanas. Monitorear peso, ICC y adherencia al plan. ${bmi && bmi >= 30 ? 'Solicitar perfil lipídico y glucemia en control.' : ''}`,
    raw_text: '[Análisis basado en reglas clínicas MINSAL — sin API key de Gemini]',
  };
}

// ── Chat clínico libre ──────────────────────────────────────
export async function askClinicalQuestion(
  question: string,
  context?: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return generateOfflineAnswer(question);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `Eres una nutricionista clínica especialista en Chile. Respondes en español de forma clara, basada en evidencia y normativa MINSAL. Eres empática, profesional y directa. Si la pregunta es fuera de tu alcance clínico, lo indicas amablemente.${context ? `\n\nContexto del paciente: ${context}` : ''}`
    });

    const result = await model.generateContent(question);
    const response = await result.response;
    return response.text() || 'No pude procesar tu consulta. Intenta de nuevo.';
  } catch {
    return generateOfflineAnswer(question);
  }
}

function generateOfflineAnswer(q: string): string {
  const ql = q.toLowerCase();
  if (ql.includes('imc') || ql.includes('obesidad'))
    return 'El IMC (Índice de Masa Corporal) es el peso en kg dividido por la talla en metros al cuadrado. Según MINSAL Chile: < 18.5 Bajo peso, 18.5–24.9 Normal, 25–29.9 Sobrepeso, ≥30 Obesidad. En adultos mayores (≥65 años) los puntos de corte son distintos.';
  if (ql.includes('minsal') || ql.includes('guía') || ql.includes('recomend'))
    return 'Las guías alimentarias MINSAL Chile recomiendan: consumir alimentos naturales y mínimamente procesados, 5 porciones de frutas y verduras al día, preferir agua, reducir azúcar, sal y grasas saturadas, y realizar actividad física ≥150 min/semana.';
  if (ql.includes('proteína') || ql.includes('proteina'))
    return 'La recomendación proteica según MINSAL es 10–20% del VCT. En adultos sanos: 0.8–1.0 g/kg/día. En adultos mayores: 1.0–1.2 g/kg/día. Con ERC sin diálisis se reduce. Con sarcopenia o trauma se aumenta a 1.2–1.5 g/kg/día.';
  if (ql.includes('diabetes') || ql.includes('glucosa'))
    return 'En diabetes mellitus tipo 2: restricción de azúcares simples, índice glucémico bajo, fraccionamiento en 5–6 tiempos, HCO de absorción lenta. Objetivo VCT según peso ideal. Meta HbA1c < 7% (individualizar según MINSAL GES Diabetes).';
  return 'Para esta consulta, te recomiendo revisar las Guías Alimentarias MINSAL Chile 2023 o consultar directamente con un especialista. Puedo ayudarte mejor cuando configures la API key de Gemini para análisis más profundos.';
}
