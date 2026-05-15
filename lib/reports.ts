import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Patient, ClinicalRecord, CalculationResult, AIAnalysis } from '../types';
import { COLORS } from '../constants/theme';

export async function generateClinicalReport(
  patient: Patient,
  record: ClinicalRecord,
  calc: CalculationResult,
  ai: AIAnalysis,
  history: ClinicalRecord[] = []
) {
  // Generate SVG for Weight Evolution (Line Chart)
  const validHistory = history.filter(r => r.weight_kg).slice(0, 10).reverse();
  let chartSVG = '';
  
  if (validHistory.length > 1) {
    const minW = Math.min(...validHistory.map(r => r.weight_kg!)) - 5;
    const maxW = Math.max(...validHistory.map(r => r.weight_kg!)) + 5;
    const range = maxW - minW || 10;
    
    const points = validHistory.map((r, i) => {
      const x = (i / (validHistory.length - 1)) * 360 + 20; // width 400, padding 20
      const y = 100 - ((r.weight_kg! - minW) / range) * 80; // height 100, padding 10
      return `${x},${y}`;
    }).join(' ');

    const circles = validHistory.map((r, i) => {
      const x = (i / (validHistory.length - 1)) * 360 + 20;
      const y = 100 - ((r.weight_kg! - minW) / range) * 80;
      return `<circle cx="${x}" cy="${y}" r="4" fill="${COLORS.crimson}" />
              <text x="${x}" y="${y - 10}" fill="#888" font-size="8" text-anchor="middle">${r.weight_kg}kg</text>`;
    }).join('');

    chartSVG = `
      <div class="chart-container">
        <h4 style="margin:0 0 10px 0; color:${COLORS.bone}; font-size:10px; letter-spacing:1px;">EVOLUCIÓN PONDERAL (ÚLTIMOS ${validHistory.length} CONTROLES)</h4>
        <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid meet">
          <rect width="400" height="120" fill="rgba(0,0,0,0.3)" rx="4"/>
          <!-- Grid lines -->
          <line x1="0" y1="20" x2="400" y2="20" stroke="#222" stroke-width="1" />
          <line x1="0" y1="60" x2="400" y2="60" stroke="#222" stroke-width="1" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="#222" stroke-width="1" />
          <!-- Data line -->
          <polyline points="${points}" fill="none" stroke="${COLORS.poison}" stroke-width="2.5" />
          <!-- Points and Labels -->
          ${circles}
        </svg>
      </div>
    `;
  } else {
    chartSVG = `<div class="chart-container" style="text-align:center; padding: 30px;"><span style="color:#666; font-size:10px;">DATOS HISTÓRICOS INSUFICIENTES PARA GRAFICAR</span></div>`;
  }

  // Generate SVG for Macros (Pie Chart Simulation using stroke-dasharray)
  const p = calc.macros?.protG || 0;
  const c = calc.macros?.choG || 0;
  const f = calc.macros?.fatG || 0;
  const totalG = p + c + f || 1;
  const pPct = (p / totalG) * 100;
  const cPct = (c / totalG) * 100;
  const fPct = (f / totalG) * 100;

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

          .container { padding: 40px; position: relative; }
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
            border: 2px solid #333; padding: 25px; 
            display: flex; justify-content: space-between; align-items: flex-start;
            background: rgba(10, 10, 15, 0.9); margin-bottom: 40px;
            border-left: 5px solid var(--crimson);
          }

          .title-area h1 { 
            font-family: 'Orbitron', sans-serif; font-size: 28px; 
            color: #fff; margin: 0; text-transform: uppercase;
            letter-spacing: 3px; line-height: 1.2;
          }
          .title-area span { color: var(--crimson); }
          .transmission-log { font-size: 9px; color: #888; margin-top: 8px; letter-spacing: 2px; }

          .biorisk-status {
            text-align: right; border-left: 1px solid #333; padding-left: 20px;
          }
          .status-code { font-family: 'Orbitron', sans-serif; font-size: 22px; color: var(--poison); font-weight: 900; }
          .status-label { font-size: 8px; color: #666; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px; }

          /* Sections */
          .section { margin-bottom: 30px; }
          .section-tag { 
            display: inline-block; background: var(--crimson); color: #fff;
            font-size: 9px; font-weight: 900; padding: 6px 12px; 
            text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;
          }

          .data-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .cell { background: rgba(255,255,255,0.02); padding: 12px; border: 1px solid #222; }
          .label { font-size: 8px; color: #888; text-transform: uppercase; display: block; margin-bottom: 5px; }
          .value { font-size: 14px; color: #fff; font-weight: 700; }
          .sub-value { font-size: 9px; color: var(--crimson); font-weight: bold; margin-top: 4px; }

          /* HUD Visuals */
          .hud-container { display: flex; gap: 15px; margin-top: 15px; }
          .hud-viz { flex: 1; background: var(--glass); border: 1px solid #222; padding: 15px; border-top: 3px solid var(--poison); }
          .hud-title { font-size: 9px; color: #aaa; font-weight: 900; margin-bottom: 12px; letter-spacing: 1px; }

          /* Macros Table */
          .macro-container { display: flex; gap: 20px; align-items: center; background: rgba(0,0,0,0.5); padding: 20px; border: 1px solid #222; }
          .macro-table { flex: 1; border-collapse: collapse; }
          .macro-table th { font-size: 8px; color: #666; text-align: left; padding: 10px; border-bottom: 1px solid #333; }
          .macro-table td { font-size: 11px; padding: 10px; border-bottom: 1px solid #1a1a1f; color: #ddd; font-weight: bold;}
          .macro-name { letter-spacing: 1px; }

          /* Neural Analysis Box */
          .neural-interrogation {
            background: linear-gradient(135deg, rgba(20, 20, 30, 0.9) 0%, rgba(5, 5, 5, 1) 100%);
            border: 1px solid #333; border-left: 4px solid var(--purple);
            padding: 30px; position: relative;
          }
          .ai-h3 { font-family: 'Orbitron', sans-serif; font-size: 12px; color: #fff; margin-bottom: 12px; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 5px;}
          .ai-p { font-size: 11px; line-height: 1.6; color: #bbb; text-align: justify; margin-bottom: 20px; }

          .recs-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
          .rec-card { background: rgba(255,255,255,0.03); padding: 12px; border-left: 2px solid var(--poison); display: flex; align-items: center; gap: 10px;}
          .rec-text { font-size: 11px; color: #ccc; line-height: 1.4; }

          .footer { 
            margin-top: 40px; padding: 20px; border-top: 1px solid #333;
            display: flex; justify-content: space-between; align-items: center; background: #0a0a0d;
          }
          .footer-info { font-size: 8px; color: #666; line-height: 1.5; text-transform: uppercase; letter-spacing: 1px;}

          .chart-container { background: #0a0a0d; border: 1px solid #222; padding: 15px; margin-top: 15px; }
          
          @media print { 
            .container { padding: 10px; } 
            .neural-interrogation { background: #000 !important; }
            .background-fx { display: none; }
            body { background-color: #fff; color: #000; }
            .header, .cell, .hud-viz, .macro-container, .chart-container, .rec-card, .footer { background: #fff !important; border-color: #ccc !important; }
            .title-area h1, .label, .value, .hud-title, .ai-h3, .ai-p, .rec-text, .footer-info { color: #000 !important; }
            .section-tag { background: #000; color: #fff; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="background-fx"></div>

          <header class="header">
            <div class="title-area">
              <h1>DOSSIER <span>CLÍNICO</span></h1>
              <div class="transmission-log">ID DE EXTRACCIÓN: ${Math.random().toString(36).substr(2, 9).toUpperCase()} | REPORTE TÉCNICO OFICIAL</div>
            </div>
            <div class="biorisk-status">
              <div class="status-code">${calc.bmiStatus?.split(' ')[0].toUpperCase() || 'STABLE'}</div>
              <div class="status-label">STATUS BIOMÉTRICO</div>
            </div>
          </header>

          <section class="section">
            <div class="section-tag">Ficha de Identificación</div>
            <div class="data-grid">
              <div class="cell"><span class="label">Sujeto</span><span class="value">${patient.full_name.toUpperCase()}</span></div>
              <div class="cell"><span class="label">Genotipo</span><span class="value">${patient.sex === 'M' ? 'XY (MASCULINO)' : 'XX (FEMENINO)'}</span></div>
              <div class="cell"><span class="label">Edad Biológica</span><span class="value">${patient.age} AÑOS</span></div>
              <div class="cell"><span class="label">Previsión</span><span class="value">${patient.insurance}</span></div>
              <div class="cell"><span class="label">Expediente ID</span><span class="value">SUB-${patient.id?.slice(0,8).toUpperCase()}</span></div>
              <div class="cell"><span class="label">Fecha Evaluación</span><span class="value">${new Date().toLocaleDateString('es-CL')}</span></div>
            </div>
          </section>

          <section class="section">
            <div class="section-tag">Telemetría Corporal</div>
            <div class="data-grid" style="grid-template-columns: repeat(4, 1fr);">
              <div class="cell"><span class="label">Masa Total (Peso)</span><span class="value">${record.weight_kg} KG</span></div>
              <div class="cell"><span class="label">Estatura</span><span class="value">${record.height_cm} CM</span></div>
              <div class="cell"><span class="label">Índice IMC</span><span class="value" style="color:var(--crimson)">${calc.bmi}</span></div>
              <div class="cell"><span class="label">Objetivo Lorenz</span><span class="value">${calc.idealWeight} KG</span></div>
              <div class="cell"><span class="label">Adiposidad %</span><span class="value">${calc.fatPercent}%</span></div>
              <div class="cell"><span class="label">Tejido Graso</span><span class="value">${calc.fatMassKg} KG</span></div>
              <div class="cell"><span class="label">Tejido Magro</span><span class="value">${calc.leanMassKg} KG</span></div>
              <div class="cell"><span class="label">Riesgo CV (Cintura)</span><span class="value" style="color:var(--crimson)">${calc.cvRisk}</span></div>
            </div>
            
            ${chartSVG}

            <div class="hud-container">
              <div class="hud-viz">
                <div class="hud-title">SISTEMA HEMODINÁMICO</div>
                <div class="value">${record.systolic_bp || '--'}/${record.diastolic_bp || '--'} mmHg</div>
                <div class="sub-value" style="color:var(--sky)">${calc.bpStatus || 'Sin Registro'}</div>
              </div>
              <div class="hud-viz" style="border-top-color: var(--crimson)">
                <div class="hud-title">FILTRACIÓN RENAL (TFG)</div>
                <div class="value">${calc.gfr || 'N/A'} ml/min</div>
                <div class="sub-value" style="color:var(--crimson)">KDIGO: ${calc.kdigoStage || '--'}</div>
              </div>
              <div class="hud-viz" style="border-top-color: var(--purple)">
                <div class="hud-title">CAPACIDAD FUNCIONAL</div>
                <div class="value">${record.grip_strength_kg || '0'} KG (GRIP)</div>
                <div class="sub-value" style="color:var(--purple)">Sarcopenia: ${calc.sarcopeniaRisk || 'Estable'}</div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-tag">Asignación de Recursos Metabólicos</div>
            <div class="hud-viz" style="border-top: none; background: #111; margin-bottom: 10px; border: 1px solid #333;">
               <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div><span class="label">Gasto Basal</span><div class="value">${calc.bmr} KCAL</div></div>
                  <div><span class="label">Gasto Total (VCT)</span><div class="value" style="color:var(--poison)">${calc.tdee} KCAL</div></div>
                  <div><span class="label">Hidratación 24h</span><div class="value" style="color:var(--sky)">${calc.waterLiters} LITROS</div></div>
               </div>
            </div>
            <div class="macro-container">
              <!-- Visual Pie Chart Representation -->
              <div style="width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(
                var(--crimson) 0% ${pPct}%, 
                var(--purple) ${pPct}% ${pPct + cPct}%, 
                var(--pink) ${pPct + cPct}% 100%
              ); border: 2px solid #333; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
              
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
                    <td class="macro-name" style="color:var(--crimson)">● PROTEÍNAS</td>
                    <td>${record.macro_prot_pct}%</td>
                    <td class="value">${calc.macros?.protG}G</td>
                    <td style="color:#aaa;">${calc.macros?.protGkg} g/kg</td>
                  </tr>
                  <tr>
                    <td class="macro-name" style="color:var(--purple)">● CARBOHIDRATOS</td>
                    <td>${record.macro_cho_pct}%</td>
                    <td class="value">${calc.macros?.choG}G</td>
                    <td style="color:#aaa;">${calc.macros?.choGkg} g/kg</td>
                  </tr>
                  <tr>
                    <td class="macro-name" style="color:var(--pink)">● LÍPIDOS</td>
                    <td>${record.macro_fat_pct}%</td>
                    <td class="value">${calc.macros?.fatG}G</td>
                    <td style="color:#aaa;">${calc.macros?.fatGkg} g/kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="section">
            <div class="section-tag">Análisis Clínico y Fisiopatológico</div>
            <div class="neural-interrogation">
              <h3 class="ai-h3" style="color:var(--sky)">DIAGNÓSTICO MÉDICO NUTRICIONAL</h3>
              <p class="ai-p" style="font-weight: 700; color: #fff; font-size: 13px;">${ai.nutritional_diagnosis}</p>
              
              <h3 class="ai-h3" style="color:var(--purple)">RESUMEN FISIOPATOLÓGICO</h3>
              <p class="ai-p">${ai.summary}</p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div style="background: rgba(0,0,0,0.4); padding: 15px; border-left: 2px solid var(--crimson);">
                  <h4 style="margin:0 0 8px 0; color:var(--crimson); font-size:9px; letter-spacing:1px;">RIESGO CARDIOMETABÓLICO</h4>
                  <p style="margin:0; font-size:10px; color:#ccc; line-height: 1.4;">${ai.metabolic_syndrome_risk || 'Evaluación en curso.'}</p>
                </div>
                <div style="background: rgba(0,0,0,0.4); padding: 15px; border-left: 2px solid var(--sky);">
                  <h4 style="margin:0 0 8px 0; color:var(--sky); font-size:9px; letter-spacing:1px;">PERFIL RENAL / HEPÁTICO</h4>
                  <p style="margin:0; font-size:10px; color:#ccc; line-height: 1.4;">${ai.renal_hepatic_profile || 'Evaluación en curso.'}</p>
                </div>
                <div style="grid-column: span 2; background: rgba(0,0,0,0.4); padding: 15px; border-left: 2px solid var(--gold);">
                  <h4 style="margin:0 0 8px 0; color:#FFD700; font-size:9px; letter-spacing:1px;">INTERACCIONES FARMACOLÓGICAS Y SUPLEMENTACIÓN</h4>
                  <p style="margin:0; font-size:10px; color:#ccc; line-height: 1.4;">${ai.pharmacological_interactions || 'No se detectan interacciones críticas primarias.'}</p>
                </div>
              </div>
              
              <h3 class="ai-h3" style="color:var(--poison)">PLAN DE INTERVENCIÓN CLÍNICA</h3>
              <div class="recs-grid">
                ${ai.recommendations.map(r => `
                  <div class="rec-card">
                    <span style="color:var(--poison); font-weight:900;">></span>
                    <div class="rec-text">${r}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>

          ${record.professional_indications ? `
          <section class="section">
            <div class="section-tag" style="background: #222; color: #fff;">Indicaciones del Profesional</div>
            <div style="background: rgba(255,255,255,0.02); border: 1px dashed #444; padding: 25px;">
              <p style="font-size: 13px; color: #eee; line-height: 1.8; white-space: pre-wrap; font-family: 'Space Mono', monospace;">${record.professional_indications}</p>
            </div>
          </section>
          ` : ''}

          <div style="margin-top: 60px; display: flex; justify-content: flex-end;">
            <div style="text-align: center; border-top: 1px solid #444; padding-top: 10px; width: 250px;">
              <div style="font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 4px;">CAMILA OLIVARES ARCE</div>
              <div style="font-size: 9px; color: #888; letter-spacing: 1px;">NUTRICIONISTA CLÍNICA</div>
              <div style="font-size: 9px; color: #888; letter-spacing: 1px;">REG. NACIONAL DE SALUD</div>
            </div>
          </div>

          <footer class="footer">
            <div class="footer-info">
              SISTEMA DE CONTROL BIOMÉTRICO - REPORTE DE USO EXCLUSIVO PROFESIONAL<br/>
              © 2026 CAMILA OLIVARES ARCE | NUTRICIONISTA UNIVERSITARIA
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; color: #888; font-weight: 900; font-family:'Orbitron', sans-serif;">SECURE_PROTOCOL_138</div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  `;

  try {
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500); // Give it a moment to render charts and fonts
      } else {
        console.error('El navegador bloqueó la ventana emergente para el reporte.');
      }
    } else {
      const result = await Print.printToFileAsync({ html });
      if (result && result.uri) {
        await Sharing.shareAsync(result.uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: `Reporte_${patient.full_name}.pdf` });
      }
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
