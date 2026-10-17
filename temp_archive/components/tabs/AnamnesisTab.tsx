import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';
import CyberInput from '../ui/CyberInput';
import { SectionHeader } from '../ui/LayoutComponents';
import { RecordFormData } from '../../types';

interface Props {
  form: Partial<RecordFormData>;
  setForm: (f: Partial<RecordFormData>) => void;
}

export default function AnamnesisTab({ form, setForm }: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader title="ANAMNESIS CLÍNICA" icon="medical" color={COLORS.gold} />
      <View style={styles.row}>
        <CyberInput label="TIPO DE DIETA" value={form.diet_type} onChange={(v) => setForm({...form, diet_type: v})} placeholder="Omnívora" />
        <CyberInput label="DIGESTIÓN" value={form.digestion_status} onChange={(v) => setForm({...form, digestion_status: v})} placeholder="Normal" />
      </View>
      <View style={styles.row}>
        <CyberInput label="INGESTA HÍDRICA" value={form.liquid_intake} onChange={(v) => setForm({...form, liquid_intake: v})} placeholder="1 a 2 Litros" />
      </View>
      
      <CyberInput label="PATOLOGÍAS CONFIRMADAS" value={form.pathologies?.join(', ')} onChange={(v) => setForm({...form, pathologies: v.split(',').map(s => s.trim())})} placeholder="Ej. HTA, DM2, Hipotiroidismo..." multiline />
      <CyberInput label="ALERGIAS / INTOLERANCIAS" value={form.allergies?.join(', ')} onChange={(v) => setForm({...form, allergies: v.split(',').map(s => s.trim())})} placeholder="Ej. APLV, Gluten, Lactosa..." multiline />
      <CyberInput label="FARMACOLOGÍA Y SUPLEMENTOS" value={form.observations} onChange={(v) => setForm({...form, observations: v})} placeholder="Lista de medicamentos o suplementos actuales..." multiline />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 20 },
  row: { flexDirection: 'row', gap: 15, flexWrap: 'wrap' },
});
