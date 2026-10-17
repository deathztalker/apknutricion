import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import CyberInput from '../ui/CyberInput';
import { SectionHeader, MacroBox, ResultBox } from '../ui/LayoutComponents';
import { CalculationResult, RecordFormData } from '../../types';

interface Props {
  form: Partial<RecordFormData>;
  setForm: (f: Partial<RecordFormData>) => void;
  results: CalculationResult | null;
}

export default function MacrosTab({ form, setForm, results }: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader title="METABOLISMO Y MACRONUTRIENTES" icon="pie-chart" color={COLORS.pink} />
      
      <View style={styles.macroDashboard}>
        <View style={styles.row}>
          <CyberInput label="% PROTEÍNAS" value={form.macro_prot_pct} onChange={(v) => setForm({...form, macro_prot_pct: v})} placeholder="20" />
          <CyberInput label="% CARBOS" value={form.macro_cho_pct} onChange={(v) => setForm({...form, macro_cho_pct: v})} placeholder="50" />
          <CyberInput label="% GRASAS" value={form.macro_fat_pct} onChange={(v) => setForm({...form, macro_fat_pct: v})} placeholder="30" />
        </View>

        {results?.macros && (
          <View style={{ gap: 10 }}>
            <MacroBox label="PROTEÍNA" grams={results.macros.protG} gkg={results.macros.protGkg} color={COLORS.pink} />
            <MacroBox label="CARBOHIDRATOS" grams={results.macros.choG} gkg={results.macros.choGkg} color={COLORS.sky} />
            <MacroBox label="GRASAS" grams={results.macros.fatG} gkg={results.macros.fatGkg} color={COLORS.gold} />
          </View>
        )}
        
        <View style={styles.dashboardGrid}>
          <ResultBox label="GASTO ENERGÉTICO (TDEE)" value={`${results?.tdee || '--'} KCAL`} color={COLORS.orange} />
          <ResultBox label="TMB (MIFFLIN-ST JEOR)" value={`${results?.bmr || '--'} KCAL`} color={COLORS.dim} />
          <ResultBox label="REQ. HÍDRICO" value={`${results?.waterLiters?.toFixed(1) || '--'} L`} color={COLORS.sky} />
          <ResultBox label="IMC ACTUAL" value={`${results?.bmi || '--'}`} sub={results?.bmiStatus || ''} color={results?.bmiColor || COLORS.dim} />
          <ResultBox label="RIESGO CARDIOMETABÓLICO" value={`${results?.cvRisk || '--'}`} sub={`ICT: ${results?.ict || '--'}`} color={results?.cvColor || COLORS.dim} />
          <ResultBox label="PESO IDEAL (LORENZ)" value={`${results?.idealWeight?.toFixed(1) || '--'} KG`} color={COLORS.dim} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 20 },
  row: { flexDirection: 'row', gap: 15, flexWrap: 'wrap' },
  macroDashboard: { flexDirection: 'column', gap: 12 },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 15 },
});
