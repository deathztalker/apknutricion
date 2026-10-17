import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '../../constants/theme';
import CyberInput from '../ui/CyberInput';
import { SectionHeader } from '../ui/LayoutComponents';
import { AIAnalysis, CalculationResult, Patient, RecordFormData, ClinicalRecord } from '../../types';
import { generateClinicalReport } from '../../lib/reports';

interface Props {
  patientId: string | undefined;
  patient: Partial<Patient>;
  form: Partial<RecordFormData>;
  setForm: (f: Partial<RecordFormData>) => void;
  results: CalculationResult | null;
  aiAnalysis: AIAnalysis | null;
  loading: boolean;
  globalHistory: ClinicalRecord[];
  onAnalyze: () => void;
}

export default function AITab({ patientId, patient, form, setForm, results, aiAnalysis, loading, globalHistory, onAnalyze }: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader title="DISECCIÓN NEURAL" icon="brain" color={COLORS.crimson} />
      
      <View style={[styles.actionRow, { marginTop: 0, marginBottom: 15 }]}>
        <TouchableOpacity style={[styles.actionBtn, { flex: 1, borderColor: COLORS.neon, shadowColor: COLORS.neon }]} onPress={() => router.push(`/(app)/ai-chat?patientId=${patientId || ''}`)}>
          <Ionicons name='chatbubbles' size={24} color={COLORS.neon} />
          <Text style={[styles.actionBtnText, { color: COLORS.neon }]}>ABRIR CHAT IA</Text>
        </TouchableOpacity>
      </View>

      {!aiAnalysis ? (
         <TouchableOpacity style={[styles.mainActionBtn, { marginTop: 0 }]} onPress={onAnalyze} disabled={loading}>
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
            <CyberInput label="INDICACIONES CLÍNICAS (OPCIONAL)" value={form.professional_indications} onChange={(v) => setForm({...form, professional_indications: v})} placeholder="Agregue sus notas o prescripciones que irán firmadas en el PDF final..." multiline />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => generateClinicalReport(patient as Patient, globalHistory.find(r => r.patient_id === patientId) || {} as ClinicalRecord, results!, aiAnalysis, globalHistory.filter(r => r.patient_id === patientId))}>
              <Ionicons name='document-text' size={24} color={COLORS.white} />
              <Text style={styles.actionBtnText}>GENERAR REPORTE PDF</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 20 },
  actionRow: { flexDirection: 'row', gap: 15, marginTop: 25 },
  actionBtn: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.bg3, borderWidth: 2, borderColor: COLORS.purple, shadowColor: COLORS.purple, shadowOpacity: 0.3, shadowRadius: 10, borderRadius: 8 },
  actionBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  mainActionBtn: { backgroundColor: COLORS.crimson, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 30, shadowColor: COLORS.crimson, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10, borderRadius: 8 },
  mainActionText: { color: COLORS.white, fontWeight: 'bold', fontSize: 20, letterSpacing: 2 },
  aiCard: { backgroundColor: 'rgba(157, 0, 255, 0.05)', padding: 24, borderWidth: 2, borderColor: COLORS.purple, shadowColor: COLORS.purple, shadowOpacity: 0.3, shadowRadius: 15, borderRadius: 8 },
  aiLabel: { color: COLORS.crimson, fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  aiText: { color: COLORS.white, fontSize: 14, lineHeight: 22, textAlign: 'justify', fontWeight: '800' },
  aiRecItem: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  aiRecBullet: { color: COLORS.poison, fontWeight: '900', fontSize: 18 },
  aiDivider: { height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
});
