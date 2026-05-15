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
          
          :root {
            --crimson: ${COLORS.crimson};
            --poison: ${COLORS.poison};
            --purple: ${COLORS.purple};
            --bg: #050505;
            --glass: rgba(255, 255, 255, 0.03);
          }

          body { 
            font-family: 'Space Mono', monospace; 
            padding: 0; margin: 0;
            background-color: var(--bg); color: #f5f5f5; 
          }

          .container { padding: 50px; position: relative; }
          .background-fx {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background-image: 
              radial-gradient(circle at 2px 2px, rgba(220, 20, 60, 0.15) 1px, transparent 0),
              linear-gradient(rgba(10, 10, 15, 0.5) 2px, transparent 2px),
              linear-gradient(90deg, rgba(10, 10, 15, 0.5) 2px, transparent 2px);
            background-size: 30px 30px, 60px 60px, 60px 60px;
            z-index: -1;
          }

          /* Technical Header */
          .header { 
            border: 3px solid var(--crimson); padding: 30px; 
            display: flex; justify-content: space-between; align-items: flex-start;
            background: rgba(220, 20, 60, 0.05); margin-bottom: 50px;
            box-shadow: 0 0 30px rgba(220, 20, 60, 0.2);
            position: relative;
          }
          .header::before {
            content: "BIO-NEURAL_LINK_ESTABLISHED"; position: absolute; top: -10px; left: 20px;
            background: var(--bg); color: var(--crimson); font-size: 10px; font-weight: 900; padding: 0 10px;
          }

          .title-area h1 { 
            font-family: 'Orbitron', sans-serif; font-size: 32px; 
            color: var(--crimson); margin: 0; text-transform: uppercase;
            letter-spacing: 5px; line-height: 1;
          }
          .transmission-log { font-size: 10px; color: #666; margin-top: 10px; letter-spacing: 2px; }

          .biorisk-status {
            text-align: right; border-left: 1px solid #333; padding-left: 20px;
          }
          .status-code { font-family: 'Orbitron', sans-serif; font-size: 20px; color: var(--poison); font-weight: 900; }
          .status-label { font-size: 9px; color: #555; text-transform: uppercase; margin-top: 5px; }

          /* Sections */
          .section { margin-bottom: 40px; }
          .section-tag { 
            display: inline-block; background: var(--crimson); color: #fff;
            font-size: 10px; font-weight: 900; padding: 5px 15px; 
            text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;
          }

          .data-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; background: #222; border: 1px solid #222; }
          .cell { background: var(--bg); padding: 15px; }
          .label { font-size: 8px; color: #666; text-transform: uppercase; display: block; margin-bottom: 6px; }
          .value { font-size: 14px; color: #fff; font-weight: 700; }
          .sub-value { font-size: 9px; color: var(--crimson); font-weight: bold; margin-top: 4px; }

          /* HUD Visuals */
          .hud-container { display: flex; gap: 30px; margin-top: 20px; }
          .hud-viz { flex: 1; background: var(--glass); border: 1px solid #1a1a1f; padding: 20px; border-top: 3px solid var(--poison); }
          .hud-title { font-size: 10px; color: var(--poison); font-weight: 900; margin-bottom: 15px; letter-spacing: 1px; }

          /* Macros High fidelity table */
          .macro-table { width: 100%; border-collapse: collapse; margin-top: 10px; background: var(--glass); }
          .macro-table th { font-size: 9px; color: #444; text-align: left; padding: 15px; border-bottom: 2px solid #222; }
          .macro-table td { font-size: 12px; padding: 15px; border-bottom: 1px solid #111; }
          .macro-name { font-weight: 900; letter-spacing: 1px; }

          /* Neural Analysis Box */
          .neural-interrogation {
            background: linear-gradient(135deg, rgba(102, 0, 204, 0.05) 0%, rgba(5, 5, 5, 1) 100%);
            border: 1px solid rgba(163, 102, 255, 0.2);
            padding: 35px; position: relative; overflow: hidden;
          }
          .neural-interrogation::before {
            content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--purple);
          }
          .ai-h3 { font-family: 'Orbitron', sans-serif; font-size: 14px; color: var(--purple); margin-bottom: 15px; letter-spacing: 2px; }
          .ai-p { font-size: 13px; line-height: 1.8; color: #ccc; text-align: justify; margin-bottom: 25px; }

          .recs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .rec-card { background: rgba(255,255,255,0.02); padding: 15px; border-left: 2px solid var(--poison); }
          .rec-text { font-size: 11px; color: #999; line-height: 1.5; }

          .footer { 
            margin-top: 80px; padding: 40px; border-top: 1px solid #1a1a1f;
            display: flex; justify-content: space-between; align-items: center;
          }
          .footer-info { font-size: 9px; color: #333; line-height: 1.8; text-transform: uppercase; }

          @media print { 
            .container { padding: 20px; } 
            .neural-interrogation { background: #000 !important; }
            .background-fx { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="background-fx"></div>

          <header class="header">
            <div class="title-area">
              <h1>NEURAL DOSSIER</h1>
              <div class="transmission-log">DATA_BURST_ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()} | SIG: TREATMENT_STATION_ALPHA</div>
            </div>
            <div class="biorisk-status">
              <div class="status-code">${calc.bmiStatus?.split(' ')[0].toUpperCase() || 'STABLE'}</div>
              <div class="status-label">BIOMETRIC THREAT LEVEL</div>
            </div>
          </header>

          <section class="section">
            <div class="section-tag">Sujeto de Interrogación</div>
            <div class="data-grid">
              <div class="cell"><span class="label">Identidad</span><span class="value">${patient.full_name.toUpperCase()}</span></div>
              <div class="cell"><span class="label">Genotipo</span><span class="value">${patient.sex === 'M' ? 'XY (MASCULINO)' : 'XX (FEMENINO)'}</span></div>
              <div class="cell"><span class="label">Ciclos Génesis</span><span class="value">${patient.age} AÑOS</span></div>
              <div class="cell"><span class="label">Previsión</span><span class="value">${patient.insurance}</span></div>
              <div class="cell"><span class="label">Core ID</span><span class="value">SUB-${patient.id?.slice(0,8).toUpperCase()}</span></div>
              <div class="cell"><span class="label">Sincronización</span><span class="value">${new Date().toLocaleDateString('es-CL')}</span></div>
              <div class="cell"><span class="label">Protocolo</span><span class="value">NUTRICESFAM V8.0</span></div>
              <div class="cell"><span class="label">Red de Datos</span><span class="value" style="color:var(--poison)">ENCRIPTADA</span></div>
            </div>
          </section>

          <section class="section">
            <div class="section-tag">Telemetría de Composición</div>
            <div class="data-grid" style="grid-template-columns: repeat(4, 1fr);">
              <div class="cell"><span class="label">Masa Total</span><span class="value">${record.weight_kg} KG</span></div>
              <div class="cell"><span class="label">Estatura</span><span class="value">${record.height_cm} CM</span></div>
              <div class="cell"><span class="label">Índice IMC</span><span class="value" style="color:var(--crimson)">${calc.bmi}</span><div class="sub-value">${calc.bmiStatus}</div></div>
              <div class="cell"><span class="label">Objetivo Lorenz</span><span class="value">${calc.idealWeight} KG</span></div>
              <div class="cell"><span class="label">Adiposidad %</span><span class="value">${calc.fatPercent}%</span></div>
              <div class="cell"><span class="label">Tejido Graso</span><span class="value">${calc.fatMassKg} KG</span></div>
              <div class="cell"><span class="label">Tejido Magro</span><span class="value">${calc.leanMassKg} KG</span></div>
              <div class="cell"><span class="label">Riesgo CV</span><span class="value" style="color:var(--crimson)">${calc.cvRisk}</span><div class="sub-value">ICT: ${calc.ict}</div></div>
            </div>
            
            <div class="hud-container">
              <div class="hud-viz">
                <div class="hud-title">SISTEMA HEMODINÁMICO</div>
                <div class="value">${record.systolic_bp}/${record.diastolic_bp} mmHg</div>
                <div class="sub-value" style="color:#fff">${calc.bpStatus}</div>
              </div>
              <div class="hud-viz" style="border-top-color: var(--crimson)">
                <div class="hud-title" style="color:var(--crimson)">FILTRACIÓN RENAL</div>
                <div class="value">${calc.gfr || 'N/A'} ml/min</div>
                <div class="sub-value">${calc.kdigoStage}</div>
              </div>
              <div class="hud-viz" style="border-top-color: var(--purple)">
                <div class="hud-title" style="color:var(--purple)">MARCADORES FUNCIONALES</div>
                <div class="value">${record.grip_strength_kg || '0'} KG</div>
                <div class="sub-value">Sarcopenia: ${calc.sarcopeniaRisk || 'Estable'}</div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-tag">Protocolo de Asignación de Recursos</div>
            <div class="hud-viz" style="border-top: none; background: rgba(0,0,0,0.4); margin-bottom: 20px; border: 1px solid #111;">
               <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div><span class="label">Gasto Basal</span><div class="value">${calc.bmr} KCAL</div></div>
                  <div><span class="label">Gasto Total</span><div class="value" style="color:var(--poison)">${calc.tdee} KCAL</div></div>
                  <div><span class="label">Hidratación 24h</span><div class="value" style="color:var(--sky)">${calc.waterLiters} LITROS</div></div>
               </div>
            </div>
            <table class="macro-table">
              <thead>
                <tr>
                  <th>Macronutriente</th>
                  <th>Distribución %</th>
                  <th>Carga (Gramos)</th>
                  <th>Ratio de Peso</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="macro-name" style="color:var(--crimson)">PROTEÍNAS</td>
                  <td>${record.macro_prot_pct}%</td>
                  <td class="value">${calc.macros?.protG}G</td>
                  <td style="font-weight: 700;">${calc.macros?.protGkg} g/kg</td>
                </tr>
                <tr>
                  <td class="macro-name" style="color:var(--purple)">CARBOHIDRATOS</td>
                  <td>${record.macro_cho_pct}%</td>
                  <td class="value">${calc.macros?.choG}G</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td class="macro-name" style="color:var(--pink)">LÍPIDOS</td>
                  <td>${record.macro_fat_pct}%</td>
                  <td class="value">${calc.macros?.fatG}G</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="section">
            <div class="section-tag">Disección Neural del Sujeto</div>
            <div class="neural-interrogation">
              <h3 class="ai-h3">DIAGNÓSTICO TÉCNICO INTEGRAL</h3>
              <p class="ai-p" style="font-weight: 700; color: #fff; font-size: 15px;">${ai.nutritional_diagnosis}</p>
              
              <h3 class="ai-h3" style="color:var(--crimson)">ANÁLISIS FISIOPATOLÓGICO</h3>
              <p class="ai-p">${ai.summary}</p>
              
              <h3 class="ai-h3" style="color:var(--poison)">PROTOCOLOS DE INTERVENCIÓN REQUERIDOS</h3>
              <div class="recs-grid">
                ${ai.recommendations.map(r => `
                  <div class="rec-card">
                    <div class="rec-text">${r}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>

          <footer class="footer">
            <div class="footer-info">
              TRANSMISIÓN ENCRIPTADA DE GRADO CLÍNICO<br/>
              © 2026 CAMILA OLIVARES ARCE | NUTRICIONISTA UNIVERSITARIA<br/>
              CÓDIGO DE TRANSMISIÓN: SECURE_PROTOCOL_138_REV_8
            </div>
            <div style="text-align: right;">
              <svg width="60" height="60" viewBox="0 0 60 60">
                <rect width="60" height="60" fill="none" stroke="#222" stroke-width="1" />
                <path d="M 10,10 L 50,10 L 50,50 L 10,50 Z M 20,20 L 40,20 L 40,40 L 20,40 Z" fill="#111" />
                <text x="15" y="58" fill="#333" font-size="6">QR_LINK_VAULT</text>
              </svg>
            </div>
          </footer>
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
