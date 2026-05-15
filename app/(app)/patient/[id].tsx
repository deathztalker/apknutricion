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
        Alert.alert("ERROR DE ACCESO", "No se pudo recuperar el expediente del vacío.");
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
        <Text style={styles.loadingText}>DESCRIPTANDO EXPEDIENTE...</Text>
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
      strokeWidth: 3
    }]
  };

  return (
    <TerminalBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* DOSSIER HEADER */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(220, 20, 60, 0.1)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{patient?.full_name[0].toUpperCase()}</Text>
            </View>
            <View style={styles.skullBadge}>
              <Ionicons name="skull" size={18} color={COLORS.bg} />
            </View>
          </View>
          
          <Text style={styles.subjectName}>{patient?.full_name.toUpperCase()}</Text>
          <View style={styles.idContainer}>
            <Text style={styles.idText}>SUJETO ID: {id?.substring(0, 15).toUpperCase()}</Text>
          </View>

          <View style={styles.tagRow}>
            <DossierTag label={patient?.insurance} icon="shield-checkmark" color={COLORS.purple} />
            <DossierTag label={patient?.sex === 'M' ? 'XY' : 'XX'} icon="male-female" color={COLORS.pink} />
            <DossierTag label={`${patient?.age} AÑOS`} icon="calendar" color={COLORS.poison} />
          </View>
        </View>

        <View style={styles.content}>
          
          {/* PRIMARY DIAGNOSTIC CONSOLE */}
          <View style={styles.consoleRow}>
            <ConsoleCard 
              label="IMC ACTUAL" 
              value={latest?.bmi || '--'} 
              status={latest?.bmi_status?.toUpperCase() || 'SIN DATOS'} 
              color={COLORS.crimson}
            />
            <ConsoleCard 
              label="MASA GRASA" 
              value={`${latest?.fat_percent || '--'}%`} 
              status={`${latest?.fat_mass_kg || '--'} KG`} 
              color={COLORS.poison}
            />
          </View>

          {/* TELEMETRY GRAPH */}
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Ionicons name="stats-chart" size={16} color={COLORS.crimson} />
              <Text style={styles.panelTitle}>EVOLUCIÓN PONDERAL (KG)</Text>
            </View>
            {records.length > 1 ? (
              <LineChart
                data={weightData}
                width={SCREEN_WIDTH - 40}
                height={180}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
              />
            ) : (
              <View style={styles.noData}>
                <Text style={styles.noDataText}>DATOS INSUFICIENTES PARA TELEMETRÍA</Text>
              </View>
            )}
          </View>

          {/* COMMAND ACTIONS */}
          <View style={styles.actionGrid}>
            <ActionButton 
              label="NUEVA EVALUACIÓN" 
              icon="scan-outline" 
              color={COLORS.crimson}
              onPress={() => router.push({ pathname: '/calculator', params: { patientId: id } })}
            />
            <ActionButton 
              label="PLAN ALIMENTICIO" 
              icon="restaurant-outline" 
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
              label="LABORATORIOS" 
              icon="flask-outline" 
              color={COLORS.purple}
              onPress={() => router.push(`/(app)/patient/${id}/labs`)}
            />
            <ActionButton 
              label="BORRAR ARCHIVO" 
              icon="trash-outline" 
              color={COLORS.dim}
              onPress={() => Alert.alert("AVISO", "Solo el administrador del núcleo puede purgar expedientes.")}
            />
          </View>

          {/* CHRONOLOGICAL LOG */}
          <View style={styles.historySection}>
            <Text style={styles.sectionHeader}>LOG CRONOLÓGICO DE TRANSMISIONES</Text>
            {records.map((r, i) => (
              <TouchableOpacity key={r.id} style={styles.historyItem}>
                <View style={[styles.historyIndicator, { backgroundColor: i === 0 ? COLORS.crimson : '#222' }]} />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDate}>{new Date(r.record_date!).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</Text>
                  <Text style={styles.historySummary}>IMC: {r.bmi} | {r.weight_kg}KG | {r.bmi_status}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
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
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.dTagText, { color }]}>{label}</Text>
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

function ActionButton({ label, icon, color, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.actBtn, { borderColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.actBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const chartConfig = {
  backgroundColor: '#0a0a0d',
  backgroundGradientFrom: '#0a0a0d',
  backgroundGradientTo: '#0a0a0d',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(220, 20, 60, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(245, 245, 245, ${opacity * 0.5})`,
  style: { borderRadius: 0 },
  propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.bg }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, gap: 15 },
  loadingText: { color: COLORS.crimson, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  header: { padding: 30, paddingTop: Platform.OS === 'ios' ? 40 : 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderBottomWidth: 1, borderBottomColor: '#1a1a1f' },
  avatarWrapper: { position: 'relative', marginBottom: 20 },
  avatar: { width: 90, height: 90, borderRadius: 0, backgroundColor: '#0a0a0d', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.crimson, ...SHADOWS.crimson },
  avatarLetter: { fontSize: 44, fontFamily: FONTS.horror, color: COLORS.crimson },
  skullBadge: { position: 'absolute', bottom: -5, right: -5, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.crimson, justifyContent: 'center', alignItems: 'center' },
  subjectName: { fontSize: 32, fontFamily: FONTS.horror, color: COLORS.white, textAlign: 'center', letterSpacing: 1 },
  idContainer: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 4, marginTop: 10, borderWidth: 1, borderColor: '#222' },
  idText: { color: COLORS.dim, fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  tagRow: { flexDirection: 'row', gap: 10, marginTop: 25, flexWrap: 'wrap', justifyContent: 'center' },
  dTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, backgroundColor: '#000' },
  dTagText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  content: { padding: 20, gap: 25 },
  consoleRow: { flexDirection: 'row', gap: 15 },
  consoleCard: { flex: 1, backgroundColor: '#0a0a0d', padding: 15, borderLeftWidth: 4, borderWidth: 1, borderColor: '#1a1a1f' },
  consoleLabel: { fontSize: 8, fontWeight: 'bold', color: COLORS.dim, marginBottom: 10 },
  consoleValue: { fontSize: 24, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  consoleStatus: { fontSize: 9, color: COLORS.muted, fontWeight: 'bold', marginTop: 5 },
  panel: { backgroundColor: '#0a0a0d', padding: 15, borderWidth: 1, borderColor: '#1a1a1f' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  panelTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.muted, letterSpacing: 1 },
  chart: { marginVertical: 10 },
  noData: { height: 100, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#222' },
  noDataText: { color: COLORS.dim, fontSize: 9, fontWeight: 'bold' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actBtn: { width: '48%', height: 70, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  actBtnText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  historySection: { gap: 15, marginBottom: 40 },
  sectionHeader: { fontSize: 11, fontWeight: 'bold', color: COLORS.dim, letterSpacing: 1 },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0d', padding: 15, borderWidth: 1, borderColor: '#1a1a1f', gap: 15 },
  historyIndicator: { width: 3, height: '100%', borderRadius: 2 },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 10, color: COLORS.muted, fontWeight: 'bold' },
  historySummary: { fontSize: 11, color: COLORS.dim, marginTop: 4 },
});
