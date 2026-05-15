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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@700;900&display=swap');
          
          body { 
            font-family: 'Space Mono', monospace; 
            padding: 0; margin: 0;
            background-color: #050505; color: #f5f5f5; 
          }

          .container { padding: 40px; }
          .background-fx {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background-image: radial-gradient(${COLORS.crimson} 0.5px, transparent 0.5px);
            background-size: 15px 15px; opacity: 0.05; z-index: -1;
          }

          .header { 
            border: 2px solid ${COLORS.crimson}; padding: 25px; 
            display: flex; justify-content: space-between; align-items: center;
            background: rgba(220, 20, 60, 0.03); margin-bottom: 40px;
            box-shadow: 0 0 20px rgba(220, 20, 60, 0.1);
          }

          .title-area h1 { 
            font-family: 'Orbitron', sans-serif; font-size: 26px; 
            color: ${COLORS.crimson}; margin: 0; text-transform: uppercase;
            letter-spacing: 3px;
          }

          .status-stamp {
            border: 2px solid ${COLORS.poison}; color: ${COLORS.poison};
            padding: 4px 12px; font-weight: 900; font-size: 12px;
            letter-spacing: 2px;
          }

          .section { margin-bottom: 30px; border: 1px solid #1a1a1f; background: rgba(10, 10, 13, 0.9); }
          .section-head { 
            background: #0a0a0d; padding: 12px 20px; 
            border-bottom: 1px solid #1a1a1f; display: flex; align-items: center; 
          }
          .section-title { font-size: 11px; font-weight: bold; color: ${COLORS.crimson}; text-transform: uppercase; letter-spacing: 2px; }

          .data-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 20px; }
          .cell { border-bottom: 1px solid #111; padding-bottom: 8px; }
          .label { font-size: 8px; color: #555; text-transform: uppercase; display: block; margin-bottom: 4px; }
          .value { font-size: 12px; color: #fff; font-weight: 700; }

          .macro-panel { display: flex; padding: 20px; gap: 20px; }
          .macro-item { flex: 1; padding: 15px; background: rgba(255,255,255,0.02); border-left: 3px solid ${COLORS.crimson}; }
          .macro-val { font-size: 18px; font-weight: 900; color: #fff; margin-top: 5px; }

          .neural-box {
            margin: 20px; padding: 25px;
            background: rgba(102, 0, 204, 0.03); border: 1px solid rgba(102, 0, 204, 0.15);
            position: relative;
          }
          .neural-box::after {
            content: "SYSTEM_DIAGNOSIS_LOG"; position: absolute; top: -8px; right: 20px;
            background: #050505; color: ${COLORS.purple}; font-size: 8px; padding: 0 10px; font-weight: 900;
          }
          .neural-text { font-size: 12px; line-height: 1.8; text-align: justify; color: #ccc; }

          .recs-area { padding: 0 20px 20px 20px; }
          .rec-item { font-size: 11px; color: #999; margin-bottom: 10px; display: flex; gap: 10px; }
          .rec-bullet { color: ${COLORS.poison}; font-weight: 900; }

          .footer { 
            margin-top: 60px; padding: 30px; border-top: 1px solid #1a1a1f;
            display: flex; justify-content: space-between; align-items: flex-end;
          }
          .footer-text { font-size: 9px; color: #333; line-height: 1.5; }

          @media print { .section { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="background-fx"></div>

          <div class="header">
            <div class="title-area">
              <h1>NEURAL DOSSIER</h1>
              <p style="font-size: 10px; color: #444; margin: 5px 0;">TRANS-MISSION PROTOCOL v6.6.6</p>
            </div>
            <div class="status-stamp">AUTHORIZED</div>
          </div>

          <div class="section">
            <div class="section-head"><span class="section-title">SUBJECT IDENTIFICATION</span></div>
            <div class="data-grid">
              <div class="cell"><span class="label">ALIAS</span><span class="value">${patient.full_name.toUpperCase()}</span></div>
              <div class="cell"><span class="label">GENOTYPE</span><span class="value">${patient.sex === 'M' ? 'XY' : 'XX'}</span></div>
              <div class="cell"><span class="label">GENESIS</span><span class="value">${patient.age} Y</span></div>
              <div class="cell"><span class="label">REG. DATE</span><span class="value">${new Date().toLocaleDateString('es-CL')}</span></div>
              <div class="cell"><span class="label">INSURANCE</span><span class="value">${patient.insurance}</span></div>
              <div class="cell"><span class="label">CORE ID</span><span class="value">${patient.id?.slice(0,8).toUpperCase()}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-head"><span class="section-title">BIOMETRIC TELEMETRY</span></div>
            <div class="data-grid">
              <div class="cell"><span class="label">WEIGHT</span><span class="value">${record.weight_kg} KG</span></div>
              <div class="cell"><span class="label">HEIGHT</span><span class="value">${record.height_cm} CM</span></div>
              <div class="cell"><span class="label">IMC</span><span class="value" style="color:${COLORS.crimson}">${calc.bmi}</span></div>
              <div class="cell"><span class="label">FAT %</span><span class="value">${calc.fatPercent}%</span></div>
              <div class="cell"><span class="label">LEAN MASS</span><span class="value">${calc.leanMassKg} KG</span></div>
              <div class="cell"><span class="label">CV RISK</span><span class="value" style="color:${COLORS.crimson}">${calc.cvRisk}</span></div>
              <div class="cell"><span class="label">RENAL (GFR)</span><span class="value">${calc.gfr || 'N/A'}</span></div>
              <div class="cell"><span class="label">KDIGO</span><span class="value">${calc.kdigoStage?.split(' ')[0] || 'N/A'}</span></div>
            </div>
            <div style="padding: 0 20px 20px 20px;">
              <svg width="100%" height="80" viewBox="0 0 500 80">
                <path d="M 0,40 L 50,40 L 60,10 L 80,70 L 90,40 L 140,40 L 150,20 L 170,60 L 180,40 L 500,40" fill="none" stroke="${COLORS.poison}" stroke-width="1.5" opacity="0.4" />
                <text x="10" y="70" fill="#333" font-size="8">NEURAL_PULSE_MONITOR_ACTIVE</text>
              </svg>
            </div>
          </div>

          <div class="section">
            <div class="section-head"><span class="section-title">RESOURCE ALLOCATION (MACROS)</span></div>
            <div class="macro-panel">
              <div class="macro-item">
                <span class="label">PROTEINS</span>
                <div class="macro-val">${calc.macros?.protG}G</div>
                <span style="font-size: 8px; color: #444;">${record.macro_prot_pct}% | ${calc.macros?.protGkg} g/kg</span>
              </div>
              <div class="macro-item" style="border-left-color: ${COLORS.purple}">
                <span class="label">CARBOHYDRATES</span>
                <div class="macro-val">${calc.macros?.choG}G</div>
                <span style="font-size: 8px; color: #444;">${record.macro_cho_pct}%</span>
              </div>
              <div class="macro-item" style="border-left-color: ${COLORS.pink}">
                <span class="label">LIPIDS</span>
                <div class="macro-val">${calc.macros?.fatG}G</div>
                <span style="font-size: 8px; color: #444;">${record.macro_fat_pct}%</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-head"><span class="section-title">CLINICAL INTERROGATION LOG</span></div>
            <div class="neural-box">
              <div style="font-size: 10px; font-weight: 900; color: #fff; margin-bottom: 10px;">ESTADO NUTRICIONAL INTEGRAL</div>
              <p class="neural-text">${ai.nutritional_diagnosis}</p>
              <div style="height: 20px;"></div>
              <div style="font-size: 10px; font-weight: 900; color: #fff; margin-bottom: 10px;">ANÁLISIS DE INTERACCIÓN</div>
              <p class="neural-text">${ai.summary}</p>
            </div>
            
            <div class="recs-area">
              <div class="label" style="margin-bottom: 15px; color: ${COLORS.poison}">PROTOCOLOS DE INTERVENCIÓN SUGERIDOS</div>
              ${ai.recommendations.map(r => `
                <div class="rec-item">
                  <span class="rec-bullet">></span>
                  <span>${r}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <div class="footer-text">
              ENCRYPTED TRANSMISSION PROTOCOL 138<br/>
              PROPERTY OF THE TREATING PROFESSIONAL<br/>
              © 2026 CAMILA OLIVARES ARCE
            </div>
            <div style="text-align: right;">
              <div style="font-size: 8px; color: #222; font-weight: 900;">SCAN_CODE_666</div>
            </div>
          </div>
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
