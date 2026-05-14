import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SHADOWS } from '../../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Equivalentes Chilenos (Promedios aproximados por porción)
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

  const renderPortionInput = (label: string, key: string) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label.toUpperCase()}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity 
          style={styles.stepBtn} 
          onPress={() => updatePortion(key, String(Math.max(0, (portions[key] || 0) - 0.5)))}
        >
          <Ionicons name="remove" size={20} color={COLORS.neon} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(portions[key] || '')}
          onChangeText={(v) => updatePortion(key, v)}
          placeholder="0"
          placeholderTextColor={COLORS.dim}
        />
        <TouchableOpacity 
          style={styles.stepBtn} 
          onPress={() => updatePortion(key, String((portions[key] || 0) + 0.5))}
        >
          <Ionicons name="add" size={20} color={COLORS.neon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bg1, COLORS.bg]} style={StyleSheet.absoluteFill} />
      
      {/* Real-time Counter */}
      <View style={styles.counterBoard}>
        <View style={styles.counterRow}>
          <CounterItem label="KCAL" current={totals.kcal} target={kcal} />
          <CounterItem label="PROT" current={totals.prot} target={prot} unit="g" />
        </View>
        <View style={styles.counterRow}>
          <CounterItem label="CHO" current={totals.cho} target={cho} unit="g" />
          <CounterItem label="FAT" current={totals.fat} target={fat} unit="g" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>DISTRIBUCIÓN DE PORCIONES</Text>
        
        <View style={styles.grid}>
          {renderPortionInput('Lácteos Bajos', 'dairy_low_fat')}
          {renderPortionInput('Lácteos Altos', 'dairy_high_fat')}
          {renderPortionInput('Carnes Bajas', 'meat_low_fat')}
          {renderPortionInput('Carnes Medias', 'meat_med_fat')}
          {renderPortionInput('Legumbres', 'legumes')}
          {renderPortionInput('Cereales', 'cereals_no_fat')}
          {renderPortionInput('Vegetales G.', 'vegetables_gen')}
          {renderPortionInput('Vegetales L.', 'vegetables_free')}
          {renderPortionInput('Frutas', 'fruits')}
          {renderPortionInput('Aceites/Grasas', 'fats_no_cho')}
        </View>

        <TouchableOpacity 
          style={styles.saveBtn}
          onPress={() => Alert.alert('Éxito', 'Plan de porciones guardado en el sistema.')}
        >
          <Text style={styles.saveBtnText}>SAVE MEAL PLAN</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function CounterItem({ label, current, target, unit = '' }: any) {
  const diff = target ? current - parseFloat(target) : 0;
  const isOk = Math.abs(diff) < 50; // Tolerancia
  const color = diff > 20 ? COLORS.pink : isOk ? COLORS.neon : COLORS.gold;

  return (
    <View style={styles.counterItem}>
      <Text style={styles.counterLabel}>{label}</Text>
      <Text style={[styles.counterValue, { color }]}>
        {Math.round(current)}{unit} / {target || '—'}{unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  counterBoard: {
    padding: 20,
    backgroundColor: COLORS.bg1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg4,
    gap: 12,
  },
  counterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  counterItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.bg4,
  },
  counterLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.muted,
    marginBottom: 4,
  },
  counterValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.pink,
    letterSpacing: 2,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  inputGroup: {
    width: '47%',
    gap: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.muted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.bg4,
  },
  stepBtn: {
    padding: 10,
  },
  input: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: COLORS.neon,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    ...SHADOWS.neon,
  },
  saveBtnText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
