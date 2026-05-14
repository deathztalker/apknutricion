import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { COLORS, SHADOWS, ACTIVITY_FACTORS } from '../constants/theme';
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
    full_name: 'Invitado',
    birth_date: '1990-01-01',
    sex: 'M',
    insurance: 'FONASA',
  });

  const [results, setResults] = useState<CalculationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'results' | 'ai'>('input');

  const handleCalculate = async () => {
    if (!form.weight_kg || !form.height_cm) {
      Alert.alert('Error', 'Peso y Talla son obligatorios.');
      return;
    }

    setLoading(true);
    const age = calcAge(patient.birth_date!);
    const calcResults = calculateAll(form, age, patient.sex as any);
    setResults(calcResults);
    
    try {
      const analysis = await analyzeWithGemini(patient, form as any, calcResults);
      setAiAnalysis(analysis);
      setActiveTab('results');
    } catch (error) {
      console.error('AI Error:', error);
      Alert.alert('Aviso', 'No se pudo conectar con la IA. Se muestran solo alertas locales.');
      setActiveTab('results');
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
      Alert.alert('Error', 'No se pudo generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const goToMealPlan = () => {
    if (!results) return;
    router.push({
      pathname: '/(app)/meal-plan/new',
      params: {
        kcal: results.tdee,
        prot: results.macros?.protG,
        cho: results.macros?.choG,
        fat: results.macros?.fatG,
        patientId
      }
    });
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
      <LinearGradient colors={[COLORS.bg1, COLORS.bg]} style={StyleSheet.absoluteFill} />
      
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'input' && styles.activeTab]} 
          onPress={() => setActiveTab('input')}
        >
          <Text style={[styles.tabText, activeTab === 'input' && styles.activeTabText]}>INPUT</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'results' && styles.activeTab]} 
          onPress={() => setActiveTab('results')}
        >
          <Text style={[styles.tabText, activeTab === 'results' && styles.activeTabText]}>METRICS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ai' && styles.activeTab]} 
          onPress={() => setActiveTab('ai')}
        >
          <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>AI CLINIC</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'input' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ANTROPOMETRÍA & SIGNOS</Text>
            <View style={styles.row}>
              {renderInput('PESO (KG)', 'weight_kg', '0.0')}
              {renderInput('TALLA (CM)', 'height_cm', '0')}
            </View>
            <View style={styles.row}>
              {renderInput('CINTURA (CM)', 'waist_cm', '0')}
              {renderInput('FACTOR ACT.', 'activity_factor', '1.2')}
            </View>
            <View style={styles.row}>
              {renderInput('PAS (MMHG)', 'systolic_bp', '120')}
              {renderInput('PAD (MMHG)', 'diastolic_bp', '80')}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>DATOS DE SOMATOTIPO (OPCIONAL)</Text>
            <View style={styles.row}>
              {renderInput('TRICEPS', 'fold_triceps', 'mm')}
              {renderInput('SUBESC.', 'fold_subscapular', 'mm')}
              {renderInput('SUPRASP.', 'fold_supraspinal', 'mm')}
            </View>
            <View style={styles.row}>
              {renderInput('DIAM. HUM', 'diameter_humerus' as any, 'cm')}
              {renderInput('DIAM. FEM', 'diameter_femur' as any, 'cm')}
              {renderInput('PER. BRAZO', 'perimeter_arm' as any, 'cm')}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>MACRONUTRIENTES (%)</Text>
            <View style={styles.row}>
              {renderInput('PROT', 'macro_prot_pct', '15')}
              {renderInput('CHO', 'macro_cho_pct', '55')}
              {renderInput('FAT', 'macro_fat_pct', '30')}
            </View>

            <TouchableOpacity 
              style={styles.calcButton} 
              onPress={handleCalculate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color={COLORS.bg} />
                  <Text style={styles.calcButtonText}>EXECUTE ANALYSIS</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'results' && !results && (
          <View style={styles.center}>
            <Ionicons name="stats-chart" size={64} color={COLORS.bg4} />
            <Text style={styles.emptyText}>EJECUTE EL ANÁLISIS PRIMERO</Text>
          </View>
        )}

        {activeTab === 'results' && results && (
          <View style={styles.section}>
            <View style={styles.resultCard}>
              <Text style={styles.cardHeader}>PRIMARY INDICATORS</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>IMC</Text>
                <Text style={[styles.metricValue, { color: results.bmiColor }]}>{results.bmi} ({results.bmiStatus})</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>PESO IDEAL</Text>
                <Text style={styles.metricValue}>{results.idealWeight} KG</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>RIESGO CV</Text>
                <Text style={styles.metricValue}>{results.cvRisk}</Text>
              </View>
            </View>

            {results.somatotype && (
              <View style={styles.resultCard}>
                <Text style={styles.cardHeader}>SOMATOCARTA (HEATH-CARTER)</Text>
                <View style={{ marginVertical: 10 }}>
                  <Somatocarta x={results.somatotype.x} y={results.somatotype.y} size={250} />
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>COMPONENTE</Text>
                  <Text style={styles.metricValue}>
                    {results.somatotype.endo} - {results.somatotype.meso} - {results.somatotype.ecto}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.resultCard}>
              <Text style={styles.cardHeader}>MACRONUTRIENT BREAKDOWN</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>VCT ESTIMADO</Text>
                <Text style={styles.metricValue}>{results.tdee} KCAL/DÍA</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>PROTEÍNAS</Text>
                <Text style={styles.metricValue}>{results.macros?.protG}g ({results.macros?.protGkg}g/kg)</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>CARBOHIDRATOS</Text>
                <Text style={styles.metricValue}>{results.macros?.choG}g</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>LÍPIDOS</Text>
                <Text style={styles.metricValue}>{results.macros?.fatG}g</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.pdfBtn]} onPress={handleExportPDF}>
                <Ionicons name="document-text" size={20} color={COLORS.bg} />
                <Text style={styles.actionBtnText}>EXPORT PDF</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionBtn, styles.planBtn]} onPress={goToMealPlan}>
                <Ionicons name="nutrition" size={20} color={COLORS.bg} />
                <Text style={styles.actionBtnText}>PLAN PORCIONES</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'ai' && !aiAnalysis && (
          <View style={styles.center}>
            <Ionicons name="hardware-chip" size={64} color={COLORS.bg4} />
            <Text style={styles.emptyText}>LA INTELIGENCIA ARTIFICIAL ESPERA DATOS...</Text>
          </View>
        )}

        {activeTab === 'ai' && aiAnalysis && (
          <View style={styles.section}>
            <View style={styles.aiHeader}>
              <Ionicons name="hardware-chip" size={24} color={COLORS.neon} />
              <Text style={styles.aiTitle}>GEMINI 1.5 FLASH OBSERVATIONS</Text>
            </View>

            <View style={styles.aiCard}>
              <Text style={styles.aiLabel}>DIAGNÓSTICO NUTRICIONAL</Text>
              <Text style={styles.aiText}>{aiAnalysis.nutritional_diagnosis}</Text>
            </View>

            <View style={styles.aiCard}>
              <Text style={styles.aiLabel}>ANÁLISIS CLÍNICO</Text>
              <Text style={styles.aiText}>{aiAnalysis.summary}</Text>
            </View>

            <View style={styles.aiCard}>
              <Text style={styles.aiLabel}>RECOMENDACIONES CLAVE</Text>
              {aiAnalysis.recommendations.map((rec, i) => (
                <View key={i} style={styles.aiBullet}>
                  <Text style={styles.bulletSymbol}>»</Text>
                  <Text style={styles.aiText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    gap: 16,
  },
  emptyText: {
    color: COLORS.dim,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg4,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.neon,
  },
  disabledTab: {
    opacity: 0.3,
  },
  tabText: {
    color: COLORS.dim,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activeTabText: {
    color: COLORS.neon,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    color: COLORS.pink,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.pink,
    paddingLeft: 10,
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
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.bg4,
    borderRadius: 6,
    padding: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  calcButton: {
    backgroundColor: COLORS.neon,
    padding: 18,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    ...SHADOWS.neon,
  },
  calcButtonText: {
    color: COLORS.bg,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  resultCard: {
    backgroundColor: COLORS.bg1,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.bg4,
    gap: 12,
  },
  cardHeader: {
    color: COLORS.neon,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  aiTitle: {
    color: COLORS.neon,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aiCard: {
    backgroundColor: 'rgba(163, 255, 0, 0.05)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(163, 255, 0, 0.2)',
    gap: 8,
  },
  aiLabel: {
    color: COLORS.neon,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  aiText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  aiBullet: {
    flexDirection: 'row',
    gap: 8,
  },
  bulletSymbol: {
    color: COLORS.neon,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pdfBtn: {
    backgroundColor: COLORS.pink,
    ...SHADOWS.pink,
  },
  planBtn: {
    backgroundColor: COLORS.neon,
    ...SHADOWS.neon,
  },
  actionBtnText: {
    color: COLORS.bg,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
  },
});
