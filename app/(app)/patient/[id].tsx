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
              onPress={() => router.push({ pathname: '/calculator', params: { patientId: id } })}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, gap: 30 },
  loadingText: { color: COLORS.orange, fontSize: 18, fontWeight: '900', letterSpacing: 5, fontFamily: FONTS.horror },
  header: { 
    padding: 45, 
    paddingTop: Platform.OS === 'ios' ? 80 : 50, 
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
    backgroundColor: COLORS.bg2, 
    padding: 30, 
    borderWidth: 2, 
    borderColor: COLORS.dim, 
    borderRadius: 0,
    shadowColor: '#000',
    shadowOpacity: 0.4,
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
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  actBtn: { 
    width: '46.5%', 
    height: 110, 
    backgroundColor: '#000', 
    borderWidth: 3, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  actBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 1.5, fontFamily: FONTS.horror },
  actBtnSub: { fontSize: 9, color: COLORS.muted, fontWeight: '900', marginTop: 5, textTransform: 'uppercase' },
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
  historyItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.bg2, 
    padding: 30, 
    borderWidth: 2, 
    borderColor: COLORS.dim, 
    gap: 25,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10
  },
  historyIndicator: { width: 8, height: '100%', borderRadius: 0 },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 15, color: COLORS.white, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  historySummary: { fontSize: 14, color: COLORS.muted, fontWeight: '800' },
});
