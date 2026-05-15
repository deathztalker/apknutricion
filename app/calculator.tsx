import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { COLORS, SHADOWS, ACTIVITY_FACTORS, FONTS, DIET_TYPES } from '../constants/theme';
import { calculateAll } from '../lib/calculations';
import { analyzeWithGemini } from '../lib/ai';
import { RecordFormData, CalculationResult, AIAnalysis, Patient } from '../types';
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
    full_name: 'UNKNOWN SUBJECT',
    age: 0, sex: 'M', insurance: 'FONASA',
  });

  const [results, setResults] = useState<CalculationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'anamnesis' | 'macros' | 'sports' | 'clinical' | 'ai' | 'tables'>('scanner');

  useEffect(() => {
    if (patientId) {
      const fetchPatient = async () => {
        const { data, error } = await patientService.getById(patientId);
        if (data && !error) {
          let age = data.age;
          if (data.birth_date) {
            const birthDate = new Date(data.birth_date);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
          }
          setPatient({ ...data, age } as any);
        }
      };
      fetchPatient();
    }
  }, [patientId]);

  // Real-time calculation sync
  useEffect(() => {
    const calc = calculateAll(form, patient.age || 0, patient.sex as any);
    setResults(calc);
  }, [form, patient.age, patient.sex]);

  const handleAINeuralDissection = async () => {
    if (!form.weight_kg || !form.height_cm) {
      Alert.alert('DATA DEFICIENCY', 'Weight and Height are mandatory for neural dissection.');
      return;
    }
    setLoading(true);
    try {
      const analysis = await analyzeWithGemini(patient, form as any, results!);
      setAiAnalysis(analysis);
      setActiveTab('ai');
    } catch (error) {
      console.error('AI Failure:', error);
      Alert.alert('LINK FAILURE', 'Could not establish connection with Gemini core.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!results || !patientId) {
      Alert.alert('SYSTEM ERROR', 'No subject selected for persistence.');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');
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
      Alert.alert('SYNC COMPLETE', 'Biometric record persisted to database.');
    } catch (error: any) {
      Alert.alert('SYNC FAILURE', error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (label: string, value: any, onChange: (v: string) => void, placeholder: string, keyboard = 'numeric', multiline = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={String(value || '')}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.dim}
        keyboardType={keyboard as any}
        multiline={multiline}
      />
    </View>
  );

  return (
    <TerminalBackground>
      <View style={styles.container}>
        {/* Module Selector (Aligned with index.html order) */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            <TabItem id="scanner" label="CESFAM" icon="scan" active={activeTab} onPress={setActiveTab} color={COLORS.crimson} />
            <TabItem id="anamnesis" label="ANAMNESIS" icon="list" active={activeTab} onPress={setActiveTab} color={COLORS.purple} />
            <TabItem id="macros" label="MACROS" icon="pie-chart" active={activeTab} onPress={setActiveTab} color={COLORS.pink} />
            <TabItem id="sports" label="SPORTS" icon="fitness" active={activeTab} onPress={setActiveTab} color={COLORS.poison} />
            <TabItem id="clinical" label="CLINICAL" icon="medkit" active={activeTab} onPress={setActiveTab} color={COLORS.purple} />
            <TabItem id="ai" label="NEURAL" icon="brain" active={activeTab} onPress={setActiveTab} color={COLORS.crimson} />
            <TabItem id="tables" label="LIBRARY" icon="grid" active={activeTab} onPress={setActiveTab} color={COLORS.dim} />
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* TAB 1: CESFAM (SCANNER) */}
          {activeTab === 'scanner' && (
            <View style={styles.section}>
              <SectionHeader title="PRIMARY BIOMETRICS" icon="skull" color={COLORS.crimson} />
              <View style={styles.row}>
                {renderInput('WEIGHT (KG)', form.weight_kg, (v) => setForm({...form, weight_kg: v}), '0.0')}
                {renderInput('HEIGHT (CM)', form.height_cm, (v) => setForm({...form, height_cm: v}), '0')}
              </View>
              <View style={styles.row}>
                {renderInput('WAIST (CM)', form.waist_cm, (v) => setForm({...form, waist_cm: v}), '0')}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ACTIVITY</Text>
                  <View style={styles.selectBox}>
                    <TextInput
                      style={styles.selectInput}
                      value={form.activity_factor}
                      onChangeText={(v) => setForm({...form, activity_factor: v})}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
              <View style={styles.row}>
                {renderInput('SYS BP', form.systolic_bp, (v) => setForm({...form, systolic_bp: v}), '120')}
                {renderInput('DIA BP', form.diastolic_bp, (v) => setForm({...form, diastolic_bp: v}), '80')}
              </View>

              {/* Real-time Dashboard Results (Mirroring index.html) */}
              <View style={styles.dashboardGrid}>
                <ResultBox label="IMC CLINIC" value={results?.bmi?.toFixed(1) || '--'} sub={results?.bmiStatus || 'WAITING...'} color={results?.bmiColor || COLORS.dim} />
                <ResultBox label="IDEAL WEIGHT" value={`${results?.idealWeight?.toFixed(1) || '--'} KG`} sub={results?.adjustedWeight ? `ADJ: ${results.adjustedWeight.toFixed(1)}` : ''} color={COLORS.bone} />
                <ResultBox label="CV RISK / ICT" value={results?.cvRisk || '--'} sub={`ICT: ${results?.ict?.toFixed(2) || '--'}`} color={COLORS.pink} />
                <ResultBox label="PRESION ART." value={`${form.systolic_bp || '--'}/${form.diastolic_bp || '--'}`} sub={results?.bpStatus || '--'} color={results?.bpColor || COLORS.dim} />
                <ResultBox label="WATER REQ." value={`${results?.waterLiters?.toFixed(1) || '--'} L`} color={COLORS.sky} />
                <ResultBox label="TOTAL Kcal" value={`${results?.tdee?.toFixed(0) || '--'} Kcal`} color={COLORS.neon} />
              </View>

              <TouchableOpacity style={styles.mainActionBtn} onPress={handleAINeuralDissection} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.white} /> : (
                  <>
                    <Ionicons name="brain" size={24} color={COLORS.white} />
                    <Text style={styles.mainActionText}>START NEURAL DISSECTION</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 2: ANAMNESIS */}
          {activeTab === 'anamnesis' && (
            <View style={styles.section}>
              <SectionHeader title="NEURAL ANAMNESIS" icon="list" color={COLORS.purple} />
              {renderInput('PATHOLOGIES', form.pathologies?.join(', '), (v) => setForm({...form, pathologies: v.split(',').map(s => s.trim())}), 'HTA, DM2...', 'default')}
              {renderInput('ALLERGIES', form.allergies?.join(', '), (v) => setForm({...form, allergies: v.split(',').map(s => s.trim())}), 'Lactosa, Gluten...', 'default')}
              <View style={styles.row}>
                {renderInput('DIET TYPE', form.diet_type, (v) => setForm({...form, diet_type: v}), 'Omnívora', 'default')}
                {renderInput('LIQUIDS', form.liquid_intake, (v) => setForm({...form, liquid_intake: v}), '1-2L', 'default')}
              </View>
              {renderInput('DIGESTION', form.digestion_status, (v) => setForm({...form, digestion_status: v}), 'Normal', 'default')}
              {renderInput('OBSERVATIONS', form.observations, (v) => setForm({...form, observations: v}), 'Clinical logs...', 'default', true)}
            </View>
          )}

          {/* TAB 3: MACROS */}
          {activeTab === 'macros' && (
            <View style={styles.section}>
              <SectionHeader title="MACRO ALLOCATION" icon="pie-chart" color={COLORS.pink} />
              <View style={styles.row}>
                {renderInput('% PROT', form.macro_prot_pct, (v) => setForm({...form, macro_prot_pct: v}), '20')}
                {renderInput('% CARB', form.macro_cho_pct, (v) => setForm({...form, macro_cho_pct: v}), '50')}
                {renderInput('% FAT', form.macro_fat_pct, (v) => setForm({...form, macro_fat_pct: v}), '30')}
              </View>
              {results?.macros && (
                <View style={styles.macroDashboard}>
                  <MacroBox label="PROTEINS" grams={results.macros.protG} gkg={results.macros.protGkg} color={COLORS.crimson} />
                  <MacroBox label="CARBS" grams={results.macros.choG} gkg={results.macros.choGkg} color={COLORS.purple} />
                  <MacroBox label="LIPIDS" grams={results.macros.fatG} gkg={results.macros.fatGkg} color={COLORS.pink} />
                </View>
              )}
            </View>
          )}

          {/* TAB 4: SPORTS (DEPORTIVA) */}
          {activeTab === 'sports' && (
            <View style={styles.section}>
              <SectionHeader title="NEURAL KINANTHROPOMETRY" icon="fitness" color={COLORS.poison} />
              
              {results?.somatotype && (
                <View style={styles.vizContainer}>
                  <Somatocarta x={results.somatotype.x} y={results.somatotype.y} size={280} />
                </View>
              )}

              <View style={styles.grid2}>
                {renderInput('TRICEPS', form.fold_triceps, (v) => setForm({...form, fold_triceps: v}), '0')}
                {renderInput('SUBSCAP.', form.fold_subscapular, (v) => setForm({...form, fold_subscapular: v}), '0')}
                {renderInput('SUPRAESP.', form.fold_supraspinal, (v) => setForm({...form, fold_supraspinal: v}), '0')}
                {renderInput('ABDOMINAL', form.fold_abdominal, (v) => setForm({...form, fold_abdominal: v}), '0')}
              </View>

              <View style={styles.row}>
                {renderInput('ARM PER.', form.perimeter_arm, (v) => setForm({...form, perimeter_arm: v}), '0')}
                {renderInput('CALF PER.', form.perimeter_calf, (v) => setForm({...form, perimeter_calf: v}), '0')}
              </View>

              <View style={styles.dashboardGrid}>
                <ResultBox label="FAT %" value={`${results?.fatPercent?.toFixed(1) || '--'} %`} color={COLORS.poison} />
                <ResultBox label="FAT MASS" value={`${results?.fatMassKg?.toFixed(1) || '--'} KG`} color={COLORS.pink} />
                <ResultBox label="LEAN MASS" value={`${results?.leanMassKg?.toFixed(1) || '--'} KG`} color={COLORS.sky} />
                <ResultBox label="FOLD SUM" value={`${results?.foldSum?.toFixed(1) || '--'} MM`} color={COLORS.purple} />
              </View>
            </View>
          )}

          {/* TAB 5: CLINICAL (HOSPITALARIA) */}
          {activeTab === 'clinical' && (
            <View style={styles.section}>
              <SectionHeader title="CLINICAL OVERRIDE" icon="medkit" color={COLORS.purple} />
              
              {/* Renal Panel */}
              <View style={styles.miniCard}>
                <Text style={styles.cardTitle}>RENAL FILTRATION (CG)</Text>
                <View style={styles.row}>
                  {renderInput('CREATININE', form.creatinine, (v) => setForm({...form, creatinine: v}), 'mg/dL')}
                  <View style={styles.displayOnly}>
                    <Text style={styles.displayLabel}>GFR / KDIGO</Text>
                    <Text style={[styles.displayValue, { color: COLORS.poison }]}>{results?.gfr?.toFixed(1) || '--'} ({results?.kdigoStage || '--'})</Text>
                  </View>
                </View>
              </View>

              {/* Chumlea Panel */}
              <View style={styles.miniCard}>
                <Text style={styles.cardTitle}>ESTIMATED HEIGHT (CHUMLEA)</Text>
                <View style={styles.row}>
                  {renderInput('KNEE HEIGHT', form.knee_height_cm, (v) => setForm({...form, knee_height_cm: v}), 'cm')}
                  <View style={styles.displayOnly}>
                    <Text style={styles.displayLabel}>EST. HEIGHT</Text>
                    <Text style={[styles.displayValue, { color: COLORS.neon }]}>{results?.estimatedHeight?.toFixed(1) || '--'} CM</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.inlineBtn}
                  onPress={() => setForm({...form, height_cm: results?.estimatedHeight?.toFixed(1) || ''})}
                >
                  <Text style={styles.inlineBtnText}>INJECT TO SCANNER</Text>
                </TouchableOpacity>
              </View>

              {/* Weight Loss Screening */}
              <View style={styles.miniCard}>
                <Text style={styles.cardTitle}>WEIGHT LOSS SCREENING</Text>
                <View style={styles.row}>
                  {renderInput('USUAL WEIGHT', form.usual_weight_kg, (v) => setForm({...form, usual_weight_kg: v}), 'kg')}
                  <View style={styles.displayOnly}>
                    <Text style={styles.displayLabel}>LOSS % / RISK</Text>
                    <Text style={[styles.displayValue, { color: results?.weightLossRisk === 'Normal' ? COLORS.poison : COLORS.crimson }]}>
                      {results?.weightLossPct?.toFixed(1) || '--'}% ({results?.weightLossRisk || '--'})
                    </Text>
                  </View>
                </View>
              </View>

              {/* Drug Dosing */}
              <View style={[styles.miniCard, { borderColor: COLORS.pink }]}>
                <Text style={[styles.cardTitle, { color: COLORS.pink }]}>SYSTEM DOSING (mg/kg)</Text>
                <View style={styles.row}>
                  {renderInput('DOSE (mg/kg)', form.med_dose, (v) => setForm({...form, med_dose: v}), '15')}
                  {renderInput('CONC (mg/ml)', form.med_conc, (v) => setForm({...form, med_conc: v}), '50')}
                </View>
                <View style={styles.dosageResult}>
                  <Text style={styles.dosageLabel}>REQUIRED VOLUME</Text>
                  <Text style={styles.dosageValue}>
                    {results && form.med_dose && form.med_conc && form.weight_kg 
                      ? ((parseFloat(form.med_dose) * parseFloat(form.weight_kg)) / parseFloat(form.med_conc)).toFixed(1)
                      : '--'
                    } ml
                  </Text>
                </View>
              </View>

              {/* Functional */}
              <View style={styles.miniCard}>
                <Text style={styles.cardTitle}>FUNCTIONAL MARKERS</Text>
                <View style={styles.row}>
                  {renderInput('GRIP (KG)', form.grip_strength_kg, (v) => setForm({...form, grip_strength_kg: v}), 'kg')}
                  {renderInput('MNA SCORE', String(form.mna_score || ''), (v) => setForm({...form, mna_score: parseFloat(v) || undefined}), '0-14')}
                </View>
                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>VGS STATUS</Text>
                    <View style={styles.miniBtnRow}>
                      {['A', 'B', 'C'].map(v => (
                        <TouchableOpacity 
                          key={v}
                          style={[styles.miniBtn, form.vgs_status === v && styles.activeMiniBtn]} 
                          onPress={() => setForm({...form, vgs_status: v as any})}
                        >
                          <Text style={[styles.miniBtnText, form.vgs_status === v && styles.activeMiniBtnText]}>{v}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* TAB 6: NEURAL AI */}
          {activeTab === 'ai' && aiAnalysis && (
            <View style={styles.section}>
              <SectionHeader title="NEURAL DISSECTION" icon="brain" color={COLORS.crimson} />
              <View style={styles.aiCard}>
                <View style={styles.aiItem}>
                  <Text style={styles.aiLabel}>SYSTEM DIAGNOSIS</Text>
                  <Text style={styles.aiText}>{aiAnalysis.nutritional_diagnosis}</Text>
                </View>
                <View style={styles.aiDivider} />
                <View style={styles.aiItem}>
                  <Text style={[styles.aiLabel, { color: COLORS.purple }]}>ANALYSIS LOG</Text>
                  <Text style={styles.aiText}>{aiAnalysis.summary}</Text>
                </View>
                <View style={styles.aiDivider} />
                <View style={styles.aiItem}>
                  <Text style={[styles.aiLabel, { color: COLORS.poison }]}>PROTOCOL RECS</Text>
                  {aiAnalysis.recommendations.map((r, i) => (
                    <Text key={i} style={styles.aiText}>• {r}</Text>
                  ))}
                </View>
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => generateClinicalReport(patient as any, form as any, results!, aiAnalysis)}>
                  <Ionicons name='document-text' size={20} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>REPORT</Text>
                </TouchableOpacity>

                {patientId && (
                  <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: COLORS.crimson }]} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color={COLORS.white} /> : (
                      <>
                        <Ionicons name='cloud-upload' size={20} color={COLORS.white} />
                        <Text style={styles.actionBtnText}>SYNC</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* TAB 7: TABLES (LIBRARY) */}
          {activeTab === 'tables' && (
            <View style={styles.section}>
              <SectionHeader title="REFERENCE PROTOCOLS" icon="grid" color={COLORS.dim} />
              
              <View style={styles.tableCard}>
                <Text style={styles.tableTitle}>IMC ADULTO (18-64)</Text>
                <TableRow label="UNDERWEIGHT" value="< 18.5" color={COLORS.gold} />
                <TableRow label="NORMAL" value="18.5 - 24.9" color={COLORS.poison} />
                <TableRow label="OVERWEIGHT" value="25.0 - 29.9" color={COLORS.purple} />
                <TableRow label="OBESITY" value="≥ 30.0" color={COLORS.crimson} />
              </View>

              <View style={styles.tableCard}>
                <Text style={styles.tableTitle}>IMC ADULTO MAYOR (65+)</Text>
                <TableRow label="UNDERWEIGHT" value="< 23.0" color={COLORS.gold} />
                <TableRow label="NORMAL" value="23.0 - 27.9" color={COLORS.poison} />
                <TableRow label="OVERWEIGHT" value="28.0 - 31.9" color={COLORS.purple} />
                <TableRow label="OBESITY" value="≥ 32.0" color={COLORS.crimson} />
              </View>

              <View style={styles.tableCard}>
                <Text style={styles.tableTitle}>CARDIOVASCULAR (CINTURA)</Text>
                <TableRow label="LOW RISK (M/F)" value="< 94 / 80" color={COLORS.poison} />
                <TableRow label="HIGH RISK (M/F)" value="≥ 102 / 88" color={COLORS.crimson} />
              </View>
            </View>
          )}

        </ScrollView>
      </View>
    </TerminalBackground>
  );
}

// Sub-components
function TabItem({ id, label, icon, active, onPress, color }: any) {
  const isActive = active === id;
  return (
    <TouchableOpacity 
      style={[styles.tab, isActive && { borderBottomColor: color, backgroundColor: 'rgba(255,255,255,0.02)' }]} 
      onPress={() => onPress(id)}
    >
      <Ionicons name={icon as any} size={16} color={isActive ? color : COLORS.dim} />
      <Text style={[styles.tabText, isActive && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, icon, color }: any) {
  return (
    <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={20} color={color} />
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
    </TouchableOpacity>
  );
}

function TableRow({ label, value, color }: any) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{label}</Text>
      <Text style={[styles.tableValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: { backgroundColor: 'rgba(0,0,0,0.4)', borderBottomWidth: 1, borderBottomColor: '#111' },
  tabScroll: { paddingHorizontal: 10 },
  tab: { paddingHorizontal: 18, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { color: COLORS.dim, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  scrollContent: { padding: 20, paddingBottom: 50 },
  section: { gap: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 3, paddingLeft: 12 },
  sectionTitle: { fontSize: 20, fontFamily: FONTS.horror, letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 15 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  inputGroup: { flex: 1, gap: 8 },
  inputLabel: { color: COLORS.dim, fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  input: { backgroundColor: '#000', borderWidth: 1, borderColor: '#1a1a1f', padding: 15, color: COLORS.white, fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  selectBox: { backgroundColor: '#000', borderWidth: 1, borderColor: '#1a1a1f' },
  selectInput: { padding: 15, color: COLORS.white, fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  resBox: { width: '31%', backgroundColor: '#0a0a0d', padding: 12, borderBottomWidth: 3, gap: 4 },
  resLabel: { fontSize: 8, fontWeight: 'bold', color: COLORS.dim },
  resValue: { fontSize: 14, fontWeight: '900', fontFamily: FONTS.horror },
  resSub: { fontSize: 8, color: COLORS.muted, fontWeight: 'bold' },
  mainActionBtn: { backgroundColor: COLORS.crimson, height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, marginTop: 20, ...SHADOWS.crimson },
  mainActionText: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 22 },
  macroDashboard: { flexDirection: 'row', gap: 12 },
  macroBox: { flex: 1, backgroundColor: '#0a0a0d', padding: 15, borderLeftWidth: 4, gap: 5 },
  macroLabel: { fontSize: 9, fontWeight: 'bold', color: COLORS.dim },
  macroGrams: { fontSize: 20, fontWeight: '900', fontFamily: FONTS.horror },
  macroGkg: { fontSize: 9, color: COLORS.muted, fontWeight: 'bold' },
  vizContainer: { alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.01)' },
  miniCard: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 15, borderWidth: 1, borderColor: '#1a1a1f', gap: 12 },
  cardTitle: { fontSize: 11, fontWeight: 'bold', color: COLORS.muted, letterSpacing: 1 },
  displayOnly: { flex: 1, justifyContent: 'center' },
  displayLabel: { fontSize: 8, fontWeight: 'bold', color: COLORS.dim, marginBottom: 5 },
  displayValue: { fontSize: 16, fontWeight: 'bold' },
  inlineBtn: { alignSelf: 'flex-start', padding: 8, borderWidth: 1, borderColor: COLORS.purple },
  inlineBtnText: { color: COLORS.purple, fontSize: 9, fontWeight: 'bold' },
  dosageResult: { backgroundColor: 'rgba(255, 0, 51, 0.05)', padding: 12, alignItems: 'center', borderRadius: 4 },
  dosageLabel: { fontSize: 9, color: COLORS.dim, fontWeight: 'bold' },
  dosageValue: { fontSize: 20, color: COLORS.pink, fontWeight: '900', marginTop: 5 },
  miniBtnRow: { flexDirection: 'row', gap: 8 },
  miniBtn: { flex: 1, height: 40, borderWidth: 1, borderColor: '#222', justifyContent: 'center', alignItems: 'center' },
  activeMiniBtn: { borderColor: COLORS.purple, backgroundColor: 'rgba(102, 0, 204, 0.1)' },
  miniBtnText: { color: COLORS.dim, fontSize: 11 },
  activeMiniBtnText: { color: COLORS.white, fontWeight: 'bold' },
  aiCard: { backgroundColor: 'rgba(255, 255, 255, 0.01)', padding: 25, borderWidth: 1, borderColor: '#1a1a1f' },
  aiItem: { gap: 10 },
  aiLabel: { color: COLORS.crimson, fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
  aiText: { color: COLORS.text, fontSize: 13, lineHeight: 22 },
  aiDivider: { height: 1, backgroundColor: '#1a1a1f', marginVertical: 20 },
  actionRow: { flexDirection: 'row', gap: 15, marginTop: 20 },
  actionBtn: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#0a0a0d', borderWidth: 1, borderColor: '#1a1a1f' },
  actionBtnText: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 20 },
  tableCard: { backgroundColor: '#0a0a0d', padding: 20, borderWidth: 1, borderColor: '#1a1a1f', gap: 10 },
  tableTitle: { fontSize: 11, fontWeight: 'bold', color: COLORS.muted, marginBottom: 5 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a1f' },
  tableLabel: { color: COLORS.dim, fontSize: 12, fontWeight: 'bold' },
  tableValue: { fontSize: 13, fontWeight: 'bold' },
});
