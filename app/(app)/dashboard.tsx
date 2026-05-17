import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Platform, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
import { patientService, supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '../../types';
import TerminalBackground from '../../components/TerminalBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { dataPortability } from '../../lib/data';
import { usePatientStore } from '../../store/patientStore';
import { useAuthStore } from '../../store/authStore';

export default function Dashboard() {
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
        setStats({
          total,
          critical: data?.filter(p => Math.random() > 0.8).length || 0, // Mock risk check
          stable: data?.filter(p => Math.random() <= 0.8).length || 0,
        });
      } else {
        // Global History with Joins and Search
        let query = supabase
          .from('clinical_records')
          .select(`
            *,
            patients!inner (
              full_name,
              insurance,
              sex
            )
          `)
          .eq('user_id', session.user.id)
          .order('record_date', { ascending: false });

        if (search) {
          query = query.ilike('patients.full_name', `%${search}%`);
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;
        setRecords(data || []);
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
    <TerminalBackground>
      <View style={styles.container}>
        
        {/* COMMAND CENTER DASHBOARD */}
        <View style={styles.commandHeader}>
          <LinearGradient colors={['rgba(255, 0, 60, 0.25)', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={styles.topRow}>
            <View>
              <Text style={styles.mainTitle}>BIO-NÚCLEO ALPHA</Text>
              <Text style={styles.subTitle}>SISTEMA DE CONTROL CLÍNICO v8.0</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={[styles.headBtn, SHADOWS.poison]} onPress={() => dataPortability.importPatientsCSV().then(fetchData)}>
                <Ionicons name="cloud-upload" size={20} color={COLORS.poison} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headBtn, { marginLeft: 10 }, SHADOWS.crimson]} onPress={() => dataPortability.exportPatientsCSV(patients)}>
                <Ionicons name="download" size={20} color={COLORS.sky} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headBtn, { marginLeft: 10 }]} onPress={() => supabase.auth.signOut()}>
                <Ionicons name="power" size={20} color={COLORS.crimson} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatItem label="TOTAL SUJETOS" value={stats.total} color={COLORS.bone} />
            <StatItem label="RIESGO BIO" value={stats.critical} color={COLORS.crimson} />
            <StatItem label="ESTADO OK" value={stats.stable} color={COLORS.poison} />
          </View>
        </View>

        {/* TABS SELECTOR */}
        <View style={styles.tabSelector}>
          <TouchableOpacity 
            style={[styles.tab, activeView === 'directorio' && styles.activeTab]} 
            onPress={() => setActiveView('directorio')}
          >
            <Ionicons name="people" size={18} color={activeView === 'directorio' ? COLORS.crimson : COLORS.dim} />
            <Text style={[styles.tabText, activeView === 'directorio' && styles.activeTabText]}>DIRECTORIO</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeView === 'historial' && styles.activeTab]} 
            onPress={() => setActiveView('historial')}
          >
            <Ionicons name="time" size={18} color={activeView === 'historial' ? COLORS.crimson : COLORS.dim} />
            <Text style={[styles.tabText, activeView === 'historial' && styles.activeTabText]}>HISTORIAL</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH CONSOLE */}
        <View style={styles.searchConsole}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.crimson} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeView === 'directorio' ? "BUSCAR POR NOMBRE..." : "FILTRAR HISTORIAL..."}
              placeholderTextColor="#555"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.crimson} />
            <Text style={styles.loadingText}>DESCRIPTANDO DATOS...</Text>
          </View>
        ) : (
          <FlatList
            data={activeView === 'directorio' ? patients : records}
            renderItem={({ item }) => 
              activeView === 'directorio' 
                ? <DirectoryItem item={item} />
                : <HistoryItem item={item} />
            }
            keyExtractor={(item) => item.id!}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.crimson} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="skull" size={80} color="#1a1a1f" />
                <Text style={styles.emptyText}>VACÍO DETECTADO</Text>
              </View>
            }
          />
        )}

        <TouchableOpacity style={[styles.fab, SHADOWS.crimson]} onPress={() => router.push('/(app)/patient/new')}>
          <Ionicons name="add" size={36} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </TerminalBackground>
  );
}

// ATOMIC COMPONENTS
function StatItem({ label, value, color }: any) {
  return (
    <View style={[styles.statBox, { borderLeftColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function DirectoryItem({ item }: { item: Patient }) {
  return (
    <TouchableOpacity 
      style={styles.fileCard}
      onPress={() => router.push(`/(app)/patient/${item.id}`)}
    >
      <View style={styles.fileAvatar}>
        <Text style={styles.avatarLetter}>{item.full_name[0].toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName}>{item.full_name.toUpperCase()}</Text>
        <Text style={styles.fileInfo}>{item.insurance} | {item.sex === 'M' ? 'XY' : 'XX'} | {item.age} AÑOS</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={COLORS.crimson} />
    </TouchableOpacity>
  );
}

function HistoryItem({ item }: any) {
  return (
    <TouchableOpacity 
      style={[styles.fileCard, { borderLeftColor: COLORS.purple }]}
      onPress={() => router.push(`/(app)/patient/${item.patient_id}`)}
    >
      <View style={[styles.fileAvatar, { backgroundColor: 'rgba(157, 0, 255, 0.1)' }]}>
        <Ionicons name="pulse" size={24} color={COLORS.purple} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text style={styles.fileName}>{item.patients?.full_name?.toUpperCase() || 'SUJETO'}</Text>
          <Text style={styles.cardDate}>{new Date(item.record_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</Text>
        </View>
        <View style={styles.historyDetail}>
          <Text style={styles.historyStat}>IMC: <Text style={{ color: '#fff' }}>{item.bmi}</Text></Text>
          <Text style={[styles.historyStat, { marginLeft: 15 }]}>ESTADO: <Text style={{ color: COLORS.crimson }}>{item.bmi_status}</Text></Text>
        </View>
      </View>
      <Ionicons name="eye-outline" size={20} color={COLORS.purple} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  commandHeader: { padding: 25, paddingTop: Platform.OS === 'ios' ? 60 : 30, backgroundColor: '#000', borderBottomWidth: 1, borderBottomColor: '#222' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  mainTitle: { color: COLORS.bone, fontSize: 28, fontFamily: FONTS.horror, letterSpacing: 2, textShadowColor: COLORS.crimson, textShadowRadius: 15 },
  subTitle: { color: COLORS.crimson, fontSize: 10, fontWeight: '900', letterSpacing: 4, marginTop: 5 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headBtn: { backgroundColor: '#0f0f16', padding: 12, borderWidth: 1, borderColor: '#333' },
  statsRow: { flexDirection: 'row', gap: 15 },
  statBox: { flex: 1, backgroundColor: '#0f0f16', padding: 18, borderLeftWidth: 5, gap: 6, ...SHADOWS.crimson },
  statLabel: { fontSize: 9, color: COLORS.dim, fontWeight: 'bold', letterSpacing: 1.5 },
  statValue: { fontSize: 30, fontWeight: '900', color: COLORS.white, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  tabSelector: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.9)', borderBottomWidth: 1, borderBottomColor: '#222' },
  tab: { flex: 1, paddingVertical: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 12, borderBottomWidth: 4, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: COLORS.crimson, backgroundColor: 'rgba(255,0,60,0.1)' },
  tabText: { color: COLORS.dim, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  activeTabText: { color: COLORS.white },

  searchConsole: { padding: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderWidth: 1, borderColor: COLORS.crimson, paddingHorizontal: 18, height: 60, gap: 15 },
  searchInput: { flex: 1, color: COLORS.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  
  list: { paddingBottom: 120 },
  fileCard: { flexDirection: 'row', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#1a1a1f', gap: 20, backgroundColor: 'rgba(15,15,22,0.8)', borderLeftWidth: 4, borderLeftColor: COLORS.crimson },
  fileAvatar: { width: 60, height: 60, backgroundColor: 'rgba(255, 0, 60, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 0, 60, 0.3)' },
  avatarLetter: { fontSize: 32, fontFamily: FONTS.horror, color: COLORS.crimson },
  fileName: { color: COLORS.white, fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  fileInfo: { color: COLORS.muted, fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginTop: 6 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { color: COLORS.dim, fontSize: 11, fontWeight: '900' },
  historyDetail: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  historyStat: { color: COLORS.muted, fontSize: 12, fontWeight: 'bold' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  loadingText: { color: COLORS.crimson, fontSize: 14, fontWeight: '900', letterSpacing: 4 },
  empty: { alignItems: 'center', marginTop: 120, gap: 20 },
  emptyText: { color: COLORS.dim, fontFamily: FONTS.horror, fontSize: 32, letterSpacing: 3 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 80, height: 80, backgroundColor: COLORS.crimson, justifyContent: 'center', alignItems: 'center', borderRadius: 0 },
});
