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
  // ── Generar Gráfico SVG Evolutivo ──────────────────────────
  const validHistory = history.filter(r => r.weight_kg).slice(0, 10).reverse();
  let chartSVG = '';
  
  if (validHistory.length > 1) {
    const minW = Math.min(...validHistory.map(r => r.weight_kg!)) - 5;
    const maxW = Math.max(...validHistory.map(r => r.weight_kg!)) + 5;
    const range = maxW - minW || 10;
    
    const points = validHistory.map((r, i) => {
      const x = (i / (validHistory.length - 1)) * 360 + 20; 
      const y = 100 - ((r.weight_kg! - minW) / range) * 80;
      return `${x},${y}`;
    }).join(' ');

    const circles = validHistory.map((r, i) => {
      const x = (i / (validHistory.length - 1)) * 360 + 20;
      const y = 100 - ((r.weight_kg! - minW) / range) * 80;
      return `<circle cx="${x}" cy="${y}" r="4" fill="${COLORS.crimson}" />
              <text x="${x}" y="${y - 10}" fill="#ffffff" font-size="9" text-anchor="middle" font-family="monospace" font-weight="900">${r.weight_kg}kg</text>`;
    }).join('');

    chartSVG = `
      <div class="chart-container">
        <div class="hud-title" style="color:${COLORS.bone};">EVOLUCIÓN PONDERAL HISTÓRICA</div>
        <svg width="100%" height="120" viewBox="0 0 400 120" style="background:#000; border:1px solid #333;">
          <line x1="0" y1="20" x2="400" y2="20" stroke="#222" stroke-width="1" />
          <line x1="0" y1="60" x2="400" y2="60" stroke="#222" stroke-width="1" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="#222" stroke-width="1" />
          <polyline points="${points}" fill="none" stroke="${COLORS.poison}" stroke-width="3" />
          ${circles}
        </svg>
      </div>
    `;
  }

  // ── Cálculo de Proporciones para Barra de Macros ───────────
  const p = calc.macros?.protG || 0;
  const c = calc.macros?.choG || 0;
  const f = calc.macros?.fatG || 0;
  const totalG = p + c + f || 1;
  const pPct = (p / totalG) * 100;
  const cPct = (c / totalG) * 100;
  const fPct = (f / totalG) * 100;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@700;900&display=swap');
          
          /* Forzar colores en impresión */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          :root {
            --crimson: ${COLORS.crimson};
            --poison: ${COLORS.poison};
            --purple: ${COLORS.purple};
            --pink: ${COLORS.pink};
            --orange: ${COLORS.orange};
            --sky: ${COLORS.sky};
          }

          body { 
            font-family: 'Space Mono', monospace; 
            padding: 0; margin: 0;
            background-color: #050505 !important; color: #ffffff !important; 
          }

          .page { padding: 40px; }

          /* Header Estilo Terminal */
          .header { 
            border: 3px solid #333; padding: 30px; 
            display: flex; justify-content: space-between; align-items: center;
            background-color: #0d0d12 !important; margin-bottom: 40px;
            border-left: 15px solid var(--crimson);
          }

          .title-area h1 { 
            font-family: 'Orbitron', sans-serif; font-size: 36px; 
            color: #ffffff !important; margin: 0; text-transform: uppercase;
            letter-spacing: 5px; line-height: 1;
          }
          .title-area span { color: var(--crimson) !important; }
          .transmission-id { font-size: 10px; color: #888; margin-top: 10px; letter-spacing: 3px; font-weight: 700; }

          .status-box {
            text-align: right; border-left: 2px solid #333; padding-left: 30px;
          }
          .status-val { font-family: 'Orbitron', sans-serif; font-size: 28px; color: var(--poison) !important; font-weight: 900; }
          .status-lab { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; }

          /* Contenedores de Datos */
          .section { margin-bottom: 40px; }
          .tag { 
            display: inline-block; background-color: var(--crimson) !important; color: #fff !important;
            font-size: 10px; font-weight: 900; padding: 8px 20px; 
            text-transform: uppercase; letter-spacing: 4px; margin-bottom: 20px;
          }

          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .cell { background-color: #0d0d12 !important; padding: 18px; border: 1px solid #333; }
          .label { font-size: 9px; color: #888; text-transform: uppercase; display: block; margin-bottom: 8px; font-weight: 700; }
          .value { font-size: 18px; color: #ffffff !important; font-weight: 900; }
          .unit { font-size: 10px; color: #666; margin-left: 4px; }

          /* HUD de Visualización */
          .hud-container { display: flex; gap: 20px; margin-top: 20px; }
          .hud-card { flex: 1; background-color: #0d0d12 !important; border: 2px solid #333; padding: 20px; border-top: 5px solid var(--sky); }
          .hud-title { font-size: 11px; color: #aaa; font-weight: 900; margin-bottom: 15px; letter-spacing: 2px; text-transform: uppercase; }

          /* Barra de Macros Segmentada */
          .macro-display {
            background-color: #000000 !important; border: 2px solid #444; padding: 35px; margin-top: 20px;
          }
          .macro-bar {
            height: 40px; display: flex; width: 100%; margin-bottom: 30px;
            border: 2px solid #555; overflow: hidden; background-color: #111 !important;
          }
          .segment { 
            height: 100%; display: flex; align-items: center; justify-content: center; 
            font-size: 12px; font-weight: 900; color: #fff !important; text-shadow: 0 0 5px #000;
          }
          .seg-p { background-color: var(--crimson) !important; }
          .seg-c { background-color: var(--purple) !important; }
          .seg-f { background-color: var(--pink) !important; }

          .legend { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
          .leg-card { padding: 15px; border-left: 6px solid #333; background-color: #0d0d12 !important; }
          .leg-val { font-size: 18px; font-weight: 900; color: #ffffff !important; margin-top: 5px; }

          /* Caja de Análisis IA */
          .ai-box {
            background-color: #0d0d12 !important;
            border: 3px solid #333; border-left: 10px solid var(--purple);
            padding: 40px; position: relative;
          }
          .ai-title { font-family: 'Orbitron', sans-serif; font-size: 16px; color: var(--sky) !important; margin-bottom: 20px; letter-spacing: 3px; border-bottom: 1px solid #444; padding-bottom: 10px;}
          .ai-diag { font-size: 15px; line-height: 1.8; color: #ffffff !important; font-weight: 700; margin-bottom: 30px; text-align: justify; }
          .ai-text { font-size: 13px; line-height: 1.8; color: #bbbbbb !important; text-align: justify; margin-bottom: 30px; }

          .rec-list { display: grid; grid-template-columns: 1fr; gap: 15px; }
          .rec-item { background-color: #151520 !important; padding: 20px; border-left: 4px solid var(--poison); display: flex; align-items: center; gap: 20px;}
          .rec-val { font-size: 14px; color: #eeeeee !important; line-height: 1.6; font-weight: 600; }

          /* Footer y Firma */
          .signature-area { margin-top: 80px; display: flex; justify-content: flex-end; }
          .signature-box { text-align: center; border-top: 2px solid #555; padding-top: 20px; width: 350px; }
          .signer-name { font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 900; color: #fff !important; margin-bottom: 5px; }
          
          .footer { 
            margin-top: 80px; padding: 30px; border-top: 2px solid #333;
            display: flex; justify-content: space-between; align-items: center; background-color: #0d0d12 !important;
          }
          .footer-text { font-size: 10px; color: #666; line-height: 1.6; text-transform: uppercase; letter-spacing: 2px;}

          .chart-container { background-color: #000000 !important; border: 2px solid #333; padding: 25px; margin-top: 20px; }

          @media print {
            body { background-color: #050505 !important; -webkit-print-color-adjust: exact !important; }
            .page { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          
          <header class="header">
            <div class="title-area">
              <h1>DOSSIER <span>METABÓLICO</span></h1>
              <div class="transmission-id">NÚCLEO_ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()} | REPORTE TÉCNICO DE ÉLITE</div>
            </div>
            <div class="status-box">
              <div class="status-val">${calc.bmiStatus?.split(' ')[0].toUpperCase() || 'ESTABLE'}</div>
              <div class="status-lab">STATUS BIOMÉTRICO</div>
            </div>
          </header>

          <section class="section">
            <div class="tag">Identidad del Sujeto</div>
            <div class="grid">
              <div class="cell"><span class="label">Sujeto</span><span class="value">${patient.full_name.toUpperCase()}</span></div>
              <div class="cell"><span class="label">Genotipo</span><span class="value">${patient.sex === 'F' ? 'XX (FEMENINO)' : 'XY (MASCULINO)'}</span></div>
              <div class="cell"><span class="label">Edad Biológica</span><span class="value">${patient.age} <span class="unit">AÑOS</span></span></div>
              <div class="cell"><span class="label">Previsión</span><span class="value">${patient.insurance}</span></div>
              <div class="cell"><span class="label">Expediente ID</span><span class="value">${patient.id?.slice(0,8).toUpperCase() || 'LOCAL'}</span></div>
              <div class="cell"><span class="label">Fecha</span><span class="value">${new Date().toLocaleDateString('es-CL')}</span></div>
            </div>
          </section>

          <section class="section">
            <div class="tag">Telemetría Corporal Avanzada</div>
            <div class="grid">
              <div class="cell"><span class="label">Masa Total</span><span class="value">${record.weight_kg} <span class="unit">KG</span></span></div>
              <div class="cell"><span class="label">Estatura</span><span class="value">${record.height_cm} <span class="unit">CM</span></span></div>
              <div class="cell"><span class="label">Índice IMC</span><span class="value" style="color:var(--crimson)">${calc.bmi}</span></div>
              <div class="cell"><span class="label">Peso Ideal</span><span class="value">${calc.idealWeight} <span class="unit">KG</span></span></div>
              <div class="cell"><span class="label">Adiposidad %</span><span class="value">${calc.fatPercent}%</span></div>
              <div class="cell"><span class="label">Tejido Graso</span><span class="value">${calc.fatMassKg} <span class="unit">KG</span></span></div>
              <div class="cell"><span class="label">Tejido Magro</span><span class="value">${calc.leanMassKg} <span class="unit">KG</span></span></div>
              <div class="cell"><span class="label">Riesgo CV</span><span class="value" style="color:var(--crimson)">${calc.cvRisk}</span></div>
            </div>
            
            ${chartSVG}

            <div class="hud-container">
              <div class="hud-card">
                <div class="hud-title">Hemodinámica</div>
                <div class="value">${record.systolic_bp || '--'}/${record.diastolic_bp || '--'} <span class="unit">mmHg</span></div>
                <div class="label" style="color:var(--sky); margin-top:5px;">${calc.bpStatus || 'Sin Registro'}</div>
              </div>
              <div class="hud-card" style="border-top-color: var(--crimson)">
                <div class="hud-title">Filtración Renal</div>
                <div class="value">${calc.gfr || 'N/A'} <span class="unit">ml/min</span></div>
                <div class="label" style="color:var(--crimson); margin-top:5px;">KDIGO: ${calc.kdigoStage || '--'}</div>
              </div>
              <div class="hud-card" style="border-top-color: var(--purple)">
                <div class="hud-title">Capacidad Funcional</div>
                <div class="value">${record.grip_strength_kg || '0'} <span class="unit">KG (GRIP)</span></div>
                <div class="label" style="color:var(--purple); margin-top:5px;">Sarcopenia: ${calc.sarcopeniaRisk || 'Estable'}</div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="tag">Asignación de Recursos Metabólicos</div>
            <div class="macro-display">
              <div class="hud-title" style="margin-bottom:20px; color:var(--crimson)">VINCULACIÓN DE RECURSOS (DISTRIBUCIÓN ENERGÉTICA)</div>
              <div class="macro-bar">
                <div class="segment seg-p" style="width: ${pPct}%">PRO</div>
                <div class="segment seg-c" style="width: ${cPct}%">CHO</div>
                <div class="segment seg-f" style="width: ${fPct}%">LIP</div>
              </div>
              
              <div class="legend">
                <div class="leg-card" style="border-left-color: var(--crimson)">
                  <div class="label">Proteínas</div>
                  <div class="leg-val">${calc.macros?.protG}g <span style="font-size:10px; color:#888;">(${record.macro_prot_pct}%)</span></div>
                  <div class="label" style="margin-top:5px;">${calc.macros?.protGkg} g/kg</div>
                </div>
                <div class="leg-card" style="border-left-color: var(--purple)">
                  <div class="label">Carbohidratos</div>
                  <div class="leg-val">${calc.macros?.choG}g <span style="font-size:10px; color:#888;">(${record.macro_cho_pct}%)</span></div>
                  <div class="label" style="margin-top:5px;">${calc.macros?.choGkg} g/kg</div>
                </div>
                <div class="leg-card" style="border-left-color: var(--pink)">
                  <div class="label">Lípidos</div>
                  <div class="leg-val">${calc.macros?.fatG}g <span style="font-size:10px; color:#888;">(${record.macro_fat_pct}%)</span></div>
                  <div class="label" style="margin-top:5px;">${calc.macros?.fatGkg} g/kg</div>
                </div>
              </div>

              <div style="margin-top:30px; display:flex; justify-content:space-between; border-top:1px solid #333; padding-top:20px;">
                <div><span class="label">GASTO BASAL</span><div class="value">${calc.bmr} <span class="unit">KCAL</span></div></div>
                <div><span class="label">VCT TOTAL</span><div class="value" style="color:var(--poison)">${calc.tdee} <span class="unit">KCAL</span></div></div>
                <div><span class="label">HIDRATACIÓN</span><div class="value" style="color:var(--sky)">${calc.waterLiters} <span class="unit">L/DÍA</span></div></div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="tag">Análisis Clínico y Fisiopatológico IA</div>
            <div class="ai-box">
              <div class="ai-title">DIAGNÓSTICO TÉCNICO INTEGRAL</div>
              <div class="ai-diag">${ai.nutritional_diagnosis}</div>
              
              <div class="ai-title" style="color:var(--purple)">ANÁLISIS FISIOPATOLÓGICO CRÍTICO</div>
              <div class="ai-text">${ai.summary}</div>
              
              <div class="ai-title" style="color:var(--poison)">PLAN DE INTERVENCIÓN TÁCTICO</div>
              <div class="rec-list">
                ${ai.recommendations.map(r => `
                  <div class="rec-item">
                    <span style="color:var(--poison); font-weight:900; font-size:20px;">></span>
                    <div class="rec-val">${r}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>

          ${record.professional_indications ? `
          <section class="section">
            <div class="tag" style="background-color: #333 !important;">Indicaciones Profesionales Adicionales</div>
            <div style="background-color: #0d0d12 !important; border: 2px dashed #444; padding: 30px;">
              <p style="font-size: 15px; color: #eeeeee !important; line-height: 1.8; white-space: pre-wrap; margin:0;">${record.professional_indications}</p>
            </div>
          </section>
          ` : ''}

          <div class="signature-area">
            <div class="signature-box">
              <div class="signer-name">CAMILA OLIVARES ARCE</div>
              <div class="label" style="letter-spacing: 2px;">NUTRICIONISTA CLÍNICA</div>
              <div class="label" style="font-size:8px;">REGISTRO NACIONAL DE SALUD</div>
            </div>
          </div>

          <footer class="footer">
            <div class="footer-text">
              SISTEMA DE CONTROL BIOMÉTRICO "NÚCLEO METABÓLICO"<br/>
              REPORTE DE USO EXCLUSIVO PROFESIONAL - CONFIDENCIAL
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #444; font-weight: 900; font-family:'Orbitron', sans-serif;">PROTOCOL_138_GEN_9</div>
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
        }, 1000); 
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
