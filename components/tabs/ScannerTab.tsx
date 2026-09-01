import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';
import CyberInput from '../ui/CyberInput';
import { SectionHeader } from '../ui/LayoutComponents';
import { Patient, RecordFormData } from '../../types';

interface Props {
  patient: Partial<Patient>;
  setPatient: (p: Partial<Patient>) => void;
  form: Partial<RecordFormData>;
  setForm: (f: Partial<RecordFormData>) => void;
}

export default function ScannerTab({ patient, setPatient, form, setForm }: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader title="IDENTIDAD Y BIOMETRÍA" icon="skull" color={COLORS.crimson} />
      
      <View style={styles.identityCard}>
        <View style={styles.row}>
          <CyberInput label="NOMBRE DEL SUJETO" value={patient.full_name} onChange={(v) => setPatient({...patient, full_name: v})} placeholder="Ej. Juan Pérez" />
        </View>
        <View style={styles.row}>
          <CyberInput label="EDAD (AÑOS)" value={patient.age ? String(patient.age) : ''} onChange={(v) => setPatient({...patient, age: parseInt(v) || 0})} placeholder="0" />
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>GENOTIPO</Text>
            <View style={styles.miniBtnRow}>
              <TouchableOpacity style={[styles.miniBtn, patient.sex === 'M' && styles.activeMiniBtn]} onPress={() => setPatient({...patient, sex: 'M'})}>
                <Text style={[styles.miniBtnText, patient.sex === 'M' && styles.activeMiniBtnText]}>XY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.miniBtn, patient.sex === 'F' && styles.activeMiniBtn]} onPress={() => setPatient({...patient, sex: 'F'})}>
                <Text style={[styles.miniBtnText, patient.sex === 'F' && styles.activeMiniBtnText]}>XX</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <CyberInput label="PESO (KG)" value={form.weight_kg} onChange={(v) => setForm({...form, weight_kg: v})} placeholder="0.0" />
        <CyberInput label="TALLA (CM)" value={form.height_cm} onChange={(v) => setForm({...form, height_cm: v})} placeholder="0" />
      </View>
      <View style={styles.row}>
        <CyberInput label="CINTURA (CM)" value={form.waist_cm} onChange={(v) => setForm({...form, waist_cm: v})} placeholder="0" />
        <CyberInput label="ACT. FÍSICA" value={form.activity_factor} onChange={(v) => setForm({...form, activity_factor: v})} placeholder="1.2" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 20 },
  row: { flexDirection: 'row', gap: 15, flexWrap: 'wrap' },
  identityCard: { backgroundColor: 'rgba(0, 255, 159, 0.03)', padding: 20, borderWidth: 2, borderColor: COLORS.dim, gap: 15, marginBottom: 15, borderRadius: 8 },
  inputGroup: { flex: 1, marginBottom: 15, minWidth: 140 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: COLORS.bone, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' },
  miniBtnRow: { flexDirection: 'row', gap: 10 },
  miniBtn: { flex: 1, height: 50, borderWidth: 1.5, borderColor: COLORS.dim, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', borderRadius: 6 },
  activeMiniBtn: { borderColor: COLORS.crimson, backgroundColor: 'rgba(255, 0, 60, 0.2)' },
  miniBtnText: { color: COLORS.muted, fontSize: 14, fontWeight: '900' },
  activeMiniBtnText: { color: COLORS.white },
});
