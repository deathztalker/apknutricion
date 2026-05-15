import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { mealPlanService } from '../../../lib/supabase';
import TerminalBackground from '../../../components/TerminalBackground';

const EQUIVALENTS = {
  dairy_low_fat:   { kcal: 70, prot: 7, fat: 0, cho: 10 },
  dairy_high_fat:  { kcal: 110, prot: 7, fat: 6, cho: 10 },
  meat_low_fat:    { kcal: 65, prot: 11, fat: 2, cho: 0 },
  meat_med_fat:    { kcal: 115, prot: 11, fat: 8, cho: 0 },
  meat_high_fat:   { kcal: 170, prot: 11, fat: 14, cho: 0 },
  legumes:         { kcal: 170, prot: 9, fat: 1, cho: 30 },
  cereals_no_fat:  { kcal: 140, prot: 3, fat: 1, cho: 30 },
  cereals_fat:     { kcal: 200, prot: 3, fat: 10, cho: 25 },
  vegetables_gen:  { kcal: 30, prot: 2, fat: 0, cho: 5 },
  vegetables_free: { kcal: 10, prot: 1, fat: 0, cho: 2 },
  fruits:          { kcal: 65, prot: 0, fat: 0, cho: 15 },
  fats_no_cho:     { kcal: 180, prot: 0, fat: 20, cho: 0 },
  fats_cho:        { kcal: 200, prot: 5, fat: 15, cho: 10 },
  sugar:           { kcal: 40, prot: 0, fat: 0, cho: 10 },
};

export default function MealPlanBuilder() {
  const { kcal, prot, cho, fat, patientId } = useLocalSearchParams<any>();
  
  const [portions, setPortions] = useState<any>({
    dairy_low_fat: 0, dairy_high_fat: 0,
    meat_low_fat: 0, meat_med_fat: 0, meat_high_fat: 0,
    legumes: 0, cereals_no_fat: 0, cereals_fat: 0,
    vegetables_gen: 0, vegetables_free: 0,
    fruits: 0, fats_no_cho: 0, fats_cho: 0, sugar: 0
  });

  const [totals, setTotals] = useState({ kcal: 0, prot: 0, cho: 0, fat: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let k = 0, p = 0, c = 0, f = 0;
    Object.keys(portions).forEach(key => {
      const count = parseFloat(portions[key]) || 0;
      const eq = (EQUIVALENTS as any)[key];
      k += eq.kcal * count;
      p += eq.prot * count;
      c += eq.cho * count;
      f += eq.fat * count;
    });
    setTotals({ kcal: k, prot: p, cho: c, fat: f });
  }, [portions]);

  const updatePortion = (key: string, val: string) => {
    const n = parseFloat(val) || 0;
    setPortions({ ...portions, [key]: n });
  };

  const handleSave = async () => {
    if (!patientId) {
      Alert.alert('SYSTEM ERROR', 'NO SUBJECT LINKED.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await mealPlanService.create({
        patient_id: patientId,
        kcal_target: totals.kcal,
        protein_target: totals.prot,
        cho_target: totals.cho,
        fat_target: totals.fat,
        portions: portions,
      });

      if (error) throw error;
      Alert.alert('LINK ESTABLISHED', 'Meal plan synchronized with core.');
      router.back();
    } catch (error: any) {
      Alert.alert('SYNC FAILURE', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TerminalBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RESOURCE ALLOCATION</Text>
          <Text style={styles.headerSub}>MEAL PLAN PORTION DISTRIBUTION</Text>
        </View>

        {/* Real-time Monitors */}
        <View style={styles.monitors}>
          <View style={styles.monitorRow}>
            <MonitorItem label="KCAL" current={totals.kcal} target={kcal} />
            <MonitorItem label="PROT" current={totals.prot} target={prot} unit="g" />
          </View>
          <View style={styles.monitorRow}>
            <MonitorItem label="CHO" current={totals.cho} target={cho} unit="g" />
            <MonitorItem label="FAT" current={totals.fat} target={fat} unit="g" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            <PortionInput label="Dairy L-Fat" k="dairy_low_fat" v={portions} onUpdate={updatePortion} color={COLORS.neon} />
            <PortionInput label="Dairy H-Fat" k="dairy_high_fat" v={portions} onUpdate={updatePortion} color={COLORS.neon} />
            <PortionInput label="Meat L-Fat" k="meat_low_fat" v={portions} onUpdate={updatePortion} color={COLORS.purple} />
            <PortionInput label="Meat M-Fat" k="meat_med_fat" v={portions} onUpdate={updatePortion} color={COLORS.purple} />
            <PortionInput label="Legumes" k="legumes" v={portions} onUpdate={updatePortion} color={COLORS.gold} />
            <PortionInput label="Cereals" k="cereals_no_fat" v={portions} onUpdate={updatePortion} color={COLORS.gold} />
            <PortionInput label="Veg Gen" k="vegetables_gen" v={portions} onUpdate={updatePortion} color={COLORS.neon} />
            <PortionInput label="Veg Free" k="vegetables_free" v={portions} onUpdate={updatePortion} color={COLORS.neon} />
            <PortionInput label="Fruits" k="fruits" v={portions} onUpdate={updatePortion} color={COLORS.pink} />
            <PortionInput label="Oils/Fats" k="fats_no_cho" v={portions} onUpdate={updatePortion} color={COLORS.pink} />
          </View>

          <TouchableOpacity 
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={COLORS.bg} /> : (
              <>
                <Ionicons name="cloud-upload" size={24} color={COLORS.bg} />
                <Text style={styles.saveBtnText}>SYNC MEAL PLAN</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TerminalBackground>
  );
}

function MonitorItem({ label, current, target, unit = '' }: any) {
  const diff = target ? current - parseFloat(target) : 0;
  const isOk = Math.abs(diff) < (parseFloat(target) * 0.1); 
  const color = diff > (parseFloat(target) * 0.05) ? COLORS.pink : isOk ? COLORS.neon : COLORS.gold;

  return (
    <View style={[styles.monitor, { borderLeftColor: color }]}>
      <Text style={styles.monitorLabel}>{label}</Text>
      <Text style={[styles.monitorValue, { color }]}>
        {Math.round(current)}{unit} / {target ? Math.round(parseFloat(target)) : '—'}{unit}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(100, (current / (parseFloat(target) || 1)) * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function PortionInput({ label, k, v, onUpdate, color }: any) {
  const val = v[k] || 0;
  return (
    <View style={[styles.portionCard, { borderBottomColor: color }]}>
      <Text style={styles.portionLabel}>{label.toUpperCase()}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity onPress={() => onUpdate(k, String(Math.max(0, val - 0.5)))} style={styles.stepBtn}>
          <Ionicons name="remove" size={16} color={color} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { color }]}
          keyboardType="numeric"
          value={String(val)}
          onChangeText={(newVal) => onUpdate(k, newVal)}
        />
        <TouchableOpacity onPress={() => onUpdate(k, String(val + 0.5))} style={styles.stepBtn}>
          <Ionicons name="add" size={16} color={color} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25, backgroundColor: 'rgba(0,0,0,0.5)', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { fontSize: 20, fontFamily: FONTS.horror, color: COLORS.white, letterSpacing: 2 },
  headerSub: { fontSize: 9, color: COLORS.dim, letterSpacing: 1, fontWeight: 'bold' },
  monitors: { padding: 20, gap: 15, backgroundColor: 'rgba(0,0,0,0.3)' },
  monitorRow: { flexDirection: 'row', gap: 15 },
  monitor: { flex: 1, backgroundColor: COLORS.bg1, padding: 12, borderLeftWidth: 3, borderWidth: 1, borderColor: '#222' },
  monitorLabel: { fontSize: 9, fontWeight: 'bold', color: COLORS.muted, marginBottom: 5 },
  monitorValue: { fontSize: 13, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  progressBar: { height: 2, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 8 },
  progressFill: { height: '100%' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  portionCard: { width: '47%', backgroundColor: 'rgba(25, 25, 30, 0.8)', padding: 15, borderWidth: 1, borderColor: '#222', borderBottomWidth: 3 },
  portionLabel: { fontSize: 9, fontWeight: 'bold', color: COLORS.muted, marginBottom: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { padding: 5 },
  input: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  saveBtn: {
    backgroundColor: COLORS.neon,
    height: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginTop: 40,
    ...SHADOWS.neon,
  },
  saveBtnText: { color: COLORS.bg, fontFamily: FONTS.horror, fontSize: 22 },
});
