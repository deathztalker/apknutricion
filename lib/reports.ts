import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Patient, ClinicalRecord, CalculationResult, AIAnalysis } from '../types';
import { COLORS } from '../constants/theme';

// Configurar fuentes virtuales para pdfmake
(pdfMake as any).vfs = pdfFonts;

export async function generateClinicalReport(
  patient: Patient,
  record: ClinicalRecord,
  calc: CalculationResult,
  ai: AIAnalysis,
  history: ClinicalRecord[] = []
) {
  // ── Cálculo de Proporciones para Macros ───────────
  const p = calc.macros?.protG || 0;
  const c = calc.macros?.choG || 0;
  const f = calc.macros?.fatG || 0;

  // ── Generar Gráfico SVG Evolutivo ──────────────────────────
  const validHistory = history.filter(r => r.weight_kg).slice(0, 10).reverse();
  let chartNode: any = null;

  if (validHistory.length > 1) {
    const minW = Math.min(...validHistory.map(r => r.weight_kg!)) - 5;
    const maxW = Math.max(...validHistory.map(r => r.weight_kg!)) + 5;
    const range = maxW - minW || 10;

    const points = validHistory.map((r, i) => {
      const x = (i / (validHistory.length - 1)) * 480 + 25;
      const y = 100 - ((r.weight_kg! - minW) / range) * 80;
      return `${x},${y}`;
    }).join(' ');

    const circles = validHistory.map((r, i) => {
      const x = (i / (validHistory.length - 1)) * 480 + 25;
      const y = 100 - ((r.weight_kg! - minW) / range) * 80;
      return `<circle cx="${x}" cy="${y}" r="5" fill="${COLORS.crimson}" />
              <text x="${x}" y="${y - 12}" fill="#ffffff" font-size="10" text-anchor="middle" font-weight="900">${r.weight_kg}kg</text>`;
    }).join('');

    const rawSvg = `
      <svg width="530" height="130" viewBox="0 0 530 130">
        <rect x="0" y="0" width="530" height="130" fill="#000" stroke="#333" stroke-width="1" />
        <line x1="0" y1="20" x2="530" y2="20" stroke="#222" stroke-width="1" />
        <line x1="0" y1="60" x2="530" y2="60" stroke="#222" stroke-width="1" />
        <line x1="0" y1="100" x2="530" y2="100" stroke="#222" stroke-width="1" />
        <polyline points="${points}" fill="none" stroke="${COLORS.poison}" stroke-width="3" />
        ${circles}
      </svg>
    `;

    chartNode = {
      stack: [
        { text: 'EVOLUCIÓN PONDERAL HISTÓRICA', color: COLORS.bone, fontSize: 10, bold: true, margin: [0, 0, 0, 10] },
        { svg: rawSvg, width: 530 }
      ],
      margin: [0, 20, 0, 0],
      unbreakable: true
    };
  }

  // AI Recomendaciones
  const recList = (ai?.recommendations || []).map(r => ({
    text: [
      { text: '> ', color: COLORS.poison, bold: true, fontSize: 12 },
      { text: r, color: '#eeeeee', fontSize: 10 }
    ],
    margin: [0, 5, 0, 5]
  }));

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [30, 40, 30, 40],
    background: function (currentPage: any, pageSize: any) {
      return {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: pageSize.width, h: pageSize.height, color: '#050505' }
        ]
      };
    },
    defaultStyle: { color: '#ffffff', fontSize: 10 },
    styles: {
      header: { fontSize: 28, bold: true, color: '#ffffff' },
      headerHighlight: { fontSize: 28, bold: true, color: COLORS.crimson },
      tag: { color: '#ffffff', background: COLORS.crimson, bold: true, fontSize: 10, margin: [0, 20, 0, 10], alignment: 'left' },
      label: { color: '#888888', fontSize: 8, bold: true },
      value: { color: '#ffffff', fontSize: 12, bold: true },
    },
    content: [
      // HEADER
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              {
                stack: [
                  { text: [{ text: 'DOSSIER ', style: 'header' }, { text: 'METABÓLICO', style: 'headerHighlight' }] },
                  { text: `NÚCLEO_ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()} | REPORTE TÉCNICO DE ÉLITE`, color: '#888888', fontSize: 8, margin: [0, 5, 0, 0] }
                ],
                border: [false, false, false, false]
              },
              {
                stack: [
                  { text: calc.bmiStatus?.split(' ')[0].toUpperCase() || 'ESTABLE', fontSize: 18, color: COLORS.poison, bold: true, alignment: 'right' },
                  { text: 'STATUS BIOMÉTRICO', fontSize: 8, color: '#666666', alignment: 'right' }
                ],
                border: [true, false, false, false],
                borderColor: ['#333333', '#333333', '#333333', '#333333']
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: (i: number) => (i === 1 ? 2 : 0),
          vLineColor: () => '#333333',
          paddingLeft: (i: number) => (i === 1 ? 15 : 0)
        },
        margin: [0, 0, 0, 20]
      },

      // IDENTIDAD DEL SUJETO
      {
        table: { widths: ['auto'], body: [[{ text: ' IDENTIDAD DEL SUJETO ', color: '#ffffff', fillColor: COLORS.crimson, bold: true, fontSize: 9, border: [false, false, false, false] }]] }
      },
      { text: '\n', fontSize: 5 },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            [
              { text: [{ text: 'SUJETO\n', style: 'label' }, { text: patient.full_name.toUpperCase(), style: 'value' }], fillColor: '#0d0d12', border: [true, true, true, true] },
              { text: [{ text: 'GENOTIPO\n', style: 'label' }, { text: patient.sex === 'F' ? 'XX (FEMENINO)' : 'XY (MASCULINO)', style: 'value' }], fillColor: '#0d0d12', border: [true, true, true, true] },
              { text: [{ text: 'EDAD\n', style: 'label' }, { text: `${patient.age} AÑOS`, style: 'value' }], fillColor: '#0d0d12', border: [true, true, true, true] },
              { text: [{ text: 'FECHA\n', style: 'label' }, { text: new Date().toLocaleDateString('es-CL'), style: 'value' }], fillColor: '#0d0d12', border: [true, true, true, true] }
            ]
          ]
        },
        layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#333333', vLineColor: () => '#333333', paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 8, paddingBottom: () => 8 },
        margin: [0, 0, 0, 15]
      },

      // TELEMETRÍA AVANZADA
      {
        table: { widths: ['auto'], body: [[{ text: ' TELEMETRÍA CORPORAL AVANZADA ', color: '#ffffff', fillColor: COLORS.crimson, bold: true, fontSize: 9, border: [false, false, false, false] }]] },
        unbreakable: true
      },
      { text: '\n', fontSize: 5 },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            [
              { text: [{ text: 'MASA TOTAL\n', style: 'label' }, { text: `${record.weight_kg ?? 'N/A'} KG`, style: 'value' }], fillColor: '#0d0d12' },
              { text: [{ text: 'ESTATURA\n', style: 'label' }, { text: `${record.height_cm ?? 'N/A'} CM`, style: 'value' }], fillColor: '#0d0d12' },
              { text: [{ text: 'ÍNDICE IMC\n', style: 'label' }, { text: `${calc.bmi ?? 'N/A'}`, style: 'value', color: COLORS.crimson }], fillColor: '#0d0d12' },
              { text: [{ text: 'PESO IDEAL\n', style: 'label' }, { text: `${calc.idealWeight ?? 'N/A'} KG`, style: 'value' }], fillColor: '#0d0d12' }
            ],
            [
              { text: [{ text: 'ADIPOSIDAD %\n', style: 'label' }, { text: calc.fatPercent != null ? `${calc.fatPercent}%` : 'N/A', style: 'value' }], fillColor: '#0d0d12' },
              { text: [{ text: 'TEJIDO GRASO\n', style: 'label' }, { text: `${calc.fatMassKg ?? 'N/A'} KG`, style: 'value' }], fillColor: '#0d0d12' },
              { text: [{ text: 'TEJIDO MAGRO\n', style: 'label' }, { text: `${calc.leanMassKg ?? 'N/A'} KG`, style: 'value' }], fillColor: '#0d0d12' },
              { text: [{ text: 'RIESGO CV\n', style: 'label' }, { text: `${calc.cvRisk || 'N/A'}`, style: 'value', color: COLORS.crimson }], fillColor: '#0d0d12' }
            ]
          ]
        },
        layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#333333', vLineColor: () => '#333333', paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 8, paddingBottom: () => 8 },
        unbreakable: true
      },

      chartNode,

      // HUD SECUNDARIO
      {
        table: {
          widths: ['*', '*', '*'],
          body: [
            [
              { text: [{ text: 'HEMODINÁMICA\n', style: 'label' }, { text: `${record.systolic_bp || '--'}/${record.diastolic_bp || '--'} mmHg\n`, style: 'value' }, { text: calc.bpStatus || 'Sin Registro', fontSize: 8, color: COLORS.sky }], fillColor: '#0d0d12' },
              { text: [{ text: 'FILTRACIÓN RENAL\n', style: 'label' }, { text: `${calc.gfr || 'N/A'} ml/min\n`, style: 'value' }, { text: `KDIGO: ${calc.kdigoStage || '--'}`, fontSize: 8, color: COLORS.crimson }], fillColor: '#0d0d12' },
              { text: [{ text: 'CAPACIDAD FUNCIONAL\n', style: 'label' }, { text: `${record.grip_strength_kg || '0'} KG (GRIP)\n`, style: 'value' }, { text: `Sarcopenia: ${calc.sarcopeniaRisk || 'Estable'}`, fontSize: 8, color: COLORS.purple }], fillColor: '#0d0d12' }
            ]
          ]
        },
        layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#333333', vLineColor: () => '#333333', paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 10, paddingBottom: () => 10 },
        margin: [0, 15, 0, 15],
        unbreakable: true
      },

      // MACROS
      {
        table: { widths: ['auto'], body: [[{ text: ' ASIGNACIÓN DE RECURSOS METABÓLICOS ', color: '#ffffff', fillColor: COLORS.crimson, bold: true, fontSize: 9, border: [false, false, false, false] }]] },
        unbreakable: true
      },
      { text: '\n', fontSize: 5 },
      {
        table: {
          widths: ['*', '*', '*'],
          body: [
            [
              { text: [{ text: 'PROTEÍNAS\n', style: 'label' }, { text: `${p}g `, style: 'value' }, { text: `(${record.macro_prot_pct || 0}%)\n`, fontSize: 8, color: '#888888' }, { text: `${calc.macros?.protGkg || 0} g/kg`, style: 'label' }], fillColor: '#0d0d12' },
              { text: [{ text: 'CARBOHIDRATOS\n', style: 'label' }, { text: `${c}g `, style: 'value' }, { text: `(${record.macro_cho_pct || 0}%)\n`, fontSize: 8, color: '#888888' }, { text: `${calc.macros?.choGkg || 0} g/kg`, style: 'label' }], fillColor: '#0d0d12' },
              { text: [{ text: 'LÍPIDOS\n', style: 'label' }, { text: `${f}g `, style: 'value' }, { text: `(${record.macro_fat_pct || 0}%)\n`, fontSize: 8, color: '#888888' }, { text: `${calc.macros?.fatGkg || 0} g/kg`, style: 'label' }], fillColor: '#0d0d12' }
            ],
            [
              { text: [{ text: 'GASTO BASAL\n', style: 'label' }, { text: `${calc.bmr} KCAL`, style: 'value' }], fillColor: '#0d0d12' },
              { text: [{ text: 'VCT TOTAL\n', style: 'label' }, { text: `${calc.tdee} KCAL`, style: 'value', color: COLORS.poison }], fillColor: '#0d0d12' },
              { text: [{ text: 'HIDRATACIÓN\n', style: 'label' }, { text: `${calc.waterLiters} L/DÍA`, style: 'value', color: COLORS.sky }], fillColor: '#0d0d12' }
            ]
          ]
        },
        layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#333333', vLineColor: () => '#333333', paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 10, paddingBottom: () => 10 },
        unbreakable: true
      },

      // IA
      ...(ai ? [
        {
          table: { widths: ['auto'], body: [[{ text: ' ANÁLISIS CLÍNICO Y FISIOPATOLÓGICO IA ', color: '#ffffff', fillColor: COLORS.crimson, bold: true, fontSize: 9, border: [false, false, false, false] }]] },
          margin: [0, 15, 0, 0],
          unbreakable: true
        },
        { text: '\n', fontSize: 5 },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: 'DIAGNÓSTICO TÉCNICO INTEGRAL', color: COLORS.sky, fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
                    { text: ai.nutritional_diagnosis || 'Sin registro.', color: '#ffffff', fontSize: 10, margin: [0, 0, 0, 15] },
                    { text: 'ANÁLISIS FISIOPATOLÓGICO CRÍTICO', color: COLORS.purple, fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
                    { text: ai.summary || 'Sin registro.', color: '#bbbbbb', fontSize: 10, margin: [0, 0, 0, 15] },
                    { text: 'PLAN DE INTERVENCIÓN TÁCTICO', color: COLORS.poison, fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
                    ...recList
                  ],
                  fillColor: '#0d0d12'
                }
              ]
            ]
          },
          layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#333333', vLineColor: () => '#333333', paddingLeft: () => 15, paddingRight: () => 15, paddingTop: () => 15, paddingBottom: () => 15 },
          unbreakable: true
        }
      ] : [
        {
          table: { widths: ['auto'], body: [[{ text: ' ANÁLISIS IA (NÚCLEO CORTEX) ', color: '#ffffff', fillColor: COLORS.muted, bold: true, fontSize: 9, border: [false, false, false, false] }]] },
          margin: [0, 15, 0, 0],
          unbreakable: true
        },
        { text: '\n', fontSize: 5 },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: '⚠️', fontSize: 24, alignment: 'center', margin: [0, 0, 0, 10] },
                    { text: 'ANÁLISIS IA NO INICIADO', color: COLORS.muted, fontSize: 14, bold: true, alignment: 'center' },
                    { text: 'El expediente fue generado sin activar el NÚCLEO CORTEX.', color: '#666666', fontSize: 10, alignment: 'center', margin: [0, 5, 0, 0] }
                  ],
                  fillColor: '#0d0d12'
                }
              ]
            ]
          },
          layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#333333', vLineColor: () => '#333333', paddingLeft: () => 15, paddingRight: () => 15, paddingTop: () => 30, paddingBottom: () => 30 },
          unbreakable: true
        }
      ]),

      ...(record.professional_indications ? [
        {
          table: { widths: ['auto'], body: [[{ text: ' INDICACIONES PROFESIONALES ADICIONALES ', color: '#ffffff', fillColor: '#333333', bold: true, fontSize: 9, border: [false, false, false, false] }]] },
          margin: [0, 15, 0, 0],
          unbreakable: true
        },
        { text: '\n', fontSize: 5 },
        {
          table: {
            widths: ['*'],
            body: [
              [
                { text: record.professional_indications, color: '#eeeeee', fontSize: 10, fillColor: '#0d0d12' }
              ]
            ]
          },
          layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#555555', vLineColor: () => '#555555', paddingLeft: () => 15, paddingRight: () => 15, paddingTop: () => 15, paddingBottom: () => 15, hLineStyle: () => ({ dash: { length: 4 } }) },
          unbreakable: true
        }
      ] : []),

      // FIRMA Y FOOTER
      {
        stack: [
          { text: 'CAMILA OLIVARES ARCE', color: '#ffffff', fontSize: 12, bold: true, alignment: 'right' },
          { text: 'NUTRICIONISTA CLÍNICA', color: '#888888', fontSize: 8, alignment: 'right' },
          { text: 'REGISTRO NACIONAL DE SALUD', color: '#666666', fontSize: 6, alignment: 'right' }
        ],
        margin: [0, 40, 0, 20],
        unbreakable: true
      },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { text: 'SISTEMA DE CONTROL BIOMÉTRICO "NÚCLEO METABÓLICO"\nREPORTE DE USO EXCLUSIVO PROFESIONAL - CONFIDENCIAL', color: '#666666', fontSize: 8, border: [false, false, false, false] },
              { text: 'PROTOCOL_138_GEN_9\nGenerado por SYNDROME OS v9.0 — Camila Olivares Arce', color: '#444444', fontSize: 8, alignment: 'right', border: [false, false, false, false] }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 10, 0, 0],
        unbreakable: true
      }
    ].filter(Boolean)
  };

  try {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'web') {
        pdfMake.createPdf(docDefinition).open();
        resolve(true);
      } else {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        (pdfDocGenerator as any).getBase64(async (data: string) => {
          try {
            const fileName = `Reporte_${patient.full_name.replace(/ /g, '_')}.pdf`;
            const fileUri = FileSystem.documentDirectory + fileName;
            await FileSystem.writeAsStringAsync(fileUri, data, { encoding: FileSystem.EncodingType.Base64 });
            await Sharing.shareAsync(fileUri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: fileName });
            resolve(true);
          } catch (err) {
            console.error('Error sharing PDF:', err);
            reject(err);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
