import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Modal, TextInput, Alert, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../../../../constants/theme';
import { biochemicalService } from '../../../../lib/supabase';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TerminalBackground from '../../../../components/TerminalBackground';
import { useAuthStore } from '../../../../store/authStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function LabsTerminal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLab, setNewLab] = useState({
    glucose_mg: '', hba1c: '', total_chol: '', triglycerides: '',
    uric_acid: '', tsh: '', vitamin_d: '',
  });

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

  const handleAddLab = async () => {
    setSaving(true);
    try {
      if (!session?.user) throw new Error('No autorizado');

      const { error } = await biochemicalService.create({
        patient_id: id,
        user_id: session.user.id,
        exam_date: new Date().toISOString(),
        glucose_mg: parseFloat(newLab.glucose_mg) || null,
        hba1c: parseFloat(newLab.hba1c) || null,
        total_chol: parseFloat(newLab.total_chol) || null,
        triglycerides: parseFloat(newLab.triglycerides) || null,
        uric_acid: parseFloat(newLab.uric_acid) || null,
        tsh: parseFloat(newLab.tsh) || null,
        vitamin_d: parseFloat(newLab.vitamin_d) || null,
      });

      if (error) throw error;

      setModalVisible(false);
      setNewLab({
        glucose_mg: '', hba1c: '', total_chol: '', triglycerides: '',
        uric_acid: '', tsh: '', vitamin_d: '',
      });
      fetchLabs();
      Alert.alert('SYNC COMPLETE', 'Biochemical telemetry synchronized.');
    } catch (error: any) {
      Alert.alert('SYNC FAILURE', error.message);
    } finally {
      setSaving(false);
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
    labels: records.length > 0 
      ? records.slice(0, 6).reverse().map(r => new Date(r.exam_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }))
      : [],
    datasets: [{
      data: records.length > 0 
        ? records.slice(0, 6).reverse().map(r => r.glucose_mg || 0)
        : [0],
      color: () => COLORS.neon,
      strokeWidth: 2
    }]
  };

  return (
    <TerminalBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="flask" size={32} color={COLORS.neon} />
          <View>
            <Text style={styles.headerTitle}>BIOCHEMICAL TERMINAL</Text>
            <Text style={styles.headerSub}>SUBJECT HISTORY ANALYSIS</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Glucose Trend */}
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>GLUCOSE TREND (mg/dL)</Text>
            {records.length > 1 ? (
              <LineChart
                data={glucoseData}
                width={SCREEN_WIDTH - 60}
                height={160}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>MINIMUM 2 RECORDS REQUIRED FOR TELEMETRY</Text>
              </View>
            )}
          </View>

          {/* Latest Results Table */}
          <View style={styles.logSection}>
            <Text style={styles.sectionTitle}>LATEST LABORATORY REVIEWS</Text>
            {records.map((r) => (
              <View key={r.id} style={styles.labCard}>
                <View style={styles.labHeader}>
                  <Text style={styles.labDate}>{new Date(r.exam_date).toLocaleDateString('es-CL', { dateStyle: 'medium' }).toUpperCase()}</Text>
                  <Ionicons name="shield-checkmark" size={14} color={COLORS.neon} />
                </View>
                <View style={styles.labGrid}>
                  <LabItem label="GLUCOSE" value={r.glucose_mg} unit="mg/dL" />
                  <LabItem label="HbA1c" value={r.hba1c} unit="%" />
                  <LabItem label="CHOL" value={r.total_chol} unit="mg/dL" />
                  <LabItem label="TRIGL" value={r.triglycerides} unit="mg/dL" />
                  <LabItem label="URIC" value={r.uric_acid} unit="mg/dL" />
                  <LabItem label="TSH" value={r.tsh} unit="uUI/mL" />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={32} color={COLORS.bg} />
        </TouchableOpacity>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>INPUT LAB DATA</Text>
              
              <ScrollView contentContainerStyle={{ gap: 15 }} showsVerticalScrollIndicator={false}>
                <LabInput label="GLUCOSE (mg/dL)" value={newLab.glucose_mg} onChange={(v: string) => setNewLab({...newLab, glucose_mg: v})} />
                <LabInput label="HbA1c (%)" value={newLab.hba1c} onChange={(v: string) => setNewLab({...newLab, hba1c: v})} />
                <LabInput label="COL. TOTAL (mg/dL)" value={newLab.total_chol} onChange={(v: string) => setNewLab({...newLab, total_chol: v})} />
                <LabInput label="TRIGLYCERIDES (mg/dL)" value={newLab.triglycerides} onChange={(v: string) => setNewLab({...newLab, triglycerides: v})} />
                <LabInput label="URIC ACID (mg/dL)" value={newLab.uric_acid} onChange={(v: string) => setNewLab({...newLab, uric_acid: v})} />
                <LabInput label="TSH (uUI/mL)" value={newLab.tsh} onChange={(v: string) => setNewLab({...newLab, tsh: v})} />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>ABORT</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleAddLab}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.saveButtonText}>SYNC</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TerminalBackground>
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

function LabInput({ label, value, onChange }: any) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder="0.0"
        placeholderTextColor={COLORS.dim}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

const chartConfig = {
  backgroundColor: COLORS.bg1,
  backgroundGradientFrom: COLORS.bg1,
  backgroundGradientTo: COLORS.bg1,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(128, 112, 112, ${opacity})`,
  style: { borderRadius: 0 },
  propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.bg }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: { 
    padding: 25, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: { fontSize: 20, fontFamily: FONTS.horror, color: COLORS.white, letterSpacing: 2 },
  headerSub: { fontSize: 9, color: COLORS.pink, letterSpacing: 1, fontWeight: 'bold' },
  content: { padding: 20, gap: 30 },
  panel: {
    backgroundColor: COLORS.bg1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#222',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.neon,
  },
  panelTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.muted, letterSpacing: 2, marginBottom: 15 },
  chart: { marginVertical: 10 },
  noDataCard: { height: 100, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#333' },
  noDataText: { color: COLORS.dim, fontSize: 9, fontWeight: 'bold' },
  logSection: { gap: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.dim, letterSpacing: 1 },
  labCard: { backgroundColor: 'rgba(25, 25, 30, 0.8)', padding: 15, borderWidth: 1, borderColor: '#222', gap: 15 },
  labHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 10 },
  labDate: { fontSize: 11, color: COLORS.neon, fontWeight: 'bold' },
  labGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  labItem: { width: '45%' },
  labLabel: { fontSize: 9, color: COLORS.dim, fontWeight: 'bold', marginBottom: 2 },
  labValue: { fontSize: 14, color: COLORS.white, fontWeight: '900' },
  labUnit: { fontSize: 9, color: COLORS.muted },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 0,
    backgroundColor: COLORS.neon,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.neon,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalView: { width: '100%', maxWidth: 400, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.neon, padding: 25, gap: 20, ...SHADOWS.neon },
  modalTitle: { fontSize: 24, fontFamily: FONTS.horror, color: COLORS.white, textAlign: 'center' },
  inputContainer: { gap: 8 },
  label: { fontSize: 9, fontWeight: 'bold', color: COLORS.muted, letterSpacing: 1 },
  input: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: '#222', padding: 12, color: COLORS.white, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 10 },
  modalButton: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  cancelButton: { borderColor: '#444' },
  saveButton: { borderColor: COLORS.neon, backgroundColor: 'rgba(0,255,136,0.05)' },
  cancelButtonText: { color: '#666', fontWeight: 'bold', letterSpacing: 2 },
  saveButtonText: { color: COLORS.neon, fontFamily: FONTS.horror, fontSize: 20 },
});
