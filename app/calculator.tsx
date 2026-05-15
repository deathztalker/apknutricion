import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { COLORS, SHADOWS, ACTIVITY_FACTORS, FONTS, DIET_TYPES } from '../constants/theme';
import { calculateAll } from '../lib/calculations';
import { analyzeWithGemini, generateRuleBasedAlerts } from '../lib/ai';
import { RecordFormData, CalculationResult, AIAnalysis, Patient } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { generateClinicalReport } from '../lib/reports';
import { useLocalSearchParams, router } from 'expo-router';
import { patientService, recordService, supabase } from '../lib/supabase';
import Somatocarta from '../components/Somatocarta';
import TerminalBackground from '../components/TerminalBackground';
import { LinearGradient } from 'expo-linear-gradient';

export default function Calculator() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  
  const [form, setForm] = useState<RecordFormData>({
    weight_kg: '', height_cm: '', waist_cm: '', systolic_bp: '', diastolic_bp: '',
    activity_factor: '1.2', macro_prot_pct: '15', macro_cho_pct: '55', macro_fat_pct: '30',
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

  const handleCalculate = async () => {
    if (!form.weight_kg || !form.height_cm) {
      Alert.alert('DATA DEFICIENCY', 'Weight and Height are mandatory for biometric scan.');
      return;
    }

    setLoading(true);
    const calcResults = calculateAll(form, patient.age || 0, patient.sex as any);
    setResults(calcResults);
    
    try {
      const analysis = await analyzeWithGemini(patient, form as any, calcResults);
      setAiAnalysis(analysis);
      setActiveTab('ai');
    } catch (error) {
      console.error('AI Link Failure:', error);
      Alert.alert('AI OFFLINE', 'System connection failed. Falling back to local heuristics.');
      setActiveTab('ai');
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

      const recordData = {
        patient_id: patientId,
        user_id: user.id,
        record_date: new Date().toISOString(),
        weight_kg: parseFloat(form.weight_kg!),
        height_cm: parseFloat(form.height_cm!),
        waist_cm: parseFloat(form.waist_cm || '0'),
        bmi: results.bmi,
        bmi_status: results.bmiStatus,
        ideal_weight: results.idealWeight,
        fat_percent: results.fatPercent,
        fat_mass_kg: results.fatMassKg,
        lean_mass_kg: results.leanMassKg,
        ict: results.ict,
        cv_risk: results.cvRisk,
        systolic_bp: parseInt(form.systolic_bp || '0'),
        diastolic_bp: parseInt(form.diastolic_bp || '0'),
        bp_status: results.bpStatus,
        activity_factor: parseFloat(form.activity_factor || '1.2'),
        bmr_kcal: results.bmr,
        tdee_kcal: results.tdee,
        water_liters: results.waterLiters,
        macro_prot_pct: parseInt(form.macro_prot_pct || '15'),
        macro_cho_pct: parseInt(form.macro_cho_pct || '55'),
        macro_fat_pct: parseInt(form.macro_fat_pct || '30'),
        pathologies: form.pathologies,
        allergies: form.allergies,
        diet_type: form.diet_type,
        liquid_intake: form.liquid_intake,
        digestion_status: form.digestion_status,
        observations: form.observations,
        ai_analysis: aiAnalysis?.summary,
        grip_strength_kg: parseFloat(form.grip_strength_kg || '0'),
        calf_circumference_cm: parseFloat(form.calf_circumference_cm || '0'),
        mna_score: form.mna_score,
        vgs_status: form.vgs_status,
        somatotype: results.somatotype,
      };

      const { error } = await recordService.create(recordData as any);
      if (error) throw error;

      Alert.alert('SYNC COMPLETE', 'Biometric record persisted to database.');
    } catch (error: any) {
      Alert.alert('SYNC FAILURE', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!results || !aiAnalysis) return;
    try {
      setLoading(true);
      await generateClinicalReport(patient as any, form as any, results, aiAnalysis);
    } catch (error) {
      Alert.alert('ERROR', 'Report generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: any, onChange: (v: string) => void, placeholder: string, keyboard = 'numeric', multiline = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 100, textAlignVertical: 'top' }]}
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
        <View style={styles.header}>
          <View style={styles.subjectInfo}>
            <Text style={styles.subjectName}>{patient.full_name?.toUpperCase()}</Text>
            <Text style={styles.subjectDetails}>GENOTYPE: {patient.sex === 'M' ? 'XY' : 'XX'} | INS: {patient.insurance}</Text>
          </View>
          <Ionicons name="skull" size={24} color={COLORS.crimson} />
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            <TabItem id="scanner" label="SCANNER" icon="scan" active={activeTab} onPress={setActiveTab} color={COLORS.crimson} />
            <TabItem id="anamnesis" label="ANAMNESIS" icon="list" active={activeTab} onPress={setActiveTab} color={COLORS.purple} />
            <TabItem id="macros" label="MACROS" icon="pie-chart" active={activeTab} onPress={setActiveTab} color={COLORS.pink} />
            <TabItem id="sports" label="SPORTS" icon="fitness" active={activeTab} onPress={setActiveTab} color={COLORS.poison} />
            <TabItem id="clinical" label="CLINICAL" icon="medkit" active={activeTab} onPress={setActiveTab} color={COLORS.purple} />
            <TabItem id="ai" label="NEURAL" icon="brain" active={activeTab} onPress={setActiveTab} color={COLORS.crimson} />
            <TabItem id="tables" label="TABLES" icon="grid" active={activeTab} onPress={setActiveTab} color={COLORS.dim} />
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'scanner' && (
            <View style={styles.section}>
              <SectionTitle title="PRIMARY BIOMETRICS" color={COLORS.crimson} />
              <View style={styles.row}>
                {renderInput('WEIGHT (KG)', form.weight_kg, (v) => setForm({...form, weight_kg: v}), '0.0')}
                {renderInput('HEIGHT (CM)', form.height_cm, (v) => setForm({...form, height_cm: v}), '0')}
              </View>
              <View style={styles.row}>
                {renderInput('WAIST (CM)', form.waist_cm, (v) => setForm({...form, waist_cm: v}), '0')}
                {renderInput('ACT. FACTOR', form.activity_factor, (v) => setForm({...form, activity_factor: v}), '1.2')}
              </View>
              <View style={styles.row}>
                {renderInput('SYS BP', form.systolic_bp, (v) => setForm({...form, systolic_bp: v}), '120')}
                {renderInput('DIA BP', form.diastolic_bp, (v) => setForm({...form, diastolic_bp: v}), '80')}
              </View>

              <TouchableOpacity style={styles.mainActionBtn} onPress={handleCalculate} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.bg} /> : (
                  <>
                    <Ionicons name='pulse' size={24} color={COLORS.white} />
                    <Text style={styles.mainActionText}>NEURAL OVERRIDE</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'anamnesis' && (
            <View style={styles.section}>
              <SectionTitle title="LIFESTYLE TELEMETRY" color={COLORS.purple} />
              {renderInput('PATHOLOGIES', form.pathologies?.join(', '), (v) => setForm({...form, pathologies: v.split(',').map(s => s.trim())}), 'HTA, DM2...', 'default')}
              {renderInput('ALLERGIES', form.allergies?.join(', '), (v) => setForm({...form, allergies: v.split(',').map(s => s.trim())}), 'Lactosa, Gluten...', 'default')}
              <View style={styles.row}>
                {renderInput('DIET', form.diet_type, (v) => setForm({...form, diet_type: v}), 'Omnívora', 'default')}
                {renderInput('LIQUIDS', form.liquid_intake, (v) => setForm({...form, liquid_intake: v}), '1-2L', 'default')}
              </View>
              {renderInput('OBSERVATIONS', form.observations, (v) => setForm({...form, observations: v}), 'Clinical logs...', 'default', true)}
            </View>
          )}

          {activeTab === 'macros' && (
            <View style={styles.section}>
              <SectionTitle title="MACRO ALLOCATION" color={COLORS.pink} />
              <View style={styles.row}>
                {renderInput('% PROT', form.macro_prot_pct, (v) => setForm({...form, macro_prot_pct: v}), '15')}
                {renderInput('% CARB', form.macro_cho_pct, (v) => setForm({...form, macro_cho_pct: v}), '55')}
                {renderInput('% FAT', form.macro_fat_pct, (v) => setForm({...form, macro_fat_pct: v}), '30')}
              </View>
              {results?.macros && (
                <View style={styles.resultCard}>
                  <Text style={styles.resultHeader}>SYSTEM TARGETS</Text>
                  <MacroRow label="PROTEINS" value={`${results.macros.protG}G`} sub={`${results.macros.protGkg}G/KG`} color={COLORS.crimson} />
                  <MacroRow label="CARBOHYDRATES" value={`${results.macros.choG}G`} color={COLORS.purple} />
                  <MacroRow label="LIPIDS" value={`${results.macros.fatG}G`} color={COLORS.pink} />
                </View>
              )}
            </View>
          )}

          {activeTab === 'sports' && (
            <View style={styles.section}>
              <SectionTitle title="NEURAL KINANTHROPOMETRY" color={COLORS.poison} />
              {results?.somatotype && (
                <View style={styles.vizContainer}>
                  <Somatocarta x={results.somatotype.x} y={results.somatotype.y} size={280} />
                </View>
              )}
              <View style={styles.row}>
                {renderInput('TRICEPS', form.fold_triceps, (v) => setForm({...form, fold_triceps: v}), '0')}
                {renderInput('SUBSCAP.', form.fold_subscapular, (v) => setForm({...form, fold_subscapular: v}), '0')}
              </View>
              <View style={styles.row}>
                {renderInput('ARM', form.perimeter_arm, (v) => setForm({...form, perimeter_arm: v}), '0')}
                {renderInput('CALF', form.perimeter_calf, (v) => setForm({...form, perimeter_calf: v}), '0')}
              </View>
            </View>
          )}

          {activeTab === 'ai' && aiAnalysis && (
            <View style={styles.section}>
              <SectionTitle title="GEMINI NEURAL DISSECTION" color={COLORS.crimson} />
              <View style={styles.aiCard}>
                <Text style={styles.aiLabel}>DIAGNOSIS</Text>
                <Text style={styles.aiText}>{aiAnalysis.nutritional_diagnosis}</Text>
                
                <View style={styles.aiDivider} />
                
                <Text style={[styles.aiLabel, { color: COLORS.purple }]}>ANALYSIS LOG</Text>
                <Text style={styles.aiText}>{aiAnalysis.summary}</Text>
                
                <View style={styles.aiDivider} />

                <Text style={[styles.aiLabel, { color: COLORS.poison }]}>PROTOCOL RECS</Text>
                {aiAnalysis.recommendations.map((r, i) => (
                  <Text key={i} style={styles.aiText}>• {r}</Text>
                ))}
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={handleExportPDF}>
                  <Ionicons name='document-text' size={20} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>REPORT</Text>
                </TouchableOpacity>

                {patientId && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { flex: 1, backgroundColor: COLORS.crimson }]} 
                    onPress={handleSave}
                    disabled={saving}
                  >
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

          {activeTab === 'tables' && (
            <View style={styles.section}>
              <SectionTitle title="REFERENCE PROTOCOLS" color={COLORS.dim} />
              <View style={styles.tableCard}>
                <TableRow label="UNDERWEIGHT" value="< 18.5" color={COLORS.gold} />
                <TableRow label="NORMAL" value="18.5 - 24.9" color={COLORS.poison} />
                <TableRow label="OVERWEIGHT" value="25.0 - 29.9" color={COLORS.purple} />
                <TableRow label="OBESITY" value="≥ 30.0" color={COLORS.crimson} />
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
    <TouchableOpacity 
      style={[styles.tab, isActive && { borderBottomColor: color, backgroundColor: 'rgba(255,255,255,0.02)' }]} 
      onPress={() => onPress(id)}
    >
      <Ionicons name={icon as any} size={16} color={isActive ? color : COLORS.dim} />
      <Text style={[styles.tabText, isActive && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionTitle({ title, color }: any) {
  return (
    <View style={[styles.sectionTitleContainer, { borderLeftColor: color }]}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );
}

function MacroRow({ label, value, sub, color }: any) {
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.macroValue, { color }]}>{value}</Text>
        {sub && <Text style={styles.macroSub}>{sub}</Text>}
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  subjectInfo: { flex: 1 },
  subjectName: { color: COLORS.white, fontSize: 18, fontFamily: FONTS.horror, letterSpacing: 1 },
  subjectDetails: { color: COLORS.dim, fontSize: 9, fontWeight: 'bold', marginTop: 4 },
  tabsContainer: { backgroundColor: 'rgba(0,0,0,0.2)', borderBottomWidth: 1, borderBottomColor: '#111' },
  tabsScroll: { paddingHorizontal: 10 },
  tab: { paddingHorizontal: 18, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { color: COLORS.dim, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  scrollContent: { padding: 20, paddingBottom: 50 },
  section: { gap: 20 },
  sectionTitleContainer: { borderLeftWidth: 3, paddingLeft: 12 },
  sectionTitle: { fontSize: 18, fontFamily: FONTS.horror, letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1, gap: 8 },
  inputLabel: { color: COLORS.dim, fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  input: { backgroundColor: '#000', borderWidth: 1, borderColor: '#1a1a1f', padding: 15, color: COLORS.white, fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  mainActionBtn: { backgroundColor: COLORS.crimson, height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, marginTop: 15, ...SHADOWS.crimson },
  mainActionText: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 20 },
  resultCard: { backgroundColor: 'rgba(220, 20, 60, 0.03)', padding: 20, borderWidth: 1, borderColor: 'rgba(220, 20, 60, 0.1)', gap: 15 },
  resultHeader: { color: COLORS.crimson, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroLabel: { color: COLORS.muted, fontSize: 11, fontWeight: 'bold' },
  macroValue: { fontSize: 18, fontWeight: '900' },
  macroSub: { color: COLORS.dim, fontSize: 9, fontWeight: 'bold' },
  vizContainer: { alignItems: 'center', marginVertical: 10 },
  aiCard: { backgroundColor: 'rgba(255, 255, 255, 0.01)', padding: 20, borderWidth: 1, borderColor: '#1a1a1f' },
  aiLabel: { color: COLORS.crimson, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  aiText: { color: COLORS.text, fontSize: 13, lineHeight: 20, marginBottom: 5 },
  aiDivider: { height: 1, backgroundColor: '#1a1a1f', marginVertical: 15 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 15 },
  actionBtn: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#0a0a0d', borderWidth: 1, borderColor: '#1a1a1f' },
  actionBtnText: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 18 },
  tableCard: { backgroundColor: '#0a0a0d', padding: 20, borderWidth: 1, borderColor: '#1a1a1f' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1f' },
  tableLabel: { color: COLORS.muted, fontSize: 11, fontWeight: 'bold' },
  tableValue: { fontSize: 13, fontWeight: 'bold' },
});
