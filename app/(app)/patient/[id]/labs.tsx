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
      Alert.alert('SINCRONIZACIÓN EXITOSA', 'Telemetría bioquímica inyectada en el núcleo.');
    } catch (error: any) {
      Alert.alert('FALLO DE VÍNCULO', error.message);
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
            <Text style={styles.headerTitle}>TERMINAL BIOQUÍMICO</Text>
            <Text style={styles.headerSub}>ANÁLISIS HISTÓRICO DEL SUJETO</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Glucose Trend */}
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>TENDENCIA DE GLUCOSA (mg/dL)</Text>
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
                <Text style={styles.noDataText}>MÍNIMO 2 REGISTROS REQUERIDOS PARA TELEMETRÍA</Text>
              </View>
            )}
          </View>

          {/* Latest Results Table */}
          <View style={styles.logSection}>
            <Text style={styles.sectionTitle}>ÚLTIMAS REVISIONES DE LABORATORIO</Text>
            {records.map((r) => (
              <View key={r.id} style={styles.labCard}>
                <View style={styles.labHeader}>
                  <Text style={styles.labDate}>{new Date(r.exam_date).toLocaleDateString('es-CL', { dateStyle: 'medium' }).toUpperCase()}</Text>
                  <Ionicons name="shield-checkmark" size={14} color={COLORS.neon} />
                </View>
                <View style={styles.labGrid}>
                  <LabItem label="GLUCOSA" value={r.glucose_mg} unit="mg/dL" />
                  <LabItem label="HbA1c" value={r.hba1c} unit="%" />
                  <LabItem label="COLESTEROL" value={r.total_chol} unit="mg/dL" />
                  <LabItem label="TRIGLICÉRIDOS" value={r.triglycerides} unit="mg/dL" />
                  <LabItem label="ÁC. ÚRICO" value={r.uric_acid} unit="mg/dL" />
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
              <Text style={styles.modalTitle}>INGRESAR DATOS LAB</Text>
              
              <ScrollView contentContainerStyle={{ gap: 15 }} showsVerticalScrollIndicator={false}>
                <LabInput label="GLUCOSA (mg/dL)" value={newLab.glucose_mg} onChange={(v: string) => setNewLab({...newLab, glucose_mg: v})} />
                <LabInput label="HbA1c (%)" value={newLab.hba1c} onChange={(v: string) => setNewLab({...newLab, hba1c: v})} />
                <LabInput label="COL. TOTAL (mg/dL)" value={newLab.total_chol} onChange={(v: string) => setNewLab({...newLab, total_chol: v})} />
                <LabInput label="TRIGLICÉRIDOS (mg/dL)" value={newLab.triglycerides} onChange={(v: string) => setNewLab({...newLab, triglycerides: v})} />
                <LabInput label="ÁCIDO ÚRICO (mg/dL)" value={newLab.uric_acid} onChange={(v: string) => setNewLab({...newLab, uric_acid: v})} />
                <LabInput label="TSH (uUI/mL)" value={newLab.tsh} onChange={(v: string) => setNewLab({...newLab, tsh: v})} />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>ABORTAR</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleAddLab}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.saveButtonText}>SINCRONIZAR</Text>}
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
        placeholderTextColor={COLORS.muted}
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
    padding: 30, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'rgba(5,5,10,0.95)',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.purple,
  },
  headerTitle: { fontSize: 24, fontFamily: FONTS.horror, color: COLORS.white, letterSpacing: 3 },
  headerSub: { fontSize: 11, color: COLORS.purple, letterSpacing: 2, fontWeight: '900', textTransform: 'uppercase' },
  content: { padding: 25, gap: 35 },
  panel: {
    backgroundColor: COLORS.bg2,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.dim,
    borderLeftWidth: 8,
    borderLeftColor: COLORS.neon,
    shadowColor: COLORS.neon,
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  panelTitle: { fontSize: 12, fontWeight: '900', color: COLORS.bone, letterSpacing: 2, marginBottom: 20, textTransform: 'uppercase' },
  chart: { marginVertical: 15 },
  noDataCard: { height: 120, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.dim },
  noDataText: { color: COLORS.muted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
  logSection: { gap: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: COLORS.orange, letterSpacing: 2, fontFamily: FONTS.horror, marginBottom: 10 },
  labCard: { backgroundColor: COLORS.bg2, padding: 20, borderWidth: 2, borderColor: COLORS.dim, gap: 20, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10 },
  labHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.bg4, paddingBottom: 12 },
  labDate: { fontSize: 13, color: COLORS.neon, fontWeight: '900', letterSpacing: 1 },
  labGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  labItem: { width: '45%', gap: 5 },
  labLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  labValue: { fontSize: 18, color: COLORS.white, fontWeight: '900' },
  labUnit: { fontSize: 11, color: COLORS.muted, fontWeight: 'bold' },
  fab: {
    position: 'absolute',
    bottom: 35,
    right: 35,
    width: 75,
    height: 75,
    borderRadius: 0,
    backgroundColor: COLORS.neon,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.neon,
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.98)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalView: { width: '100%', maxWidth: 450, backgroundColor: COLORS.bg1, borderWidth: 3, borderColor: COLORS.neon, padding: 35, gap: 25, shadowColor: COLORS.neon, shadowOpacity: 0.5, shadowRadius: 30 },
  modalTitle: { fontSize: 32, fontFamily: FONTS.horror, color: COLORS.white, textAlign: 'center', letterSpacing: 3 },
  inputContainer: { gap: 10 },
  label: { fontSize: 11, fontWeight: '900', color: COLORS.bone, letterSpacing: 2, textTransform: 'uppercase' },
  input: { backgroundColor: '#000', borderWidth: 2, borderColor: COLORS.dim, padding: 18, color: COLORS.white, fontSize: 18, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  modalActions: { flexDirection: 'row', gap: 20, marginTop: 15 },
  modalButton: { flex: 1, height: 65, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  cancelButton: { borderColor: COLORS.crimson, backgroundColor: 'rgba(255,0,60,0.05)' },
  saveButton: { borderColor: COLORS.neon, backgroundColor: 'rgba(0,255,159,0.05)' },
  cancelButtonText: { color: COLORS.crimson, fontWeight: '900', fontSize: 16, letterSpacing: 2, fontFamily: FONTS.horror },
  saveButtonText: { color: COLORS.neon, fontFamily: FONTS.horror, fontSize: 22, letterSpacing: 2 },
});
