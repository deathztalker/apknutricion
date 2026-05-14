import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, SHADOWS } from '../../../../constants/theme';
import { biochemicalService } from '../../../../lib/supabase';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function LabsTerminal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabs();
  }, [id]);

  const fetchLabs = async () => {
    try {
      const { data, error } = await biochemicalService.getByPatient(id);
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.neon} />
      </View>
    );
  }

  const glucoseData = {
    labels: records.slice(0, 6).reverse().map(r => new Date(r.exam_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })),
    datasets: [{
      data: records.slice(0, 6).reverse().map(r => r.glucose_mg || 0),
      color: () => COLORS.neon,
      strokeWidth: 2
    }]
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={[COLORS.bg1, COLORS.bg]} style={styles.header}>
        <Ionicons name="flask" size={40} color={COLORS.neon} />
        <Text style={styles.title}>BIOCHEMICAL TERMINAL</Text>
        <Text style={styles.subtitle}>Subject History Analysis</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Glucose Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GLUCOSE TREND (mg/dL)</Text>
          {records.length > 1 ? (
            <LineChart
              data={glucoseData}
              width={SCREEN_WIDTH - 40}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.noDataCard}><Text style={styles.noDataText}>MINIMUM 2 RECORDS REQUIRED</Text></View>
          )}
        </View>

        {/* Latest Results Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LATEST LABORATORY REVIEWS</Text>
          {records.map((r) => (
            <View key={r.id} style={styles.labCard}>
              <View style={styles.labHeader}>
                <Text style={styles.labDate}>{new Date(r.exam_date).toLocaleDateString('es-CL', { dateStyle: 'long' })}</Text>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.neon} />
              </View>
              <View style={styles.labGrid}>
                <LabItem label="GLUCOSA" value={r.glucose_mg} unit="mg/dL" />
                <LabItem label="HbA1c" value={r.hba1c} unit="%" />
                <LabItem label="COL. TOTAL" value={r.total_chol} unit="mg/dL" />
                <LabItem label="TRIGLIC." value={r.triglycerides} unit="mg/dL" />
                <LabItem label="ÁC. ÚRICO" value={r.uric_acid} unit="mg/dL" />
                <LabItem label="TSH" value={r.tsh} unit="uUI/mL" />
                <LabItem label="VITAMINA D" value={r.vitamin_d} unit="ng/mL" />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function LabItem({ label, value, unit }: any) {
  return (
    <View style={styles.labItem}>
      <Text style={styles.labLabel}>{label}</Text>
      <Text style={styles.labValue}>{value || '—'} <Text style={styles.labUnit}>{unit}</Text></Text>
    </View>
  );
}

const chartConfig = {
  backgroundColor: COLORS.bg1,
  backgroundGradientFrom: COLORS.bg1,
  backgroundGradientTo: COLORS.bg1,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(163, 255, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(128, 112, 112, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.bg }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: { padding: 40, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.bg4 },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 2, marginTop: 10 },
  subtitle: { fontSize: 12, color: COLORS.pink, textTransform: 'uppercase', letterSpacing: 1 },
  content: { padding: 20, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.dim, letterSpacing: 1 },
  chart: { borderRadius: 16, marginVertical: 8 },
  noDataCard: { height: 100, backgroundColor: COLORS.bg1, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: COLORS.bg4, borderStyle: 'dashed' },
  noDataText: { color: COLORS.dim, fontSize: 10, fontWeight: 'bold' },
  labCard: { backgroundColor: COLORS.bg1, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: COLORS.bg4, gap: 12, marginBottom: 12 },
  labHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 8 },
  labDate: { fontSize: 12, color: COLORS.neon, fontWeight: 'bold' },
  labGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  labItem: { width: '45%' },
  labLabel: { fontSize: 10, color: COLORS.muted, fontWeight: 'bold', marginBottom: 2 },
  labValue: { fontSize: 14, color: COLORS.text, fontWeight: '900' },
  labUnit: { fontSize: 10, color: COLORS.dim },
});
