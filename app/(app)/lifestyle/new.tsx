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

export default function LifestyleScreen() {
  const insets = useSafeAreaInsets();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    sueno_horas: '',
    estres_nivel: '',
    pasos_diarios: '',
    calidad_sueno: 'REGULAR',
    tipo_entrenamiento: 'FUERZA',
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
      Alert.alert('✅ Éxito', 'Rutina vital sincronizada correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 1500);
  };

  const renderToggle = (label: string, options: string[], fieldKey: keyof typeof form) => (
    <View style={styles.toggleContainer}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.toggleRow}>
        {options.map(opt => {
          const isActive = form[fieldKey] === opt;
          return (
            <TouchableOpacity 
              key={opt}
              style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
              onPress={() => { Haptics.selectionAsync(); setForm({...form, [fieldKey]: opt}); }}
            >
              <Text style={[styles.toggleTxt, isActive && styles.toggleTxtActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <NeuralBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); router.back(); }} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={COLORS.gold} />
          </TouchableOpacity>
          <Ionicons name="body" size={32} color={COLORS.gold} style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.headerTitle}>RUTINA VITAL</Text>
            <Text style={styles.headerSub}>MÉTRICAS DE LIFESTYLE</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.subtitle}>// MÉTRICAS DE RECUPERACIÓN</Text>

            <View style={styles.row}>
              <CyberInput 
                label="HORAS DE SUEÑO" 
                value={form.sueno_horas} 
                onChangeText={(v: string) => setForm({...form, sueno_horas: v})} 
                placeholder="0" 
                style={{ flex: 1 }} 
                keyboardType="numeric" 
                color={COLORS.gold} 
              />
              <CyberInput 
                label="NIVEL DE ESTRÉS (1-10)" 
                value={form.estres_nivel} 
                onChangeText={(v: string) => setForm({...form, estres_nivel: v})} 
                placeholder="1" 
                style={{ flex: 1 }} 
                keyboardType="numeric" 
                color={COLORS.gold} 
              />
            </View>

            {renderToggle('CALIDAD DEL SUEÑO', ['MALO', 'REGULAR', 'BUENO', 'ÓPTIMO'], 'calidad_sueno')}

            <View style={styles.separator} />
            <Text style={[styles.subtitle, { color: COLORS.neon }]}>// MÉTRICAS DE ACTIVIDAD</Text>

            <CyberInput 
              label="PASOS DIARIOS" 
              value={form.pasos_diarios} 
              onChangeText={(v: string) => setForm({...form, pasos_diarios: v})} 
              placeholder="Ej. 10000" 
              keyboardType="numeric" 
              color={COLORS.neon} 
            />

            {renderToggle('TIPO DE ENTRENAMIENTO', ['SEDENTARIO', 'CARDIO', 'FUERZA', 'HÍBRIDO'], 'tipo_entrenamiento')}

            <CyberButton 
              title={loading ? "SINTETIZANDO..." : "GUARDAR RUTINA VITAL"}
              onPress={handleSave}
              color={COLORS.gold}
              style={{ marginTop: 30 }}
              icon={<Ionicons name="body" size={24} color={COLORS.gold} />}
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
  subtitle: { fontSize: 11, color: COLORS.gold, fontWeight: '900', letterSpacing: 2, marginBottom: 10, fontFamily: FONTS.space },
  backBtn: { marginRight: 15 },
  scroll: { padding: 20, paddingBottom: 100 },
  card: { 
    backgroundColor: 'rgba(10,10,20,0.85)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,215,0,0.3)', 
    borderRadius: RADIUS.lg, 
    padding: 20, 
    borderTopWidth: 3,
    borderTopColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  row: { flexDirection: 'row', gap: SPACING.md },
  separator: { height: 1, backgroundColor: COLORS.dim, marginVertical: 20 },
  
  toggleContainer: { marginTop: 15, marginBottom: 10 },
  toggleLabel: { fontSize: 11, color: COLORS.bone, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontFamily: FONTS.space, marginLeft: 10, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toggleBtn: { 
    paddingHorizontal: 15, paddingVertical: 12, borderRadius: RADIUS.sm, 
    borderWidth: 1, borderColor: COLORS.dim, backgroundColor: 'rgba(0,0,0,0.5)'
  },
  toggleBtnActive: { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: COLORS.gold },
  toggleTxt: { color: COLORS.muted, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  toggleTxtActive: { color: COLORS.gold }
});
