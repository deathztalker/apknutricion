import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { COLORS, SHADOWS, ACTIVITY_FACTORS, FONTS, DIET_TYPES } from '../constants/theme';
import { calculateAll } from '../lib/calculations';
import { analyzeWithGemini } from '../lib/ai';
import { RecordFormData, CalculationResult, AIAnalysis, Patient, ClinicalRecord } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { generateClinicalReport } from '../lib/reports';
import { useLocalSearchParams, router } from 'expo-router';
import { patientService, recordService, supabase } from '../lib/supabase';
import Somatocarta from '../components/Somatocarta';
import TerminalBackground from '../components/TerminalBackground';

export default function Calculator() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  
  const [form, setForm] = useState<RecordFormData>({
    weight_kg: '', height_cm: '', waist_cm: '', systolic_bp: '', diastolic_bp: '',
    activity_factor: '1.2', macro_prot_pct: '20', macro_cho_pct: '50', macro_fat_pct: '30',
    fold_triceps: '', fold_subscapular: '', fold_supraspinal: '', fold_abdominal: '',
    diameter_humerus: '', diameter_femur: '', perimeter_arm: '', perimeter_calf: '',
    creatinine: '', knee_height_cm: '', usual_weight_kg: '', weight_loss_weeks: '',
    med_dose: '', med_conc: '', observations: '',
    diet_type: 'Omnívora', liquid_intake: '1 a 2 Litros', digestion_status: 'Normal',
    pathologies: [], allergies: [], grip_strength_kg: '', calf_circumference_cm: '',
    mna_score: undefined, vgs_status: undefined,
  });

  const [patient, setPatient] = useState<Partial<Patient>>({
    full_name: 'SUJETO DESCONOCIDO',
    age: 0, sex: 'M', insurance: 'FONASA',
  });

  const [results, setResults] = useState<CalculationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [patientHistory, setPatientHistory] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'anamnesis' | 'macros' | 'sports' | 'clinical' | 'ai' | 'history' | 'tables'>('scanner');

  useEffect(() => {
    if (patientId) {
      const fetchData = async () => {
        const [pRes, hRes] = await Promise.all([
          patientService.getById(patientId),
          recordService.getByPatient(patientId, 20)
        ]);
        
        if (pRes.data) {
          let age = pRes.data.age;
          if (pRes.data.birth_date) {
            const birthDate = new Date(pRes.data.birth_date);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
          }
          setPatient({ ...pRes.data, age } as any);
        }
        if (hRes.data) setPatientHistory(hRes.data);
      };
      fetchData();
    }
  }, [patientId]);

  useEffect(() => {
    const calc = calculateAll(form, patient.age || 0, patient.sex as any);
    setResults(calc);
  }, [form, patient.age, patient.sex]);

  const handleAINeuralDissection = async () => {
    if (!form.weight_kg || !form.height_cm) {
      Alert.alert('FALLO BIOMÉTRICO', 'Peso y Talla son obligatorios para la disección neural.');
      return;
    }
    setLoading(true);
    try {
      const analysis = await analyzeWithGemini(patient, form as any, results!);
      setAiAnalysis(analysis);
      setActiveTab('ai');
    } catch (error) {
      console.error('AI Failure:', error);
      Alert.alert('FALLO DE VÍNCULO', 'Núcleo Gemini fuera de línea.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!results || !patientId) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');
      const { error } = await recordService.create({
        patient_id: patientId, user_id: user.id, record_date: new Date().toISOString(),
        weight_kg: parseFloat(form.weight_kg!), height_cm: parseFloat(form.height_cm!),
        waist_cm: parseFloat(form.waist_cm || '0'), bmi: results.bmi, bmi_status: results.bmiStatus,
        ideal_weight: results.idealWeight, fat_percent: results.fatPercent, fat_mass_kg: results.fatMassKg,
        lean_mass_kg: results.leanMassKg, ict: results.ict, cv_risk: results.cvRisk,
        systolic_bp: parseInt(form.systolic_bp || '0'), diastolic_bp: parseInt(form.diastolic_bp || '0'),
        bp_status: results.bpStatus, activity_factor: parseFloat(form.activity_factor || '1.2'),
        bmr_kcal: results.bmr, tdee_kcal: results.tdee, water_liters: results.waterLiters,
        macro_prot_pct: parseInt(form.macro_prot_pct || '20'), macro_cho_pct: parseInt(form.macro_cho_pct || '50'),
        macro_fat_pct: parseInt(form.macro_fat_pct || '30'), pathologies: form.pathologies,
        allergies: form.allergies, diet_type: form.diet_type, liquid_intake: form.liquid_intake,
        digestion_status: form.digestion_status, observations: form.observations,
        ai_analysis: aiAnalysis?.summary, grip_strength_kg: parseFloat(form.grip_strength_kg || '0'),
        calf_circumference_cm: parseFloat(form.calf_circumference_cm || '0'),
        mna_score: form.mna_score, vgs_status: form.vgs_status, somatotype: results.somatotype,
      } as any);
      if (error) throw error;
      Alert.alert('SINCRO EXITOSA', 'Expediente actualizado en el núcleo.');
      setActiveTab('history');
      // Refresh history
      const { data } = await recordService.getByPatient(patientId, 20);
      if (data) setPatientHistory(data);
    } catch (error: any) {
      Alert.alert('FALLO DE RED', error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (label: string, value: any, onChange: (v: string) => void, placeholder: string, keyboard = 'numeric', multiline = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 120, textAlignVertical: 'top' }]}
        value={String(value || '')}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#444"
        keyboardType={keyboard as any}
        multiline={multiline}
      />
    </View>
  );

  return (
    <TerminalBackground>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            <TabItem id="scanner" label="CESFAM" icon="scan" active={activeTab} onPress={setActiveTab} color={COLORS.crimson} />
            <TabItem id="anamnesis" label="ANAMNESIS" icon="list" active={activeTab} onPress={setActiveTab} color={COLORS.purple} />
            <TabItem id="macros" label="MACROS" icon="pie-chart" active={activeTab} onPress={setActiveTab} color={COLORS.pink} />
            <TabItem id="sports" label="DEPORTIVA" icon="fitness" active={activeTab} onPress={setActiveTab} color={COLORS.poison} />
            <TabItem id="clinical" label="CLÍNICA" icon="medkit" active={activeTab} onPress={setActiveTab} color={COLORS.purple} />
            <TabItem id="ai" label="NEURAL" icon="brain" active={activeTab} onPress={setActiveTab} color={COLORS.crimson} />
            <TabItem id="history" label="HISTORIAL" icon="server" active={activeTab} onPress={setActiveTab} color={COLORS.sky} />
            <TabItem id="tables" label="LIB" icon="grid" active={activeTab} onPress={setActiveTab} color={COLORS.dim} />
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {activeTab === 'scanner' && (
            <View style={styles.section}>
              <SectionHeader title="ESCANEO BIOMÉTRICO" icon="skull" color={COLORS.crimson} />
              <View style={styles.row}>
                {renderInput('PESO (KG)', form.weight_kg, (v) => setForm({...form, weight_kg: v}), '0.0')}
                {renderInput('TALLA (CM)', form.height_cm, (v) => setForm({...form, height_cm: v}), '0')}
              </View>
              <View style={styles.row}>
                {renderInput('CINTURA (CM)', form.waist_cm, (v) => setForm({...form, waist_cm: v}), '0')}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ACT. FÍSICA</Text>
                  <TextInput style={styles.input} value={form.activity_factor} onChangeText={(v) => setForm({...form, activity_factor: v})} keyboardType="numeric" placeholder="1.2" />
                </View>
              </View>
              <View style={styles.row}>
                {renderInput('PAS (SIST)', form.systolic_bp, (v) => setForm({...form, systolic_bp: v}), '120')}
                {renderInput('PAD (DIAST)', form.diastolic_bp, (v) => setForm({...form, diastolic_bp: v}), '80')}
              </View>

              <View style={styles.dashboardGrid}>
                <ResultBox label="IMC CLÍNICO" value={results?.bmi?.toFixed(1) || '--'} sub={results?.bmiStatus || 'STANDBY'} color={results?.bmiColor || COLORS.bone} />
                <ResultBox label="PESO IDEAL" value={`${results?.idealWeight?.toFixed(1) || '--'} KG`} sub={results?.adjustedWeight ? `ADJ: ${results.adjustedWeight.toFixed(1)}` : 'PESO LORENZ'} color={COLORS.bone} />
                <ResultBox label="RIESGO CV" value={results?.cvRisk || '--'} sub={`ICT: ${results?.ict?.toFixed(2) || '--'}`} color={COLORS.pink} />
                <ResultBox label="P. ARTERIAL" value={`${form.systolic_bp || '--'}/${form.diastolic_bp || '--'}`} sub={results?.bpStatus || '--'} color={results?.bpColor || COLORS.bone} />
                <ResultBox label="REQ. AGUA" value={`${results?.waterLiters?.toFixed(1) || '--'} L`} color={COLORS.sky} />
                <ResultBox label="VCT DIARIO" value={`${results?.tdee?.toFixed(0) || '--'} Kcal`} color={COLORS.neon} />
              </View>

              <TouchableOpacity style={styles.mainActionBtn} onPress={handleAINeuralDissection} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.white} /> : (
                  <>
                    <Ionicons name="brain" size={30} color={COLORS.white} />
                    <Text style={styles.mainActionText}>INICIAR DISECCIÓN NEURAL</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'anamnesis' && (
            <View style={styles.section}>
              <SectionHeader title="ANAMNESIS DEL SUJETO" icon="list" color={COLORS.purple} />
              {renderInput('PATOLOGÍAS', form.pathologies?.join(', '), (v) => setForm({...form, pathologies: v.split(',').map(s => s.trim())}), 'HTA, DM2, Hipotiroidismo...', 'default')}
              {renderInput('ALERGIAS / INTOLERANCIAS', form.allergies?.join(', '), (v) => setForm({...form, allergies: v.split(',').map(s => s.trim())}), 'Lactosa, Gluten...', 'default')}
              <View style={styles.row}>
                {renderInput('DIETA', form.diet_type, (v) => setForm({...form, diet_type: v}), 'Omnívora', 'default')}
                {renderInput('LÍQUIDOS', form.liquid_intake, (v) => setForm({...form, liquid_intake: v}), '1-2 Litros', 'default')}
              </View>
              {renderInput('DIGESTIÓN', form.digestion_status, (v) => setForm({...form, digestion_status: v}), 'Normal', 'default')}
              {renderInput('OBSERVACIONES', form.observations, (v) => setForm({...form, observations: v}), 'Notas clínicas...', 'default', true)}
            </View>
          )}

          {activeTab === 'macros' && (
            <View style={styles.section}>
              <SectionHeader title="PROTOCOLOS DE NUTRICIÓN" icon="pie-chart" color={COLORS.pink} />
              <View style={styles.row}>
                {renderInput('% PROTEÍNAS', form.macro_prot_pct, (v) => setForm({...form, macro_prot_pct: v}), '20')}
                {renderInput('% CARBOS', form.macro_cho_pct, (v) => setForm({...form, macro_cho_pct: v}), '50')}
                {renderInput('% LÍPIDOS', form.macro_fat_pct, (v) => setForm({...form, macro_fat_pct: v}), '30')}
              </View>
              {results?.macros && (
                <View style={styles.macroDashboard}>
                  <MacroBox label="PROTEÍNAS" grams={results.macros.protG} gkg={results.macros.protGkg} color={COLORS.crimson} />
                  <MacroBox label="CARBOHIDRATOS" grams={results.macros.choG} gkg={results.macros.choGkg} color={COLORS.purple} />
                  <MacroBox label="LÍPIDOS" grams={results.macros.fatG} gkg={results.macros.fatGkg} color={COLORS.pink} />
                </View>
              )}
            </View>
          )}

          {activeTab === 'sports' && (
            <View style={styles.section}>
              <SectionHeader title="CINEANTROPOMETRÍA" icon="fitness" color={COLORS.poison} />
              {results?.somatotype && (
                <View style={styles.vizContainer}>
                  <Somatocarta x={results.somatotype.x} y={results.somatotype.y} size={280} />
                </View>
              )}
              <View style={styles.grid2}>
                {renderInput('TRICIPITAL', form.fold_triceps, (v) => setForm({...form, fold_triceps: v}), '0')}
                {renderInput('SUBESCAPULAR', form.fold_subscapular, (v) => setForm({...form, fold_subscapular: v}), '0')}
                {renderInput('SUPRAESPINAL', form.fold_supraspinal, (v) => setForm({...form, fold_supraspinal: v}), '0')}
                {renderInput('ABDOMINAL', form.fold_abdominal, (v) => setForm({...form, fold_abdominal: v}), '0')}
              </View>
              <View style={styles.dashboardGrid}>
                <ResultBox label="% GRASA" value={`${results?.fatPercent?.toFixed(1) || '--'} %`} color={COLORS.poison} />
                <ResultBox label="M. GRASA" value={`${results?.fatMassKg?.toFixed(1) || '--'} KG`} color={COLORS.pink} />
                <ResultBox label="M. MAGRA" value={`${results?.leanMassKg?.toFixed(1) || '--'} KG`} color={COLORS.sky} />
                <ResultBox label="∑ PLIEGUES" value={`${results?.foldSum?.toFixed(1) || '--'} MM`} color={COLORS.purple} />
              </View>
            </View>
          )}

          {activeTab === 'clinical' && (
            <View style={styles.section}>
              <SectionHeader title="OVERRIDE HOSPITALARIO" icon="medkit" color={COLORS.purple} />
              <View style={styles.miniCard}>
                <Text style={styles.cardTitle}>FILTRACIÓN RENAL (GFR)</Text>
                <View style={styles.row}>
                  {renderInput('CREATININA', form.creatinine, (v) => setForm({...form, creatinine: v}), 'mg/dL')}
                  <View style={styles.displayOnly}>
                    <Text style={styles.displayLabel}>TFG / KDIGO</Text>
                    <Text style={[styles.displayValue, { color: COLORS.poison }]}>{results?.gfr?.toFixed(1) || '--'} ({results?.kdigoStage || '--'})</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.miniCard, { borderColor: COLORS.pink }]}>
                <Text style={[styles.cardTitle, { color: COLORS.pink }]}>DOSIFICACIÓN (mg/kg)</Text>
                <View style={styles.row}>
                  {renderInput('DOSIS', form.med_dose, (v) => setForm({...form, med_dose: v}), '15')}
                  {renderInput('CONC', form.med_conc, (v) => setForm({...form, med_conc: v}), '50')}
                </View>
                <View style={styles.dosageResult}>
                  <Text style={styles.dosageLabel}>VOLUMEN REQUERIDO</Text>
                  <Text style={styles.dosageValue}>{results && form.med_dose && form.med_conc && form.weight_kg ? ((parseFloat(form.med_dose) * parseFloat(form.weight_kg)) / parseFloat(form.med_conc)).toFixed(1) : '--'} ml</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'ai' && aiAnalysis && (
            <View style={styles.section}>
              <SectionHeader title="DISECCIÓN NEURAL" icon="brain" color={COLORS.crimson} />
              <View style={styles.aiCard}>
                <Text style={styles.aiLabel}>DIAGNÓSTICO TÉCNICO</Text>
                <Text style={styles.aiText}>{aiAnalysis.nutritional_diagnosis}</Text>
                <View style={styles.aiDivider} />
                <Text style={[styles.aiLabel, { color: COLORS.purple }]}>LOG FISIOPATOLÓGICO</Text>
                <Text style={styles.aiText}>{aiAnalysis.summary}</Text>
                <View style={styles.aiDivider} />
                <Text style={[styles.aiLabel, { color: COLORS.poison }]}>PROTOCOLOS DE INTERVENCIÓN</Text>
                {aiAnalysis.recommendations.map((r, i) => (
                  <View key={i} style={styles.aiRecItem}><Text style={styles.aiRecBullet}>></Text><Text style={styles.aiText}>{r}</Text></View>
                ))}
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => generateClinicalReport(patient as any, form as any, results!, aiAnalysis)}>
                  <Ionicons name='document-text' size={26} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>REPORTE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: COLORS.crimson }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color={COLORS.white} /> : <><Ionicons name='cloud-upload' size={26} color={COLORS.white} /><Text style={styles.actionBtnText}>SINCRO</Text></>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'history' && (
            <View style={styles.section}>
              <SectionHeader title="REGISTROS DEL SUJETO" icon="server" color={COLORS.sky} />
              {patientHistory.map((rec) => (
                <View key={rec.id} style={styles.historyCard}>
                  <View style={styles.historyHead}>
                    <Text style={styles.historyDate}>{new Date(rec.record_date!).toLocaleDateString('es-CL', { dateStyle: 'long' }).toUpperCase()}</Text>
                    <Ionicons name="shield-checkmark" size={16} color={COLORS.poison} />
                  </View>
                  <View style={styles.historyGrid}>
                    <HStat label="IMC" val={rec.bmi} />
                    <HStat label="PESO" val={`${rec.weight_kg}KG`} />
                    <HStat label="GRASA" val={`${rec.fat_percent}%`} />
                    <HStat label="STATUS" val={rec.bmi_status} />
                  </View>
                </View>
              ))}
              {patientHistory.length === 0 && <Text style={styles.emptyText}>SIN TRANSMISIONES PREVIAS</Text>}
            </View>
          )}

          {activeTab === 'tables' && (
            <View style={styles.section}>
              <SectionHeader title="PROTOCOLOS MINSAL" icon="grid" color={COLORS.dim} />
              <View style={styles.tableCard}>
                <TableRow label="ENFLAQUECIDO" value="< 18.5" color={COLORS.gold} />
                <TableRow label="NORMAL" value="18.5 - 24.9" color={COLORS.poison} />
                <TableRow label="SOBREPESO" value="25.0 - 29.9" color={COLORS.purple} />
                <TableRow label="OBESIDAD" value="≥ 30.0" color={COLORS.crimson} />
              </View>
            </View>
          )}

        </ScrollView>
      </View>
    </TerminalBackground>
  );
}

function TabItem({ id, label, icon, active, onPress, color }: any) {
  const isActive = active === id;
  return (
    <TouchableOpacity style={[styles.tab, isActive && { borderBottomColor: color, backgroundColor: 'rgba(255,255,255,0.08)' }]} onPress={() => onPress(id)}>
      <Ionicons name={icon as any} size={22} color={isActive ? color : COLORS.dim} />
      <Text style={[styles.tabText, isActive && { color, fontWeight: '900' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, icon, color }: any) {
  return (
    <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={28} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );
}

function ResultBox({ label, value, sub, color }: any) {
  return (
    <View style={[styles.resBox, { borderBottomColor: color }]}>
      <Text style={styles.resLabel}>{label}</Text>
      <Text style={[styles.resValue, { color }]}>{value}</Text>
      {sub && <Text style={styles.resSub}>{sub}</Text>}
    </View>
  );
}

function MacroBox({ label, grams, gkg, color }: any) {
  return (
    <View style={[styles.macroBox, { borderLeftColor: color }]}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroGrams, { color }]}>{grams.toFixed(0)}G</Text>
      <Text style={styles.macroGkg}>{gkg.toFixed(1)} G/KG</Text>
    </View>
  );
}

function TableRow({ label, value, color }: any) {
  return (
    <View style={styles.tableRow}><Text style={styles.tableLabel}>{label}</Text><Text style={[styles.tableValue, { color }]}>{value}</Text></View>
  );
}

function HStat({ label, val }: any) {
  return (
    <View style={styles.hStat}><Text style={styles.hLabel}>{label}</Text><Text style={styles.hVal}>{val}</Text></View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: { backgroundColor: 'rgba(0,0,0,0.7)', borderBottomWidth: 1, borderBottomColor: '#222' },
  tabScroll: { paddingHorizontal: 10 },
  tab: { paddingHorizontal: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 4, borderBottomColor: 'transparent' },
  tabText: { color: COLORS.dim, fontSize: 13, letterSpacing: 1.5 },
  scrollContent: { padding: 25, paddingBottom: 60 },
  section: { gap: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, borderLeftWidth: 6, paddingLeft: 18 },
  sectionTitle: { fontSize: 26, fontFamily: FONTS.horror, letterSpacing: 3 },
  row: { flexDirection: 'row', gap: 18 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  inputGroup: { flex: 1, gap: 12 },
  inputLabel: { color: COLORS.white, fontSize: 12, fontWeight: '900', letterSpacing: 2.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: '#444', padding: 22, color: COLORS.white, fontSize: 20, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', ...SHADOWS.neon },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 20 },
  resBox: { width: '30%', backgroundColor: '#0d0d12', padding: 20, borderBottomWidth: 5, gap: 10, ...SHADOWS.crimson },
  resLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.dim, letterSpacing: 2 },
  resValue: { fontSize: 20, fontWeight: '900', fontFamily: FONTS.horror },
  resSub: { fontSize: 11, color: COLORS.muted, fontWeight: '900' },
  mainActionBtn: { backgroundColor: COLORS.crimson, height: 85, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, marginTop: 40, ...SHADOWS.crimson },
  mainActionText: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 28, letterSpacing: 3 },
  macroDashboard: { flexDirection: 'row', gap: 15 },
  macroBox: { flex: 1, backgroundColor: '#0f0f16', padding: 22, borderLeftWidth: 8, gap: 12 },
  macroLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.dim },
  macroGrams: { fontSize: 26, fontWeight: '900', fontFamily: FONTS.horror },
  macroGkg: { fontSize: 12, color: COLORS.muted, fontWeight: 'bold' },
  vizContainer: { alignItems: 'center', padding: 25, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: '#333' },
  miniCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 30, borderWidth: 1, borderColor: '#555', gap: 25 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: COLORS.muted, letterSpacing: 2 },
  displayOnly: { flex: 1, justifyContent: 'center', backgroundColor: '#000', padding: 20, borderWidth: 1, borderColor: '#444' },
  displayLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.dim, marginBottom: 10 },
  displayValue: { fontSize: 22, fontWeight: '900', color: COLORS.bone },
  dosageResult: { backgroundColor: 'rgba(255, 0, 81, 0.15)', padding: 25, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: COLORS.pink },
  dosageLabel: { fontSize: 12, color: COLORS.bone, fontWeight: 'bold' },
  dosageValue: { fontSize: 32, color: COLORS.bone, fontWeight: '900', marginTop: 12 },
  aiCard: { backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: 40, borderWidth: 1, borderColor: '#555', ...SHADOWS.purple },
  aiLabel: { color: COLORS.crimson, fontSize: 16, fontWeight: '900', letterSpacing: 4 },
  aiText: { color: COLORS.bone, fontSize: 18, lineHeight: 28, textAlign: 'justify' },
  aiRecItem: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  aiRecBullet: { color: COLORS.poison, fontWeight: '900', fontSize: 22 },
  aiDivider: { height: 1, backgroundColor: '#666', marginVertical: 35 },
  actionRow: { flexDirection: 'row', gap: 20, marginTop: 40 },
  actionBtn: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, backgroundColor: '#0a0a0d', borderWidth: 2, borderColor: '#555' },
  actionBtnText: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 24 },
  historyCard: { backgroundColor: '#0d0d12', padding: 25, borderWidth: 1, borderColor: '#333', marginBottom: 15, borderLeftWidth: 5, borderLeftColor: COLORS.sky },
  historyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  historyDate: { fontSize: 13, color: COLORS.sky, fontWeight: '900', letterSpacing: 1 },
  historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  hStat: { width: '45%' },
  hLabel: { fontSize: 10, color: COLORS.dim, fontWeight: 'bold' },
  hVal: { fontSize: 15, color: COLORS.bone, fontWeight: '900' },
  emptyText: { color: COLORS.dim, fontFamily: FONTS.horror, fontSize: 24, textAlign: 'center', marginTop: 50 },
  tableCard: { backgroundColor: '#0f0f16', padding: 35, borderWidth: 1, borderColor: '#555' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#444' },
  tableLabel: { color: COLORS.muted, fontSize: 15, fontWeight: 'bold' },
  tableValue: { fontSize: 18, fontWeight: '900' },
});
