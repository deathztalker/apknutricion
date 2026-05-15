import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Platform, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
import { patientService, supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '../../types';
import TerminalBackground from '../../components/TerminalBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { dataPortability } from '../../lib/data';

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState({ total: 0, critical: 0, stable: 0 });
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    full_name: '', age: 0, sex: 'M', insurance: 'FONASA',
  });

  const fetchPatients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await patientService.getAll(user.id, search);
      if (error) throw error;
      setPatients(data || []);
      
      const total = data?.length || 0;
      setStats({
        total,
        critical: Math.ceil(total * 0.2), 
        stable: total - Math.ceil(total * 0.2),
      });
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPatients(); }, [search]);

  const handleExport = async () => {
    try {
      await dataPortability.exportPatientsCSV(patients);
    } catch (error: any) {
      Alert.alert('FALLO DE EXTRACCIÓN', error.message);
    }
  };

  const handleImport = async () => {
    try {
      const importedPatients = await dataPortability.importPatientsCSV();
      if (!importedPatients) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      let successCount = 0;
      for (const p of importedPatients) {
        const { error } = await patientService.create({ ...p, user_id: user.id } as any);
        if (!error) successCount++;
      }

      Alert.alert('SISTEMA', `Inyección completada: ${successCount} nuevos sujetos asimilados.`);
      fetchPatients();
    } catch (error: any) {
      Alert.alert('FALLO DE INYECCIÓN', error.message);
    }
  };

  const handleAddPatient = async () => {
    if (!newPatient.full_name || !newPatient.age) {
      Alert.alert('FALLO DE NÚCLEO', 'DATOS BIOMÉTRICOS REQUERIDOS');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');
      const { error } = await patientService.create({ ...newPatient, user_id: user.id });
      if (error) throw error;
      setModalVisible(false);
      setNewPatient({ full_name: '', age: 0, sex: 'M', insurance: 'FONASA' });
      fetchPatients();
      Alert.alert('SISTEMA', 'NUEVO REVENANT INICIALIZADO');
    } catch (error: any) {
      Alert.alert('ERROR CRÍTICO', error.message);
    }
  };

  return (
    <TerminalBackground>
      <View style={styles.container}>
        
        <View style={styles.commandHeader}>
          <LinearGradient colors={['rgba(220, 20, 60, 0.15)', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={styles.topRow}>
            <View>
              <Text style={styles.systemTitle}>ARCHIVO BIOMÉTRICO</Text>
              <Text style={styles.systemSub}>CONTROL DE EXPEDIENTES v6.6.6</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleImport} title="Importar">
                <Ionicons name="cloud-download-outline" size={22} color={COLORS.poison} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { marginLeft: 10 }]} onPress={handleExport} title="Exportar">
                <Ionicons name="share-outline" size={22} color={COLORS.bone} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { marginLeft: 10 }]} onPress={() => supabase.auth.signOut()}>
                <Ionicons name="power" size={22} color={COLORS.crimson} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <DashboardStat label="SUJETOS" value={stats.total} color={COLORS.bone} />
            <DashboardStat label="CRÍTICOS" value={stats.critical} color={COLORS.crimson} />
            <DashboardStat label="ESTABLES" value={stats.stable} color={COLORS.poison} />
          </View>
        </View>

        <View style={styles.searchBarContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={COLORS.crimson} />
            <TextInput
              style={styles.searchInput}
              placeholder="ESCANEAR POR IDENTIDAD..."
              placeholderTextColor={COLORS.dim}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.crimson} />
            <Text style={styles.loadingText}>ACCEDIENDO AL VACÍO...</Text>
          </View>
        ) : (
          <FlatList
            data={patients}
            renderItem={({ item, index }) => <PatientFileCard item={item} index={index} />}
            keyExtractor={(item) => item.id!}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={fetchPatients} tintColor={COLORS.crimson} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="skull" size={80} color={COLORS.dim} />
                <Text style={styles.emptyText}>SIN REGISTROS ACTIVOS</Text>
              </View>
            }
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>

        <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>NUEVO REVENANT</Text>
              <View style={styles.modalDivider} />
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ALIAS DE IDENTIDAD</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nombre Completo"
                  placeholderTextColor={COLORS.dim}
                  value={newPatient.full_name}
                  onChangeText={(v) => setNewPatient({ ...newPatient, full_name: v })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EDAD (GÉNESIS)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.dim}
                  keyboardType="numeric"
                  value={String(newPatient.age || '')}
                  onChangeText={(v) => setNewPatient({ ...newPatient, age: parseInt(v) || 0 })}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>GENOTIPO</Text>
                  <View style={styles.miniBtnRow}>
                    {['M', 'F'].map(s => (
                      <TouchableOpacity 
                        key={s}
                        style={[styles.miniBtn, newPatient.sex === s && styles.activeMiniBtn]} 
                        onPress={() => setNewPatient({ ...newPatient, sex: s as any })}
                      >
                        <Text style={[styles.miniBtnText, newPatient.sex === s && styles.activeMiniBtnText]}>{s === 'M' ? 'XY' : 'XX'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>PREVISIÓN</Text>
                  <View style={styles.miniBtnRow}>
                    {['FONASA', 'ISAPRE'].map(i => (
                      <TouchableOpacity 
                        key={i}
                        style={[styles.miniBtn, newPatient.insurance === i && styles.activeMiniBtn]} 
                        onPress={() => setNewPatient({ ...newPatient, insurance: i })}
                      >
                        <Text style={[styles.miniBtnText, newPatient.insurance === i && styles.activeMiniBtnText]}>{i[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>ABORTAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddPatient}>
                  <Text style={styles.saveBtnText}>INICIALIZAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TerminalBackground>
  );
}

function DashboardStat({ label, value, color }: any) {
  return (
    <View style={[styles.statBox, { borderLeftColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function PatientFileCard({ item, index }: { item: Patient, index: number }) {
  const isAlt = index % 2 === 0;
  return (
    <TouchableOpacity 
      style={[styles.fileCard, isAlt && { backgroundColor: 'rgba(255,255,255,0.01)' }]}
      onPress={() => router.push(`/(app)/patient/${item.id}`)}
    >
      <View style={styles.fileIcon}>
        <Ionicons name="document-text-outline" size={24} color={COLORS.crimson} />
      </View>
      <View style={styles.fileContent}>
        <View style={styles.fileHeader}>
          <Text style={styles.fileName}>{item.full_name.toUpperCase()}</Text>
          <Text style={styles.fileDate}>{new Date(item.created_at || Date.now()).toLocaleDateString('es-CL')}</Text>
        </View>
        <View style={styles.fileDetails}>
          <Text style={styles.fileDetailText}>ID: {item.id?.substring(0, 10).toUpperCase()}</Text>
          <View style={styles.vDivider} />
          <Text style={styles.fileDetailText}>{item.sex === 'M' ? 'MALE' : 'FEMALE'}</Text>
          <View style={styles.vDivider} />
          <Text style={styles.fileDetailText}>{item.age} AÑOS</Text>
        </View>
        <View style={styles.statusIndicatorRow}>
          <View style={[styles.statusDot, { backgroundColor: index % 4 === 0 ? COLORS.crimson : COLORS.poison }]} />
          <Text style={styles.statusText}>{index % 4 === 0 ? 'INTERVENCIÓN REQUERIDA' : 'ESTADO ESTABLE'}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.dim} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  commandHeader: { padding: 25, paddingTop: Platform.OS === 'ios' ? 60 : 30, backgroundColor: '#000', borderBottomWidth: 1, borderBottomColor: '#1a1a1f' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  systemTitle: { color: COLORS.bone, fontSize: 24, fontFamily: FONTS.horror, letterSpacing: 1 },
  systemSub: { color: COLORS.crimson, fontSize: 9, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderWidth: 1, borderColor: '#1a1a1f' },
  statsContainer: { flexDirection: 'row', gap: 15 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderLeftWidth: 3, gap: 5 },
  statLabel: { fontSize: 8, color: COLORS.dim, fontWeight: 'bold', letterSpacing: 1 },
  statValue: { fontSize: 22, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  searchBarContainer: { padding: 15, backgroundColor: 'rgba(0,0,0,0.3)' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderWidth: 1, borderColor: '#1a1a1f', paddingHorizontal: 15, height: 50, gap: 12 },
  searchInput: { flex: 1, color: COLORS.white, fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  listContent: { paddingBottom: 100 },
  fileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a1f', gap: 15 },
  fileIcon: { width: 50, height: 50, backgroundColor: 'rgba(220, 20, 60, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(220, 20, 60, 0.1)' },
  fileContent: { flex: 1 },
  fileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  fileName: { color: COLORS.bone, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  fileDate: { color: COLORS.dim, fontSize: 10, fontWeight: 'bold' },
  fileDetails: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 10 },
  fileDetailText: { color: COLORS.muted, fontSize: 10, fontWeight: 'bold' },
  vDivider: { width: 1, height: 10, backgroundColor: COLORS.dim },
  statusIndicatorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3, ...SHADOWS.crimson },
  statusText: { color: COLORS.dim, fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
  loadingText: { color: COLORS.crimson, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 20 },
  emptyText: { color: COLORS.dim, fontFamily: FONTS.horror, fontSize: 24 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 65, height: 65, backgroundColor: COLORS.crimson, justifyContent: 'center', alignItems: 'center', ...SHADOWS.crimson },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalView: { width: '100%', maxWidth: 400, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.crimson, padding: 30, gap: 20, ...SHADOWS.crimson },
  modalTitle: { fontSize: 32, fontFamily: FONTS.horror, color: COLORS.white, textAlign: 'center' },
  modalDivider: { height: 1, backgroundColor: COLORS.crimson, width: '30%', alignSelf: 'center', marginBottom: 10 },
  inputGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: 'bold', color: COLORS.muted, letterSpacing: 1 },
  modalInput: { backgroundColor: '#000', borderWidth: 1, borderColor: '#222', padding: 15, color: COLORS.white, fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  row: { flexDirection: 'row', gap: 15 },
  miniBtnRow: { flexDirection: 'row', gap: 10 },
  miniBtn: { flex: 1, height: 45, borderWidth: 1, borderColor: '#222', justifyContent: 'center', alignItems: 'center' },
  activeMiniBtn: { borderColor: COLORS.crimson, backgroundColor: 'rgba(220, 20, 60, 0.1)' },
  miniBtnText: { color: COLORS.dim, fontSize: 12, fontWeight: 'bold' },
  activeMiniBtnText: { color: COLORS.white },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 10 },
  cancelBtn: { flex: 1, height: 55, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  cancelBtnText: { color: COLORS.dim, fontWeight: 'bold', letterSpacing: 1 },
  saveBtn: { flex: 1, height: 55, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.crimson },
  saveBtnText: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 20 },
});
