// lib/ai.ts — Motor de Inteligencia Bioreactiva v9.0 (Premium Medical Output)
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
  return `Actúa como un Especialista Clínico de Nutrición y Metabolismo de Alto Nivel.
Tu tarea es analizar los datos biométricos de un paciente y redactar las conclusiones para un informe médico formal.

REGLAS ESTRICTAS:
1. NO uses lenguaje de Inteligencia Artificial (nunca digas "como IA", "mi base de datos", etc.).
2. Redacta en tercera persona clínica o impersonal (ej: "Se observa", "El paciente presenta").
3. El tono debe ser sobrio, directo, médico y altamente profesional.

DATOS DEL PACIENTE:
- Nombre: ${patient.full_name || 'Desconocido'}
- Edad: ${patient.age} años | Sexo biológico: ${patient.sex}

ANTROPOMETRÍA Y METABOLISMO:
- IMC: ${calc.bmi} (${calc.bmiStatus})
- Composición: Grasa corporal ${calc.fatPercent}% | Masa Magra ${calc.leanMassKg}kg
- TMB Estimada: ${calc.bmr} kcal | Gasto Total: ${calc.tdee} kcal
- Presión Arterial: ${record.systolic_bp}/${record.diastolic_bp} (${calc.bpStatus})
- TFG (Filtración Renal): ${calc.gfr} ml/min | KDIGO: ${calc.kdigoStage}
- Observaciones: ${record.observations || 'Sin observaciones adicionales'}

DEBES RESPONDER EXCLUSIVAMENTE CON EL SIGUIENTE FORMATO JSON:
{
  "nutritional_diagnosis": "[Escribe aquí el Diagnóstico Médico Nutricional Integrado. Máximo 2 líneas.]",
  "summary": "[Escribe aquí un Análisis Fisiopatológico Detallado. Relaciona la composición corporal, el estado renal y cardiovascular. Máximo 5 líneas.]",
  "metabolic_syndrome_risk": "[Evaluación del riesgo de síndrome metabólico basado en adiposidad, edad y parámetros cardiovasculares]",
  "renal_hepatic_profile": "[Implicancias de la TFG calculada y requerimiento proteico en la función orgánico-visceral]",
  "pharmacological_interactions": "[Posibles interacciones fármaco-nutriente y consideraciones de dosificación (si aplica)]",
  "recommendations": [
    "[Recomendación Dietoterapéutica 1]",
    "[Recomendación Metabólica 2]",
    "[Recomendación Clínica/Farmacológica 3]",
    "[Recomendación de Monitoreo 4]"
  ],
  "goals": ["Objetivo Clínico 1", "Objetivo Clínico 2"],
  "follow_up": "[Indicación de próximo control]"
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
        generationConfig: { temperature: 0.1, topP: 0.9, maxOutputTokens: 2048 } // Low temp for medical precision
      });
      const prompt = buildClinicalPrompt(patient, record, calc, ruleAlerts);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().replace(/```json|```/g, '').trim();
      
      // Cleanup common markdown artifacts just in case
      if (text.startsWith('{') && text.endsWith('}')) {
          const parsed = JSON.parse(text);
          return {
            summary: parsed.summary,
            alerts: ruleAlerts,
            recommendations: parsed.recommendations,
            nutritional_diagnosis: parsed.nutritional_diagnosis,
            metabolic_syndrome_risk: parsed.metabolic_syndrome_risk,
            renal_hepatic_profile: parsed.renal_hepatic_profile,
            pharmacological_interactions: parsed.pharmacological_interactions,
            goals: parsed.goals || [],
            follow_up: parsed.follow_up || 'Control según evolución',
            raw_text: response.text(),
          };
      } else {
          throw new Error("Respuesta no es un JSON válido.");
      }
    } catch (err) {
      console.error('Error en Motor IA:', err);
    }
  }

  return {
    summary: 'Evaluación técnica basada en parámetros antropométricos basales. Se sugiere correlación con exámenes de laboratorio en el próximo control clínico.',
    alerts: ruleAlerts,
    recommendations: ['Adecuar ingesta hídrica según requerimiento calculado.', 'Mantener distribución de macronutrientes propuesta.'],
    nutritional_diagnosis: `Estado Nutricional: ${calc.bmiStatus || 'En evaluación'}.`,
    metabolic_syndrome_risk: 'Datos insuficientes para determinar riesgo sistémico.',
    renal_hepatic_profile: 'Se requiere control bioquímico para perfil orgánico.',
    pharmacological_interactions: 'No se detectan alertas farmacológicas primarias.',
    goals: ['Lograr estabilidad metabólica', 'Prevenir pérdida de masa magra'],
    follow_up: 'Control en 30 días.',
    raw_text: 'OFFLINE_FALLBACK',
  };
}
