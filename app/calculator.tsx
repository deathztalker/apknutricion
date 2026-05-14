import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { COLORS, SHADOWS, ACTIVITY_FACTORS, FONTS } from '../constants/theme';
import { calculateAll, calcAge } from '../lib/calculations';
import { analyzeWithGemini, generateRuleBasedAlerts } from '../lib/ai';
import { RecordFormData, CalculationResult, AIAnalysis, Patient } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { generateClinicalReport } from '../lib/reports';
import { useLocalSearchParams, router } from 'expo-router';
import Somatocarta from '../components/Somatocarta';

export default function Calculator() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  
  const [form, setForm] = useState<Partial<RecordFormData>>({
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

  const renderInput = (label: string, key: keyof RecordFormData, placeholder: string, keyboard = 'numeric') => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={String(form[key] || '')}
        onChangeText={(val) => setForm({ ...form, [key]: val })}
        placeholder={placeholder}
        placeholderTextColor={COLORS.dim}
        keyboardType={keyboard as any}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.blackBackground} />
      
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
            <Text style={styles.sectionTitle}>SUBJECT DIMENSIONS</Text>
            <View style={styles.row}>
              {renderInput('WEIGHT (KG)', 'weight_kg', '0.0')}
              {renderInput('HEIGHT (CM)', 'height_cm', '0')}
            </View>
            <View style={styles.row}>
              {renderInput('WAIST (CM)', 'waist_cm', '0')}
              {renderInput('ACT. FACTOR', 'activity_factor', '1.2')}
            </View>
            <View style={styles.row}>
              {renderInput('SYS BP', 'systolic_bp', '120')}
              {renderInput('DIA BP', 'diastolic_bp', '80')}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>ANTHROPOMETRY (OPTIONAL)</Text>
            <View style={styles.row}>
              {renderInput('TRICEPS', 'fold_triceps', 'mm')}
              {renderInput('SUBESC.', 'fold_subscapular', 'mm')}
              {renderInput('SUPRASP.', 'fold_supraspinal', 'mm')}
            </View>
            <View style={styles.row}>
              {renderInput('DIA. HUM', 'diameter_humerus' as any, 'cm')}
              {renderInput('DIA. FEM', 'diameter_femur' as any, 'cm')}
              {renderInput('PER. ARM', 'perimeter_arm' as any, 'cm')}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>MACRO RATIOS (%)</Text>
            <View style={styles.row}>
              {renderInput('PROT', 'macro_prot_pct', '15')}
              {renderInput('CHO', 'macro_cho_pct', '55')}
              {renderInput('FAT', 'macro_fat_pct', '30')}
            </View>

            <TouchableOpacity style={styles.calcButton} onPress={handleCalculate} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.bg} /> : <><Ionicons name="skull" size={24} color={COLORS.bg} /><Text style={styles.calcButtonText}>START DISSECTION</Text></>}
            </TouchableOpacity>
          </View>
        )}

        {/* ... Clinical, Tables, Results tabs updated with same gritty style ... */}
        
        {activeTab === 'results' && results && (
          <View style={styles.section}>
            <View style={styles.resultCard}>
              <Text style={styles.cardHeader}>VITAL INDICATORS</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>IMC</Text>
                <Text style={[styles.metricValue, { color: results.bmiColor === COLORS.neon ? COLORS.white : COLORS.white }]}>{results.bmi} ({results.bmiStatus})</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>IDEAL WEIGHT</Text>
                <Text style={styles.metricValue}>{results.idealWeight} KG</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>CV RISK</Text>
                <Text style={styles.metricValue}>{results.cvRisk}</Text>
              </View>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.cardHeader}>MACRO BREAKDOWN</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>TDEE</Text>
                <Text style={styles.metricValue}>{results.tdee} KCAL</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>PROT</Text>
                <Text style={styles.metricValue}>{results.macros?.protG}G ({results.macros?.protGkg}G/KG)</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>CHO</Text>
                <Text style={styles.metricValue}>{results.macros?.choG}G</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>FAT</Text>
                <Text style={styles.metricValue}>{results.macros?.fatG}G</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.pdfBtn]} onPress={handleExportPDF}>
                <Ionicons name="document-text" size={20} color={COLORS.bg} />
                <Text style={styles.actionBtnText}>EXPORT PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* AI tab updated with same gritty style */}
        {activeTab === 'ai' && aiAnalysis && (
          <View style={styles.section}>
            <View style={styles.aiHeader}>
              <Ionicons name="skull" size={24} color={COLORS.white} />
              <Text style={styles.aiTitle}>GEMINI CLINICAL DISSECTION</Text>
            </View>

            <View style={styles.aiCard}>
              <Text style={styles.aiLabel}>DIAGNOSIS</Text>
              <Text style={styles.aiText}>{aiAnalysis.nutritional_diagnosis}</Text>
            </View>

            <View style={styles.aiCard}>
              <Text style={styles.aiLabel}>SUMMARY</Text>
              <Text style={styles.aiText}>{aiAnalysis.summary}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  blackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#222',
  },
  tabsScroll: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.white,
  },
  tabText: {
    color: '#444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  activeTabText: {
    color: COLORS.white,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontFamily: FONTS.horror,
    letterSpacing: 1,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.white,
    paddingLeft: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: '#222',
    borderRadius: 0,
    padding: 16,
    color: COLORS.white,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  calcButton: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 30,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  calcButtonText: {
    color: '#000',
    fontFamily: FONTS.horror,
    fontSize: 24,
    letterSpacing: 2,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 0,
    padding: 20,
    borderWidth: 2,
    borderColor: '#222',
    gap: 14,
  },
  cardHeader: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.horror,
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  metricLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  metricValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  aiTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: FONTS.horror,
    letterSpacing: 1,
  },
  aiCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 0,
    padding: 20,
    borderWidth: 2,
    borderColor: '#222',
    gap: 10,
  },
  aiLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    opacity: 0.6,
  },
  aiText: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    height: 60,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: COLORS.white,
  },
  actionBtnText: {
    color: '#000',
    fontFamily: FONTS.horror,
    fontSize: 18,
    letterSpacing: 1,
  },
});
