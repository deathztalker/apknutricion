// app/(app)/meal-plan/new.tsx — Constructor de Plan Alimentario
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { mealPlanService } from '../../../lib/supabase';
import TerminalBackground from '../../../components/TerminalBackground';
import { useAuthStore } from '../../../store/authStore';
import { COLORS, FONTS } from '../../../constants/theme';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type EquivalentKey = keyof typeof EQUIVALENTES;

interface NutrientValues {
  kcal: number;
  prot: number;
  fat: number;
  cho: number;
}

interface Totals extends NutrientValues { }

type Porciones = Record<EquivalentKey, number>;

interface GrupoAlimento {
  titulo: string;
  icono: string;
  color: string;
  items: EquivalentKey[];
}

// ─── Tabla de Equivalentes (MINSAL/EDALNU) ───────────────────────────────────

const EQUIVALENTES = {
  lacteo_bajo_grasa: { kcal: 70, prot: 7, fat: 0, cho: 10, nombre: 'Lácteo bajo en grasa', ejemplo: 'leche descremada, yogur 0%' },
  lacteo_alto_grasa: { kcal: 110, prot: 7, fat: 6, cho: 10, nombre: 'Lácteo alto en grasa', ejemplo: 'leche entera, yogur entero' },
  carne_baja_grasa: { kcal: 65, prot: 11, fat: 2, cho: 0, nombre: 'Carne magra', ejemplo: 'pechuga, atún al agua, claras' },
  carne_media_grasa: { kcal: 115, prot: 11, fat: 8, cho: 0, nombre: 'Carne semi-grasa', ejemplo: 'huevo entero, pollo con piel' },
  carne_alta_grasa: { kcal: 170, prot: 11, fat: 14, cho: 0, nombre: 'Carne grasa', ejemplo: 'costillar, embutido magro' },
  legumbres: { kcal: 170, prot: 9, fat: 1, cho: 30, nombre: 'Legumbres', ejemplo: 'lentejas, garbanzos, porotos' },
  cereales_sin_grasa: { kcal: 140, prot: 3, fat: 1, cho: 30, nombre: 'Cereal sin grasa', ejemplo: 'arroz, avena, marraqueta, papa' },
  cereales_con_grasa: { kcal: 200, prot: 3, fat: 10, cho: 25, nombre: 'Cereal con grasa', ejemplo: 'galletas, pan de molde, granola' },
  verdura_general: { kcal: 30, prot: 2, fat: 0, cho: 5, nombre: 'Verdura general', ejemplo: 'zanahoria, brócoli, espinaca' },
  verdura_libre: { kcal: 10, prot: 1, fat: 0, cho: 2, nombre: 'Verdura libre', ejemplo: 'lechuga, pepino, apio, tomate' },
  fruta: { kcal: 65, prot: 0, fat: 0, cho: 15, nombre: 'Fruta', ejemplo: 'manzana, naranja, plátano' },
  grasa_sin_cho: { kcal: 180, prot: 0, fat: 20, cho: 0, nombre: 'Grasa sin CHO', ejemplo: 'aceite, mantequilla, palta' },
  grasa_con_cho: { kcal: 200, prot: 5, fat: 15, cho: 10, nombre: 'Grasa con CHO', ejemplo: 'maní, nueces, semillas' },
  azucar: { kcal: 40, prot: 0, fat: 0, cho: 10, nombre: 'Azúcar / dulces', ejemplo: 'azúcar, miel, mermelada' },
} as const;

const GRUPOS: GrupoAlimento[] = [
  {
    titulo: 'Lácteos',
    icono: '🥛',
    color: COLORS.neon,
    items: ['lacteo_bajo_grasa', 'lacteo_alto_grasa'],
  },
  {
    titulo: 'Carnes y proteínas',
    icono: '🥩',
    color: COLORS.purple,
    items: ['carne_baja_grasa', 'carne_media_grasa', 'carne_alta_grasa'],
  },
  {
    titulo: 'Cereales y legumbres',
    icono: '🌾',
    color: COLORS.gold,
    items: ['legumbres', 'cereales_sin_grasa', 'cereales_con_grasa'],
  },
  {
    titulo: 'Verduras',
    icono: '🥦',
    color: '#4ade80',
    items: ['verdura_general', 'verdura_libre'],
  },
  {
    titulo: 'Frutas',
    icono: '🍎',
    color: '#f87171',
    items: ['fruta'],
  },
  {
    titulo: 'Grasas y azúcares',
    icono: '🫒',
    color: '#fb923c',
    items: ['grasa_sin_cho', 'grasa_con_cho', 'azucar'],
  },
];

const PORCIONES_INICIALES: Porciones = {
  lacteo_bajo_grasa: 0, lacteo_alto_grasa: 0,
  carne_baja_grasa: 0, carne_media_grasa: 0, carne_alta_grasa: 0,
  legumbres: 0, cereales_sin_grasa: 0, cereales_con_grasa: 0,
  verdura_general: 0, verdura_libre: 0,
  fruta: 0, grasa_sin_cho: 0, grasa_con_cho: 0, azucar: 0,
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ConstructorPlanAlimentario() {
  const { kcal, prot, cho, fat, patientId } = useLocalSearchParams<{
    kcal?: string; prot?: string; cho?: string; fat?: string; patientId?: string;
  }>();
  const { session } = useAuthStore();

  const [porciones, setPorciones] = useState<Porciones>(PORCIONES_INICIALES);
  const [guardando, setGuardando] = useState(false);

  const objetivos: NutrientValues = useMemo(() => ({
    kcal: parseFloat(kcal ?? '0'),
    prot: parseFloat(prot ?? '0'),
    cho: parseFloat(cho ?? '0'),
    fat: parseFloat(fat ?? '0'),
  }), [kcal, prot, cho, fat]);

  const totales: Totals = useMemo(() => {
    let k = 0, p = 0, c = 0, f = 0;
    for (const key of Object.keys(porciones) as EquivalentKey[]) {
      const cant = porciones[key];
      if (!cant) continue;
      const eq = EQUIVALENTES[key];
      k += eq.kcal * cant;
      p += eq.prot * cant;
      c += eq.cho * cant;
      f += eq.fat * cant;
    }
    return { kcal: k, prot: p, cho: c, fat: f };
  }, [porciones]);

  const actualizarPorcion = useCallback((key: EquivalentKey, valor: string) => {
    const n = parseFloat(valor) || 0;
    setPorciones(prev => ({ ...prev, [key]: Math.max(0, n) }));
  }, []);

  const ajustarPorcion = useCallback((key: EquivalentKey, delta: number) => {
    setPorciones(prev => ({
      ...prev,
      [key]: Math.max(0, Math.round((prev[key] + delta) * 10) / 10),
    }));
  }, []);

  const handleGuardar = async () => {
    if (!patientId || !session?.user) {
      Alert.alert('Error', 'No hay un paciente o sesión asociada.');
      return;
    }
    const totalPorciones = Object.values(porciones).reduce((a, b) => a + b, 0);
    if (totalPorciones === 0) {
      Alert.alert('Sin porciones', 'Agrega al menos una porción antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const { error } = await mealPlanService.create({
        patient_id: patientId,
        user_id: session.user.id,
        title: `Plan Alimentario ${new Date().toLocaleDateString('es-CL')}`,
        total_kcal: Math.round(totales.kcal),
        prot_g: Math.round(totales.prot * 10) / 10,
        cho_g: Math.round(totales.cho * 10) / 10,
        fat_g: Math.round(totales.fat * 10) / 10,
        portions: porciones,
        plan_json: porciones,
      });
      if (error) throw error;
      Alert.alert('✅ Guardado', 'Plan alimentario sincronizado correctamente.', [
        { text: 'Volver', onPress: () => router.back() },
      ]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error al guardar', msg);
    } finally {
      setGuardando(false);
    }
  };

  const porcentajeKcal = objetivos.kcal > 0
    ? Math.round((totales.kcal / objetivos.kcal) * 100)
    : 0;

  return (
    <TerminalBackground>
      <View style={styles.container}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={['rgba(5,5,12,0.98)', 'rgba(10,10,20,0.95)']}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.neon} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Plan Alimentario</Text>
            <Text style={styles.headerSub}>Distribución de equivalentes MINSAL</Text>
          </View>
          <View style={styles.kcalBadge}>
            <Text style={styles.kcalBadgeNum}>{porcentajeKcal}%</Text>
            <Text style={styles.kcalBadgeLbl}>del objetivo</Text>
          </View>
        </LinearGradient>

        {/* ── Monitores de macros ─────────────────────────────────────────── */}
        <View style={styles.monitors}>
          <MonitorMacro
            label="Calorías"
            icono="flame"
            actual={totales.kcal}
            objetivo={objetivos.kcal}
            unidad="kcal"
            color={COLORS.orange ?? '#f97316'}
          />
          <MonitorMacro
            label="Proteínas"
            icono="barbell"
            actual={totales.prot}
            objetivo={objetivos.prot}
            unidad="g"
            color={COLORS.purple}
          />
          <MonitorMacro
            label="Carbohidratos"
            icono="nutrition"
            actual={totales.cho}
            objetivo={objetivos.cho}
            unidad="g"
            color={COLORS.gold}
          />
          <MonitorMacro
            label="Grasas"
            icono="water"
            actual={totales.fat}
            objetivo={objetivos.fat}
            unidad="g"
            color={COLORS.neon}
          />
        </View>

        {/* ── Lista de grupos ─────────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {GRUPOS.map(grupo => (
            <GrupoEquivalentes
              key={grupo.titulo}
              grupo={grupo}
              porciones={porciones}
              onActualizar={actualizarPorcion}
              onAjustar={ajustarPorcion}
            />
          ))}

          {/* ── Resumen de macros ─────────────────────────────────────────── */}
          <View style={styles.resumenCard}>
            <Text style={styles.resumenTitulo}>Resumen del plan</Text>
            <View style={styles.resumenFila}>
              {(['kcal', 'prot', 'cho', 'fat'] as const).map(k => {
                const valor = totales[k];
                const obj = objetivos[k];
                const delta = obj > 0 ? valor - obj : 0;
                const color = Math.abs(delta) < obj * 0.05
                  ? COLORS.neon
                  : delta > 0 ? '#f87171' : COLORS.gold;
                return (
                  <View key={k} style={styles.resumenItem}>
                    <Text style={[styles.resumenValor, { color }]}>
                      {Math.round(valor)}
                    </Text>
                    <Text style={styles.resumenLabel}>
                      {k === 'kcal' ? 'kcal' : `${k.toUpperCase()} g`}
                    </Text>
                    {obj > 0 && (
                      <Text style={[styles.resumenDelta, { color }]}>
                        {delta > 0 ? '+' : ''}{Math.round(delta)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Botón guardar ─────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.btnGuardar, guardando && { opacity: 0.6 }]}
            onPress={handleGuardar}
            disabled={guardando}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.neon, '#00c47a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {guardando ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#000" />
                  <Text style={styles.btnTexto}>Guardar plan alimentario</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TerminalBackground>
  );
}

// ─── Monitor de macronutriente ────────────────────────────────────────────────

interface MonitorMacroProps {
  label: string;
  icono: string;
  actual: number;
  objetivo: number;
  unidad: string;
  color: string;
}

function MonitorMacro({ label, icono, actual, objetivo, unidad, color }: MonitorMacroProps) {
  const porcentaje = objetivo > 0 ? Math.min(100, (actual / objetivo) * 100) : 0;
  const delta = objetivo > 0 ? actual - objetivo : 0;
  const excede = delta > objetivo * 0.05;
  const enRango = Math.abs(delta) <= objetivo * 0.05;

  const colorBar = excede ? '#f87171' : enRango ? COLORS.neon : COLORS.gold;

  return (
    <View style={[styles.monitor, { borderTopColor: color }]}>
      <View style={styles.monitorHeader}>
        <Ionicons name={icono as any} size={13} color={color} />
        <Text style={styles.monitorLabel}>{label}</Text>
      </View>
      <Text style={[styles.monitorValor, { color: colorBar }]}>
        {Math.round(actual)}
        <Text style={styles.monitorObjetivo}>/{objetivo > 0 ? Math.round(objetivo) : '—'} {unidad}</Text>
      </Text>
      <View style={styles.barraFondo}>
        <View style={[styles.barraRelleno, { width: `${porcentaje}%`, backgroundColor: colorBar }]} />
      </View>
      {objetivo > 0 && (
        <Text style={[styles.monitorDelta, { color: colorBar }]}>
          {excede ? `+${Math.round(delta)} excedido` : enRango ? 'En objetivo ✓' : `${Math.round(delta)} por asignar`}
        </Text>
      )}
    </View>
  );
}

// ─── Grupo de equivalentes ────────────────────────────────────────────────────

interface GrupoEquivalentesProps {
  grupo: GrupoAlimento;
  porciones: Porciones;
  onActualizar: (key: EquivalentKey, valor: string) => void;
  onAjustar: (key: EquivalentKey, delta: number) => void;
}

function GrupoEquivalentes({ grupo, porciones, onActualizar, onAjustar }: GrupoEquivalentesProps) {
  const totalKcalGrupo = grupo.items.reduce((acc, key) => {
    const eq = EQUIVALENTES[key as EquivalentKey];
    return acc + (eq ? eq.kcal * (porciones[key as EquivalentKey] ?? 0) : 0);
  }, 0);

  return (
    <View style={styles.grupo}>
      <View style={[styles.grupoHeader, { borderLeftColor: grupo.color }]}>
        <Text style={styles.grupoIcono}>{grupo.icono}</Text>
        <Text style={styles.grupoTitulo}>{grupo.titulo}</Text>
        {totalKcalGrupo > 0 && (
          <View style={[styles.grupoBadge, { backgroundColor: grupo.color + '22', borderColor: grupo.color + '44' }]}>
            <Text style={[styles.grupoBadgeTxt, { color: grupo.color }]}>
              {Math.round(totalKcalGrupo)} kcal
            </Text>
          </View>
        )}
      </View>

      {grupo.items.map(key => {
        const eq = EQUIVALENTES[key as EquivalentKey];
        if (!eq) return null;
        return (
          <TarjetaPorcion
            key={key}
            alimentoKey={key as EquivalentKey}
            eq={eq}
            valor={porciones[key as EquivalentKey] ?? 0}
            color={grupo.color}
            onActualizar={onActualizar}
            onAjustar={onAjustar}
          />
        );
      })}
    </View>
  );
}

// ─── Tarjeta de porción individual ───────────────────────────────────────────

interface TarjetaPorcionProps {
  alimentoKey: EquivalentKey;
  eq: typeof EQUIVALENTES[EquivalentKey];
  valor: number;
  color: string;
  onActualizar: (key: EquivalentKey, valor: string) => void;
  onAjustar: (key: EquivalentKey, delta: number) => void;
}

function TarjetaPorcion({ alimentoKey, eq, valor, color, onActualizar, onAjustar }: TarjetaPorcionProps) {
  const kcalTotal = Math.round(eq.kcal * valor);
  const activo = valor > 0;

  return (
    <View style={[styles.tarjeta, activo && { borderColor: color + '55', backgroundColor: color + '08' }]}>
      <View style={styles.tarjetaInfo}>
        <Text style={[styles.tarjetaNombre, activo && { color: COLORS.text }]}>{eq.nombre}</Text>
        <Text style={styles.tarjetaEjemplo}>{eq.ejemplo}</Text>
        <View style={styles.tarjetaMacros}>
          <Text style={styles.macroChip}>⚡{eq.kcal} kcal</Text>
          {eq.prot > 0 && <Text style={styles.macroChip}>🥩 {eq.prot}g P</Text>}
          {eq.cho > 0 && <Text style={styles.macroChip}>🌾 {eq.cho}g C</Text>}
          {eq.fat > 0 && <Text style={styles.macroChip}>🫒 {eq.fat}g G</Text>}
        </View>
      </View>

      <View style={styles.tarjetaControles}>
        {activo && (
          <Text style={[styles.tarjetaKcal, { color }]}>{kcalTotal} kcal</Text>
        )}
        <View style={styles.stepper}>
          <TouchableOpacity
            onPress={() => onAjustar(alimentoKey, -0.5)}
            style={[styles.stepBtn, { borderColor: color + '44' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="remove" size={14} color={color} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { color: activo ? color : COLORS.muted }]}
            keyboardType="decimal-pad"
            value={valor > 0 ? String(valor) : '0'}
            onChangeText={v => onActualizar(alimentoKey, v)}
            selectTextOnFocus
          />

          <TouchableOpacity
            onPress={() => onAjustar(alimentoKey, 0.5)}
            style={[styles.stepBtn, { borderColor: color + '44' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={14} color={color} />
          </TouchableOpacity>
        </View>
        <Text style={styles.tarjetaUnidad}>porciones</Text>
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,255,136,0.12)',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, letterSpacing: 0.2 },
  headerSub: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  kcalBadge: {
    alignItems: 'center', backgroundColor: 'rgba(0,255,136,0.1)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,255,136,0.25)',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  kcalBadgeNum: { fontSize: 16, fontWeight: '900', color: COLORS.neon },
  kcalBadgeLbl: { fontSize: 9, color: COLORS.muted, marginTop: 1 },

  // Monitores
  monitors: {
    flexDirection: 'row', gap: 8, padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  monitor: {
    flex: 1, backgroundColor: 'rgba(16,20,30,0.95)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 3, padding: 10, gap: 4,
  },
  monitorHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  monitorLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  monitorValor: { fontSize: 13, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  monitorObjetivo: { fontSize: 10, color: COLORS.muted, fontWeight: '400' },
  monitorDelta: { fontSize: 9, fontWeight: '600', marginTop: 2 },
  barraFondo: { height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 4 },
  barraRelleno: { height: '100%', borderRadius: 2 },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 48, gap: 20 },

  // Grupo
  grupo: {
    backgroundColor: 'rgba(12,15,22,0.8)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  grupoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderLeftWidth: 4, backgroundColor: 'rgba(0,0,0,0.2)',
  },
  grupoIcono: { fontSize: 18 },
  grupoTitulo: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.text, letterSpacing: 0.3 },
  grupoBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  grupoBadgeTxt: { fontSize: 11, fontWeight: '700' },

  // Tarjeta de porción
  tarjeta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'transparent',
    marginHorizontal: 8, marginBottom: 6, borderRadius: 10,
  },
  tarjetaInfo: { flex: 1, gap: 3 },
  tarjetaNombre: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
  tarjetaEjemplo: { fontSize: 11, color: COLORS.dim, lineHeight: 15 },
  tarjetaMacros: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  macroChip: { fontSize: 10, color: COLORS.muted, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  tarjetaControles: { alignItems: 'center', gap: 4 },
  tarjetaKcal: { fontSize: 11, fontWeight: '700' },
  tarjetaUnidad: { fontSize: 9.5, color: COLORS.dim },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 28, height: 28, borderRadius: 8,
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    width: 44, textAlign: 'center', fontSize: 16, fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // Resumen
  resumenCard: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,255,136,0.18)',
    padding: 16, gap: 12,
  },
  resumenTitulo: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  resumenFila: { flexDirection: 'row', justifyContent: 'space-around' },
  resumenItem: { alignItems: 'center', gap: 2 },
  resumenValor: { fontSize: 20, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  resumenLabel: { fontSize: 10, color: COLORS.muted, textTransform: 'uppercase' },
  resumenDelta: { fontSize: 10, fontWeight: '700' },

  // Botón guardar
  btnGuardar: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  btnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  btnTexto: { fontSize: 15, fontWeight: '800', color: '#000', letterSpacing: 0.3 },
});