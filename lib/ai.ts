// lib/ai.ts — Motor IA Clínica v2: Gemini 2.0 Flash + Protocolo de Élite
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClinicalRecord, Patient, AIAnalysis, ClinicalAlert, CalculationResult } from '@/types';

// Polyfill para fetch en entornos que lo requieran (ej. Node antiguo durante build)
if (typeof fetch === 'undefined' && typeof global !== 'undefined') {
  // En React Native / Web fetch ya existe. Esto es para SSR/Node.
  // No importamos node-fetch dinámicamente aquí para evitar errores de bundle,
  // pero aseguramos que el entorno tenga acceso al fetch global si existe.
  (global as any).fetch = (global as any).fetch || undefined;
}

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_RETRIES = 2;
const TIMEOUT_MS = 15_000;

// ══════════════════════════════════════════════════════════════════════════════
// TIPOS INTERNOS
// ══════════════════════════════════════════════════════════════════════════════

interface GeminiAnalysisResponse {
  nutritional_diagnosis: string;
  summary: string;
  recommendations: string[];
  goals: string[];
  meal_plan_hints: string;
  follow_up: string;
  education_topics: string[];
}

// ══════════════════════════════════════════════════════════════════════════════
// ALERTAS BASADAS EN REGLAS
// ══════════════════════════════════════════════════════════════════════════════

export function generateRuleBasedAlerts(
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  age: number,
  sex: 'M' | 'F' | ''
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ── IMC (ajustado para adultos mayores ≥65) ─────────────────────────────
  if (calc.bmi != null) {
    const isElderly = age >= 65;
    const [cutLow, cutOw, cutOb1, cutOb2] = isElderly
      ? [23, 28, 32, 37]
      : [18.5, 25, 30, 35];

    if (calc.bmi < cutLow) {
      alerts.push({
        severity: 'warning', icon: '⚖️', title: 'Déficit Ponderal',
        description: `IMC ${calc.bmi}${isElderly ? ' (criterio geriátrico)' : ''}. Evaluar desnutrición y reserva muscular.`,
      });
    } else if (calc.bmi >= cutOb2) {
      alerts.push({
        severity: 'danger', icon: '🚨', title: 'Adiposidad Severa',
        description: `IMC ${calc.bmi}. Intervención multidisciplinaria urgente. Evaluar criterios bariátricos.`,
      });
    } else if (calc.bmi >= cutOb1) {
      alerts.push({
        severity: 'warning', icon: '🔶', title: 'Adiposidad Moderada',
        description: `IMC ${calc.bmi}. Plan hipocalórico estratégico con déficit de 500–750 kcal/día.`,
      });
    } else if (calc.bmi >= cutOw) {
      alerts.push({
        severity: 'info', icon: '📊', title: 'Sobrepeso',
        description: `IMC ${calc.bmi}. Intervención preventiva temprana recomendada.`,
      });
    }
  }

  // ── Riesgo CV / Cintura / ICT ────────────────────────────────────────────
  if (calc.cvRisk === 'Riesgo alto') {
    alerts.push({
      severity: 'danger', icon: '❤️', title: 'Riesgo Cardiovascular Elevado',
      description: 'Cintura en rango crítico. Reducción de grasa visceral: AF ≥150 min/sem + restricción de Na.',
    });
  }
  if (calc.ict != null && calc.ict >= 0.5) {
    alerts.push({
      severity: 'warning', icon: '📏', title: `ICT Elevado (${calc.ict})`,
      description: 'ICT ≥ 0.5 indica acumulación de grasa visceral y riesgo cardiometabólico aumentado.',
    });
  }

  // ── Presión Arterial ────────────────────────────────────────────────────
  if (record.systolic_bp != null) {
    const sys = record.systolic_bp;
    const dia = record.diastolic_bp ?? '?';
    if (sys >= 180) {
      alerts.push({
        severity: 'danger', icon: '💉', title: 'HTA Grado III — Urgencia',
        description: `PA ${sys}/${dia} mmHg. Derivación médica urgente. Protocolo de emergencia hipertensiva.`,
      });
    } else if (sys >= 160) {
      alerts.push({
        severity: 'danger', icon: '💉', title: 'HTA Grado II',
        description: `PA ${sys}/${dia} mmHg. Restricción severa de Na (<1.5 g/día). Coordinación médica.`,
      });
    } else if (sys >= 140) {
      alerts.push({
        severity: 'danger', icon: '💉', title: 'HTA Grado I',
        description: `PA ${sys}/${dia} mmHg. Dieta DASH, restricción Na <2 g/día, actividad aeróbica.`,
      });
    } else if (sys >= 130) {
      alerts.push({
        severity: 'warning', icon: '💉', title: 'Presión Normal-Alta',
        description: `PA ${sys}/${dia} mmHg. Intervención preventiva: patrón DASH y reducción de peso.`,
      });
    }
  }

  // ── Grasa Corporal ──────────────────────────────────────────────────────
  if (calc.fatPercent != null) {
    const limits = sex === 'F'
      ? { athletic: 20, fit: 25, normal: 32 }
      : { athletic: 13, fit: 18, normal: 25 };

    if (calc.fatPercent > limits.normal) {
      alerts.push({
        severity: 'warning', icon: '🧬', title: 'Exceso de Masa Grasa',
        description: `Grasa corporal ${calc.fatPercent}% (límite biológico ${limits.normal}%). Plan de reducción adiposa necesario.`,
      });
    } else if (calc.fatPercent <= limits.athletic) {
      alerts.push({
        severity: 'info', icon: '💪', title: 'Masa Grasa Atlética',
        description: `Grasa corporal ${calc.fatPercent}%. Monitorear ingesta calórica para no comprometer masa magra.`,
      });
    }
  }

  // ── Glucemia ────────────────────────────────────────────────────────────
  if (record.glucose_mg != null) {
    const g = record.glucose_mg;
    if (g >= 200) {
      alerts.push({
        severity: 'danger', icon: '🩸', title: 'Hiperglucemia Severa',
        description: `Glucosa ${g} mg/dL. Posible DM descompensada. Derivación médica urgente.`,
      });
    } else if (g >= 126) {
      alerts.push({
        severity: 'danger', icon: '🩸', title: 'Criterio DM2',
        description: `Glucosa ${g} mg/dL en ayunas. Restricción de CHO de alto IG. Confirmar con 2ª medición.`,
      });
    } else if (g >= 100) {
      alerts.push({
        severity: 'warning', icon: '🩸', title: 'Glucemia Alterada (Prediabetes)',
        description: `Glucosa ${g} mg/dL. Optimizar sensibilidad a insulina: fibra, ejercicio, CHO complejos.`,
      });
    }
  }

  // ── HbA1c ───────────────────────────────────────────────────────────────
  if (record.hba1c != null) {
    if (record.hba1c >= 6.5) {
      alerts.push({
        severity: 'danger', icon: '🔬', title: `HbA1c Diagnóstica (${record.hba1c}%)`,
        description: 'HbA1c ≥6.5% confirma DM2. Tratamiento nutricional intensivo coordinado con médico.',
      });
    } else if (record.hba1c >= 5.7) {
      alerts.push({
        severity: 'warning', icon: '🔬', title: `HbA1c Prediabética (${record.hba1c}%)`,
        description: 'Riesgo aumentado de DM2. Intervención preventiva en estilo de vida con carácter urgente.',
      });
    }
  }

  // ── Perfil Lipídico ─────────────────────────────────────────────────────
  if (record.total_chol != null && record.total_chol > 200) {
    alerts.push({
      severity: 'warning', icon: '🫀', title: 'Hipercolesterolemia',
      description: `CT ${record.total_chol} mg/dL. Priorizar AGMI, fibra soluble y esteroles vegetales.`,
    });
  }
  if (record.ldl != null && record.ldl > 130) {
    alerts.push({
      severity: record.ldl > 160 ? 'danger' : 'warning',
      icon: '🫀', title: `LDL Elevado (${record.ldl} mg/dL)`,
      description: 'Reducir grasas saturadas <7% VCT. Evaluar riesgo CV global con médico tratante.',
    });
  }
  if (record.triglycerides != null && record.triglycerides > 150) {
    alerts.push({
      severity: record.triglycerides > 500 ? 'danger' : 'warning',
      icon: '🫀', title: `Hipertrigliceridemia (${record.triglycerides} mg/dL)`,
      description: 'Restricción de azúcares simples, alcohol y CHO refinados. Omega-3 terapéutico.',
    });
  }

  // ── Hemoglobina / Anemia ─────────────────────────────────────────────────
  if (record.hemoglobin != null) {
    const threshold = sex === 'F' ? 12 : 13;
    const severeThreshold = sex === 'F' ? 8 : 9;
    if (record.hemoglobin < severeThreshold) {
      alerts.push({
        severity: 'danger', icon: '🩸', title: 'Anemia Severa',
        description: `Hb ${record.hemoglobin} g/dL. Soporte nutricional intensivo: hierro heme, ácido fólico, B12. Derivar a médico.`,
      });
    } else if (record.hemoglobin < threshold) {
      alerts.push({
        severity: 'warning', icon: '🩸', title: `Déficit Hemoglobínico (${record.hemoglobin} g/dL)`,
        description: 'Optimizar Fe biodisponible + vitamina C. Investigar causa: déficit nutricional vs pérdidas.',
      });
    }
  }

  // ── Albúmina ────────────────────────────────────────────────────────────
  if (record.albumin != null) {
    if (record.albumin < 2.8) {
      alerts.push({
        severity: 'danger', icon: '⚠️', title: 'Hipoalbuminemia Crítica',
        description: `Albúmina ${record.albumin} g/dL. Desnutrición proteica grave. Soporte nutricional urgente.`,
      });
    } else if (record.albumin < 3.5) {
      alerts.push({
        severity: 'danger', icon: '⚠️', title: 'Hipoalbuminemia',
        description: `Albúmina ${record.albumin} g/dL. Incrementar aporte proteico según tolerancia renal.`,
      });
    }
  }

  // ── Función Renal ────────────────────────────────────────────────────────
  if (calc.kdigoStage && !['G1', 'G2'].some(g => calc.kdigoStage!.startsWith(g))) {
    const isSevere = calc.kdigoStage.startsWith('G4') || calc.kdigoStage.startsWith('G5');
    alerts.push({
      severity: isSevere ? 'danger' : 'warning',
      icon: '🫘', title: `ERC ${calc.kdigoStage}`,
      description: `TFG ${calc.gfr} ml/min. Ajuste proteico restrictivo (0.6–0.8 g/kg/día). Control de K, P, Na.`,
    });
  }

  // ── Estado óptimo (sin alertas reales) ──────────────────────────────────
  const hasRealAlert = alerts.some(a => ['warning', 'danger'].includes(a.severity));
  if (!hasRealAlert && calc.bmi != null) {
    alerts.push({
      severity: 'info', icon: '✅', title: 'Parámetros en Rango Óptimo',
      description: 'Sin alertas clínicas activas. Mantener hábitos y programar control preventivo.',
    });
  }

  // Ordenar: danger → warning → info
  const order = { danger: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ══════════════════════════════════════════════════════════════════════════════

function buildPrompt(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  alerts: ClinicalAlert[]
): string {
  const sex = patient.sex === 'F' ? 'Femenino' : 'Masculino';
  const alertTitles = alerts.filter(a => a.severity !== 'info').map(a => a.title).join(', ') || 'Ninguna';

  const biometry = [
    `IMC: ${calc.bmi ?? '—'} (${calc.bmiStatus ?? '—'})`,
    `Cintura: ${record.waist_cm ?? '—'} cm`,
    `ICT: ${calc.ict ?? '—'}`,
    `% Grasa (Faulkner): ${calc.fatPercent ?? '—'}%`,
    `Masa Magra: ${calc.leanMassKg ?? '—'} kg`,
    `Riesgo CV: ${calc.cvRisk ?? '—'}`,
  ].join(' | ');

  const metabolism = [
    `TMB: ${calc.bmr ?? '—'} kcal`,
    `VCT: ${calc.tdee ?? '—'} kcal`,
    `PRO: ${calc.macros?.protG ?? '—'}g (${calc.macros?.protGkg ?? '—'} g/kg)`,
    `CHO: ${calc.macros?.choG ?? '—'}g`,
    `LIP: ${calc.macros?.fatG ?? '—'}g`,
    `Agua: ${calc.waterLiters ?? '—'} L/día`,
  ].join(' | ');

  const labs = [
    record.glucose_mg ? `Glucosa: ${record.glucose_mg} mg/dL` : null,
    record.hba1c ? `HbA1c: ${record.hba1c}%` : null,
    record.total_chol ? `CT: ${record.total_chol} mg/dL` : null,
    record.ldl ? `LDL: ${record.ldl} mg/dL` : null,
    record.triglycerides ? `TG: ${record.triglycerides} mg/dL` : null,
    record.hemoglobin ? `Hb: ${record.hemoglobin} g/dL` : null,
    record.albumin ? `Albúmina: ${record.albumin} g/dL` : null,
    calc.gfr ? `TFG: ${calc.gfr} ml/min (${calc.kdigoStage})` : null,
    record.systolic_bp ? `PA: ${record.systolic_bp}/${record.diastolic_bp} mmHg` : null,
  ].filter(Boolean).join(' | ') || 'No disponibles';

  return `Eres una Nutricionista Clínica de élite en Chile (MINSAL 2024, KDIGO, ESC/ESH 2023).
Realiza un análisis de alta densidad clínica. Sin redundancias ni frases genéricas.

## DATOS DEL PACIENTE
Nombre: ${patient.full_name ?? 'Anónimo'} | Sexo: ${sex} | Edad: ${patient.age ?? '—'} años
Patologías: ${record.pathologies?.join(', ') || 'Sin registro'}
Alertas detectadas: ${alertTitles}

## BIOMETRÍA
${biometry}

## METABOLISMO Y MACROS
${metabolism}

## BIOQUÍMICA
${labs}

## INSTRUCCIONES
Responde ÚNICAMENTE con el siguiente JSON (sin markdown ni texto adicional):
{
  "nutritional_diagnosis": "Diagnóstico formal, técnico, de grado hospitalario (2–3 oraciones)",
  "summary": "Análisis fisiopatológico integrando los datos. Explica interconexiones clave (2–3 párrafos)",
  "recommendations": ["Protocolo 1 específico y accionable", "Protocolo 2", "Protocolo 3", "Protocolo 4", "Protocolo 5"],
  "goals": ["Meta SMART 1 con número y plazo", "Meta SMART 2", "Meta SMART 3"],
  "meal_plan_hints": "Estructura táctica de comidas: tiempos, distribución de macros, suplementación específica",
  "follow_up": "Justificación técnica del próximo control y marcadores a re-evaluar",
  "education_topics": ["Tema educativo 1 para este paciente", "Tema 2", "Tema 3"]
}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// VALIDADOR DE SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

function validateGeminiResponse(data: unknown): data is GeminiAnalysisResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.nutritional_diagnosis === 'string' &&
    typeof d.summary === 'string' &&
    Array.isArray(d.recommendations) &&
    d.recommendations.length >= 3 &&
    Array.isArray(d.goals) &&
    d.goals.length >= 1
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LLAMADA A GEMINI CON RETRY Y TIMEOUT
// ══════════════════════════════════════════════════════════════════════════════

async function callGeminiWithRetry(
  model: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>,
  prompt: string,
  retries = MAX_RETRIES
): Promise<GeminiAnalysisResponse> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const result = await model.generateContent(prompt);
      clearTimeout(timeout);

      const rawText = result.response.text();
      const clean = rawText.replace(/```json\s*|```/g, '').trim();
      const parsed = JSON.parse(clean);

      if (!validateGeminiResponse(parsed)) {
        throw new Error(`Schema inválido en intento ${attempt}`);
      }
      return parsed;
    } catch (err) {
      const isLast = attempt === retries;
      if (isLast) throw err;
      // Backoff exponencial simple
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('Todos los reintentos fallaron');
}

// ══════════════════════════════════════════════════════════════════════════════
// ANÁLISIS PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export async function analyzeWithGemini(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult
): Promise<AIAnalysis> {
  const age = patient.birth_date
    ? Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    : (patient.age ?? 0);

  const ruleAlerts = generateRuleBasedAlerts(record, calc, age, patient.sex ?? '');

  if (GEMINI_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: { temperature: 0.6, maxOutputTokens: 1200 },
      });

      const parsed = await callGeminiWithRetry(model, buildPrompt(patient, record, calc, ruleAlerts));

      return {
        summary: parsed.summary,
        alerts: ruleAlerts,
        recommendations: parsed.recommendations,
        nutritional_diagnosis: parsed.nutritional_diagnosis,
        goals: parsed.goals,
        meal_plan_hints: parsed.meal_plan_hints,
        follow_up: parsed.follow_up,
        education_topics: parsed.education_topics,
        raw_text: JSON.stringify(parsed),
      };
    } catch (err) {
      console.warn('[NutriBot] Gemini falló, usando análisis por reglas:', err);
    }
  }

  return buildRuleBasedAnalysis(patient, record, calc, ruleAlerts);
}

// ══════════════════════════════════════════════════════════════════════════════
// ANÁLISIS POR REGLAS (FALLBACK OFFLINE)
// ══════════════════════════════════════════════════════════════════════════════

function buildRuleBasedAnalysis(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  alerts: ClinicalAlert[]
): AIAnalysis {
  const bmi = calc.bmi;
  const sex = patient.sex === 'F' ? 'XX' : 'XY';
  const tdee = calc.tdee ?? 2000;
  const weight = record.weight_kg ?? 70;
  const protein = calc.macros?.protGkg ?? 1.0;
  const hasObesity = bmi != null && bmi >= 30;
  const hasDM = (record.glucose_mg ?? 0) >= 126 || (record.hba1c ?? 0) >= 6.5;
  const hasHTA = (record.systolic_bp ?? 0) >= 140;
  const hasRenalIssue = calc.kdigoStage && !['G1', 'G2'].some(g => calc.kdigoStage!.startsWith(g));

  // Diagnóstico dinámico
  let diag = `Paciente ${sex}, ${patient.age ?? '?'} años`;
  if (bmi != null) diag += `, IMC ${bmi} (${calc.bmiStatus ?? '?'})`;
  const conditions: string[] = [];
  if (hasDM) conditions.push('síndrome glucémico');
  if (hasHTA) conditions.push('riesgo tensional');
  if (calc.cvRisk === 'Riesgo alto') conditions.push('riesgo cardiovascular elevado');
  if (hasRenalIssue) conditions.push(`disfunción renal ${calc.kdigoStage}`);
  if (conditions.length) diag += `. Presenta: ${conditions.join(', ')}.`;
  diag += ' Requiere intervención nutricional personalizada.';

  // Resumen dinámico
  const summaryParts: string[] = [];
  if (bmi != null) {
    if (bmi >= 30) summaryParts.push(`Exceso ponderal marcado (IMC ${bmi}) con impacto sistémico en sensibilidad insulínica y perfil lipídico.`);
    else if (bmi < 18.5) summaryParts.push(`Déficit de masa estructural (IMC ${bmi}). Riesgo de depleción proteica y compromiso inmunitario.`);
    else summaryParts.push(`Estado ponderal en rango adecuado (IMC ${bmi}).`);
  }
  if (calc.tdee) summaryParts.push(`Requerimiento energético total estimado: ${tdee} kcal/día (TMB ${calc.bmr ?? '?'} kcal).`);
  if (hasDM) summaryParts.push('El perfil glucémico indica necesidad de control de carga glucémica y distribución de CHO.');
  summaryParts.push('Monitoreo periódico de biomarcadores recomendado.');

  // Recomendaciones contextualizadas
  const recs: string[] = [];
  if (hasObesity) {
    recs.push(`Déficit calórico estratégico: ${tdee - 600} kcal/día (déficit de 500–750 kcal respecto VCT).`);
  } else if (bmi != null && bmi < 18.5) {
    recs.push(`Superávit calórico progresivo: ${tdee + 400} kcal/día para recuperación ponderal.`);
  } else {
    recs.push(`Mantener ingesta energética en torno a ${tdee} kcal/día con optimización de macros.`);
  }

  const proteinRec = hasRenalIssue
    ? `Aporte proteico restringido: 0.6–0.8 g/kg/día (~${Math.round(weight * 0.7)} g/día) según estadio KDIGO.`
    : `Aporte proteico de ${protein} g/kg/día (~${Math.round(weight * protein)} g/día) para preservar masa magra.`;
  recs.push(proteinRec);

  if (hasDM) {
    recs.push('Distribución glucémica: CHO complejos de bajo IG en 5–6 tiempos. Fibra soluble ≥25 g/día.');
  } else {
    recs.push('Fraccionamiento en 4–5 comidas para estabilidad glucémica y saciedad sostenida.');
  }

  if (hasHTA) {
    recs.push('Dieta DASH: Na <2 g/día, incrementar K (frutas, vegetales), Mg y Ca dietético.');
  } else {
    recs.push('Incrementar densidad de micronutrientes: vegetales ≥400 g/día, frutas 2–3 porciones.');
  }

  recs.push(`Hidratación estratégica: ${calc.waterLiters ?? 2} L/día. Actividad física aeróbica ≥150 min/sem.`);

  // Metas SMART
  const goals: string[] = [];
  if (hasObesity) {
    goals.push(`Reducir 5% de peso corporal en 12 semanas (~${Math.round(weight * 0.05 * 10) / 10} kg).`);
  } else if (bmi != null && bmi < 18.5) {
    goals.push(`Recuperar ${Math.round(weight * 0.05 * 10) / 10} kg de masa magra en 8–12 semanas.`);
  } else {
    goals.push('Mantener peso actual con mejora en composición corporal (reducción % grasa).');
  }
  if (hasDM) {
    goals.push('Reducir HbA1c en 0.5% en los próximos 3 meses con adherencia al plan alimentario.');
  } else {
    goals.push(`Adherencia al plan alimentario ≥80% durante el primer mes de intervención.`);
  }
  goals.push(`Alcanzar hidratación diaria de ${calc.waterLiters ?? 2} L y actividad física ≥150 min/sem.`);

  return {
    summary: summaryParts.join(' '),
    alerts,
    recommendations: recs,
    nutritional_diagnosis: diag,
    goals,
    meal_plan_hints: hasDM
      ? 'Distribuir CHO en 5–6 tiempos: 20–25% en desayuno, colaciones pequeñas cada 3h. Priorizar legumbres, avena, quinoa.'
      : 'Concentrar mayor densidad calórica en las comidas principales. Colaciones proteicas entre comidas.',
    follow_up: `Control en 30 días: peso, cintura, ${hasDM ? 'glucemia en ayunas, ' : ''}presión arterial${hasRenalIssue ? ', creatinina' : ''}. Ajustar plan según evolución.`,
    education_topics: [
      hasDM ? 'Índice glucémico y carga glucémica' : 'Lectura de etiquetas nutricionales',
      hasObesity ? 'Déficit calórico sin restricción extrema' : 'Densidad nutricional vs densidad calórica',
      'Hidratación y función metabólica',
    ],
    raw_text: '[Análisis offline — configura GEMINI_API_KEY para análisis narrativo IA]',
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// RESPUESTAS OFFLINE PARA CHAT
// ══════════════════════════════════════════════════════════════════════════════

interface OfflineTopic {
  keywords: string[];
  answer: string;
}

const OFFLINE_TOPICS: OfflineTopic[] = [
  {
    keywords: ['imc', 'índice de masa', 'obesidad', 'sobrepeso', 'bajo peso'],
    answer: `**Clasificación IMC (OMS / MINSAL 2024)**
• < 18.5 → Déficit ponderal
• 18.5–24.9 → Rango óptimo ✓
• 25–29.9 → Sobrepeso
• 30–34.9 → Obesidad Grado I
• 35–39.9 → Obesidad Grado II
• ≥ 40 → Obesidad Grado III

⚠️ **Adultos ≥65 años:** Óptimo 23–27.9 | Sobrepeso 28–31.9 (criterio geriátrico adaptado)`,
  },
  {
    keywords: ['mifflin', 'tmb', 'metabolismo basal', 'vct', 'requerimiento energético', 'calorías totales'],
    answer: `**Ecuación Mifflin-St Jeor**
♂ TMB = (10 × kg) + (6.25 × cm) − (5 × edad) + 5
♀ TMB = (10 × kg) + (6.25 × cm) − (5 × edad) − 161

**VCT = TMB × Factor de Actividad**
• Sedentario: × 1.2
• Ligero (1–3 días/sem): × 1.375
• Moderado (3–5 días/sem): × 1.55
• Intenso (6–7 días/sem): × 1.725
• Muy intenso / doble sesión: × 1.9`,
  },
  {
    keywords: ['proteína', 'proteinas', 'aporte proteico', 'gramos de proteína'],
    answer: `**Recomendaciones Proteicas (g/kg/día)**
• Adulto sano: 0.8–1.0
• Adulto mayor ≥65: 1.0–1.2
• Pérdida de peso activa: 1.2–1.6
• Sarcopenia / hipertrofia: 1.6–2.0
• ERC prediálisis: 0.6–0.8
• ERC en diálisis: 1.2–1.5
• Quemados / trauma: hasta 2.5

💡 En obesidad, usar **peso ajustado**: PA = Peso Ideal + 0.25 × (Peso Real − Peso Ideal)`,
  },
  {
    keywords: ['diabetes', 'glucosa', 'dm2', 'glicemia', 'glucemia', 'hba1c', 'insulina', 'prediabetes'],
    answer: `**Manejo Nutricional DM2**
• CHO: 45–60% VCT, preferir IG bajo (<55)
• Fibra soluble: ≥25–30 g/día (avena, legumbres, manzana)
• Distribución: 5–6 tiempos, sin saltarse comidas
• Restricción: azúcares simples, alcohol, CHO refinados
• Meta HbA1c: <7% (individualizar según edad/riesgo)
• AF: ≥150 min/sem aeróbico + 2× resistencia muscular

**Criterios diagnósticos:**
• Glucosa ayunas ≥126 mg/dL × 2 mediciones = DM
• Glucosa 100–125 mg/dL = Alterada en ayunas
• HbA1c 5.7–6.4% = Prediabetes | ≥6.5% = DM`,
  },
  {
    keywords: ['faulkner', 'pliegue', 'grasa corporal', 'composición corporal', 'adiposidad', '% grasa'],
    answer: `**Fórmula de Faulkner (4 pliegues cutáneos)**
% Grasa = (Σ4 pliegues × 0.153) + 5.783
Σ = Tríceps + Subescapular + Supraespinal + Abdominal (mm)

**Rangos de referencia:**
| Categoría | ♀ | ♂ |
|-----------|---|---|
| Atlético | <20% | <13% |
| Fitness | 21–24% | 14–17% |
| Normal | 25–31% | 18–24% |
| Exceso | ≥32% | ≥25% |`,
  },
  {
    keywords: ['presión', 'hta', 'hipertensión', 'dash', 'tensión arterial', 'sodio', 'sal'],
    answer: `**Clasificación Tensional ESC/ESH 2023**
• Óptima: <120/80 mmHg
• Normal: 120–129 / 80–84
• Normal-Alta: 130–139 / 85–89
• HTA Grado I: 140–159 / 90–99
• HTA Grado II: 160–179 / 100–109
• HTA Grado III: ≥180 / ≥110

**Protocolo DASH:**
• Na: <2 g/día (<5 g sal)
• ↑ Potasio (frutas, vegetales, legumbres)
• ↑ Calcio y Magnesio dietético
• Reducir grasas saturadas y alcohol`,
  },
  {
    keywords: ['cockcroft', 'tfg', 'filtración glomerular', 'renal', 'creatinina', 'kdigo', 'erc'],
    answer: `**TFG — Cockcroft-Gault**
TFG = [(140 − edad) × peso(kg)] / (72 × creatinina sérica) × 0.85 ♀

**Clasificación KDIGO:**
• G1: ≥90 ml/min → Función normal
• G2: 60–89 → Descenso leve
• G3a: 45–59 → Moderado-leve
• G3b: 30–44 → Moderado-grave
• G4: 15–29 → Grave
• G5: <15 → Falla renal (diálisis)

**Nutrición ERC:** Proteína 0.6–0.8 g/kg | Restringir K, P, Na según estadio`,
  },
  {
    keywords: ['chumlea', 'rodilla', 'altura de rodilla', 'talla estimada', 'postrado'],
    answer: `**Estimación de Talla — Chumlea (pacientes postrados)**
♂ Talla (cm) = 64.19 − (0.04 × edad) + (2.02 × altura rodilla cm)
♀ Talla (cm) = 84.88 − (0.24 × edad) + (1.83 × altura rodilla cm)

Medir con el paciente en decúbito supino, rodilla flexionada a 90°.`,
  },
  {
    keywords: ['cintura', 'ict', 'índice cintura', 'grasa visceral', 'cardiovascular', 'riesgo cv'],
    answer: `**Evaluación Adiposidad Abdominal**

**Circunferencia de Cintura (MINSAL):**
♀: <80 cm Normal | 80–87 cm Aumentado | ≥88 cm Alto riesgo
♂: <94 cm Normal | 94–101 cm Aumentado | ≥102 cm Alto riesgo

**ICT (Índice Cintura/Talla):**
• <0.5 → Bajo riesgo cardiometabólico
• 0.5–0.59 → Riesgo moderado
• ≥0.6 → Riesgo elevado

El ICT predice riesgo CV con mayor precisión que el IMC en adultos.`,
  },
  {
    keywords: ['lorenz', 'peso ideal', 'peso teórico', 'peso deseable'],
    answer: `**Peso Ideal — Fórmula de Lorenz**
♂ PI = Talla(cm) − 100 − [(Talla − 150) / 4]
♀ PI = Talla(cm) − 100 − [(Talla − 150) / 2.5]

Útil para calcular requerimientos en pacientes con obesidad (usar peso ajustado).
**Peso ajustado** = PI + 0.25 × (Peso real − PI)`,
  },
  {
    keywords: ['adulto mayor', 'geriátrico', 'anciano', 'sarcopenia', 'envejecimiento'],
    answer: `**Nutrición Geriátrica (≥65 años)**
• Energía: Revisar actividad; frecuente subestimación
• Proteína: 1.0–1.2 g/kg/día (hasta 1.5 en sarcopenia)
• Vitamina D: 800–2000 UI/día (riesgo de déficit)
• Calcio: 1200 mg/día (fractura osteoporótica)
• Hidratación: sensación de sed disminuida — educación activa
• Fibra: 20–30 g/día para tránsito intestinal

**Cribado:** MNA (Mini Nutritional Assessment) en toda evaluación geriátrica`,
  },
  {
    keywords: ['omega', 'ácido graso', 'grasas', 'lípidos', 'colesterol', 'ldl', 'hdl'],
    answer: `**Manejo Nutricional de Dislipidemia**
• Grasas saturadas: <7% VCT (reemplazar por AGMI/AGPI)
• Grasas trans: <1% VCT (eliminar)
• Colesterol dietético: <200 mg/día en hipercolesterolemia
• Omega-3 (EPA+DHA): 2–4 g/día para hipertrigliceridemia
• Fibra soluble: ≥10 g/día (β-glucanos, pectina)
• Esteroles vegetales: 2 g/día reducen LDL ~10%

**Meta lipídica general:** CT <200 | LDL <130 | HDL >40(♂) >50(♀) | TG <150`,
  },
];

export function generateOfflineAnswer(question: string): string {
  const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Scoring por número de palabras clave coincidentes
  let bestScore = 0;
  let bestAnswer = '';

  for (const topic of OFFLINE_TOPICS) {
    const score = topic.keywords.filter(kw =>
      q.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    ).length;

    if (score > bestScore) {
      bestScore = score;
      bestAnswer = topic.answer;
    }
  }

  if (bestScore > 0) return bestAnswer;

  return `🐱 Para esta consulta necesito conexión a Gemini.
Puedo responder en modo offline sobre:
• **Antropometría:** IMC, Lorenz, Chumlea, ICT, cintura
• **Composición:** Faulkner, % grasa, sarcopenia
• **Metabolismo:** Mifflin-St Jeor, VCT, factores de actividad
• **Patologías:** DM2, HTA/DASH, dislipidemia, ERC/KDIGO
• **Proteínas:** requerimientos por patología y edad
• **Adulto mayor:** nutrición geriátrica, MNA

Configura **GEMINI_API_KEY** para análisis clínico narrativo de alta densidad.`;
}