import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import NeuralBackground from '@/components/NeuralBackground';
import CyberInput from '@/components/CyberInput';
import CyberButton from '@/components/CyberButton';
import { COLORS, SPACING, RADIUS, FONTS } from '@/constants/theme';

export default function BiochemicalScreen() {
  const insets = useSafeAreaInsets();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    glucosa: '',
    colesterol_total: '',
    hdl: '',
    ldl: '',
    trigliceridos: '',
    insulina: '',
    hba1c: '',
  });

  const handleSave = async () => {
    if (!patientId) {
      return Alert.alert('Error', 'Falta el ID del paciente.');
    }
    
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Simular guardado
    setTimeout(() => {
      setLoading(false);
      Alert.alert('✅ Éxito', 'Bio-marcadores ingresados a la base de datos.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 1500);
  };

  return (
    <NeuralBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); router.back(); }} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={COLORS.sky} />
          </TouchableOpacity>
          <Ionicons name="flask" size={32} color={COLORS.sky} style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.headerTitle}>TERMINAL BIOQUÍMICO</Text>
            <Text style={styles.headerSub}>INGRESO DE MARCADORES</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.subtitle}>// INGRESO DE MARCADORES BIOQUÍMICOS</Text>

            <View style={styles.row}>
              <CyberInput 
                label="GLUCOSA (mg/dL)" 
                value={form.glucosa} 
                onChangeText={(v: string) => setForm({...form, glucosa: v})} 
                placeholder="0" 
                style={{ flex: 1 }} 
                keyboardType="numeric" 
                color={COLORS.sky} 
              />
              <CyberInput 
                label="INSULINA (µUI/mL)" 
                value={form.insulina} 
                onChangeText={(v: string) => setForm({...form, insulina: v})} 
                placeholder="0" 
                style={{ flex: 1 }} 
                keyboardType="numeric" 
                color={COLORS.sky} 
              />
            </View>

            <CyberInput 
              label="HEMOGLOBINA GLICOSILADA HbA1c (%)" 
              value={form.hba1c} 
              onChangeText={(v: string) => setForm({...form, hba1c: v})} 
              placeholder="0.0" 
              keyboardType="numeric" 
              color={COLORS.sky} 
            />

            <View style={styles.separator} />
            <Text style={[styles.subtitle, { color: COLORS.gold }]}>// PERFIL LIPÍDICO</Text>

            <View style={styles.row}>
              <CyberInput 
                label="COLESTEROL TOTAL" 
                value={form.colesterol_total} 
                onChangeText={(v: string) => setForm({...form, colesterol_total: v})} 
                placeholder="0" 
                style={{ flex: 1 }} 
                keyboardType="numeric" 
                color={COLORS.gold} 
              />
              <CyberInput 
                label="TRIGLICÉRIDOS" 
                value={form.trigliceridos} 
                onChangeText={(v: string) => setForm({...form, trigliceridos: v})} 
                placeholder="0" 
                style={{ flex: 1 }} 
                keyboardType="numeric" 
                color={COLORS.gold} 
              />
            </View>

            <View style={styles.row}>
              <CyberInput 
                label="HDL" 
                value={form.hdl} 
                onChangeText={(v: string) => setForm({...form, hdl: v})} 
                placeholder="0" 
                style={{ flex: 1 }} 
                keyboardType="numeric" 
                color={COLORS.gold} 
              />
              <CyberInput 
                label="LDL" 
                value={form.ldl} 
                onChangeText={(v: string) => setForm({...form, ldl: v})} 
                placeholder="0" 
                style={{ flex: 1 }} 
                keyboardType="numeric" 
                color={COLORS.gold} 
              />
            </View>

            <CyberButton 
              title={loading ? "SINTETIZANDO..." : "GUARDAR BIO-MARCADORES"}
              onPress={handleSave}
              color={COLORS.sky}
              style={{ marginTop: 30 }}
              icon={<Ionicons name="flask" size={24} color={COLORS.sky} />}
            />
          </View>
        </ScrollView>
      </View>
    </NeuralBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 20, 
    flexDirection: 'row',
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.bg4,
    backgroundColor: 'rgba(5, 5, 10, 0.9)'
  },
  headerTitle: { fontFamily: FONTS.space, fontSize: 16, color: COLORS.white, fontWeight: 'bold' },
  headerSub: { fontSize: 10, color: COLORS.dim, letterSpacing: 2 },
  backBtn: { marginRight: 15 },
  subtitle: { fontSize: 11, color: COLORS.sky, fontWeight: '900', letterSpacing: 2, marginBottom: 10, fontFamily: FONTS.space },
  scroll: { padding: 20, paddingBottom: 100 },
  card: { 
    backgroundColor: 'rgba(10,10,20,0.85)', 
    borderWidth: 1, 
    borderColor: 'rgba(0,255,255,0.3)', 
    borderRadius: RADIUS.lg, 
    padding: 20, 
    borderTopWidth: 3,
    borderTopColor: COLORS.sky,
    shadowColor: COLORS.sky,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  row: { flexDirection: 'row', gap: SPACING.md },
  separator: { height: 1, backgroundColor: COLORS.dim, marginVertical: 20 }
});
