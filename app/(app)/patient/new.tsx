// app/(app)/patient/new.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { patientService, supabase } from '@/lib/supabase';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';
import { PatientFormData } from '@/types';
import TerminalBackground from '@/components/TerminalBackground';

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
      return Alert.alert('Error', 'Nombre, Fecha de Nacimiento y Sexo son obligatorios.');
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
      Alert.alert('Éxito', 'Paciente registrado correctamente.');
      router.replace(`/(app)/patient/${data.id}`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TerminalBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.neon} />
          </TouchableOpacity>
          <Text style={styles.title}>NUEVO SUJETO</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Field label="Nombre Completo" value={form.full_name} onChangeText={(v: string) => setForm({...form, full_name: v})} placeholder="Ej. Juan Pérez" />
            <Field label="RUT (Opcional)" value={form.rut} onChangeText={(v: string) => setForm({...form, rut: v})} placeholder="12.345.678-9" />
            <View style={styles.row}>
              <Field label="Fecha Nacimiento" value={form.birth_date} onChangeText={(v: string) => setForm({...form, birth_date: v})} placeholder="YYYY-MM-DD" containerStyle={{ flex: 1 }} />
              <View style={styles.field}>
                <Text style={styles.label}>Sexo</Text>
                <View style={styles.sexRow}>
                  {['M', 'F'].map(s => (
                    <TouchableOpacity key={s} 
                      style={[styles.sexBtn, form.sex === s && styles.sexActive]}
                      onPress={() => setForm({...form, sex: s as any})}>
                      <Text style={[styles.sexTxt, form.sex === s && { color: '#000' }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.row}>
              <Field label="Previsión" value={form.insurance} onChangeText={(v: string) => setForm({...form, insurance: v})} placeholder="FONASA" containerStyle={{ flex: 1 }} />
              <Field label="Comuna" value={form.commune} onChangeText={(v: string) => setForm({...form, commune: v})} placeholder="Santiago" containerStyle={{ flex: 1 }} />
            </View>
            <Field label="Teléfono" value={form.phone} onChangeText={(v: string) => setForm({...form, phone: v})} placeholder="+569..." />
            <Field label="Notas / Antecedentes" value={form.notes} onChangeText={(v: string) => setForm({...form, notes: v})} placeholder="Escribir aquí..." multiline />

            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? 'PROCESANDO...' : 'REGISTRAR PACIENTE'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </TerminalBackground>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline, containerStyle }: any) {
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 120, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  backBtn: { padding: 4 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.orange, letterSpacing: 4, fontFamily: FONTS.horror },
  scroll: { padding: SPACING.lg },
  card: { backgroundColor: 'rgba(13, 13, 18, 0.95)', borderRadius: 0, borderWidth: 3, borderColor: COLORS.dim, padding: SPACING.xl, gap: SPACING.lg, shadowColor: COLORS.orange, shadowOpacity: 0.2, shadowRadius: 15 },
  field: { gap: 10 },
  label: { fontSize: 12, color: COLORS.bone, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  input: { backgroundColor: '#000', borderWidth: 2, borderColor: COLORS.dim, borderRadius: 0, padding: 18, color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: SPACING.md },
  sexRow: { flexDirection: 'row', gap: 12 },
  sexBtn: { width: 55, height: 55, borderRadius: 0, borderWidth: 2, borderColor: COLORS.dim, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  sexActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  sexTxt: { color: COLORS.muted, fontWeight: '900', fontSize: 18 },
  saveBtn: { backgroundColor: COLORS.orange, paddingVertical: 20, borderRadius: 0, alignItems: 'center', marginTop: 20, shadowColor: COLORS.orange, shadowOpacity: 0.5, shadowRadius: 10 },
  saveBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 22, letterSpacing: 3, fontFamily: FONTS.horror },
});
