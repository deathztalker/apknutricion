import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../../../constants/theme';
import { patientService, recordService } from '../../../lib/supabase';
import { Patient, ClinicalRecord } from '../../../types';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TerminalBackground from '../../../components/TerminalBackground';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PatientDossier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          patientService.getById(id),
          recordService.getByPatient(id, 20)
        ]);
        if (pRes.error) throw pRes.error;
        if (rRes.error) throw rRes.error;
        setPatient(pRes.data);
        setRecords(rRes.data || []);
      } catch (error) {
        console.error('Error fetching dossier:', error);
        Alert.alert("ACCESO DENEGADO", "No se pudo recuperar el expediente del núcleo.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
    <TerminalBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* DOSSIER HEADER - ULTRA HD CONTRAST */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(255, 0, 60, 0.2)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{patient?.full_name[0].toUpperCase()}</Text>
            </View>
            <View style={[styles.skullBadge, SHADOWS.crimson]}>
              <Ionicons name="skull" size={24} color={COLORS.white} />
            </View>
          </View>
          
          <Text style={styles.subjectName}>{patient?.full_name.toUpperCase()}</Text>
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
                <Ionicons name="alert-circle" size={50} color={COLORS.dim} />
                <Text style={styles.noDataText}>SIN DATOS DE EVOLUCIÓN</Text>
              </View>
            )}
          </View>

          {/* HUD ACTION GRID */}
          <View style={styles.actionGrid}>
            <ActionButton 
              label="NUEVO ESCANEO" 
              sub="OVERRIDE BIOMÉTRICO"
              icon="scan" 
              color={COLORS.crimson}
              onPress={() => router.push({ pathname: '/(app)/calculator', params: { patientId: id } })}
            />
            <ActionButton 
              label="PLAN DIETÉTICO" 
              sub="ASIGNACIÓN RECURSOS"
              icon="restaurant" 
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
            <ActionButton 
              label="BIOQUÍMICA" 
              sub="TERMINAL LABS"
              icon="flask" 
              color={COLORS.purple}
              onPress={() => router.push(`/(app)/patient/${id}/labs`)}
            />
            <ActionButton 
              label="ARCHIVO PDF" 
              sub="DOSS. EXPORTACIÓN"
              icon="document-attach" 
              color={COLORS.bone}
              onPress={() => Alert.alert("SISTEMA", "Generando dossier técnico...")}
            />
          </View>

          {/* TRANSMISSION HISTORY LOG */}
          <View style={styles.historySection}>
            <Text style={styles.sectionHeader}>LOG CRONOLÓGICO DE TRANSMISIONES</Text>
            {records.map((r, i) => (
              <TouchableOpacity key={r.id} style={styles.historyItem}>
                <View style={[styles.historyIndicator, { backgroundColor: i === 0 ? COLORS.crimson : '#555' }]} />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDate}>{new Date(r.record_date!).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</Text>
                  <Text style={styles.historySummary}>NÚCLEO: {r.bmi} IMC | {r.weight_kg}KG | {r.bmi_status}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.crimson} />
              </TouchableOpacity>
            ))}
          </View>

        </View>
      </ScrollView>
    </TerminalBackground>
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

function ActionButton({ label, sub, icon, color, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.actBtn, { borderColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={30} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.actBtnText, { color }]}>{label}</Text>
        <Text style={styles.actBtnSub}>{sub}</Text>
      </View>
    </TouchableOpacity>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, gap: 25 },
  loadingText: { color: COLORS.crimson, fontSize: 16, fontWeight: '900', letterSpacing: 4 },
  header: { padding: 40, paddingTop: Platform.OS === 'ios' ? 70 : 40, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', borderBottomWidth: 2, borderBottomColor: '#222' },
  avatarWrapper: { position: 'relative', marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 0, backgroundColor: '#0f0f16', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.crimson, ...SHADOWS.crimson },
  avatarLetter: { fontSize: 64, fontFamily: FONTS.horror, color: COLORS.crimson },
  skullBadge: { position: 'absolute', bottom: -15, right: -15, width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.crimson, justifyContent: 'center', alignItems: 'center', ...SHADOWS.crimson },
  subjectName: { fontSize: 42, fontFamily: FONTS.horror, color: COLORS.white, textAlign: 'center', letterSpacing: 3, textShadowColor: '#000', textShadowRadius: 10 },
  idContainer: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 20, paddingVertical: 8, marginTop: 15, borderWidth: 1, borderColor: '#555' },
  idText: { color: COLORS.bone, fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
  tagRow: { flexDirection: 'row', gap: 15, marginTop: 40, flexWrap: 'wrap', justifyContent: 'center' },
  dTag: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, paddingVertical: 10, borderWidth: 2, backgroundColor: '#000' },
  dTagText: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  content: { padding: 25, gap: 40 },
  consoleRow: { flexDirection: 'row', gap: 20 },
  consoleCard: { flex: 1, backgroundColor: '#0f0f16', padding: 25, borderLeftWidth: 6, borderWidth: 1, borderColor: '#333', ...SHADOWS.crimson },
  consoleLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.dim, marginBottom: 15, letterSpacing: 2 },
  consoleValue: { fontSize: 34, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: COLORS.bone },
  consoleStatus: { fontSize: 13, color: COLORS.bone, fontWeight: '900', marginTop: 10 },
  panel: { backgroundColor: '#0f0f16', padding: 25, borderWidth: 1, borderColor: '#333', borderRadius: 2 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25 },
  panelTitle: { fontSize: 14, fontWeight: '900', color: COLORS.bone, letterSpacing: 3 },
  chart: { marginVertical: 15, borderRadius: 0 },
  noData: { height: 150, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#444', gap: 15 },
  noDataText: { color: COLORS.dim, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  actBtn: { width: '47%', height: 100, backgroundColor: '#0f0f16', borderWidth: 2, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 15 },
  actBtnText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  actBtnSub: { fontSize: 9, color: COLORS.dim, fontWeight: 'bold', marginTop: 4 },
  historySection: { gap: 20, marginBottom: 60 },
  sectionHeader: { fontSize: 15, fontWeight: '900', color: COLORS.bone, letterSpacing: 3, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 10 },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f16', padding: 25, borderWidth: 1, borderColor: '#333', gap: 20 },
  historyIndicator: { width: 5, height: '100%', borderRadius: 0 },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 14, color: COLORS.white, fontWeight: '900', marginBottom: 8 },
  historySummary: { fontSize: 14, color: COLORS.muted, fontWeight: 'bold' },
});
