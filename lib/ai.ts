// lib/ai.ts — Motor de IA Clínica con Google Gemini + Reglas MINSAL
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
      alerts.push({ severity: 'warning', icon: '⚖️', title: 'Bajo Peso',
        description: `IMC ${calc.bmi} — Riesgo de desnutrición. Evaluar albúmina y hemoglobina.` });
    }
    if (calc.bmi >= 30) {
      alerts.push({ severity: 'danger', icon: '🚨', title: 'Obesidad Detectada',
        description: `IMC ${calc.bmi} — Iniciar protocolo hipocalórico y evaluar riesgo metabólico.` });
    }
  }

  if (calc.cvRisk === 'Riesgo alto') {
    alerts.push({ severity: 'danger', icon: '❤️', title: 'Riesgo CV Elevado',
      description: `Perímetro de cintura crítico. Priorizar reducción de grasa visceral.` });
  }

  if (record.systolic_bp && record.systolic_bp >= 140) {
    alerts.push({ severity: 'danger', icon: '💉', title: 'HTA Confirmada',
      description: `PA ${record.systolic_bp}/${record.diastolic_bp} mmHg. Dieta DASH recomendada.` });
  }

  if (calc.kdigoStage && !calc.kdigoStage.startsWith('G1')) {
    alerts.push({ severity: 'danger', icon: '🫘', title: `ERC Estadio ${calc.kdigoStage}`,
      description: `TFG ${calc.gfr} ml/min. Ajustar aporte proteico y fósforo.` });
  }

  return alerts;
}

function buildClinicalPrompt(
  patient: Partial<Patient>,
  record: Partial<ClinicalRecord>,
  calc: CalculationResult,
  ruleAlerts: ClinicalAlert[]
): string {
  return `Eres una Nutricionista Clínica experta de Chile. Tu objetivo es realizar una DISECCIÓN NEURAL del estado del paciente.
Utiliza un lenguaje técnico, preciso y profesional.

REGLAS:
1. Idioma: Español.
2. Formato: JSON puro.
3. Detalle: Máxima profundidad clínica.

DATOS DEL PACIENTE:
- Nombre: ${patient.full_name || 'Paciente'}
- Edad: ${patient.age} años | Sexo: ${patient.sex} | Previsión: ${patient.insurance}

BIOMETRÍA:
- IMC: ${calc.bmi} (${calc.bmiStatus})
- Composición: ${calc.fatPercent}% grasa | ${calc.leanMassKg}kg masa magra
- Riesgo CV: ${calc.cvRisk} | ICT: ${calc.ict}
- Tensión Arterial: ${record.systolic_bp}/${record.diastolic_bp} (${calc.bpStatus})

METABOLISMO:
- TMB: ${calc.bmr} kcal | VCT: ${calc.tdee} kcal
- Agua: ${calc.waterLiters} L/día
- Macros Sugeridos: PRO ${record.macro_prot_pct}% | CHO ${record.macro_cho_pct}% | LIP ${record.macro_fat_pct}%

HALLAZGOS CLÍNICOS:
- TFG Renal: ${calc.gfr} ml/min (${calc.kdigoStage})
- Sarcopenia: ${calc.sarcopeniaRisk} | Grip: ${record.grip_strength_kg}kg
- MNA: ${record.mna_score} | VGS: ${record.vgs_status}

ANAMNESIS:
- Patologías: ${record.pathologies?.join(', ')}
- Observaciones: ${record.observations}

ALERTAS:
${ruleAlerts.map(a => `[${a.severity}] ${a.title}`).join('\n')}

Responde con este JSON:
{
  "nutritional_diagnosis": "Diagnóstico técnico estructurado",
  "summary": "Análisis fisiopatológico detallado de la relación entre datos",
  "recommendations": ["Rec 1", "Rec 2", "Rec 3", "Rec 4"],
  "goals": ["Meta SMART 1", "Meta SMART 2"],
  "follow_up": "Plan de monitoreo"
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
      const parsed = JSON.parse(response.text().replace(/```json|```/g, '').trim());

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
      console.warn('IA Gemini falló, usando fallback:', err);
    }
  }

  return {
    summary: 'Análisis basado en heurística de sistema. El estado antropométrico sugiere seguimiento periódico.',
    alerts: ruleAlerts,
    recommendations: ['Mantener hidratación adecuada', 'Seguir distribución de macronutrientes prescrita'],
    nutritional_diagnosis: `Paciente con ${calc.bmiStatus?.toLowerCase() || 'parámetros estables'}.`,
    goals: ['Lograr estabilidad de peso', 'Optimizar ingesta de micronutrientes'],
    follow_up: 'Control en 30 días.',
    raw_text: 'OFFLINE_FALLBACK',
  };
}
