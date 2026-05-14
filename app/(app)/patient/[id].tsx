import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../../../constants/theme';
import { patientService, recordService } from '../../../lib/supabase';
import { Patient, ClinicalRecord } from '../../../types';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
        <ActivityIndicator size="large" color={COLORS.neon} />
      </View>
    );
  }

  const latestRecord = records[0];
  const chartData = {
    labels: records.slice(0, 5).reverse().map(r => new Date(r.record_date!).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })),
    datasets: [{
      data: records.slice(0, 5).reverse().map(r => r.weight_kg || 0),
      color: () => COLORS.neon,
      strokeWidth: 2
    }]
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={[COLORS.bg1, COLORS.bg]} style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{patient?.full_name[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{patient?.full_name.toUpperCase()}</Text>
        <Text style={styles.subtitle}>{patient?.insurance} • {patient?.sex === 'M' ? 'MASCULINO' : 'FEMENINO'}</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>LATEST IMC</Text>
            <Text style={[styles.statValue, { color: COLORS.neon }]}>{latestRecord?.bmi || '—'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>LAST WEIGHT</Text>
            <Text style={styles.statValue}>{latestRecord?.weight_kg || '—'} KG</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>% GRASA</Text>
            <Text style={[styles.statValue, { color: COLORS.pink }]}>{latestRecord?.fat_percent || '—'}%</Text>
          </View>
        </View>

        {/* Functional Stats (Overhaul V2/V3) */}
        {(latestRecord?.grip_strength_kg || latestRecord?.mna_score || latestRecord?.vgs_status) && (
          <View style={styles.statsRow}>
            {latestRecord?.grip_strength_kg && (
              <View style={[styles.statCard, { borderColor: COLORS.purple }]}>
                <Text style={styles.statLabel}>GRIP STRENGTH</Text>
                <Text style={[styles.statValue, { color: COLORS.purple }]}>{latestRecord.grip_strength_kg} KG</Text>
              </View>
            )}
            {latestRecord?.mna_score !== undefined && (
              <View style={[styles.statCard, { borderColor: COLORS.gold }]}>
                <Text style={styles.statLabel}>MNA SCORE</Text>
                <Text style={[styles.statValue, { color: COLORS.gold }]}>{latestRecord.mna_score}</Text>
              </View>
            )}
            {latestRecord?.vgs_status && (
              <View style={[styles.statCard, { borderColor: COLORS.sky }]}>
                <Text style={styles.statLabel}>VGS STATUS</Text>
                <Text style={[styles.statValue, { color: COLORS.sky }]}>{latestRecord.vgs_status}</Text>
              </View>
            )}
          </View>
        )}

        {/* Weight Trend Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WEIGHT EVOLUTION</Text>
          {records.length > 1 ? (
            <LineChart
              data={chartData}
              width={SCREEN_WIDTH - 40}
              height={220}
              chartConfig={{
                backgroundColor: COLORS.bgCard,
                backgroundGradientFrom: COLORS.bg1,
                backgroundGradientTo: COLORS.bg,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(226, 226, 222, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "6", strokeWidth: "2", stroke: COLORS.bg }
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.noDataCard}>
              <Text style={styles.noDataText}>NOT ENOUGH DATA FOR TRENDS</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push({ pathname: '/calculator', params: { patientId: id } })}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.neon} />
            <Text style={styles.actionButtonText}>NEW EVALUATION</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: COLORS.purple }]}
            onPress={() => router.push(`/(app)/patient/${id}/labs`)}
          >
            <Ionicons name="flask" size={24} color={COLORS.purple} />
            <Text style={[styles.actionButtonText, { color: COLORS.purple }]}>BIOCHEMICAL TERMINAL</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
            <Ionicons name="document-text" size={24} color={COLORS.pink} />
            <Text style={[styles.actionButtonText, { color: COLORS.pink }]}>CREATE MEAL PLAN</Text>
          </TouchableOpacity>
        </View>

        {/* History List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECORD HISTORY</Text>
          {records.map((record, index) => (
            <View key={record.id} style={styles.historyItem}>
              <View>
                <Text style={styles.historyDate}>
                  {new Date(record.record_date!).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
                <Text style={styles.historySummary}>IMC: {record.bmi} • {record.weight_kg} kg</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.neon} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    padding: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.neon,
    ...SHADOWS.neon,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: FONTS.horror,
    color: COLORS.neon,
  },
  name: {
    fontSize: 32,
    fontFamily: FONTS.horror,
    color: COLORS.neon,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: COLORS.neon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.pink,
    marginTop: 8,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    gap: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.muted,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: FONTS.horror,
    color: COLORS.pink,
    letterSpacing: 1,
    textShadowColor: COLORS.pink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noDataCard: {
    height: 150,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noDataText: {
    color: COLORS.dim,
    fontWeight: 'bold',
    fontFamily: FONTS.horror,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.neon,
    ...SHADOWS.neon,
    shadowOpacity: 0.1,
  },
  actionButtonText: {
    color: COLORS.neon,
    fontSize: 18,
    fontFamily: FONTS.horror,
    letterSpacing: 1,
  },
  secondaryAction: {
    borderColor: COLORS.pink,
    ...SHADOWS.pink,
    shadowOpacity: 0.1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  historySummary: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
});
