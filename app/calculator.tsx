import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { COLORS, SHADOWS, ACTIVITY_FACTORS, FONTS, DIET_TYPES } from '../constants/theme';
import { calculateAll } from '../lib/calculations';
import { analyzeWithGemini, generateRuleBasedAlerts } from '../lib/ai';
import { RecordFormData, CalculationResult, AIAnalysis, Patient } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { generateClinicalReport } from '../lib/reports';
import { useLocalSearchParams } from 'expo-router';
import { patientService } from '../lib/supabase';

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
    knee_height_cm: '',
    usual_weight_kg: '',
    weight_loss_weeks: '',
    med_dose: '',
    med_conc: '',
    observations: '',
    diet_type: 'Omnívora',
    liquid_intake: '1 a 2 Litros',
    digestion_status: 'Normal',
    pathologies: [],
    allergies: [],
    grip_strength_kg: '',
    calf_circumference_cm: '',
    mna_score: undefined,
    vgs_status: undefined,
  });

  const [patient, setPatient] = useState<Partial<Patient>>({
    full_name: 'SUJETO DESCONOCIDO',
    age: 0,
    sex: 'M',
    insurance: 'FONASA',
  });

  const [results, setResults] = useState<CalculationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'anamnesis' | 'macros' | 'sports' | 'clinical' | 'ai' | 'tables'>('scanner');

  useEffect(() => {
    if (patientId) {
      const fetchPatient = async () => {
        const { data, error } = await patientService.getById(patientId);
        if (data && !error) {
          // Calculate age from birth_date if available
          let age = data.age;
          if (data.birth_date) {
            const birthDate = new Date(data.birth_date);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }
          setPatient({ ...data, age } as any);
        }
      };
      fetchPatient();
    }
  }, [patientId]);

  const handleCalculate = async () => {
    if (!form.weight_kg || !form.height_cm) {
      Alert.alert('FALTAN DATOS', 'Peso y Talla son obligatorios para el diagnóstico.');
      return;
    }

    setLoading(true);
    const calcResults = calculateAll(form, patient.age || 0, patient.sex as any);
    setResults(calcResults);
    
    try {
      const analysis = await analyzeWithGemini(patient, form as any, calcResults);
      setAiAnalysis(analysis);
      if (activeTab === 'scanner' || activeTab === 'clinical') setActiveTab('ai');
    } catch (error) {
      console.error('AI Link Failure:', error);
      Alert.alert('ALERTA', 'Conexión con IA fallida. Usando análisis local.');
      setActiveTab('ai');
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
      Alert.alert('ERROR', 'Error al generar el reporte.');
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
          <TouchableOpacity style={[styles.tab, activeTab === 'scanner' && styles.activeTab]} onPress={() => setActiveTab('scanner')}>
            <Text style={[styles.tabText, activeTab === 'scanner' && styles.activeTabText]}>ESCÁNER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'anamnesis' && styles.activeTab]} onPress={() => setActiveTab('anamnesis')}>
            <Text style={[styles.tabText, activeTab === 'anamnesis' && styles.activeTabText]}>ANAMNESIS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'macros' && styles.activeTab]} onPress={() => setActiveTab('macros')}>
            <Text style={[styles.tabText, activeTab === 'macros' && styles.activeTabText]}>MACROS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'sports' && styles.activeTab]} onPress={() => setActiveTab('sports')}>
            <Text style={[styles.tabText, activeTab === 'sports' && styles.activeTabText]}>DEPORTIVA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'clinical' && styles.activeTab]} onPress={() => setActiveTab('clinical')}>
            <Text style={[styles.tabText, activeTab === 'clinical' && styles.activeTabText]}>CLÍNICA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'ai' && styles.activeTab]} onPress={() => setActiveTab('ai')}>
            <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>DISECCIÓN IA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'tables' && styles.activeTab]} onPress={() => setActiveTab('tables')}>
            <Text style={[styles.tabText, activeTab === 'tables' && styles.activeTabText]}>TABLAS</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'scanner' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>IDENTIDAD DEL SUJETO</Text>
            <View style={styles.row}>
              {renderInput('NOMBRE COMPLETO', patient.full_name, (v) => setPatient({...patient, full_name: v}), 'Nombre', 'default')}
            </View>
            <View style={styles.row}>
              {renderInput('EDAD (AÑOS)', String(patient.age || ''), (v) => setPatient({...patient, age: parseInt(v) || 0}), '0')}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SEXO</Text>
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

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>ANATOMÍA</Text>
            <View style={styles.row}>
              {renderInput('PESO (KG)', form.weight_kg, (v) => setForm({...form, weight_kg: v}), '0.0')}
              {renderInput('TALLA (CM)', form.height_cm, (v) => setForm({...form, height_cm: v}), '0')}
            </View>
            <View style={styles.row}>
              {renderInput('CINTURA (CM)', form.waist_cm, (v) => setForm({...form, waist_cm: v}), '0')}
              {renderInput('F. ACTIVIDAD', form.activity_factor, (v) => setForm({...form, activity_factor: v}), '1.2')}
            </View>
            <View style={styles.row}>
              {renderInput('PA SIST.', form.systolic_bp, (v) => setForm({...form, systolic_bp: v}), '120')}
              {renderInput('PA DIAST.', form.diastolic_bp, (v) => setForm({...form, diastolic_bp: v}), '80')}
            </View>

            <TouchableOpacity style={styles.calcButton} onPress={handleCalculate} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.bg} /> : <><Ionicons name='skull' size={24} color={COLORS.bg} /><Text style={styles.calcButtonText}>INICIAR DISECCIÓN</Text></>}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'anamnesis' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ANAMNESIS Y ESTILO DE VIDA</Text>
            {renderInput('PATOLOGÍAS', form.pathologies?.join(', '), (v) => setForm({...form, pathologies: v.split(',').map(s => s.trim())}), 'HTA, DM2...', 'default')}
            {renderInput('ALERGIAS', form.allergies?.join(', '), (v) => setForm({...form, allergies: v.split(',').map(s => s.trim())}), 'Lactosa, Gluten...', 'default')}
            <View style={styles.row}>
              {renderInput('DIETA', form.diet_type, (v) => setForm({...form, diet_type: v}), 'Omnívora', 'default')}
              {renderInput('LÍQUIDOS', form.liquid_intake, (v) => setForm({...form, liquid_intake: v}), '1-2L', 'default')}
            </View>
            {renderInput('DIGESTIÓN', form.digestion_status, (v) => setForm({...form, digestion_status: v}), 'Normal', 'default')}
            {renderInput('OBSERVACIONES', form.observations, (v) => setForm({...form, observations: v}), 'Notas clínicas...', 'default', true)}
          </View>
        )}

        {activeTab === 'macros' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MACRONUTRIENTES</Text>
            <View style={styles.row}>
              {renderInput('% PROT', form.macro_prot_pct, (v) => setForm({...form, macro_prot_pct: v}), '15')}
              {renderInput('% CARB', form.macro_cho_pct, (v) => setForm({...form, macro_cho_pct: v}), '55')}
              {renderInput('% LÍP', form.macro_fat_pct, (v) => setForm({...form, macro_fat_pct: v}), '30')}
            </View>
            {results?.macros && (
              <View style={styles.resultCard}>
                <Text style={styles.cardHeader}>APORTE PRESCRITO</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>PROTEÍNAS</Text>
                  <Text style={styles.metricValue}>{results.macros.protG}g ({results.macros.protGkg}g/kg)</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>CARBOHIDRATOS</Text>
                  <Text style={styles.metricValue}>{results.macros.choG}g</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>LÍPIDOS</Text>
                  <Text style={styles.metricValue}>{results.macros.fatG}g</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'sports' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ANTROPOMETRÍA DEPORTIVA</Text>
            <Text style={styles.aiLabel}>PLIEGUES (MM)</Text>
            <View style={styles.row}>
              {renderInput('TRICIPITAL', form.fold_triceps, (v) => setForm({...form, fold_triceps: v}), '0')}
              {renderInput('SUBESCAP.', form.fold_subscapular, (v) => setForm({...form, fold_subscapular: v}), '0')}
            </View>
            <View style={styles.row}>
              {renderInput('SUPRAESP.', form.fold_supraspinal, (v) => setForm({...form, fold_supraspinal: v}), '0')}
              {renderInput('ABDOMINAL', form.fold_abdominal, (v) => setForm({...form, fold_abdominal: v}), '0')}
            </View>

            <Text style={[styles.aiLabel, { marginTop: 10 }]}>DIÁMETROS Y PERÍMETROS (CM)</Text>
            <View style={styles.row}>
              {renderInput('HUMERO', form.diameter_humerus, (v) => setForm({...form, diameter_humerus: v}), '0')}
              {renderInput('FEMUR', form.diameter_femur, (v) => setForm({...form, diameter_femur: v}), '0')}
            </View>
            <View style={styles.row}>
              {renderInput('BRAZO REL.', form.perimeter_arm, (v) => setForm({...form, perimeter_arm: v}), '0')}
              {renderInput('PANTORRILLA', form.perimeter_calf, (v) => setForm({...form, perimeter_calf: v}), '0')}
            </View>
            
            {results?.somatotype && (
              <View style={[styles.resultCard, { borderColor: COLORS.neon }]}>
                <Text style={styles.cardHeader}>SOMATOTIPO</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>ENDOMORFÍA</Text>
                  <Text style={styles.metricValue}>{results.somatotype.endo.toFixed(1)}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>MESOMORFÍA</Text>
                  <Text style={styles.metricValue}>{results.somatotype.meso.toFixed(1)}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>ECTOMORFÍA</Text>
                  <Text style={styles.metricValue}>{results.somatotype.ecto.toFixed(1)}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'clinical' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MARCADORES CLÍNICOS</Text>
            <View style={styles.row}>
              {renderInput('CREATININA', form.creatinine, (v) => setForm({...form, creatinine: v}), 'mg/dL')}
              {renderInput('ALT. RODILLA', form.knee_height_cm, (v) => setForm({...form, knee_height_cm: v}), 'cm')}
            </View>
            <View style={styles.row}>
              {renderInput('PESO HABITUAL', form.usual_weight_kg, (v) => setForm({...form, usual_weight_kg: v}), 'kg')}
              {renderInput('PERD. PESO (%)', form.weight_loss_weeks, (v) => setForm({...form, weight_loss_weeks: v}), '%')}
            </View>
            
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>SARCOPENIA Y RIESGO</Text>
            <View style={styles.row}>
              {renderInput('FUERZA AGARRE', form.grip_strength_kg, (v) => setForm({...form, grip_strength_kg: v}), 'kg')}
              {renderInput('PER. PANTORRILLA', form.calf_circumference_cm, (v) => setForm({...form, calf_circumference_cm: v}), 'cm')}
            </View>
            
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ESTADO VGS</Text>
                <View style={styles.row}>
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
              {renderInput('PUNTAJE MNA', String(form.mna_score || ''), (v) => setForm({...form, mna_score: parseFloat(v) || undefined}), '0-14')}
            </View>
          </View>
        )}

        {activeTab === 'ai' && aiAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DISECCIÓN GEMINI</Text>
            <View style={styles.aiCard}>
              <Text style={styles.aiLabel}>DIAGNÓSTICO</Text>
              <Text style={styles.aiText}>{aiAnalysis.nutritional_diagnosis}</Text>
              <Text style={[styles.aiLabel, { marginTop: 15 }]}>ANÁLISIS DETALLADO</Text>
              <Text style={styles.aiText}>{aiAnalysis.summary}</Text>
              <Text style={[styles.aiLabel, { marginTop: 15 }]}>RECOMENDACIONES</Text>
              {aiAnalysis.recommendations.map((r, i) => (
                <Text key={i} style={styles.aiText}>• {r}</Text>
              ))}
            </View>
            
            <TouchableOpacity style={styles.actionBtn} onPress={handleExportPDF}>
              <Ionicons name='document-text' size={20} color={COLORS.bg} />
              <Text style={styles.actionBtnText}>EXPORTAR REPORTE</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'tables' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TABLAS MINSAL</Text>
            <View style={styles.resultCard}>
              <Text style={styles.cardHeader}>CRITERIOS IMC ADULTO</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>ENFLAQUECIDO</Text>
                <Text style={styles.metricValue}>{'<'} 18.5</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>NORMAL</Text>
                <Text style={styles.metricValue}>18.5 - 24.9</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>SOBREPESO</Text>
                <Text style={styles.metricValue}>25.0 - 29.9</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>OBESIDAD</Text>
                <Text style={styles.metricValue}>≥ 30.0</Text>
              </View>
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
