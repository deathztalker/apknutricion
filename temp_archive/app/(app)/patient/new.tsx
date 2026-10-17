// app/(app)/patient/new.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { patientService, supabase } from '@/lib/supabase';
import { COLORS, SPACING, RADIUS, FONTS } from '@/constants/theme';
import { PatientFormData } from '@/types';
import NeuralBackground from '@/components/NeuralBackground';
import CyberInput from '@/components/CyberInput';
import CyberButton from '@/components/CyberButton';
import * as Haptics from 'expo-haptics';

export default function NewPatientScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<PatientFormData>({
    full_name: '',
    rut: '',
    birth_date: '',
    sex: '',
    phone: '',
    commune: '',
    insurance: 'FONASA',
    notes: '',
  });

  const handleSave = async () => {
    if (!form.full_name || !form.birth_date || !form.sex) {
      return Alert.alert('DATOS INCOMPLETOS', 'Nombre, Fecha de Nacimiento y Genotipo son obligatorios para inicializar al sujeto.');
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data, error } = await patientService.create({
        ...form,
        user_id: user.id,
        is_active: true,
      } as any);

      if (error) throw error;
      Alert.alert('SUJETO REGISTRADO 💀', 'El espécimen ha sido inyectado exitosamente en el núcleo.');
      router.replace(`/(app)/patient/${data.id}`);
    } catch (error: any) {
      Alert.alert('FALLO DE SÍNTESIS', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NeuralBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); router.back(); }} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={COLORS.neon} />
          </TouchableOpacity>
          <Ionicons name="person-add" size={32} color={COLORS.neon} style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.headerTitle}>REGISTRO DE SUJETO</Text>
            <Text style={styles.headerSub}>SISTEMA DE INGRESO BIOMÉTRICO</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <CyberInput label="NOMBRE COMPLETO" value={form.full_name} onChangeText={(v: string) => setForm({...form, full_name: v})} placeholder="Ej. Juan Pérez" />
            <CyberInput label="RUT (OPCIONAL)" value={form.rut} onChangeText={(v: string) => setForm({...form, rut: v})} placeholder="12.345.678-9" />
            
            <View style={styles.row}>
              <CyberInput label="FECHA NACIMIENTO" value={form.birth_date} onChangeText={(v: string) => setForm({...form, birth_date: v})} placeholder="YYYY-MM-DD" style={{ flex: 1 }} />
              <View style={styles.field}>
                <Text style={styles.label}>GENOTIPO</Text>
                <View style={styles.sexRow}>
                  {['M', 'F'].map(s => (
                    <TouchableOpacity key={s} 
                      style={[styles.sexBtn, form.sex === s && styles.sexActive]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setForm({...form, sex: s as any})
                      }}>
                      <Text style={[styles.sexTxt, form.sex === s && { color: COLORS.white }]}>{s === 'M' ? 'XY' : 'XX'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <CyberInput label="PREVISIÓN" value={form.insurance} onChangeText={(v: string) => setForm({...form, insurance: v})} placeholder="FONASA" style={{ flex: 1 }} />
              <CyberInput label="COMUNA" value={form.commune} onChangeText={(v: string) => setForm({...form, commune: v})} placeholder="Santiago" style={{ flex: 1 }} />
            </View>
            
            <CyberInput label="TELÉFONO" value={form.phone} onChangeText={(v: string) => setForm({...form, phone: v})} placeholder="+569..." />
            <CyberInput label="NOTAS / ANTECEDENTES" value={form.notes} onChangeText={(v: string) => setForm({...form, notes: v})} placeholder="Escribir aquí..." multiline={true} />

            <CyberButton 
              title={loading ? "INYECTANDO ADN..." : "REGISTRAR SUJETO"}
              onPress={loading ? () => {} : handleSave}
              color={loading ? COLORS.dim : COLORS.crimson}
              style={{ marginTop: 20, opacity: loading ? 0.5 : 1 }}
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
    borderBottomWidth: 2, 
    borderBottomColor: COLORS.crimson,
    backgroundColor: 'rgba(5, 5, 10, 0.75)'
  },
  headerTitle: { fontFamily: FONTS.horror, fontSize: 20, color: COLORS.white, letterSpacing: 2 },
  headerSub: { fontSize: 10, color: COLORS.crimson, letterSpacing: 2, fontWeight: '900' },
  backBtn: { marginRight: 15 },
  scroll: { padding: 20, paddingBottom: 100 },
  card: { 
    backgroundColor: 'rgba(10,10,20,0.85)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,0,60,0.3)', 
    borderRadius: RADIUS.lg, 
    padding: 20, 
    borderTopWidth: 3,
    borderTopColor: COLORS.neon,
    shadowColor: COLORS.neon,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  field: { gap: 10, marginTop: 12 },
  label: { fontSize: 11, color: COLORS.bone, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontFamily: FONTS.space, marginLeft: 10 },
  row: { flexDirection: 'row', gap: SPACING.md },
  sexRow: { flexDirection: 'row', gap: 10 },
  sexBtn: { 
    width: 60, height: 55, borderRadius: RADIUS.md, 
    borderWidth: 1.5, borderColor: COLORS.dim, 
    alignItems: 'center', justifyContent: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  sexActive: { backgroundColor: 'rgba(157, 0, 255, 0.2)', borderColor: COLORS.purple },
  sexTxt: { color: COLORS.muted, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});
