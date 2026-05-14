import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Patient, ClinicalRecord, CalculationResult, AIAnalysis } from '../types';
import { COLORS } from '../constants/theme';

export async function generateClinicalReport(
  patient: Patient,
  record: ClinicalRecord,
  calc: CalculationResult,
  ai: AIAnalysis
) {
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 40px; background-color: ${COLORS.bg}; color: ${COLORS.text}; }
          .header { border-bottom: 4px solid ${COLORS.neon}; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 28px; font-weight: 900; color: ${COLORS.neon}; margin: 0; letter-spacing: 2px; }
          .subtitle { font-size: 14px; color: ${COLORS.pink}; text-transform: uppercase; letter-spacing: 1px; }
          
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; background: ${COLORS.bg1}; color: ${COLORS.neon}; padding: 8px 12px; border-left: 4px solid ${COLORS.pink}; margin-bottom: 15px; text-transform: uppercase; }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .data-item { font-size: 13px; margin-bottom: 5px; color: ${COLORS.text}; }
          .label { font-weight: bold; color: ${COLORS.muted}; }
          
          .ai-box { background: rgba(163, 255, 0, 0.05); border: 1px solid ${COLORS.neon}; padding: 15px; border-radius: 8px; }
          .ai-text { font-size: 14px; line-height: 1.6; color: ${COLORS.text}; }
          
          .footer { margin-top: 50px; font-size: 10px; color: ${COLORS.dim}; text-align: center; border-top: 1px solid ${COLORS.bg4}; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">INFORME CLÍNICO NUTRICIONAL</h1>
            <span class="subtitle">NutriCESFAM System Override</span>
          </div>
          <div style="text-align: right; color: ${COLORS.muted}; font-size: 12px;">
            <span class="label">FECHA:</span> ${new Date().toLocaleDateString('es-CL')}<br/>
            <span class="label">S. ID:</span> ${patient.id?.slice(0,8)}
          </div>
        </div>

        <div class="section">
          <div class="section-title">DATOS DEL SUJETO</div>
          <div class="grid">
            <div class="data-item"><span class="label">NOMBRE:</span> ${patient.full_name.toUpperCase()}</div>
            <div class="data-item"><span class="label">PREVISIÓN:</span> ${patient.insurance}</div>
            <div class="data-item"><span class="label">SEXO:</span> ${patient.sex === 'M' ? 'MASCULINO' : 'FEMENINO'}</div>
            <div class="data-item"><span class="label">EDAD:</span> ${patient.birth_date ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : 'N/A'} AÑOS</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">EVALUACIÓN ANTROPOMÉTRICA</div>
          <div class="grid">
            <div class="data-item"><span class="label">PESO:</span> ${record.weight_kg} KG</div>
            <div class="data-item"><span class="label">TALLA:</span> ${record.height_cm} CM</div>
            <div class="data-item"><span class="label">IMC:</span> ${calc.bmi} (${calc.bmiStatus})</div>
            <div class="data-item"><span class="label">PESO IDEAL:</span> ${calc.idealWeight} KG</div>
            <div class="data-item"><span class="label">% GRASA:</span> ${calc.fatPercent}%</div>
            <div class="data-item"><span class="label">MASA MAGRA:</span> ${calc.leanMassKg} KG</div>
          </div>
        </div>

        ${calc.somatotype || calc.sarcopeniaRisk ? `
        <div class="section">
          <div class="section-title">SOMATOTIPO Y SARCOPENIA</div>
          <div class="grid">
            ${calc.somatotype ? `
            <div class="data-item"><span class="label">SOMATOTIPO:</span> ${calc.somatotype.endo} - ${calc.somatotype.meso} - ${calc.somatotype.ecto}</div>
            ` : ''}
            ${calc.sarcopeniaRisk ? `
            <div class="data-item"><span class="label">RIESGO SARCOPENIA:</span> ${calc.sarcopeniaRisk}</div>
            ` : ''}
            ${record.grip_strength_kg ? `<div class="data-item"><span class="label">FUERZA AGARRE:</span> ${record.grip_strength_kg} KG</div>` : ''}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">ESTADO CLÍNICO Y RENAL</div>
          <div class="grid">
            <div class="data-item"><span class="label">P. ARTERIAL:</span> ${record.systolic_bp}/${record.diastolic_bp} mmHg (${calc.bpStatus})</div>
            <div class="data-item"><span class="label">GFR (RENAL):</span> ${calc.gfr ? `${calc.gfr} ml/min` : 'N/A'}</div>
            <div class="data-item"><span class="label">ESTADIO KDIGO:</span> ${calc.kdigoStage || 'N/A'}</div>
            <div class="data-item"><span class="label">PÉRDIDA PESO:</span> ${calc.weightLossPct ? `${calc.weightLossPct}% (${calc.weightLossRisk})` : 'ESTABLE'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">REQUERIMIENTOS Y METABOLISMO</div>
          <div class="grid">
            <div class="data-item"><span class="label">TMB:</span> ${calc.bmr} KCAL</div>
            <div class="data-item"><span class="label">VCT (REQ. DIARIO):</span> ${calc.tdee} KCAL</div>
            <div class="data-item"><span class="label">REQ. HÍDRICO:</span> ${calc.waterLiters} L/DÍA</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">ANAMNESIS Y OBSERVACIONES</div>
          <div class="data-item"><span class="label">TIPO DE DIETA:</span> ${record.diet_type || 'OMNÍVORA'}</div>
          <div class="data-item" style="margin-top: 10px;"><span class="label">OBSERVACIONES:</span><br/>${record.observations || 'SIN OBSERVACIONES ADICIONALES'}</div>
        </div>

        <div class="section">
          <div class="section-title">DIAGNÓSTICO IA (GEMINI 1.5 FLASH)</div>
          <div class="ai-box">
            <p class="ai-text"><strong>Diagnóstico:</strong> ${ai.nutritional_diagnosis}</p>
            <p class="ai-text"><strong>Observaciones:</strong> ${ai.summary}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">RECOMENDACIONES</div>
          <ul>
            ${ai.recommendations.map(r => `<li style="font-size: 13px; margin-bottom: 5px">${r}</li>`).join('')}
          </ul>
        </div>

        <div class="footer">
          ESTE DOCUMENTO ES UN RESUMEN GENERADO POR EL SISTEMA NUTRICESFAM.<br/>
          LA INTERPRETACIÓN FINAL DEBE SER REALIZADA POR UN PROFESIONAL DE LA SALUD.
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
