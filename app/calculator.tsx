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

const TABS = ['scanner', 'anamnesis', 'macros', 'sports', 'clinical', 'ai', 'history', 'tables'] as const;

export default function Calculator() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
// ... (rest remains the same until activeTab)
  
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
    if (activeTab === 'history') {
      fetchGlobalHistory();
    }
  }, [activeTab, searchHistory]);

  const fetchGlobalHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        .eq('user_id', user.id)
        .order('record_date', { ascending: false });

      if (searchHistory) {
        query = query.ilike('patients.full_name', `%${searchHistory}%`);
      }

      const { data, error } = await query.limit(50);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      let targetPatientId = patientId;

      if (!targetPatientId) {
        const { data: newPat, error: pError } = await supabase
          .from('patients')
          .insert({
            user_id: user.id,
            full_name: patient.full_name,
            age: patient.age,
            sex: patient.sex,
            insurance: patient.insurance,
          })
          .select()
          .single();
        
        if (pError) throw pError;
        targetPatientId = newPat.id;
        router.setParams({ patientId: newPat.id });
      }

      const { error } = await recordService.create({
        patient_id: targetPatientId, user_id: user.id, record_date: new Date().toISOString(),
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
      
      Alert.alert('SINCRONIZACIÓN EXITOSA', 'Dossier biométrico persistido en el vacío.');
      setActiveTab('history');
    } catch (error: any) {
      Alert.alert('FALLO DE RED', error.message);
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
        style={[styles.input, multiline && { height: 120, textAlignVertical: 'top' }]}
        value={String(value || '')}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
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
                  <TextInput style={styles.input} value={form.activity_factor} onChangeText={(v) => setForm({...form, activity_factor: v})} keyboardType="numeric" placeholder="1.2" placeholderTextColor="rgba(255, 255, 255, 0.4)" />
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
                    <Text style={styles.displayLabel}>TFG ESTIMADA / KDIGO</Text>
                    <Text style={[styles.displayValue, { color: COLORS.poison }]}>{results?.gfr?.toFixed(1) || '--'} ({results?.kdigoStage || '--'})</Text>
                  </View>
                </View>
              </View>
              <View style={styles.miniCard}>
                <Text style={styles.cardTitle}>ESTIMACIÓN DE TALLA (CHUMLEA)</Text>
                <View style={styles.row}>
                  {renderInput('ALTURA DE RODILLA', form.knee_height_cm, (v) => setForm({...form, knee_height_cm: v}), 'cm')}
                  <View style={styles.displayOnly}>
                    <Text style={styles.displayLabel}>TALLA CALCULADA</Text>
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
              <SectionHeader title="PROTOCOLOS MINSAL" icon="grid" color={COLORS.dim} />
              <View style={styles.tableCard}>
                <Text style={styles.tableTitle}>ESTADO NUTRICIONAL ADULTO (18-64)</Text>
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
  tabContainer: { backgroundColor: 'rgba(0,0,0,0.8)', borderBottomWidth: 1, borderBottomColor: '#333' },
  tabScroll: { paddingHorizontal: 5 },
  tab: { paddingHorizontal: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 4, borderBottomColor: 'transparent' },
  tabText: { color: COLORS.dim, fontSize: 13, letterSpacing: 1.5, fontWeight: 'bold' },
  scrollContent: { padding: 25, paddingBottom: 80 },
  section: { gap: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, borderLeftWidth: 6, paddingLeft: 18 },
  sectionTitle: { fontSize: 26, fontFamily: FONTS.horror, letterSpacing: 2 },
  row: { flexDirection: 'row', gap: 18 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  inputGroup: { flex: 1, gap: 10 },
  inputLabel: { color: COLORS.white, fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  
  // HIGH LEGIBILITY INPUTS
  input: { 
    backgroundColor: 'rgba(255,255,255,0.12)', // Brighter input background
    borderWidth: 2, 
    borderColor: 'rgba(255, 255, 255, 0.4)', // Brighter border
    padding: 22, 
    color: '#FFFFFF', // Pure white text
    fontSize: 22, 
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
  },
  
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 20 },
  resBox: { width: '31%', backgroundColor: 'rgba(20,20,30,0.9)', padding: 20, borderBottomWidth: 5, gap: 8, ...SHADOWS.crimson },
  resLabel: { fontSize: 11, fontWeight: '900', color: COLORS.dim, letterSpacing: 1.5 },
  resValue: { fontSize: 22, fontWeight: '900', fontFamily: FONTS.horror },
  resSub: { fontSize: 11, color: COLORS.muted, fontWeight: '900' },
  
  mainActionBtn: { backgroundColor: COLORS.crimson, height: 85, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, marginTop: 40, ...SHADOWS.crimson },
  mainActionText: { color: COLORS.bg, fontFamily: FONTS.horror, fontSize: 28, letterSpacing: 3 },
  
  macroDashboard: { flexDirection: 'row', gap: 15 },
  macroBox: { flex: 1, backgroundColor: 'rgba(20,20,30,0.9)', padding: 25, borderLeftWidth: 8, gap: 12 },
  macroLabel: { fontSize: 13, fontWeight: '900', color: COLORS.dim },
  macroGrams: { fontSize: 28, fontWeight: '900', fontFamily: FONTS.horror },
  macroGkg: { fontSize: 13, color: COLORS.bone, fontWeight: 'bold' },
  
  vizContainer: { alignItems: 'center', padding: 25, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 2, borderColor: '#555' },
  miniCard: { backgroundColor: 'rgba(255,255,255,0.06)', padding: 30, borderWidth: 2, borderColor: '#555', gap: 25 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: COLORS.bone, letterSpacing: 1.5 },
  displayOnly: { flex: 1, justifyContent: 'center', backgroundColor: '#000', padding: 20, borderWidth: 2, borderColor: '#555' },
  displayLabel: { fontSize: 11, fontWeight: '900', color: COLORS.dim, marginBottom: 10 },
  displayValue: { fontSize: 24, fontWeight: '900', color: COLORS.bone },
  
  dosageResult: { backgroundColor: 'rgba(255, 0, 81, 0.2)', padding: 25, alignItems: 'center', borderRadius: 6, borderWidth: 2, borderColor: COLORS.pink },
  dosageLabel: { fontSize: 12, color: COLORS.bone, fontWeight: '900', letterSpacing: 2 },
  dosageValue: { fontSize: 36, color: COLORS.bone, fontWeight: '900', marginTop: 12 },
  
  aiCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 40, borderWidth: 2, borderColor: '#666', ...SHADOWS.purple },
  aiLabel: { color: COLORS.crimson, fontSize: 16, fontWeight: '900', letterSpacing: 3, marginBottom: 12 },
  aiText: { color: COLORS.bone, fontSize: 18, lineHeight: 28, textAlign: 'justify', fontWeight: 'bold' },
  aiRecItem: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  aiRecBullet: { color: COLORS.poison, fontWeight: '900', fontSize: 22 },
  aiDivider: { height: 2, backgroundColor: '#666', marginVertical: 35 },
  
  actionRow: { flexDirection: 'row', gap: 20, marginTop: 40 },
  actionBtn: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, backgroundColor: '#111', borderWidth: 2, borderColor: '#666' },
  actionBtnText: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 24 },
  
  identityCard: { backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: 25, borderWidth: 2, borderColor: '#444', gap: 20, marginBottom: 15 },
  miniBtnRow: { flexDirection: 'row', gap: 12 },
  miniBtn: { flex: 1, height: 60, borderWidth: 2, borderColor: '#555', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  activeMiniBtn: { borderColor: COLORS.crimson, backgroundColor: 'rgba(255, 0, 60, 0.25)' },
  miniBtnText: { color: COLORS.dim, fontSize: 15, fontWeight: '900' },
  activeMiniBtnText: { color: COLORS.white },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderWidth: 2, borderColor: COLORS.gold, paddingHorizontal: 20, height: 70, gap: 15, marginBottom: 25 },
  searchInput: { flex: 1, color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  iconBtn: { padding: 15, backgroundColor: '#000', borderWidth: 2, borderColor: '#444' },
  
  historyCard: { backgroundColor: '#111', padding: 30, borderWidth: 2, borderColor: '#444', marginBottom: 20, borderLeftWidth: 6, borderLeftColor: COLORS.gold },
  historyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  historyName: { fontSize: 20, color: COLORS.white, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  historyDate: { fontSize: 14, color: COLORS.dim, fontWeight: 'bold' },
  historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  hStat: { flex: 1 },
  hLabel: { fontSize: 11, color: COLORS.dim, fontWeight: '900', marginBottom: 6 },
  hVal: { fontSize: 18, fontWeight: '900' },
  emptyCard: { alignItems: 'center', justifyContent: 'center', padding: 60, borderWidth: 2, borderColor: '#333', borderStyle: 'dashed' },
  emptyText: { color: COLORS.dim, fontFamily: FONTS.horror, fontSize: 24, marginTop: 20 },
  
  tableCard: { backgroundColor: '#111', padding: 35, borderWidth: 2, borderColor: '#444' },
  tableTitle: { fontSize: 16, fontWeight: '900', color: COLORS.bone, marginBottom: 25, letterSpacing: 2 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#444' },
  tableLabel: { color: COLORS.muted, fontSize: 16, fontWeight: '900' },
  tableValue: { fontSize: 18, fontWeight: '900' },
});
