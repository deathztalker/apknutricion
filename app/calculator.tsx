import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { COLORS, SHADOWS, ACTIVITY_FACTORS, FONTS, DIET_TYPES } from '../constants/theme';
import { calculateAll, calcAge } from '../lib/calculations';
import { analyzeWithGemini, generateRuleBasedAlerts } from '../lib/ai';
import { RecordFormData, CalculationResult, AIAnalysis, Patient } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { generateClinicalReport } from '../lib/reports';
import { useLocalSearchParams } from 'expo-router';

export default function Calculator() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  
  const [form, setForm] = useState<RecordFormData>({
    weight_kg: '',
    height_cm: '',
    waist_cm: '',
    systolic_bp: '',
    diastolic_bp: '',
    activity_factor: '1.2',
    macro_prot_pct: '15',
    macro_cho_pct: '55',
    macro_fat_pct: '30',
    fold_triceps: '',
    fold_subscapular: '',
    fold_supraspinal: '',
    fold_abdominal: '',
    diameter_humerus: '',
    diameter_femur: '',
    perimeter_arm: '',
    perimeter_calf: '',
    creatinine: '',
    knee_height: '',
    usual_weight: '',
    med_dose: '',
    med_conc: '',
    observations: '',
    diet_type: 'Omnívora',
  });

  const [patient, setPatient] = useState<Partial<Patient>>({
    full_name: 'UNKNOWN SUBJECT',
    birth_date: '1990-01-01',
    sex: 'M',
    insurance: 'NONE',
  });

  const [results, setResults] = useState<CalculationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'clinical' | 'results' | 'ai' | 'tables'>('input');

  const handleCalculate = async () => {
    if (!form.weight_kg || !form.height_cm) {
      Alert.alert('DATA VOID', 'Weight and Height are mandatory for dissection.');
      return;
    }

    setLoading(true);
    const age = calcAge(patient.birth_date!);
    const calcResults = calculateAll(form, age, patient.sex as any);
    setResults(calcResults);
    
    try {
      const analysis = await analyzeWithGemini(patient, form as any, calcResults);
      setAiAnalysis(analysis);
      if (activeTab === 'input' || activeTab === 'clinical') setActiveTab('results');
    } catch (error) {
      console.error('AI Link Failure:', error);
      Alert.alert('VOID ALERT', 'AI connection lost. Using local rule-sets.');
      if (activeTab === 'input' || activeTab === 'clinical') setActiveTab('results');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!results || !aiAnalysis) return;
    try {
      setLoading(true);
      await generateClinicalReport(patient as any, form as any, results, aiAnalysis);
    } catch (error) {
      Alert.alert('SYSTEM ERROR', 'Report generation failed.');
    } finally {
      setLoading(false);
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
    <View style={styles.container}>
      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity style={[styles.tab, activeTab === 'input' && styles.activeTab]} onPress={() => setActiveTab('input')}>
            <Text style={[styles.tabText, activeTab === 'input' && styles.activeTabText]}>ANATOMY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'clinical' && styles.activeTab]} onPress={() => setActiveTab('clinical')}>
            <Text style={[styles.tabText, activeTab === 'clinical' && styles.activeTabText]}>CLINIC</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'results' && styles.activeTab]} onPress={() => setActiveTab('results')}>
            <Text style={[styles.tabText, activeTab === 'results' && styles.activeTabText]}>METRICS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'ai' && styles.activeTab]} onPress={() => setActiveTab('ai')}>
            <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>AI DISSECT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'tables' && styles.activeTab]} onPress={() => setActiveTab('tables')}>
            <Text style={[styles.tabText, activeTab === 'tables' && styles.activeTabText]}>ARCHIVES</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'input' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUBJECT IDENTITY</Text>
            <View style={styles.row}>
              {renderInput('FULL NAME', patient.full_name, (v) => setPatient({...patient, full_name: v}), 'Name', 'default')}
            </View>
            <View style={styles.row}>
              {renderInput('BIRTH DATE', patient.birth_date, (v) => setPatient({...patient, birth_date: v}), 'YYYY-MM-DD', 'default')}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SEX</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.miniBtn, patient.sex === 'M' && styles.activeMiniBtn]} onPress={() => setPatient({...patient, sex: 'M'})}>
                    <Text style={[styles.miniBtnText, patient.sex === 'M' && styles.activeMiniBtnText]}>M</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.miniBtn, patient.sex === 'F' && styles.activeMiniBtn]} onPress={() => setPatient({...patient, sex: 'F'})}>
                    <Text style={[styles.miniBtnText, patient.sex === 'F' && styles.activeMiniBtnText]}>F</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>ANATOMY</Text>
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

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>ANTHROPOMETRY</Text>
            <View style={styles.row}>
              {renderInput('TRICEPS', form.fold_triceps, (v) => setForm({...form, fold_triceps: v}), 'mm')}
              {renderInput('SUBESC.', form.fold_subscapular, (v) => setForm({...form, fold_subscapular: v}), 'mm')}
              {renderInput('SUPRASP.', form.fold_supraspinal, (v) => setForm({...form, fold_supraspinal: v}), 'mm')}
            </View>

            <TouchableOpacity style={styles.calcButton} onPress={handleCalculate} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.bg} /> : <><Ionicons name="skull" size={24} color={COLORS.bg} /><Text style={styles.calcButtonText}>START DISSECTION</Text></>}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'clinical' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CLINICAL MARKERS</Text>
            <View style={styles.row}>
              {renderInput('CREATININE', form.creatinine, (v) => setForm({...form, creatinine: v}), 'mg/dL')}
              {renderInput('KNEE HEIGHT', form.knee_height, (v) => setForm({...form, knee_height: v}), 'cm')}
            </View>
            <View style={styles.row}>
              {renderInput('USUAL WEIGHT', form.usual_weight, (v) => setForm({...form, usual_weight: v}), 'kg')}
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>ANAMNESIS & OBS</Text>
            {renderInput('OBSERVATIONS', form.observations, (v) => setForm({...form, observations: v}), 'Clinical notes...', 'default', true)}
          </View>
        )}

        {activeTab === 'results' && results && (
          <View style={styles.section}>
            <View style={styles.resultCard}>
              <Text style={styles.cardHeader}>VITAL INDICATORS</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>IMC</Text>
                <Text style={styles.metricValue}>{results.bmi} ({results.bmiStatus})</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>CV RISK</Text>
                <Text style={styles.metricValue}>{results.cvRisk}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>BP STATUS</Text>
                <Text style={styles.metricValue}>{results.bpStatus}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={handleExportPDF}>
              <Ionicons name="document-text" size={20} color={COLORS.bg} />
              <Text style={styles.actionBtnText}>EXPORT PDF</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'ai' && aiAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GEMINI DISSECTION</Text>
            <View style={styles.aiCard}>
              <Text style={styles.aiLabel}>DIAGNOSIS</Text>
              <Text style={styles.aiText}>{aiAnalysis.nutritional_diagnosis}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.bg, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 255, 136, 0.2)' },
  tabsScroll: { paddingHorizontal: 10, alignItems: 'center' },
  tab: { paddingHorizontal: 20, paddingVertical: 18, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: COLORS.neon, backgroundColor: 'rgba(0, 255, 136, 0.05)' },
  tabText: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  activeTabText: { color: COLORS.neon },
  scrollContent: { padding: 20 },
  section: { gap: 16 },
  sectionTitle: { color: COLORS.neon, fontSize: 24, fontFamily: FONTS.horror, letterSpacing: 1, borderLeftWidth: 6, borderLeftColor: COLORS.neon, paddingLeft: 12, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1, gap: 6 },
  inputLabel: { color: COLORS.stg, fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0, 0, 0, 0.6)', borderWidth: 1, borderColor: COLORS.purple, borderRadius: 4, padding: 16, color: COLORS.white, fontSize: 16 },
  calcButton: { backgroundColor: COLORS.neon, padding: 20, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 30 },
  calcButtonText: { color: COLORS.bg, fontFamily: FONTS.horror, fontSize: 24 },
  resultCard: { backgroundColor: 'rgba(0, 255, 136, 0.05)', borderRadius: 4, padding: 20, borderWidth: 1, borderColor: 'rgba(0, 255, 136, 0.3)', gap: 14 },
  cardHeader: { color: COLORS.white, fontSize: 20, fontFamily: FONTS.horror, paddingBottom: 8 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10 },
  metricLabel: { color: COLORS.stg, fontSize: 12, fontWeight: '900' },
  metricValue: { color: COLORS.white, fontSize: 18, fontFamily: FONTS.horror },
  aiCard: { backgroundColor: 'rgba(157, 0, 255, 0.05)', borderRadius: 4, padding: 20, borderWidth: 1, borderColor: 'rgba(157, 0, 255, 0.3)' },
  aiLabel: { color: COLORS.pink, fontSize: 11, fontWeight: 'bold' },
  aiText: { color: COLORS.text, fontSize: 14, lineHeight: 22 },
  actionBtn: { height: 60, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.pink, marginTop: 20 },
  actionBtnText: { color: COLORS.bg, fontFamily: FONTS.horror, fontSize: 18 },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.purple, marginRight: 8 },
  activeMiniBtn: { backgroundColor: COLORS.purple },
  miniBtnText: { color: COLORS.muted, fontSize: 12 },
  activeMiniBtnText: { color: COLORS.white, fontWeight: 'bold' },
});
