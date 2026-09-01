import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Platform, Alert, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../../../constants/theme';
import { patientService, recordService, mealPlanService } from '../../../lib/supabase';
import { Patient, ClinicalRecord, CalculationResult, AIAnalysis } from '../../../types';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NeuralBackground from '@/components/NeuralBackground';
import { generateClinicalReport } from '../../../lib/reports';
import { calculateAll } from '../../../lib/calculations';
import CyberButton from '../../../components/CyberButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PatientDossier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, rRes, mRes] = await Promise.all([
          patientService.getById(id),
          recordService.getByPatient(id, 20),
          mealPlanService.getByPatient(id)
        ]);
        if (pRes.error) throw pRes.error;
        if (rRes.error) throw rRes.error;
        if (mRes.error) throw mRes.error;

        setPatient(pRes.data);
        setRecords(rRes.data || []);
        setMealPlans(mRes.data || []);
      } catch (error) {
        console.error('Error fetching dossier:', error);
        Alert.alert("ACCESO DENEGADO", "No se pudo recuperar el expediente del núcleo.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleGeneratePDF = async () => {
    if (!patient || records.length === 0) return;
    
    try {
      const latest = records[0];
      // Re-calculate results for PDF to ensure all calculated fields are present
      const calc = calculateAll(latest as any, patient.age, patient.sex as any);
      
      // Re-parse AI analysis if it exists as string
      let ai: AIAnalysis = {
        summary: latest.ai_analysis || 'No se registra análisis previo.',
        alerts: [],
        recommendations: [],
        nutritional_diagnosis: 'Evaluación de rutina.',
        goals: [],
        follow_up: '',
        raw_text: ''
      };

      await generateClinicalReport(patient, latest, calc, ai, records);
    } catch (error) {
      console.error('PDF Error:', error);
      Alert.alert('FALLO DE EXTRACCIÓN', 'No se pudo generar el dossier PDF.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.crimson} />
        <Text style={styles.loadingText}>DECRIPTANDO DOSSIER...</Text>
      </View>
    );
  }

  const latest = records[0];
  
  const weightData = {
    labels: records.length > 0 
      ? records.slice(0, 6).reverse().map(r => new Date(r.record_date!).toLocaleDateString('es-CL', { month: 'short' }))
      : [],
    datasets: [{
      data: records.length > 0 
        ? records.slice(0, 6).reverse().map(r => r.weight_kg || 0)
        : [0],
      color: () => COLORS.crimson,
      strokeWidth: 4
    }]
  };

  return (
    <NeuralBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* DOSSIER HEADER - ULTRA HD CONTRAST */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 50) + 20 }]}>
          <LinearGradient
            colors={['rgba(255, 0, 60, 0.2)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity 
            style={{ position: 'absolute', top: Math.max(insets.top, 40) + 15, left: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center' }} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.crimson} />
            <Text style={{ color: COLORS.crimson, fontWeight: 'bold', letterSpacing: 1 }}>VOLVER</Text>
          </TouchableOpacity>

          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{patient?.full_name[0].toUpperCase()}</Text>
            </View>
            <View style={[styles.skullBadge, SHADOWS.crimson]}>
              <Ionicons name="skull" size={24} color={COLORS.white} />
            </View>
          </View>
          
          <Text style={styles.subjectName} adjustsFontSizeToFit numberOfLines={2}>
            {patient?.full_name.toUpperCase()}
          </Text>
          <View style={styles.idContainer}>
            <Text style={styles.idText}>EXPEDIENTE_ID: {id?.toUpperCase()}</Text>
          </View>

          <View style={styles.tagRow}>
            <DossierTag label={patient?.insurance} icon="shield-checkmark" color={COLORS.sky} />
            <DossierTag label={patient?.sex === 'M' ? 'GENOTIPO XY' : 'GENOTIPO XX'} icon="male-female" color={COLORS.pink} />
            <DossierTag label={`${patient?.age} AÑOS`} icon="calendar" color={COLORS.poison} />
          </View>
        </View>

        <View style={styles.content}>
          
          {/* PRIMARY DIAGNOSTIC HUD */}
          <View style={styles.consoleRow}>
            <ConsoleCard 
              label="IMC SISTEMA" 
              value={latest?.bmi || '--'} 
              status={latest?.bmi_status?.toUpperCase() || 'SIN ESCANEO'} 
              color={COLORS.crimson}
            />
            <ConsoleCard 
              label="MASA GRASA" 
              value={`${latest?.fat_percent || '--'}%`} 
              status={`${latest?.fat_mass_kg || '--'} KG`} 
              color={COLORS.poison}
            />
          </View>

          {/* EVOLUTION TELEMETRY */}
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Ionicons name="pulse" size={20} color={COLORS.crimson} />
              <Text style={styles.panelTitle}>EVOLUCIÓN BIOMÉTRICA (KG)</Text>
            </View>
            {records.length > 1 ? (
              <LineChart
                data={weightData}
                width={SCREEN_WIDTH - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={true}
                segments={5}
              />
            ) : (
              <View style={styles.noData}>
                <Ionicons name="alert-circle" size={50} color={COLORS.muted} />
                <Text style={styles.noDataText}>SIN DATOS DE EVOLUCIÓN</Text>
              </View>
            )}
          </View>

          {/* HUD ACTION GRID */}
          <View style={styles.actionGrid}>
            <CyberButton 
              title="NUEVO ESCANEO"
              icon={<Ionicons name="scan" size={24} color={COLORS.crimson} />}
              color={COLORS.crimson}
              onPress={() => router.push({ pathname: '/(app)/calculator', params: { patientId: id } })}
            />
            <CyberButton 
              title="PLAN DIETÉTICO"
              icon={<Ionicons name="restaurant" size={24} color={COLORS.pink} />}
              color={COLORS.pink}
              onPress={() => router.push({
                pathname: '/(app)/meal-plan/new',
                params: { 
                  patientId: id,
                  kcal: latest?.tdee_kcal || 2000,
                  prot: (latest?.tdee_kcal || 2000) * (latest?.macro_prot_pct || 15) / 100 / 4,
                  cho: (latest?.tdee_kcal || 2000) * (latest?.macro_cho_pct || 55) / 100 / 4,
                  fat: (latest?.tdee_kcal || 2000) * (latest?.macro_fat_pct || 30) / 100 / 9,
                }
              })}
            />
            <CyberButton 
              title="BIOQUÍMICA"
              icon={<Ionicons name="flask" size={24} color={COLORS.sky} />}
              color={COLORS.sky}
              onPress={() => router.push({ pathname: '/(app)/biochemical/new' as any, params: { patientId: id } })}
            />
            <CyberButton 
              title="HÁBITOS & LIFESTYLE"
              icon={<Ionicons name="body" size={24} color={COLORS.gold} />}
              color={COLORS.gold}
              onPress={() => router.push({ pathname: '/(app)/lifestyle/new' as any, params: { patientId: id } })}
            />
            
            {records.length > 0 && (
              <CyberButton 
                title="GENERAR DOSSIER PDF"
                icon={<Ionicons name="document-text" size={24} color={COLORS.neon} />}
                color={COLORS.neon}
                onPress={handleGeneratePDF}
                style={{ marginTop: 20 }}
              />
            )}
          </View>

          {/* MEAL PLANS SECTION */}
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Ionicons name="restaurant" size={20} color={COLORS.pink} />
              <Text style={[styles.panelTitle, { color: COLORS.pink }]}>PROTOCOLOS DIETÉTICOS ACTIVOS</Text>
            </View>
            {mealPlans.length > 0 ? (
              <View style={{ gap: 15 }}>
                {mealPlans.map((plan) => (
                  <TouchableOpacity 
                    key={plan.id} 
                    style={styles.planItem}
                    onPress={() => setSelectedPlan(plan)}
                  >
                    <View style={styles.planInfo}>
                      <Text style={styles.planTitle}>{plan.title?.toUpperCase() || 'PLAN SIN TÍTULO'}</Text>
                      <Text style={styles.planDate}>{new Date(plan.created_at).toLocaleDateString('es-CL')}</Text>
                    </View>
                    <View style={styles.planStats}>
                      <Text style={styles.planKcal}>{plan.total_kcal || plan.kcal_target} KCAL</Text>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.pink} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noData}>
                <Ionicons name="nutrition" size={50} color={COLORS.dim} />
                <Text style={styles.noDataText}>SIN PLANES ASIGNADOS</Text>
              </View>
            )}
          </View>

          {/* TRANSMISSION HISTORY LOG */}
          <View style={styles.historySection}>
            <Text style={styles.sectionHeader}>LOG CRONOLÓGICO DE TRANSMISIONES</Text>
            <View style={styles.historyList}>
              {records.map((r, i) => (
                <TouchableOpacity key={r.id} style={styles.historyItem}>
                  <View style={styles.historyGlow} />
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{new Date(r.record_date!).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).toUpperCase()}</Text>
                    <View style={[styles.statusDot, { backgroundColor: i === 0 ? COLORS.crimson : COLORS.dim }]} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historySummary}>IMC: {r.bmi} // {r.bmi_status?.toUpperCase()}</Text>
                    <Text style={styles.historySub}>PESO: {r.weight_kg}KG</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>

        {/* MODAL PARA DETALLE DEL PLAN */}
        <Modal
          visible={!!selectedPlan}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPlan(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>DETALLE DEL PROTOCOLO</Text>
                <TouchableOpacity onPress={() => setSelectedPlan(null)}>
                  <Ionicons name="close" size={28} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              
              {selectedPlan && (
                <ScrollView style={{ padding: 20 }}>
                  <Text style={styles.detailLabel}>PLAN: {selectedPlan.title?.toUpperCase()}</Text>
                  <View style={styles.detailStats}>
                    <DetailStat label="KCAL" val={selectedPlan.total_kcal || selectedPlan.kcal_target} color={COLORS.neon} />
                    <DetailStat label="PROT" val={`${selectedPlan.prot_g || selectedPlan.protein_target}g`} color={COLORS.pink} />
                    <DetailStat label="CHO" val={`${selectedPlan.cho_g || selectedPlan.cho_target}g`} color={COLORS.sky} />
                    <DetailStat label="FAT" val={`${selectedPlan.fat_g || selectedPlan.fat_target}g`} color={COLORS.gold} />
                  </View>

                  <Text style={[styles.detailLabel, { marginTop: 25 }]}>DISTRIBUCIÓN DE PORCIONES:</Text>
                  <View style={styles.portionsGrid}>
                    {selectedPlan.portions && Object.entries(selectedPlan.portions).map(([k, v]: any) => (
                      v > 0 && (
                        <View key={k} style={styles.portionRow}>
                          <Text style={styles.portionName}>{k.replace(/_/g, ' ').toUpperCase()}</Text>
                          <Text style={styles.portionVal}>{v}</Text>
                        </View>
                      )
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

      </ScrollView>
    </NeuralBackground>
  );
}

function DetailStat({ label, val, color }: any) {
  return (
    <View style={styles.detailBox}>
      <Text style={styles.detailBoxLabel}>{label}</Text>
      <Text style={[styles.detailBoxVal, { color }]}>{val}</Text>
    </View>
  );
}

function DossierTag({ label, icon, color }: any) {
  return (
    <View style={[styles.dTag, { borderColor: color }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.dTagText, { color }]}>{label?.toUpperCase()}</Text>
    </View>
  );
}

function ConsoleCard({ label, value, status, color }: any) {
  return (
    <View style={[styles.consoleCard, { borderLeftColor: color }]}>
      <Text style={styles.consoleLabel}>{label}</Text>
      <Text style={[styles.consoleValue, { color }]}>{value}</Text>
      <Text style={styles.consoleStatus}>{status}</Text>
    </View>
  );
}

const chartConfig = {
  backgroundColor: '#0a0a0d',
  backgroundGradientFrom: '#0a0a0d',
  backgroundGradientTo: '#1a1a24',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(255, 0, 60, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.9})`,
  style: { borderRadius: 0 },
  propsForDots: { r: "6", strokeWidth: "3", stroke: COLORS.bg },
  propsForBackgroundLines: { stroke: '#333', strokeDasharray: "" }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, gap: 30 },
  loadingText: { color: COLORS.orange, fontSize: 18, fontWeight: '900', letterSpacing: 5, fontFamily: FONTS.horror },
  header: { 
    padding: 45, 
    alignItems: 'center', 
    backgroundColor: 'rgba(5,5,10,0.96)', 
    borderBottomWidth: 3, 
    borderBottomColor: COLORS.purple,
    shadowColor: COLORS.purple,
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  avatarWrapper: { position: 'relative', marginBottom: 35 },
  avatar: { 
    width: 130, 
    height: 130, 
    borderRadius: 0, 
    backgroundColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: COLORS.neon, 
    shadowColor: COLORS.neon,
    shadowOpacity: 0.4,
    shadowRadius: 15
  },
  avatarLetter: { fontSize: 72, fontFamily: FONTS.horror, color: COLORS.neon },
  skullBadge: { 
    position: 'absolute', 
    bottom: -18, 
    right: -18, 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: COLORS.crimson, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: COLORS.crimson,
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10
  },
  subjectName: { 
    fontSize: 48, 
    fontFamily: FONTS.horror, 
    color: COLORS.white, 
    textAlign: 'center', 
    letterSpacing: 4, 
    textShadowColor: COLORS.purple, 
    textShadowRadius: 15 
  },
  idContainer: { 
    backgroundColor: 'rgba(157,0,255,0.08)', 
    paddingHorizontal: 25, 
    paddingVertical: 10, 
    marginTop: 20, 
    borderWidth: 2, 
    borderColor: COLORS.purple 
  },
  idText: { color: COLORS.bone, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  tagRow: { flexDirection: 'row', gap: 18, marginTop: 45, flexWrap: 'wrap', justifyContent: 'center' },
  dTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingHorizontal: 18, 
    paddingVertical: 12, 
    borderWidth: 2, 
    backgroundColor: '#000' 
  },
  dTagText: { fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 30, gap: 45 },
  consoleRow: { flexDirection: 'row', gap: 20 },
  consoleCard: { 
    flex: 1, 
    backgroundColor: COLORS.bg2, 
    padding: 25, 
    borderLeftWidth: 8, 
    borderWidth: 2, 
    borderColor: COLORS.dim,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10
  },
  consoleLabel: { fontSize: 11, fontWeight: '900', color: COLORS.muted, marginBottom: 15, letterSpacing: 2, textTransform: 'uppercase' },
  consoleValue: { fontSize: 36, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: COLORS.white },
  consoleStatus: { fontSize: 13, color: COLORS.bone, fontWeight: '900', marginTop: 12, textTransform: 'uppercase' },
  panel: { 
    backgroundColor: 'rgba(10,10,15,0.7)', 
    padding: 20, 
    borderWidth: 1.5, 
    borderColor: COLORS.purple, 
    borderRadius: 8,
    shadowColor: COLORS.purple,
    shadowOpacity: 0.3,
    shadowRadius: 15
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 },
  panelTitle: { fontSize: 16, fontWeight: '900', color: COLORS.orange, letterSpacing: 3, fontFamily: FONTS.horror },
  chart: { marginVertical: 20, borderRadius: 0 },
  noData: { 
    height: 180, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderStyle: 'dashed', 
    borderWidth: 3, 
    borderColor: COLORS.dim, 
    gap: 20 
  },
  noDataText: { color: COLORS.muted, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  actionGrid: { flexDirection: 'column', gap: 15 },
  historySection: { gap: 25, marginBottom: 80 },
  sectionHeader: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: COLORS.white, 
    letterSpacing: 3, 
    borderBottomWidth: 3, 
    borderBottomColor: COLORS.purple, 
    paddingBottom: 15,
    fontFamily: FONTS.horror
  },
  historyList: { gap: 15 },
  historyItem: { backgroundColor: 'rgba(10,10,15,0.7)', borderWidth: 1, borderColor: COLORS.dim, borderRadius: 8, padding: 15, position: 'relative', overflow: 'hidden' },
  historyGlow: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: COLORS.dim },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyDate: { color: COLORS.purple, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  historyInfo: { paddingRight: 30 },
  historySummary: { color: COLORS.white, fontSize: 13, fontWeight: 'bold', fontFamily: FONTS.space, letterSpacing: 1 },
  historySub: { color: COLORS.dim, fontSize: 11, fontWeight: '900', marginTop: 4 },

  // Estilos para Planes Dietéticos
  planItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#000', 
    padding: 20, 
    borderWidth: 1, 
    borderColor: COLORS.dim,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.pink
  },
  planInfo: { flex: 1 },
  planTitle: { color: COLORS.white, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  planDate: { color: COLORS.muted, fontSize: 11, marginTop: 5 },
  planStats: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planKcal: { color: COLORS.pink, fontSize: 16, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  // Estilos Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.bg2, borderWidth: 3, borderColor: COLORS.purple, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.bg1, borderBottomWidth: 2, borderBottomColor: COLORS.purple },
  modalTitle: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 20, letterSpacing: 2 },
  detailLabel: { color: COLORS.purple, fontWeight: '900', fontSize: 12, letterSpacing: 2, marginBottom: 15 },
  detailStats: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  detailBox: { flex: 1, backgroundColor: '#000', padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.dim },
  detailBoxLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '900', marginBottom: 5 },
  detailBoxVal: { fontSize: 14, fontWeight: 'bold' },
  portionsGrid: { gap: 10 },
  portionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  portionName: { color: COLORS.bone, fontSize: 11, fontWeight: '800' },
  portionVal: { color: COLORS.neon, fontSize: 13, fontWeight: '900' },
});
