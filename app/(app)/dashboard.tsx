import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Platform, Alert, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
import { supabase, patientService, recordService } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '../../types';
import TerminalBackground from '../../components/TerminalBackground';
import CyberInput from '../../components/CyberInput';
import { LinearGradient } from 'expo-linear-gradient';
import { dataPortability } from '../../lib/data';
import { usePatientStore } from '../../store/patientStore';
import { useAuthStore } from '../../store/authStore';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated, Easing } from 'react-native';
import NeuralBackground from '../../components/NeuralBackground';

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const [activeView, setActiveView] = useState<'directorio' | 'historial'>('directorio');
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { patients, setPatients } = usePatientStore();
  const { session } = useAuthStore();
  
  const [stats, setStats] = useState({ total: 0, critical: 0, stable: 0 });

  const fetchData = async () => {
    try {
      if (!session?.user) return;

      if (activeView === 'directorio') {
        const { data, error } = await patientService.getAll(session.user.id, search);
        if (error) throw error;
        setPatients(data || []);
        const total = data?.length || 0;
        // Real risk stats based on age and data
        const critical = data?.filter((p: any) => p.age && (p.age > 65 || p.age < 18)).length || 0;
        const stable = total - critical;
        setStats({ total, critical, stable });
      } else {
        // Global History with Local Service
        const { data: recordsData, error: rError } = await recordService.getByUser(session.user.id);
        if (rError) throw rError;
        
        let filtered = recordsData || [];
        if (search) {
          const lowerSearch = search.toLowerCase();
          filtered = filtered.filter((r: any) => r.patients?.full_name?.toLowerCase().includes(lowerSearch));
        }
        
        setRecords(filtered.sort((a: any, b: any) => new Date(b.record_date!).getTime() - new Date(a.record_date!).getTime()).slice(0, 50));
      }
    } catch (error) {
      console.error('Error de núcleo:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [activeView])
  );

  const glitchX = React.useRef(new Animated.Value(0)).current;
  const glitchOpacity = React.useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      const xLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glitchX, { toValue: 2, duration: 40, useNativeDriver: false }),
          Animated.timing(glitchX, { toValue: -2, duration: 40, useNativeDriver: false }),
          Animated.timing(glitchX, { toValue: 0, duration: 40, useNativeDriver: false }),
          Animated.delay(3000)
        ])
      );
      const opacityLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glitchOpacity, { toValue: 0.6, duration: 40, useNativeDriver: false }),
          Animated.timing(glitchOpacity, { toValue: 1, duration: 40, useNativeDriver: false }),
          Animated.delay(3000)
        ])
      );

      xLoop.start();
      opacityLoop.start();

      return () => {
        xLoop.stop();
        opacityLoop.stop();
        glitchX.setValue(0);
        glitchOpacity.setValue(1);
      };
    }, [])
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <NeuralBackground>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
        
        {/* COMMAND CENTER DASHBOARD (GLASSMORPHISM) */}
        <View style={styles.commandHeader}>
          <LinearGradient colors={['rgba(255, 107, 0, 0.15)', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={styles.topRow}>
            <View style={styles.profileAvatarContainer}>
              <Image source={require('../../assets/images/camila_avatar.jpg')} style={styles.profileAvatar} />
            </View>
            <View style={{ flex: 1, paddingRight: 10, justifyContent: 'center', marginLeft: 15 }}>
              <Animated.View style={{ transform: [{ translateX: glitchX }], opacity: glitchOpacity }}>
                <Text style={styles.mainTitle} adjustsFontSizeToFit={true} numberOfLines={1}>[ MEOW CLUB NÚCLEO //_ ]</Text>
              </Animated.View>
              <Text style={styles.subTitle}>&gt; CREADO POR CAMILA OLIVARES ARCE</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.headBtn, { borderColor: COLORS.poison, shadowColor: COLORS.poison }]} 
                onPress={async () => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    const imported = await dataPortability.importPatientsCSV();
                    if (imported && imported.length > 0) {
                      Alert.alert('INFECCIÓN EXITOSA', `${imported.length} ALMAS ABSORBIDAS AL NÚCLEO.`);
                      fetchData(); // Recargar lista
                    }
                  } catch (e: any) {
                    Alert.alert('FALLO DE INYECCIÓN', e.message || 'Error al importar datos.');
                  }
                }}
              >
                <Ionicons name="cloud-upload" size={20} color={COLORS.poison} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headBtn, { marginLeft: 10, borderColor: COLORS.sky, shadowColor: COLORS.sky }]} 
                onPress={async () => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    await dataPortability.exportPatientsCSV(patients);
                    Alert.alert('EXTRACCIÓN COMPLETA', 'DOSSIER BIOMÉTRICO EXPORTADO AL VACÍO.');
                  } catch (e: any) {
                    Alert.alert('FALLO DE EXTRACCIÓN', e.message || 'Error al exportar datos.');
                  }
                }}
              >
                <Ionicons name="download" size={20} color={COLORS.sky} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headBtn, { marginLeft: 10, borderColor: COLORS.crimson, shadowColor: COLORS.crimson }]} 
                onPress={async () => { 
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); 
                    await supabase.auth.signOut();
                    router.replace('/login');
                  } catch (e: any) {
                    Alert.alert('ERROR', e.message);
                  }
                }}>
                <Ionicons name="power" size={20} color={COLORS.crimson} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatItem label="GHOULS" value={stats.total} color={COLORS.orange} />
            <StatItem label="ALTO RIESGO" value={stats.critical} color={COLORS.crimson} />
            <StatItem label="SALUDABLES" value={stats.stable} color={COLORS.neon} />
          </View>
        </View>

        {/* PILL TAB SELECTOR */}
        <View style={styles.tabSelectorContainer}>
          <View style={styles.pillSelector}>
            <TouchableOpacity 
              style={[styles.pill, activeView === 'directorio' && styles.activePill]} 
              onPress={() => { Haptics.selectionAsync(); setActiveView('directorio'); }}
            >
              <Ionicons name="people" size={16} color={activeView === 'directorio' ? COLORS.white : COLORS.dim} />
              <Text style={[styles.pillText, activeView === 'directorio' && styles.activePillText]}>SUJETOS</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pill, activeView === 'historial' && styles.activePill]} 
              onPress={() => { Haptics.selectionAsync(); setActiveView('historial'); }}
            >
              <Ionicons name="time" size={16} color={activeView === 'historial' ? COLORS.white : COLORS.dim} />
              <Text style={[styles.pillText, activeView === 'historial' && styles.activePillText]}>AUTOPSIAS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* GLASS SEARCH CONSOLE */}
        <View style={styles.searchConsole}>
          <CyberInput
            label="INTERFAZ DE BÚSQUEDA"
            value={search}
            onChangeText={setSearch}
            placeholder={activeView === 'directorio' ? "BUSCAR POR NOMBRE..." : "FILTRAR HISTORIAL..."}
            color={COLORS.purple}
          />
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.crimson} />
            <Text style={styles.loadingText}>DESENCRIPTANDO DATOS...</Text>
          </View>
        ) : (
          <FlatList
            data={activeView === 'directorio' ? patients : records}
            renderItem={({ item, index }) => 
              activeView === 'directorio' 
                ? <DirectoryItem item={item} index={index} />
                : <HistoryItem item={item} index={index} />
            }
            keyExtractor={(item) => item.id!}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.crimson} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="skull-outline" size={70} color={COLORS.crimson} />
                <Text style={[styles.emptyText, { color: COLORS.crimson, fontFamily: FONTS.horror, fontSize: 24 }]}>SIN CARNE FRESCA</Text>
                <Text style={styles.emptyText}>[!] ESPERANDO SUJETOS PARA DISECCIÓN...</Text>
              </View>
            }
          />
        )}

        <PulsingFab onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); router.push('/(app)/patient/new'); }} />
        
        {/* BOTTOM NAV BAR */}
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 15) }]}>
          <TouchableOpacity style={styles.navItem} onPress={() => { Haptics.selectionAsync(); router.push('/(app)/calculator'); }}>
            <Ionicons name="skull" size={24} color={COLORS.orange} />
            <Text style={[styles.navText, { color: COLORS.orange }]}>HUB</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { Haptics.selectionAsync(); router.push('/(app)/ai-chat'); }}>
            <Ionicons name="hardware-chip" size={24} color={COLORS.dim} />
            <Text style={styles.navText}>IA NÚCLEO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { Haptics.selectionAsync(); router.push('/(app)/calculator'); }}>
            <Ionicons name="calculator" size={24} color={COLORS.dim} />
            <Text style={styles.navText}>CALCULADORA</Text>
          </TouchableOpacity>
        </View>
      </View>
    </NeuralBackground>
  );
}

// ATOMIC COMPONENTS
function PulsingFab({ onPress }: { onPress: () => void }) {
  const pulseScale = React.useRef(new Animated.Value(1)).current;
  const pulseOpacity = React.useRef(new Animated.Value(0.8)).current;
  const spin = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const scaleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.05, duration: 1500, useNativeDriver: false }),
          Animated.timing(pulseScale, { toValue: 1, duration: 1500, useNativeDriver: false })
        ])
      );
      const opLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.4, duration: 1500, useNativeDriver: false }),
          Animated.timing(pulseOpacity, { toValue: 0.8, duration: 1500, useNativeDriver: false })
        ])
      );
      const spinLoop = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: false })
      );

      scaleLoop.start();
      opLoop.start();
      spinLoop.start();

      return () => {
        scaleLoop.stop();
        opLoop.stop();
        spinLoop.stop();
      };
    }, [])
  );

  const spinInterpolate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.fabContainer}>
      <Animated.View style={[styles.fabGlow, { transform: [{ scale: pulseScale }], opacity: pulseOpacity, borderRadius: 10, backgroundColor: 'rgba(255, 0, 60, 0.2)' }]} />
      <TouchableOpacity onPress={onPress}>
        <Animated.View style={[styles.fab, { borderRadius: 15, borderWidth: 1, borderColor: COLORS.crimson, overflow: 'hidden' }]}>
          <LinearGradient colors={['rgba(255,0,60,0.5)', 'rgba(255,0,60,0.1)']} style={StyleSheet.absoluteFill} />
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinInterpolate }], borderWidth: 2, borderColor: COLORS.crimson, borderStyle: 'dashed', borderRadius: 15, opacity: 0.5 }]} />
          <Ionicons name="add" size={32} color={COLORS.white} style={{ textShadowColor: COLORS.crimson, textShadowRadius: 10 }} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}
function StatItem({ label, value, color }: { label: string, value: number | string, color: string }) {
  // Glow requires native driver false or we can just ignore animating it to avoid crashes
  return (
    <View style={[styles.statBox, { borderLeftColor: color, shadowRadius: 10, elevation: 5 }]}>
      <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function DirectoryItem({ item, index }: { item: Patient, index: number }) {
  return (
    <Animated.View>
      <TouchableOpacity onPress={() => { Haptics.selectionAsync(); router.push(`/(app)/patient/${item.id}`); }}>
        <View style={[styles.fileCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIdText}>ID // {item.id?.substring(0, 8).toUpperCase() || 'UNKNOWN'}</Text>
          <View style={[styles.statusDot, { backgroundColor: COLORS.neon }]} />
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.fileAvatar, { borderColor: COLORS.neon, shadowColor: COLORS.neon, shadowOpacity: 0.5, shadowRadius: 5 }]}>
            <Text style={styles.avatarLetter}>{item.full_name[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <Text style={styles.fileName}>{item.full_name.toUpperCase()}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.hudBadge}>
                <Text style={styles.hudBadgeText}>{item.insurance}</Text>
              </View>
              <View style={styles.hudBadge}>
                <Text style={styles.hudBadgeText}>{item.sex === 'M' ? 'XY' : 'XX'}</Text>
              </View>
              <View style={styles.hudBadge}>
                <Text style={styles.hudBadgeText}>{item.age} AÑ</Text>
              </View>
            </View>
          </View>
          <Ionicons name="scan-outline" size={26} color={COLORS.neon} />
        </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function HistoryItem({ item, index }: any) {
  return (
    <Animated.View>
      <TouchableOpacity onPress={() => { Haptics.selectionAsync(); router.push(`/(app)/patient/${item.patient_id}`); }}>
        <View style={[styles.fileCard, { borderLeftColor: COLORS.purple, shadowColor: COLORS.purple }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIdText}>REG // {new Date(item.record_date).toISOString().substring(0, 10).replace(/-/g, '')}</Text>
          <View style={[styles.statusDot, { backgroundColor: COLORS.purple }]} />
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.fileAvatar, { backgroundColor: 'rgba(157, 0, 255, 0.1)', borderColor: COLORS.purple, shadowColor: COLORS.purple, shadowOpacity: 0.5, shadowRadius: 5 }]}>
            <Ionicons name="pulse" size={28} color={COLORS.purple} />
          </View>
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <Text style={styles.fileName}>{item.patients?.full_name?.toUpperCase() || 'SUJETO'}</Text>
            <View style={styles.hudBar}>
              <View style={[styles.hudBarFill, { width: item.bmi ? `${Math.min((item.bmi / 40) * 100, 100)}%` : '50%', backgroundColor: COLORS.purple }]} />
            </View>
            <View style={styles.historyDetail}>
              <Text style={styles.historyStat}>IMC: <Text style={{ color: COLORS.neon }}>{item.bmi}</Text></Text>
              <Text style={[styles.historyStat, { marginLeft: 15 }]}>ST: <Text style={{ color: COLORS.crimson }}>{item.bmi_status}</Text></Text>
            </View>
          </View>
          <Ionicons name="documents-outline" size={26} color={COLORS.purple} />
        </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  commandHeader: { 
    padding: 15,
    backgroundColor: 'rgba(5,5,10,0.75)',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.orange,
    marginBottom: 10,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  profileAvatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: COLORS.neon,
    backgroundColor: 'rgba(0, 255, 159, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 46,
    height: 46,
    resizeMode: 'cover',
  },
  mainTitle: { 
    color: COLORS.neon, 
    fontSize: 22, 
    fontWeight: 'bold', 
    fontFamily: FONTS.horror,
    textShadowColor: COLORS.neon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 2
  },
  subTitle: { 
    color: COLORS.purple, 
    fontSize: 9, 
    fontWeight: '900', 
    letterSpacing: 3, 
    marginTop: 2,
    textTransform: 'uppercase'
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headBtn: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 10, 
    borderWidth: 1, 
    borderColor: COLORS.dim,
    borderRadius: 20,
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { 
    flex: 1, 
    backgroundColor: 'rgba(10,10,20,0.8)', 
    padding: 12, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderLeftWidth: 4, 
    borderRadius: 8,
    overflow: 'hidden'
  },
  statLabel: { fontSize: 9, color: COLORS.muted, fontWeight: 'bold', letterSpacing: 1 },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.white, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  tabSelectorContainer: { paddingHorizontal: 15, marginBottom: 15 },
  pillSelector: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 107, 0, 0.3)',
    padding: 4, 
    gap: 4 
  },
  pill: { 
    flex: 1, 
    flexDirection: 'row', 
    paddingVertical: 10, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6,
    borderRadius: 4,
  },
  activePill: { 
    backgroundColor: COLORS.orange, 
    shadowColor: COLORS.orange, 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.6, 
    shadowRadius: 8,
    elevation: 4
  },
  pillText: { color: COLORS.dim, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  activePillText: { color: COLORS.white, fontWeight: '900', letterSpacing: 2 },

  searchConsole: { paddingHorizontal: 15, marginBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 15, 
    height: 45, 
    gap: 10,
    borderRadius: 8
  },
  searchInput: { flex: 1, color: COLORS.white, fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  
  list: { paddingBottom: 180, paddingHorizontal: 15 },
  fileCard: { 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: 14, 
    borderWidth: 1,
    borderColor: 'rgba(0,255,159,0.15)',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(5,5,10,0.6)', 
    borderLeftWidth: 3, 
    borderLeftColor: COLORS.neon,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 5,
    marginBottom: 10,
    width: '100%',
  },
  cardIdText: {
    fontFamily: FONTS.space,
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 2,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  hudBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hudBadgeText: {
    color: COLORS.muted,
    fontFamily: FONTS.space,
    fontSize: 9,
  },
  hudBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginVertical: 6,
    width: '80%',
    overflow: 'hidden',
  },
  hudBarFill: {
    height: '100%',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  fileAvatar: { 
    width: 50, 
    height: 50, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: 23 
  },
  avatarLetter: { fontSize: 24, fontFamily: FONTS.horror, color: COLORS.neon },
  glitchText: { fontSize: 24, fontFamily: FONTS.space, color: COLORS.neon, letterSpacing: 3, fontWeight: 'bold' },
  fileName: { color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  fileInfo: { color: COLORS.muted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
  
  
  cardDate: { color: COLORS.purple, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  historyDetail: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  historyStat: { color: COLORS.bone, fontSize: 11, fontWeight: 'bold' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  loadingText: { color: COLORS.orange, fontSize: 14, fontWeight: '900', letterSpacing: 3, fontFamily: FONTS.horror },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { color: COLORS.muted, fontFamily: FONTS.space, fontSize: 13, letterSpacing: 2, textAlign: 'center' },
  fabContainer: {
    position: 'absolute', 
    bottom: 110, 
    right: 30, 
    width: 64, 
    height: 64,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fabGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.crimson,
  },
  fab: { 
    width: 56, 
    height: 56, 
    backgroundColor: COLORS.crimson, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    elevation: 10
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(5,5,5,0.85)',
    borderTopWidth: 2,
    borderTopColor: COLORS.crimson,
    paddingTop: 10,
    justifyContent: 'space-around',
    shadowColor: COLORS.crimson,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    fontFamily: FONTS.space,
    color: COLORS.dim,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
});
