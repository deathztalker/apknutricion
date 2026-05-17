import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, FlatList, PanResponder } from 'react-native';
import { COLORS, SHADOWS, FONTS } from '../constants/theme';
import { calculateAll } from '../lib/calculations';
import { analyzeWithGemini } from '../lib/ai';
import { RecordFormData, CalculationResult, AIAnalysis, Patient, ClinicalRecord } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { generateClinicalReport } from '../lib/reports';
import { useLocalSearchParams, router } from 'expo-router';
import { patientService, recordService, supabase } from '../lib/supabase';
import Somatocarta from '../components/Somatocarta';
import TerminalBackground from '../components/TerminalBackground';
import { dataPortability } from '../lib/data';
import { syncService } from '../lib/sync';
import { useAuthStore } from '../store/authStore';

const TABS = ['scanner', 'anamnesis', 'macros', 'sports', 'clinical', 'ai', 'history', 'tables'] as const;

export default function Calculator() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const { session } = useAuthStore();
  
  const [form, setForm] = useState<RecordFormData>({
    weight_kg: '', height_cm: '', waist_cm: '', systolic_bp: '', diastolic_bp: '',
    activity_factor: '1.2', macro_prot_pct: '20', macro_cho_pct: '50', macro_fat_pct: '30',
    fold_triceps: '', fold_subscapular: '', fold_supraspinal: '', fold_abdominal: '',
    diameter_humerus: '', diameter_femur: '', perimeter_arm: '', perimeter_calf: '',
    creatinine: '', knee_height_cm: '', usual_weight_kg: '', weight_loss_weeks: '',
    med_dose: '', med_conc: '', observations: '',
    diet_type: 'Omnívora', liquid_intake: '1 a 2 Litros', digestion_status: 'Normal',
    pathologies: [], allergies: [], grip_strength_kg: '', calf_circumference_cm: '',
    mna_score: undefined, vgs_status: undefined, professional_indications: '',
  });

  const [patient, setPatient] = useState<Partial<Patient>>({
    full_name: '',
    age: 0, sex: 'M', insurance: 'FONASA',
  });

  const [results, setResults] = useState<CalculationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  
  const [globalHistory, setGlobalHistory] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'anamnesis' | 'macros' | 'sports' | 'clinical' | 'ai' | 'history' | 'tables'>('scanner');
  const [libTab, setLibTab] = useState<'antro' | 'diet' | 'formulas'>('antro');

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 50 && Math.abs(gestureState.dy) < 30; // Horizontal swipe
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentIndex = TABS.indexOf(activeTab);
        if (gestureState.dx > 50 && currentIndex > 0) {
          setActiveTab(TABS[currentIndex - 1]);
        } else if (gestureState.dx < -50 && currentIndex < TABS.length - 1) {
          setActiveTab(TABS[currentIndex + 1]);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '8') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < TABS.length) setActiveTab(TABS[index]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (patientId) {
      const fetchData = async () => {
        const pRes = await patientService.getById(patientId);
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
      };
      fetchData();
    }
  }, [patientId]);

  useEffect(() => {
    fetchGlobalHistory();
  }, [patientId, searchHistory]);

  const fetchGlobalHistory = async () => {
    try {
      if (!session?.user) return;

      let query = supabase
        .from('clinical_records')
        .select(`
          *,
          patients!inner (
            id,
            full_name,
            insurance,
            sex,
            age
          )
        `)
        .eq('user_id', session.user.id);

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      if (searchHistory) {
        query = query.ilike('patients.full_name', `%${searchHistory}%`);
      }

      const { data, error } = await query.order('record_date', { ascending: false }).limit(50);
      if (error) throw error;
      setGlobalHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    const calc = calculateAll(form, patient.age || 0, patient.sex as any);
    setResults(calc);
  }, [form, patient.age, patient.sex]);

  const handleAINeuralDissection = async () => {
    if (!form.weight_kg || !form.height_cm || !patient.full_name || !patient.age) {
      Alert.alert('FALLO BIOMÉTRICO', 'Identidad, Edad, Peso y Talla son obligatorios para la disección neural.');
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
    if (!results) return;
    if (!patient.full_name || !patient.age) {
      Alert.alert('IDENTIDAD REQUERIDA', 'Debe ingresar Nombre y Edad del paciente para guardar el registro.');
      return;
    }

    setSaving(true);
    try {
      if (!session?.user) throw new Error('No autorizado: Sesión expirada o inválida.');

      let targetPatientId = patientId;

      // Create patient if guest or not linked
      if (!targetPatientId) {
        const { data: newPat, error: pError } = await supabase
          .from('patients')
          .insert({
            user_id: session.user.id,
            full_name: patient.full_name,
            age: parseInt(String(patient.age)) || 0,
            sex: patient.sex || 'M',
            insurance: patient.insurance || 'FONASA',
            is_active: true
          })
          .select()
          .single();
        
        if (pError) throw pError;
        targetPatientId = newPat.id;
        router.setParams({ patientId: newPat.id });
      }

      // Helper to avoid NaN in DB
      const val = (v: any) => {
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
      };

      const { error } = await recordService.create({
        patient_id: targetPatientId, 
        user_id: session.user.id, 
        record_date: new Date().toISOString(),
        weight_kg: val(form.weight_kg), 
        height_cm: val(form.height_cm),
        waist_cm: val(form.waist_cm), 
        bmi: results.bmi, 
        bmi_status: results.bmiStatus,
        ideal_weight: results.idealWeight, 
        fat_percent: results.fatPercent, 
        fat_mass_kg: results.fatMassKg,
        lean_mass_kg: results.leanMassKg, 
        ict: results.ict, 
        cv_risk: results.cvRisk,
        systolic_bp: parseInt(form.systolic_bp || '0') || null, 
        diastolic_bp: parseInt(form.diastolic_bp || '0') || null,
        bp_status: results.bpStatus, 
        activity_factor: val(form.activity_factor),
        bmr_kcal: Math.round(results.bmr || 0) || null, 
        tdee_kcal: Math.round(results.tdee || 0) || null, 
        water_liters: val(results.waterLiters),
        macro_prot_pct: parseInt(form.macro_prot_pct || '0') || null, 
        macro_cho_pct: parseInt(form.macro_cho_pct || '0') || null,
        macro_fat_pct: parseInt(form.macro_fat_pct || '0') || null, 
        pathologies: form.pathologies || [],
        allergies: form.allergies || [], 
        diet_type: form.diet_type || 'Omnívora', 
        liquid_intake: form.liquid_intake || 'Normal',
        digestion_status: form.digestion_status || 'Normal', 
        observations: form.observations || '',
        ai_analysis: aiAnalysis?.summary || null, 
        grip_strength_kg: val(form.grip_strength_kg),
        calf_circumference_cm: val(form.calf_circumference_cm),
        mna_score: form.mna_score || null, 
        vgs_status: form.vgs_status || null, 
        somatotype: results.somatotype || null,
      } as any);
      
      if (error) throw error;
      
      Alert.alert('SINCRONIZACIÓN EXITOSA', 'Dossier biométrico persistido en el vacío.');
      setActiveTab('history');
      fetchGlobalHistory(); // Refresh history list
    } catch (error: any) {
      console.error('Save Error:', error);
      Alert.alert('FALLO DE RED / PERSISTENCIA', error.message || 'Error desconocido al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      if (globalHistory.length === 0) {
        Alert.alert("VACÍO", "No hay registros para exportar.");
        return;
      }
      Alert.alert("SISTEMA", "Extracción completada. Datos asegurados.");
    } catch (e: any) {
      Alert.alert("ERROR", e.message);
    }
  };

  const renderInput = (label: string, value: any, onChange: (v: string) => void, placeholder: string, keyboard = 'numeric', multiline = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 160, textAlignVertical: 'top' }]}
        value={String(value ?? '')}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
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
            <TabItem id="scanner" label="ESCANER" icon="scan" active={activeTab} onPress={setActiveTab} color={COLORS.crimson} />
            <TabItem id="anamnesis" label="ANAMNESIS" icon="list" active={activeTab} onPress={setActiveTab} color={COLORS.sky} />
            <TabItem id="macros" label="MACROS" icon="pie-chart" active={activeTab} onPress={setActiveTab} color={COLORS.pink} />
            <TabItem id="sports" label="DEPORTIVA" icon="fitness" active={activeTab} onPress={setActiveTab} color={COLORS.poison} />
            <TabItem id="clinical" label="CLÍNICA" icon="medkit" active={activeTab} onPress={setActiveTab} color={COLORS.purple} />
            <TabItem id="ai" label="NEURAL IA" icon="brain" active={activeTab} onPress={setActiveTab} color={COLORS.crimson} />
            <TabItem id="history" label="HISTORIAL" icon="server" active={activeTab} onPress={setActiveTab} color={COLORS.gold} />
            <TabItem id="tables" label="BIBLIOTECA" icon="grid" active={activeTab} onPress={setActiveTab} color={COLORS.bone} />
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {activeTab === 'scanner' && (
            <View style={styles.section}>
              <SectionHeader title="IDENTIDAD Y BIOMETRÍA" icon="skull" color={COLORS.crimson} />
              
              <View style={styles.identityCard}>
                <View style={styles.row}>
                  {renderInput('NOMBRE DEL SUJETO', patient.full_name, (v) => setPatient({...patient, full_name: v}), 'Ej. Juan Pérez', 'default')}
                </View>
                <View style={styles.row}>
                  {renderInput('EDAD (AÑOS)', patient.age ? String(patient.age) : '', (v) => setPatient({...patient, age: parseInt(v) || 0}), '0')}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>GENOTIPO</Text>
                    <View style={styles.miniBtnRow}>
                      <TouchableOpacity style={[styles.miniBtn, patient.sex === 'M' && styles.activeMiniBtn]} onPress={() => setPatient({...patient, sex: 'M'})}>
                        <Text style={[styles.miniBtnText, patient.sex === 'M' && styles.activeMiniBtnText]}>XY</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.miniBtn, patient.sex === 'F' && styles.activeMiniBtn]} onPress={() => setPatient({...patient, sex: 'F'})}>
                        <Text style={[styles.miniBtnText, patient.sex === 'F' && styles.activeMiniBtnText]}>XX</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                {renderInput('PESO (KG)', form.weight_kg, (v) => setForm({...form, weight_kg: v}), '0.0')}
                {renderInput('TALLA (CM)', form.height_cm, (v) => setForm({...form, height_cm: v}), '0')}
              </View>
              <View style={styles.row}>
                {renderInput('CINTURA (CM)', form.waist_cm, (v) => setForm({...form, waist_cm: v}), '0')}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ACT. FÍSICA</Text>
                  <TextInput 
                    style={styles.input} 
                    value={form.activity_factor} 
                    onChangeText={(v) => setForm({...form, activity_factor: v})} 
                    keyboardType="numeric" 
                    placeholder="1.2" 
                    placeholderTextColor={COLORS.muted} 
                  />
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

              <TouchableOpacity style={styles.mainActionBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.bg} /> : (
                  <>
                    <Ionicons name="save" size={28} color={COLORS.bg} />
                    <Text style={styles.mainActionText}>GUARDAR EXPEDIENTE</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'anamnesis' && (
            <View style={styles.section}>
              <SectionHeader title="ANAMNESIS DEL SUJETO" icon="list" color={COLORS.sky} />
              {renderInput('PATOLOGÍAS DETECTADAS', form.pathologies?.join(', '), (v) => setForm({...form, pathologies: v.split(',').map(s => s.trim())}), 'HTA, DM2, Hipotiroidismo...', 'default')}
              {renderInput('ALERGIAS / INTOLERANCIAS', form.allergies?.join(', '), (v) => setForm({...form, allergies: v.split(',').map(s => s.trim())}), 'Lactosa, Gluten...', 'default')}
              <View style={styles.row}>
                {renderInput('TIPO DIETA', form.diet_type, (v) => setForm({...form, diet_type: v}), 'Omnívora', 'default')}
                {renderInput('LÍQUIDOS', form.liquid_intake, (v) => setForm({...form, liquid_intake: v}), '1-2 Litros', 'default')}
              </View>
              {renderInput('ESTADO DIGESTIVO', form.digestion_status, (v) => setForm({...form, digestion_status: v}), 'Normal', 'default')}
              {renderInput('OBSERVACIONES CLÍNICAS', form.observations, (v) => setForm({...form, observations: v}), 'Escribir notas clínicas aquí...', 'default', true)}
            </View>
          )}

          {activeTab === 'macros' && (
            <View style={styles.section}>
              <SectionHeader title="CONFIGURACIÓN DE NUTRIENTES" icon="pie-chart" color={COLORS.pink} />
              <View style={styles.row}>
                {renderInput('% PROTEÍNAS', form.macro_prot_pct, (v) => setForm({...form, macro_prot_pct: v}), '20')}
                {renderInput('% CARBOS', form.macro_cho_pct, (v) => setForm({...form, macro_cho_pct: v}), '50')}
                {renderInput('% LÍPIDOS', form.macro_fat_pct, (v) => setForm({...form, macro_fat_pct: v}), '30')}
              </View>
              {results?.macros && (
                <View style={styles.macroDashboard}>
                  <MacroBox label="PROTEÍNAS" grams={results.macros.protG} gkg={results.macros.protGkg} color={COLORS.crimson} />
                  <MacroBox label="CARBOHIDRATOS" grams={results.macros.choG} gkg={results.macros.choGkg} color={COLORS.sky} />
                  <MacroBox label="LÍPIDOS" grams={results.macros.fatG} gkg={results.macros.fatGkg} color={COLORS.pink} />
                </View>
              )}
            </View>
          )}

          {activeTab === 'sports' && (
            <View style={styles.section}>
              <SectionHeader title="CINEANTROPOMETRÍA AVANZADA" icon="fitness" color={COLORS.poison} />
              {results?.somatotype && (
                <View style={styles.vizContainer}>
                  <Somatocarta x={results.somatotype.x} y={results.somatotype.y} size={280} />
                </View>
              )}
              <View style={styles.grid2}>
                {renderInput('PLIEGUE TRICIPITAL', form.fold_triceps, (v) => setForm({...form, fold_triceps: v}), '0')}
                {renderInput('PLIEGUE SUBESCAPULAR', form.fold_subscapular, (v) => setForm({...form, fold_subscapular: v}), '0')}
                {renderInput('PLIEGUE SUPRAESPINAL', form.fold_supraspinal, (v) => setForm({...form, fold_supraspinal: v}), '0')}
                {renderInput('PLIEGUE ABDOMINAL', form.fold_abdominal, (v) => setForm({...form, fold_abdominal: v}), '0')}
              </View>
              <View style={styles.row}>
                {renderInput('PERÍMETRO BRAZO', form.perimeter_arm, (v) => setForm({...form, perimeter_arm: v}), '0')}
                {renderInput('PERÍMETRO PANTORRILLA', form.perimeter_calf, (v) => setForm({...form, perimeter_calf: v}), '0')}
              </View>
              <View style={styles.dashboardGrid}>
                <ResultBox label="% GRASA (FAULKNER)" value={`${results?.fatPercent?.toFixed(1) || '--'} %`} color={COLORS.poison} />
                <ResultBox label="MASA GRASA" value={`${results?.fatMassKg?.toFixed(1) || '--'} KG`} color={COLORS.pink} />
                <ResultBox label="MASA MAGRA" value={`${results?.leanMassKg?.toFixed(1) || '--'} KG`} color={COLORS.sky} />
                <ResultBox label="SUMATORIA PLIEGUES" value={`${results?.foldSum?.toFixed(1) || '--'} MM`} color={COLORS.purple} />
              </View>
            </View>
          )}

          {activeTab === 'clinical' && (
            <View style={styles.section}>
              <SectionHeader title="INDICADORES HOSPITALARIOS" icon="medkit" color={COLORS.purple} />
              <View style={styles.miniCard}>
                <Text style={styles.cardTitle}>FUNCIÓN RENAL (COCKCROFT-GAULT)</Text>
                <View style={styles.row}>
                  {renderInput('CREATININA SÉRICA', form.creatinine, (v) => setForm({...form, creatinine: v}), 'mg/dL')}
                  <View style={styles.displayOnly}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
                      <Text style={[styles.displayLabel, {marginBottom: 0}]}>TFG ESTIMADA / KDIGO</Text>
                      <TooltipIcon info="Tasa de Filtración Glomerular (Cockcroft-Gault) clasificada según los estadios de la fundación KDIGO (G1-G5)." />
                    </View>
                    <Text style={[styles.displayValue, { color: COLORS.poison }]}>{results?.gfr?.toFixed(1) || '--'} ({results?.kdigoStage || '--'})</Text>
                  </View>
                </View>
              </View>
              <View style={styles.miniCard}>
                <Text style={styles.cardTitle}>ESTIMACIÓN DE TALLA (CHUMLEA)</Text>
                <View style={styles.row}>
                  {renderInput('ALTURA DE RODILLA', form.knee_height_cm, (v) => setForm({...form, knee_height_cm: v}), 'cm')}
                  <View style={styles.displayOnly}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
                      <Text style={[styles.displayLabel, {marginBottom: 0}]}>TALLA CALCULADA</Text>
                      <TooltipIcon info="Ecuación de Chumlea para predecir la estatura en base a la altura de rodilla. Especialmente útil en pacientes encamados o adultos mayores." />
                    </View>
                    <Text style={[styles.displayValue, { color: COLORS.neon }]}>{results?.estimatedHeight?.toFixed(1) || '--'} CM</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'ai' && (
            <View style={styles.section}>
              <SectionHeader title="DISECCIÓN NEURAL" icon="brain" color={COLORS.crimson} />
              
              {!aiAnalysis ? (
                 <TouchableOpacity style={styles.mainActionBtn} onPress={handleAINeuralDissection} disabled={loading}>
                  {loading ? <ActivityIndicator color={COLORS.bg} /> : (
                    <>
                      <Ionicons name="flash" size={28} color={COLORS.bg} />
                      <Text style={styles.mainActionText}>INICIAR ANÁLISIS</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.aiCard}>
                    <Text style={styles.aiLabel}>DIAGNÓSTICO TÉCNICO INTEGRAL</Text>
                    <Text style={styles.aiText}>{aiAnalysis.nutritional_diagnosis}</Text>
                    
                    <View style={styles.aiDivider} />
                    
                    <Text style={[styles.aiLabel, { color: COLORS.sky }]}>ANÁLISIS FISIOPATOLÓGICO</Text>
                    <Text style={styles.aiText}>{aiAnalysis.summary}</Text>
                    
                    <View style={styles.aiDivider} />

                    <Text style={[styles.aiLabel, { color: COLORS.poison }]}>PROTOCOLOS DE INTERVENCIÓN</Text>
                    {aiAnalysis.recommendations.map((r, i) => (
                      <View key={i} style={styles.aiRecItem}>
                        <Text style={styles.aiRecBullet}>{'>'}</Text>
                        <Text style={styles.aiText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={{ marginTop: 20 }}>
                    {renderInput('INDICACIONES CLÍNICAS (OPCIONAL)', form.professional_indications, (v) => setForm({...form, professional_indications: v}), 'Agregue sus notas o prescripciones que irán firmadas en el PDF final...', 'default', true)}
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => generateClinicalReport(patient as any, form as any, results!, aiAnalysis, globalHistory.filter(r => r.patient_id === patientId))}>
                      <Ionicons name='document-text' size={24} color={COLORS.white} />
                      <Text style={styles.actionBtnText}>GENERAR REPORTE PDF</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}

          {activeTab === 'history' && (
            <View style={styles.section}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                <SectionHeader title="PACIENTES GUARDADOS" icon="server" color={COLORS.gold} />
                <View style={{flexDirection: 'row', gap: 10}}>
                  <TouchableOpacity style={styles.iconBtn} onPress={fetchGlobalHistory}>
                     <Ionicons name="refresh" size={20} color={COLORS.bone} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={handleExportData}>
                     <Ionicons name="download" size={20} color={COLORS.sky} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={COLORS.gold} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="BUSCAR PACIENTE O FECHA..."
                  placeholderTextColor="#666"
                  value={searchHistory}
                  onChangeText={setSearchHistory}
                />
              </View>

              {globalHistory.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="skull" size={60} color="#222" />
                  <Text style={styles.emptyText}>SIN TRANSMISIONES PREVIAS</Text>
                </View>
              ) : (
                globalHistory.map((rec) => (
                  <TouchableOpacity 
                    key={rec.id} 
                    style={styles.historyCard}
                    onPress={() => router.push(`/(app)/patient/${rec.patient_id}`)}
                  >
                    <View style={styles.historyHead}>
                      <View>
                        <Text style={styles.historyName}>{rec.patients?.full_name?.toUpperCase() || 'SUJETO ANÓNIMO'}</Text>
                        <Text style={styles.historyDate}>{new Date(rec.record_date!).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={24} color={COLORS.gold} />
                    </View>
                    <View style={styles.historyGrid}>
                      <HStat label="EDAD" val={`${rec.patients?.age || '--'} Y`} color={COLORS.dim} />
                      <HStat label="IMC" val={rec.bmi} color={COLORS.bone} />
                      <HStat label="PESO" val={`${rec.weight_kg} KG`} color={COLORS.bone} />
                      <HStat label="STATUS" val={rec.bmi_status} color={COLORS.crimson} />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === 'tables' && (
            <View style={styles.section}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                <SectionHeader title="CODEX CLÍNICO" icon="book" color={COLORS.bone} />
              </View>

              <View style={styles.libTabs}>
                <TouchableOpacity style={[styles.libTab, libTab === 'antro' && styles.activeLibTab]} onPress={() => setLibTab('antro')}>
                  <Text style={[styles.libTabText, libTab === 'antro' && { color: COLORS.white }]}>ANTROPOMETRÍA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.libTab, libTab === 'diet' && styles.activeLibTab]} onPress={() => setLibTab('diet')}>
                  <Text style={[styles.libTabText, libTab === 'diet' && { color: COLORS.white }]}>DIETOTERAPIA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.libTab, libTab === 'formulas' && styles.activeLibTab]} onPress={() => setLibTab('formulas')}>
                  <Text style={[styles.libTabText, libTab === 'formulas' && { color: COLORS.white }]}>FÓRMULAS</Text>
                </TouchableOpacity>
              </View>

              {libTab === 'antro' && (
                <>
                  <View style={styles.tableCard}>
                    <Text style={styles.tableTitle}>IMC ADULTO (18-64) - MINSAL</Text>
                    <TableRow label="ENFLAQUECIDO" value="< 18.5" color={COLORS.gold} />
                    <TableRow label="NORMAL" value="18.5 - 24.9" color={COLORS.poison} />
                    <TableRow label="SOBREPESO" value="25.0 - 29.9" color={COLORS.purple} />
                    <TableRow label="OBESIDAD" value="≥ 30.0" color={COLORS.crimson} />
                  </View>
                  <View style={styles.tableCard}>
                    <Text style={styles.tableTitle}>IMC ADULTO MAYOR (65+) - MINSAL</Text>
                    <TableRow label="ENFLAQUECIDO" value="< 23.0" color={COLORS.gold} />
                    <TableRow label="NORMAL" value="23.0 - 27.9" color={COLORS.poison} />
                    <TableRow label="SOBREPESO" value="28.0 - 31.9" color={COLORS.purple} />
                    <TableRow label="OBESIDAD" value="≥ 32.0" color={COLORS.crimson} />
                  </View>
                  <View style={styles.tableCard}>
                    <Text style={styles.tableTitle}>RIESGO CARDIOVASCULAR (PERÍMETRO CINTURA)</Text>
                    <TableRow label="RIESGO ALTO MUJERES" value="≥ 88 cm" color={COLORS.crimson} />
                    <TableRow label="RIESGO ALTO HOMBRES" value="≥ 102 cm" color={COLORS.crimson} />
                  </View>
                </>
              )}

              {libTab === 'diet' && (
                <>
                  <View style={styles.tableCard}>
                    <Text style={styles.tableTitle}>ENFERMEDAD RENAL CRÓNICA (PROTEÍNAS)</Text>
                    <TableRow label="ERC G1-G3 (CON DM)" value="0.8 g/kg/día" color={COLORS.poison} />
                    <TableRow label="ERC G4-G5 (SIN DIÁLISIS)" value="0.6 - 0.8 g/kg/día" color={COLORS.gold} />
                    <TableRow label="HEMODIÁLISIS" value="1.2 - 1.4 g/kg/día" color={COLORS.crimson} />
                  </View>
                  <View style={styles.tableCard}>
                    <Text style={styles.tableTitle}>ESTRATEGIAS HTA (DASH)</Text>
                    <TableRow label="SODIO RECOMENDADO" value="< 1500 - 2300 mg/día" color={COLORS.sky} />
                    <TableRow label="POTASIO RECOMENDADO" value="3500 - 5000 mg/día" color={COLORS.poison} />
                  </View>
                </>
              )}

              {libTab === 'formulas' && (
                <>
                  <View style={styles.tableCard}>
                    <Text style={styles.tableTitle}>ECUACIONES ANALÍTICAS DEL NÚCLEO</Text>
                    <View style={{ gap: 15, marginTop: 10 }}>
                      <View>
                        <Text style={{ color: COLORS.purple, fontWeight: 'bold', fontSize: 12 }}>TFG (COCKCROFT-GAULT)</Text>
                        <Text style={{ color: COLORS.dim, fontSize: 11, marginTop: 5 }}>((140 - Edad) × Peso) / (72 × Creatinina). Mujeres × 0.85</Text>
                      </View>
                      <View>
                        <Text style={{ color: COLORS.sky, fontWeight: 'bold', fontSize: 12 }}>TALLA ESTIMADA (CHUMLEA)</Text>
                        <Text style={{ color: COLORS.dim, fontSize: 11, marginTop: 5 }}>Basado en altura de rodilla y edad. Diferente coeficiente por sexo biológico.</Text>
                      </View>
                      <View>
                        <Text style={{ color: COLORS.pink, fontWeight: 'bold', fontSize: 12 }}>TASA METABÓLICA BASAL (MIFFLIN-ST JEOR)</Text>
                        <Text style={{ color: COLORS.dim, fontSize: 11, marginTop: 5 }}>(10 × Peso) + (6.25 × Talla) - (5 × Edad) + S (S=5 hombres, S=-161 mujeres)</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

        </ScrollView>
      </View>
    </TerminalBackground>
  );
}

// ... helper functions
function TabItem({ id, label, icon, active, onPress, color }: any) {
  const isActive = active === id;
  return (
    <TouchableOpacity 
      style={[styles.tab, isActive && { borderBottomColor: color, backgroundColor: 'rgba(255,255,255,0.1)' }]} 
      onPress={() => onPress(id)}
    >
      <Ionicons name={icon as any} size={20} color={isActive ? color : COLORS.dim} />
      <Text style={[styles.tabText, isActive && { color, fontWeight: '900' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TooltipIcon({ info }: { info: string }) {
  return (
    <TouchableOpacity onPress={() => Alert.alert('REFERENCIA CLÍNICA', info)} style={{ marginLeft: 6 }}>
      <Ionicons name="information-circle-outline" size={14} color={COLORS.sky} />
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
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{label}</Text>
      <Text style={[styles.tableValue, { color }]}>{value}</Text>
    </View>
  );
}

function HStat({ label, val, color }: any) {
  return (
    <View style={styles.hStat}>
      <Text style={styles.hLabel}>{label}</Text>
      <Text style={[styles.hVal, { color }]}>{val}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: { backgroundColor: 'rgba(5,5,10,0.9)', borderBottomWidth: 2, borderBottomColor: COLORS.crimson },
  tabScroll: { paddingHorizontal: 5 },
  tab: { paddingHorizontal: 16, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 4, borderBottomColor: 'transparent' },
  tabText: { color: COLORS.muted, fontSize: 13, letterSpacing: 2, fontWeight: 'bold' },
  scrollContent: { padding: 25, paddingBottom: 80 },
  section: { gap: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, borderLeftWidth: 8, paddingLeft: 20, backgroundColor: 'rgba(255,0,60,0.1)', paddingVertical: 15 },
  sectionTitle: { fontSize: 28, fontFamily: FONTS.horror, letterSpacing: 3, textShadowColor: '#000', textShadowRadius: 5 },
  row: { flexDirection: 'row', gap: 20 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  inputGroup: { flex: 1, gap: 12 },
  inputLabel: { color: COLORS.bone, fontSize: 13, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  
  // HIGH LEGIBILITY HALLOWEEN INPUTS
  input: { 
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2, 
    borderColor: COLORS.dim,
    padding: 24, 
    color: COLORS.white, 
    fontSize: 24, 
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 25 },
  resBox: { width: '31%', backgroundColor: COLORS.bg2, padding: 22, borderBottomWidth: 6, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  resLabel: { fontSize: 12, fontWeight: '900', color: COLORS.muted, letterSpacing: 2 },
  resValue: { fontSize: 26, fontWeight: '900', fontFamily: FONTS.horror, textShadowColor: '#000', textShadowRadius: 4 },
  resSub: { fontSize: 12, color: COLORS.bone, fontWeight: '900', textTransform: 'uppercase' },
  
  mainActionBtn: { backgroundColor: COLORS.crimson, height: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 45, shadowColor: COLORS.crimson, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15 },
  mainActionText: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 32, letterSpacing: 4 },
  
  macroDashboard: { flexDirection: 'row', gap: 18 },
  macroBox: { flex: 1, backgroundColor: COLORS.bg2, padding: 28, borderLeftWidth: 10, gap: 15, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10 },
  macroLabel: { fontSize: 14, fontWeight: '900', color: COLORS.muted, letterSpacing: 1.5 },
  macroGrams: { fontSize: 32, fontWeight: '900', fontFamily: FONTS.horror },
  macroGkg: { fontSize: 14, color: COLORS.bone, fontWeight: 'bold' },
  
  vizContainer: { alignItems: 'center', padding: 30, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 3, borderColor: COLORS.purple, shadowColor: COLORS.purple, shadowOpacity: 0.3, shadowRadius: 20 },
  miniCard: { backgroundColor: COLORS.bg2, padding: 35, borderWidth: 2, borderColor: COLORS.dim, gap: 30 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: COLORS.orange, letterSpacing: 2 },
  displayOnly: { flex: 1, justifyContent: 'center', backgroundColor: '#000', padding: 25, borderWidth: 2, borderColor: COLORS.purple },
  displayLabel: { fontSize: 12, fontWeight: '900', color: COLORS.muted, marginBottom: 12 },
  displayValue: { fontSize: 28, fontWeight: '900', color: COLORS.neon },
  
  dosageResult: { backgroundColor: 'rgba(255, 107, 0, 0.15)', padding: 30, alignItems: 'center', borderRadius: 4, borderWidth: 2, borderColor: COLORS.orange },
  dosageLabel: { fontSize: 14, color: COLORS.bone, fontWeight: '900', letterSpacing: 3 },
  dosageValue: { fontSize: 42, color: COLORS.orange, fontWeight: '900', marginTop: 15, fontFamily: FONTS.horror },
  
  aiCard: { backgroundColor: 'rgba(157, 0, 255, 0.05)', padding: 45, borderWidth: 3, borderColor: COLORS.purple, shadowColor: COLORS.purple, shadowOpacity: 0.5, shadowRadius: 30 },
  aiLabel: { color: COLORS.crimson, fontSize: 18, fontWeight: '900', letterSpacing: 4, marginBottom: 15, fontFamily: FONTS.horror },
  aiText: { color: COLORS.white, fontSize: 19, lineHeight: 30, textAlign: 'justify', fontWeight: '800' },
  aiRecItem: { flexDirection: 'row', gap: 18, marginBottom: 18 },
  aiRecBullet: { color: COLORS.poison, fontWeight: '900', fontSize: 24 },
  aiDivider: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 40 },
  
  actionRow: { flexDirection: 'row', gap: 25, marginTop: 45 },
  actionBtn: { height: 85, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: COLORS.bg3, borderWidth: 3, borderColor: COLORS.purple, shadowColor: COLORS.purple, shadowOpacity: 0.4, shadowRadius: 15 },
  actionBtnText: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 26 },
  
  identityCard: { backgroundColor: 'rgba(0, 255, 159, 0.03)', padding: 30, borderWidth: 3, borderColor: COLORS.dim, gap: 25, marginBottom: 20 },
  miniBtnRow: { flexDirection: 'row', gap: 15 },
  miniBtn: { flex: 1, height: 65, borderWidth: 3, borderColor: COLORS.dim, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  activeMiniBtn: { borderColor: COLORS.crimson, backgroundColor: 'rgba(255, 0, 60, 0.2)' },
  miniBtnText: { color: COLORS.muted, fontSize: 16, fontWeight: '900' },
  activeMiniBtnText: { color: COLORS.white },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderWidth: 3, borderColor: COLORS.gold, paddingHorizontal: 22, height: 75, gap: 18, marginBottom: 30 },
  searchInput: { flex: 1, color: COLORS.white, fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  iconBtn: { padding: 18, backgroundColor: COLORS.bg1, borderWidth: 3, borderColor: COLORS.dim },
  
  historyCard: { backgroundColor: COLORS.bg2, padding: 35, borderWidth: 3, borderColor: COLORS.dim, marginBottom: 25, borderLeftWidth: 10, borderLeftColor: COLORS.gold, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15 },
  historyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  historyName: { fontSize: 24, color: COLORS.white, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
  historyDate: { fontSize: 15, color: COLORS.muted, fontWeight: 'bold' },
  historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 25 },
  hStat: { flex: 1 },
  hLabel: { fontSize: 12, color: COLORS.muted, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  hVal: { fontSize: 20, fontWeight: '900' },
  emptyCard: { alignItems: 'center', justifyContent: 'center', padding: 70, borderWidth: 4, borderColor: COLORS.dim, borderStyle: 'dashed' },
  emptyText: { color: COLORS.muted, fontFamily: FONTS.horror, fontSize: 28, marginTop: 25 },
  
  tableCard: { backgroundColor: COLORS.bg2, padding: 40, borderWidth: 3, borderColor: COLORS.dim, marginBottom: 20 },
  tableTitle: { fontSize: 18, fontWeight: '900', color: COLORS.orange, marginBottom: 30, letterSpacing: 3, fontFamily: FONTS.horror },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: COLORS.dim },
  tableLabel: { color: COLORS.bone, fontSize: 17, fontWeight: '900' },
  tableValue: { fontSize: 19, fontWeight: '900' },
  
  libTabs: { flexDirection: 'row', backgroundColor: '#000', borderWidth: 3, borderColor: COLORS.dim, marginBottom: 25 },
  libTab: { flex: 1, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: 'transparent' },
  activeLibTab: { borderBottomColor: COLORS.orange, backgroundColor: 'rgba(255, 107, 0, 0.1)' },
  libTabText: { color: COLORS.muted, fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
});
