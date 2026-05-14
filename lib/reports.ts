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
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 4px solid ${COLORS.neon}; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 28px; font-weight: 900; color: #000; margin: 0; }
          .subtitle { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
          
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; background: #f0f0f0; padding: 8px 12px; border-left: 4px solid ${COLORS.pink}; margin-bottom: 15px; }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .data-item { font-size: 13px; margin-bottom: 5px; }
          .label { font-weight: bold; color: #555; }
          
          .ai-box { background: rgba(163, 255, 0, 0.05); border: 1px solid ${COLORS.neon}; padding: 15px; border-radius: 8px; }
          .ai-text { font-size: 14px; line-height: 1.6; font-style: italic; }
          
          .footer { margin-top: 50px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">INFORME CLÍNICO NUTRICIONAL</h1>
            <span class="subtitle">NutriCESFAM System Override</span>
          </div>
          <div style="text-align: right">
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
            <div class="data-item"><span class="label">EDAD:</span> ${new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} AÑOS</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">EVALUACIÓN ANTROPOMÉTRICA</div>
          <div class="grid">
            <div class="data-item"><span class="label">PESO:</span> ${record.weight_kg} KG</div>
            <div class="data-item"><span class="label">TALLA:</span> ${record.height_cm} CM</div>
            <div class="data-item"><span class="label">IMC:</span> ${calc.bmi} (${calc.bmiStatus})</div>
            <div class="data-item"><span class="label">PESO IDEAL:</span> ${calc.idealWeight} KG</div>
            <div class="data-item"><span class="label">% GRASA (FAULKNER):</span> ${calc.fatPercent}%</div>
            <div class="data-item"><span class="label">MASA MAGRA:</span> ${calc.leanMassKg} KG</div>
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
