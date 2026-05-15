// lib/ai.ts — Motor de Inteligencia Bioreactiva v8.0
import { ClinicalRecord, Patient, AIAnalysis, ClinicalAlert, CalculationResult } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export function generateRuleBasedAlerts(
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  age: number,
  sex: 'M' | 'F' | ''
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (calc.bmi !== null) {
    if (calc.bmi < 18.5) {
      alerts.push({ severity: 'danger', icon: '💀', title: 'RIESGO DE CAQUEXIA',
        description: `IMC crítico ${calc.bmi}. Prioridad absoluta en soporte proteico y micronutrientes.` });
    }
    if (calc.bmi >= 35) {
      alerts.push({ severity: 'danger', icon: '🚨', title: 'ALERTA DE MORBILIDAD',
        description: `Obesidad severa. Riesgo sistémico crítico. Iniciar protocolo de control metabólico.` });
    }
  }

  if (calc.cvRisk === 'Riesgo alto') {
    alerts.push({ severity: 'danger', icon: '💔', title: 'AMENAZA CARDIOVASCULAR',
      description: `Perímetro de cintura en zona de peligro. Adiposidad visceral comprometida.` });
  }

  if (record.systolic_bp && record.systolic_bp >= 140) {
    alerts.push({ severity: 'danger', icon: '💉', title: 'CRISIS HIPERTENSIVA',
      description: `Protocolo DASH requerido de inmediato. Monitorear daño a órganos diana.` });
  }

  if (calc.kdigoStage && calc.kdigoStage.includes('G3')) {
    alerts.push({ severity: 'danger', icon: '🫘', title: 'FILTRACIÓN COMPROMETIDA',
      description: `Estadio KDIGO avanzado. Ajustar farmacología y aporte renal.` });
  }

  return alerts;
}

function buildClinicalPrompt(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  ruleAlerts: ClinicalAlert[]
): string {
  return `ESTÁS OPERANDO COMO EL NÚCLEO DE BIO-INTELIGENCIA NUTRICESFAM.
TU MISIÓN ES REALIZAR UNA DISECCIÓN NEURAL EXHAUSTIVA DE LOS DATOS BIOMÉTRICOS SUMINISTRADOS.

REGLAS CRÍTICAS:
1. IDIOMA: Español clínico de alta complejidad.
2. TONO: Profesional, técnico, autoritario y preciso.
3. PROHIBICIÓN: NO menciones que eres una IA, ni que procesas datos. Presenta los hallazgos como HECHOS CLÍNICOS.
4. PROFUNDIDAD: Analiza la relación fisiopatológica entre el IMC, la función renal (TFG), la sarcopenia (Grip) y el riesgo CV.

DATOS DEL SUJETO:
- IDENTIDAD: ${patient.full_name || 'DESCONOCIDO'} | EDAD: ${patient.age} | GENOTIPO: ${patient.sex} | PREVISIÓN: ${patient.insurance}

BIOMETRÍA Y TELEMETRÍA:
- IMC: ${calc.bmi} (${calc.bmiStatus})
- COMPOSICIÓN: ${calc.fatPercent}% adiposidad | ${calc.leanMassKg}kg masa libre de grasa
- RIESGO SISTÉMICO: CV: ${calc.cvRisk} | ICT: ${calc.ict}
- HEMODINÁMICA: PA ${record.systolic_bp}/${record.diastolic_bp} (${calc.bpStatus})

METABOLISMO DE DISECCIÓN:
- TMB: ${calc.bmr} kcal | VCT: ${calc.tdee} kcal
- HIDRATACIÓN: ${calc.waterLiters} L/24h
- MACRO-PROTOCOLO: PRO ${record.macro_prot_pct}% | CHO ${record.macro_cho_pct}% | LIP ${record.macro_fat_pct}%

HALLAZGOS CLÍNICOS AVANZADOS:
- FUNCIÓN RENAL: TFG ${calc.gfr} ml/min | ESTADIO: ${calc.kdigoStage}
- CAPACIDAD FUNCIONAL: Sarcopenia: ${calc.sarcopeniaRisk} | Dinamometría: ${record.grip_strength_kg}kg
- SCREENING GERIÁTRICO: MNA: ${record.mna_score} | VGS: ${record.vgs_status}

ANAMNESIS:
- PATOLOGÍAS: ${record.pathologies?.join(', ')}
- OBSERVACIONES: ${record.observations}

ALERTAS ACTIVAS:
${ruleAlerts.map(a => `[${a.severity}] ${a.title}`).join('\n')}

ESTRUCTURA DE RESPUESTA (JSON PURO):
{
  "nutritional_diagnosis": "Diagnóstico clínico integral utilizando terminología médica avanzada.",
  "summary": "Análisis profundo de la interacción entre los marcadores antropométricos, renales y hemodinámicos. Relaciona la composición corporal con el gasto energético y el riesgo metabólico detectado.",
  "recommendations": [
    "Intervención nutricional específica basada en guías clínicas internacionales.",
    "Ajuste de micronutrientes crítico.",
    "Protocolo de actividad física adaptado al riesgo sarcopénico.",
    "Plan de monitoreo de indicadores bioquímicos."
  ],
  "goals": ["Objetivo SMART 1 (Bio-estabilización)", "Objetivo SMART 2 (Optimización Metabólica)"],
  "follow_up": "Calendario de re-evaluación y metas de corto plazo."
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
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 2048 }
      });
      const prompt = buildClinicalPrompt(patient, record, calc, ruleAlerts);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);

      return {
        summary: parsed.summary,
        alerts: ruleAlerts,
        recommendations: parsed.recommendations,
        nutritional_diagnosis: parsed.nutritional_diagnosis,
        goals: parsed.goals,
        follow_up: parsed.follow_up,
        raw_text: response.text(),
      };
    } catch (err) {
      console.error('DISECCIÓN FALLIDA:', err);
    }
  }

  return {
    summary: 'SISTEMA EN MODO OFFLINE. La interacción de datos sugiere un estado nutricional que requiere monitoreo continuo. Se recomienda validar parámetros renales y antropométricos en el próximo ciclo.',
    alerts: ruleAlerts,
    recommendations: ['Bio-estabilización mediante hidratación', 'Cumplimiento estricto de la distribución de macronutrientes'],
    nutritional_diagnosis: `Diagnóstico basado en parámetros estándar: ${calc.bmiStatus || 'Estable'}.`,
    goals: ['Lograr homeostasis ponderal', 'Prevenir degradación muscular'],
    follow_up: 'Re-interrogación en 15 ciclos solares (días).',
    raw_text: 'OFFLINE_FALLBACK',
  };
}
