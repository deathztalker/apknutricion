import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import CyberInput from '../ui/CyberInput';
import { SectionHeader } from '../ui/LayoutComponents';
import { CalculationResult, RecordFormData } from '../../types';

interface Props {
  form: Partial<RecordFormData>;
  setForm: (f: Partial<RecordFormData>) => void;
  results: CalculationResult | null;
}

export default function ClinicalTab({ form, setForm, results }: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader title="INDICADORES HOSPITALARIOS" icon="medkit" color={COLORS.purple} />
      <Text style={styles.sectionDesc}>Módulo de diagnóstico para falla renal y estimación antropométrica por Chumlea.</Text>
      
      <View style={styles.miniCard}>
        <Text style={styles.cardTitle}>FUNCIÓN RENAL (COCKCROFT-GAULT)</Text>
        <View style={styles.row}>
          <CyberInput label="CREATININA SÉRICA" value={form.creatinine} onChange={(v) => setForm({...form, creatinine: v})} placeholder="mg/dL" />
          <View style={styles.displayOnly}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
              <Text style={[styles.displayLabel, {marginBottom: 0}]}>TFG ESTIMADA / KDIGO</Text>
              <TouchableOpacity onPress={() => Alert.alert('REFERENCIA CLÍNICA', 'Tasa de Filtración Glomerular (Cockcroft-Gault) clasificada según los estadios de la fundación KDIGO (G1-G5).')} style={{ marginLeft: 6 }}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.sky} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.displayValue, { color: COLORS.poison }]}>{results?.gfr?.toFixed(1) || '--'} ({results?.kdigoStage || '--'})</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.miniCard}>
        <Text style={styles.cardTitle}>ESTIMACIÓN DE TALLA (CHUMLEA)</Text>
        <View style={styles.row}>
          <CyberInput label="ALTURA DE RODILLA" value={form.knee_height_cm} onChange={(v) => setForm({...form, knee_height_cm: v})} placeholder="cm" />
          <View style={styles.displayOnly}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
              <Text style={[styles.displayLabel, {marginBottom: 0}]}>TALLA CALCULADA</Text>
              <TouchableOpacity onPress={() => Alert.alert('REFERENCIA CLÍNICA', 'Ecuación de Chumlea para predecir la estatura en base a la altura de rodilla. Especialmente útil en pacientes encamados o adultos mayores.')} style={{ marginLeft: 6 }}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.sky} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.displayValue, { color: COLORS.neon }]}>{results?.estimatedHeight?.toFixed(1) || '--'} CM</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 20 },
  sectionDesc: { color: COLORS.muted, fontSize: 12, marginBottom: 15, fontWeight: '800', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 15, flexWrap: 'wrap' },
  miniCard: { backgroundColor: COLORS.bg2, padding: 20, borderWidth: 1.5, borderColor: COLORS.dim, gap: 15, borderRadius: 8 },
  cardTitle: { fontSize: 13, fontWeight: '900', color: COLORS.orange, letterSpacing: 1 },
  displayOnly: { flex: 1, minWidth: 140, justifyContent: 'center', backgroundColor: '#000', padding: 16, borderWidth: 1.5, borderColor: COLORS.purple, borderRadius: 6 },
  displayLabel: { fontSize: 10, fontWeight: '900', color: COLORS.muted, marginBottom: 6 },
  displayValue: { fontSize: 20, fontWeight: '900', color: COLORS.neon },
});
