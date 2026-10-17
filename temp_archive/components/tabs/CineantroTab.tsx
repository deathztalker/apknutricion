import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import CyberInput from '../ui/CyberInput';
import { SectionHeader, ResultBox } from '../ui/LayoutComponents';
import { CalculationResult, RecordFormData } from '../../types';
import Somatocarta from '../Somatocarta';

interface Props {
  form: Partial<RecordFormData>;
  setForm: (f: Partial<RecordFormData>) => void;
  results: CalculationResult | null;
}

export default function CineantroTab({ form, setForm, results }: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader title="CINEANTROPOMETRÍA" icon="fitness" color={COLORS.poison} />
      
      {results?.somatotype && (
        <View style={styles.vizContainer}>
          <Text style={styles.vizTitle}>SOMATOCARTA</Text>
          <Somatocarta x={results.somatotype.x} y={results.somatotype.y} />
          <View style={{ flexDirection: 'row', gap: 15, marginTop: 15 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: COLORS.sky, fontSize: 10, fontWeight: 'bold' }}>ENDO</Text>
              <Text style={{ color: COLORS.white, fontSize: 16, fontFamily: FONTS.horror }}>{results.somatotype.endo.toFixed(1)}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: COLORS.pink, fontSize: 10, fontWeight: 'bold' }}>MESO</Text>
              <Text style={{ color: COLORS.white, fontSize: 16, fontFamily: FONTS.horror }}>{results.somatotype.meso.toFixed(1)}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: 'bold' }}>ECTO</Text>
              <Text style={{ color: COLORS.white, fontSize: 16, fontFamily: FONTS.horror }}>{results.somatotype.ecto.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.row}>
        <CyberInput label="DIÁMETRO HÚMERO" value={form.diameter_humerus} onChange={(v) => setForm({...form, diameter_humerus: v})} placeholder="0" />
        <CyberInput label="DIÁMETRO FÉMUR" value={form.diameter_femur} onChange={(v) => setForm({...form, diameter_femur: v})} placeholder="0" />
      </View>
      <View style={styles.row}>
        <CyberInput label="PLIEGUE TRICIPITAL" value={form.fold_triceps} onChange={(v) => setForm({...form, fold_triceps: v})} placeholder="0" />
        <CyberInput label="PLIEGUE SUBESCAPULAR" value={form.fold_subscapular} onChange={(v) => setForm({...form, fold_subscapular: v})} placeholder="0" />
      </View>
      <View style={styles.row}>
        <CyberInput label="PLIEGUE SUPRAESPINAL" value={form.fold_supraspinal} onChange={(v) => setForm({...form, fold_supraspinal: v})} placeholder="0" />
        <CyberInput label="PLIEGUE ABDOMINAL" value={form.fold_abdominal} onChange={(v) => setForm({...form, fold_abdominal: v})} placeholder="0" />
      </View>
      <View style={styles.row}>
        <CyberInput label="PERÍMETRO BRAZO" value={form.perimeter_arm} onChange={(v) => setForm({...form, perimeter_arm: v})} placeholder="0" />
        <CyberInput label="PERÍMETRO PANTORRILLA" value={form.perimeter_calf} onChange={(v) => setForm({...form, perimeter_calf: v})} placeholder="0" />
      </View>
      
      <View style={styles.dashboardGrid}>
        <ResultBox label="% GRASA (FAULKNER)" value={`${results?.fatPercent?.toFixed(1) || '--'} %`} color={COLORS.poison} />
        <ResultBox label="MASA GRASA" value={`${results?.fatMassKg?.toFixed(1) || '--'} KG`} color={COLORS.pink} />
        <ResultBox label="MASA MAGRA" value={`${results?.leanMassKg?.toFixed(1) || '--'} KG`} color={COLORS.sky} />
        <ResultBox label="SUMATORIA PLIEGUES" value={`${results?.foldSum?.toFixed(1) || '--'} MM`} color={COLORS.purple} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 20 },
  row: { flexDirection: 'row', gap: 15, flexWrap: 'wrap' },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 15 },
  vizTitle: { color: COLORS.bone, fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 15, textAlign: 'center', fontFamily: FONTS.horror },
  vizContainer: { alignItems: 'center', padding: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 2, borderColor: COLORS.purple, shadowColor: COLORS.purple, shadowOpacity: 0.2, shadowRadius: 10, borderRadius: 8 },
});
