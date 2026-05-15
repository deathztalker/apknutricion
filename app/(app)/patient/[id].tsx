import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../../../constants/theme';
import { patientService, recordService } from '../../../lib/supabase';
import { Patient, ClinicalRecord } from '../../../types';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TerminalBackground from '../../../components/TerminalBackground';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PatientProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          patientService.getById(id),
          recordService.getByPatient(id, 10)
        ]);
        if (pRes.error) throw pRes.error;
        if (rRes.error) throw rRes.error;
        setPatient(pRes.data);
        setRecords(rRes.data || []);
      } catch (error) {
        console.error('Error fetching patient profile:', error);
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
      </View>
    );
  }

  const latestRecord = records[0];
  const chartData = {
    labels: records.length > 0 
      ? records.slice(0, 5).reverse().map(r => new Date(r.record_date!).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }))
      : [],
    datasets: [{
      data: records.length > 0 
        ? records.slice(0, 5).reverse().map(r => r.weight_kg || 0)
        : [0],
      color: () => COLORS.crimson,
      strokeWidth: 3
    }]
  };

  return (
    <TerminalBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{patient?.full_name[0].toUpperCase()}</Text>
            </View>
            <Ionicons name="skull" size={24} color={COLORS.crimson} style={styles.headerSkull} />
          </View>
          
          <Text style={styles.name}>{patient?.full_name.toUpperCase()}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>DOSSIER ID: {id?.substring(0, 12).toUpperCase()}</Text>
          </View>
          
          <View style={styles.headerInfoRow}>
            <InfoTag icon="shield-checkmark" text={patient?.insurance || 'UNINSURED'} color={COLORS.pink} />
            <InfoTag icon="male-female" text={patient?.sex === 'M' ? 'GENOTYPE XY' : 'GENOTYPE XX'} color={COLORS.purple} />
            <InfoTag icon="calendar" text={`${patient?.age} YEARS`} color={COLORS.bone} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Biometric Panels */}
          <View style={styles.panelRow}>
            <DiagnosticPanel 
              label="IMC INDEX" 
              value={latestRecord?.bmi || 'N/A'} 
              subValue={latestRecord?.bmi_status?.toUpperCase() || 'NO SCAN'} 
              color={COLORS.crimson}
              icon="fitness"
            />
            <DiagnosticPanel 
              label="FAT MASS" 
              value={`${latestRecord?.fat_percent || '0'}%`} 
              subValue={`${latestRecord?.fat_mass_kg || '0'} KG`} 
              color={COLORS.poison}
              icon="body"
            />
          </View>

          {/* Functional Telemetry */}
          {(latestRecord?.grip_strength_kg || latestRecord?.mna_score || latestRecord?.vgs_status) && (
            <View style={styles.telemetryBox}>
              <Text style={styles.panelTitle}>NEURAL TELEMETRY</Text>
              <View style={styles.statsRow}>
                {latestRecord?.grip_strength_kg && (
                  <StatMini label="GRIP" value={`${latestRecord.grip_strength_kg}KG`} color={COLORS.purple} />
                )}
                {latestRecord?.mna_score !== undefined && (
                  <StatMini label="MNA" value={latestRecord.mna_score} color={COLORS.gold} />
                )}
                {latestRecord?.vgs_status && (
                  <StatMini label="VGS" value={latestRecord.vgs_status} color={COLORS.sky} />
                )}
              </View>
            </View>
          )}

          {/* Biometric Trend Graph */}
          <View style={styles.graphPanel}>
            <Text style={styles.panelTitle}>WEIGHT EVOLUTION (KG)</Text>
            {records.length > 1 ? (
              <LineChart
                data={chartData}
                width={SCREEN_WIDTH - 40}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
              />
            ) : (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>INSUFFICIENT TELEMETRY DATA</Text>
              </View>
            )}
          </View>

          {/* Command Hub */}
          <View style={styles.actionHub}>
            <Text style={styles.panelTitle}>COMMAND CENTER</Text>
            
            <HubButton 
              label="NEW EVALUATION" 
              sub="INITIATE BIOMETRIC OVERRIDE" 
              icon="add-circle" 
              color={COLORS.crimson}
              onPress={() => router.push({ pathname: '/calculator', params: { patientId: id } })}
            />

            <HubButton 
              label="BIOCHEMICAL TERMINAL" 
              sub="ACCESS LABORATORY RECORDS" 
              icon="flask" 
              color={COLORS.purple}
              onPress={() => router.push(`/(app)/patient/${id}/labs`)}
            />
            
            <HubButton 
              label="MEAL PLAN BUILDER" 
              sub="DISTRIBUTE SYSTEM RESOURCES" 
              icon="document-text" 
              color={COLORS.pink}
              onPress={() => router.push({
                pathname: '/(app)/meal-plan/new',
                params: { 
                  patientId: id,
                  kcal: latestRecord?.tdee_kcal || 2000,
                  prot: (latestRecord?.tdee_kcal || 2000) * (latestRecord?.macro_prot_pct || 15) / 100 / 4,
                  cho: (latestRecord?.tdee_kcal || 2000) * (latestRecord?.macro_cho_pct || 55) / 100 / 4,
                  fat: (latestRecord?.tdee_kcal || 2000) * (latestRecord?.macro_fat_pct || 30) / 100 / 9,
                }
              })}
            />
          </View>

          {/* Subject History */}
          <View style={styles.historyLog}>
            <Text style={styles.panelTitle}>TRANSMISSION HISTORY</Text>
            {records.map((record, index) => (
              <TouchableOpacity key={record.id} style={styles.historyItem}>
                <View style={styles.historyPointer} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>
                    {new Date(record.record_date!).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                  </Text>
                  <Text style={styles.historySummary}>BMI: {record.bmi} | {record.weight_kg}KG | {record.bmi_status}</Text>
                </View>
                <Ionicons name="pulse" size={18} color={COLORS.dim} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </TerminalBackground>
  );
}

function InfoTag({ icon, text, color }: any) {
  return (
    <View style={[styles.infoTag, { borderColor: color }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.infoTagText, { color }]}>{text}</Text>
    </View>
  );
}

function DiagnosticPanel({ label, value, subValue, color, icon }: any) {
  return (
    <View style={[styles.diagPanel, { borderLeftColor: color }]}>
      <View style={styles.diagHeader}>
        <Text style={styles.diagLabel}>{label}</Text>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.diagValue, { color }]}>{value}</Text>
      <Text style={styles.diagSubValue}>{subValue}</Text>
    </View>
  );
}

function StatMini({ label, value, color }: any) {
  return (
    <View style={[styles.statMini, { borderColor: color }]}>
      <Text style={styles.statMiniLabel}>{label}</Text>
      <Text style={[styles.statMiniValue, { color }]}>{value}</Text>
    </View>
  );
}

function HubButton({ label, sub, icon, color, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.hubButton, { borderColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={color} />
      <View>
        <Text style={[styles.hubButtonText, { color }]}>{label}</Text>
        <Text style={styles.hubButtonSub}>{sub}</Text>
      </View>
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
  header: { padding: 30, paddingTop: Platform.OS === 'ios' ? 40 : 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderBottomWidth: 1, borderBottomColor: '#222' },
  avatarContainer: { position: 'relative', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 0, backgroundColor: '#0a0a0d', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.crimson, ...SHADOWS.crimson },
  avatarText: { fontSize: 48, fontFamily: FONTS.horror, color: COLORS.crimson },
  headerSkull: { position: 'absolute', bottom: -10, right: -10, ...SHADOWS.crimson },
  name: { fontSize: 36, fontFamily: FONTS.horror, color: COLORS.white, textAlign: 'center', letterSpacing: 2 },
  idBadge: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 4, marginTop: 10, borderWidth: 1, borderColor: '#222' },
  idText: { color: COLORS.dim, fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  headerInfoRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 25 },
  infoTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, backgroundColor: '#000' },
  infoTagText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  content: { padding: 20, gap: 25 },
  panelRow: { flexDirection: 'row', gap: 15 },
  diagPanel: { flex: 1, backgroundColor: '#0a0a0d', padding: 15, borderLeftWidth: 4, borderWidth: 1, borderColor: '#1a1a1f' },
  diagHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  diagLabel: { fontSize: 9, fontWeight: 'bold', color: COLORS.dim, letterSpacing: 1 },
  diagValue: { fontSize: 24, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  diagSubValue: { fontSize: 9, color: COLORS.muted, marginTop: 4, fontWeight: 'bold' },
  telemetryBox: { backgroundColor: 'rgba(102, 0, 204, 0.03)', padding: 20, borderWidth: 1, borderColor: 'rgba(102, 0, 204, 0.2)', gap: 15 },
  panelTitle: { fontSize: 11, fontWeight: 'bold', color: COLORS.dim, letterSpacing: 2, marginBottom: 5 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statMini: { flex: 1, padding: 12, borderWidth: 1, alignItems: 'center', backgroundColor: '#000' },
  statMiniLabel: { fontSize: 8, color: COLORS.dim, marginBottom: 5 },
  statMiniValue: { fontSize: 16, fontWeight: 'bold' },
  graphPanel: { backgroundColor: '#0a0a0d', padding: 15, borderWidth: 1, borderColor: '#1a1a1f' },
  chart: { marginVertical: 10 },
  noDataCard: { height: 120, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#222' },
  noDataText: { color: COLORS.dim, fontSize: 9, fontWeight: 'bold' },
  actionHub: { gap: 12 },
  hubButton: { backgroundColor: '#0a0a0d', height: 75, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 18, borderWidth: 1 },
  hubButtonText: { fontSize: 18, fontFamily: FONTS.horror, letterSpacing: 1 },
  hubButtonSub: { fontSize: 9, color: COLORS.dim, fontWeight: 'bold', letterSpacing: 1 },
  historyLog: { gap: 15, marginBottom: 40 },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 18, borderWidth: 1, borderColor: '#1a1a1f', gap: 15 },
  historyPointer: { width: 3, height: '100%', backgroundColor: COLORS.crimson },
  historyDate: { fontSize: 10, color: COLORS.muted, fontWeight: 'bold' },
  historySummary: { fontSize: 11, color: COLORS.dim, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
});
