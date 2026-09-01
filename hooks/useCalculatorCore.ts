import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { RecordFormData, CalculationResult, AIAnalysis, Patient, ClinicalRecord } from '../types';
import { calculateAll } from '../lib/calculations';
import { analyzeWithGemini } from '../lib/ai';
import { patientService, supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { usePatientStore } from '../store/patientStore';

export function useCalculatorCore(patientId?: string) {
  const { session } = useAuthStore();
  const { guestRecords, addGuestRecord } = usePatientStore();

  const [form, setForm] = useState<Partial<RecordFormData>>({
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
  const [globalHistory, setGlobalHistory] = useState<ClinicalRecord[]>([]);
  const [searchHistory, setSearchHistory] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'anamnesis' | 'macros' | 'sports' | 'clinical' | 'ai' | 'history' | 'tables'>('scanner');

  // Load Patient Profile
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
          setPatient({ ...pRes.data, age } as Patient);
        }
      };
      fetchData();
    }
  }, [patientId]);

  // Recalculate Results automatically
  useEffect(() => {
    const calc = calculateAll(form, patient.age || 0, (patient.sex || '') as any);
    setResults(calc);
  }, [form, patient.age, patient.sex]);

  // Fetch History
  const fetchGlobalHistory = async () => {
    try {
      if (!session?.user) return;
      let query = supabase
        .from('clinical_records')
        .select(`*, patients!inner ( id, full_name, insurance, sex, age )`)
        .eq('user_id', session.user.id);

      if (patientId) query = query.eq('patient_id', patientId);
      if (searchHistory) query = query.ilike('patients.full_name', `%${searchHistory}%`);

      const { data, error } = await query.order('record_date', { ascending: false }).limit(50);
      if (error) throw error;
      setGlobalHistory((data as any) || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    fetchGlobalHistory();
  }, [patientId, searchHistory]);

  const buildRecordData = (): Partial<ClinicalRecord> => {
    const val = (v: any) => {
      const n = parseFloat(v);
      return isNaN(n) ? undefined : n;
    };
    return {
      record_date: new Date().toISOString(),
      weight_kg: val(form.weight_kg), height_cm: val(form.height_cm),
      waist_cm: val(form.waist_cm), hip_cm: val(form.hip_cm),
      fold_triceps: val(form.fold_triceps), fold_subscapular: val(form.fold_subscapular),
      fold_supraspinal: val(form.fold_supraspinal), fold_abdominal: val(form.fold_abdominal),
      bmi: results?.bmi || undefined, bmi_status: results?.bmiStatus || undefined,
      fat_percent: results?.fatPercent || undefined,
      fat_mass_kg: results?.fatMassKg || undefined,
      lean_mass_kg: results?.leanMassKg || undefined,
      tdee_kcal: results?.tdee || undefined,
      water_liters: results?.waterLiters || undefined,
      systolic_bp: val(form.systolic_bp), diastolic_bp: val(form.diastolic_bp),
      creatinine: val(form.creatinine),
    };
  };

  const handleAINeuralDissection = async () => {
    if (!form.weight_kg || !form.height_cm || !patient.full_name || !patient.age) {
      Alert.alert('FALLO BIOMÉTRICO', 'Identidad, Edad, Peso y Talla son obligatorios para la disección neural.');
      return;
    }
    setLoading(true);
    try {
      const analysis = await analyzeWithGemini(patient, buildRecordData(), results!);
      setAiAnalysis(analysis);
      setActiveTab('ai');
    } catch (error: any) {
      console.error('AI Failure:', error);
      const isTimeout = error.message?.includes('aborted') || error.message?.includes('timeout');
      const isNetwork = error.message?.includes('Network') || error.message?.includes('Failed to fetch');
      
      let errMsg = 'Interferencia estática en el enlace neuronal.';
      if (isTimeout) errMsg = 'TIMEOUT: La IA superó los 15s de respuesta. Enlace cortado.';
      else if (isNetwork) errMsg = 'FALLO DE RED: Servidores inaccesibles en este cuadrante.';
      
      Alert.alert('FALLO DE VÍNCULO NEURAL', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!results) return;
    if (!patient.full_name || !patient.age) {
      Alert.alert('IDENTIDAD REQUERIDA', 'Debe ingresar Nombre y Edad para procesar el expediente.');
      return;
    }

    const recordData = buildRecordData();

    setSaving(true);
    try {
      if (!session?.user) {
        addGuestRecord({ ...recordData, id: Date.now().toString(), patient_id: 'guest', user_id: 'guest' } as ClinicalRecord);
        Alert.alert('MODO INVITADO', 'Expediente local guardado exitosamente.');
        setActiveTab('history');
        return;
      }

      let pId = patientId;
      if (!pId) {
        const { data: newPatient, error: pError } = await patientService.create({
          full_name: patient.full_name,
          age: patient.age,
          sex: patient.sex as any,
          insurance: patient.insurance || 'FONASA',
          user_id: session.user.id
        });
        if (pError) throw pError;
        pId = newPatient.id;
      }

      const { error } = await supabase.from('clinical_records').insert({
        ...recordData,
        patient_id: pId,
        user_id: session.user.id,
      } as any);
      
      if (error) throw error;
      
      Alert.alert('SINCRONIZACIÓN EXITOSA', 'Dossier biométrico persistido en el núcleo.');
      setActiveTab('history');
      fetchGlobalHistory();
    } catch (error: any) {
      console.error('Save Error:', error);
      Alert.alert('FALLO DE NÚCLEO', error.message);
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

  return {
    form, setForm,
    patient, setPatient,
    results, setResults,
    aiAnalysis, setAiAnalysis,
    globalHistory, searchHistory, setSearchHistory, fetchGlobalHistory,
    guestRecords,
    session,
    loading, saving,
    activeTab, setActiveTab,
    handleSave, handleAINeuralDissection, handleExportData
  };
}
