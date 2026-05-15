import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Platform, Modal, Alert, Animated } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
import { patientService, supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '../../types';
import TerminalBackground from '../../components/TerminalBackground';
import { LinearGradient } from 'expo-linear-gradient';

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
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
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPatients(); }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const handleAddPatient = async () => {
    if (!newPatient.full_name || !newPatient.age) {
      Alert.alert('SYSTEM ERROR', 'BIOMETRIC DATA INCOMPLETE');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');
      const { error } = await patientService.create({ ...newPatient, user_id: user.id });
      if (error) throw error;
      setModalVisible(false);
      setNewPatient({ full_name: '', age: 0, sex: 'M', insurance: 'FONASA' });
      fetchPatients();
    } catch (error: any) {
      Alert.alert('GENESIS FAILURE', error.message);
    }
  };

  const renderPatientItem = ({ item, index }: { item: Patient, index: number }) => (
    <TouchableOpacity 
      style={styles.patientCard}
      onPress={() => router.push(`/(app)/patient/${item.id}`)}
    >
      <View style={styles.cardGlow} />
      <View style={styles.cardHeader}>
        <Text style={styles.patientID}>DOSSIER: {item.id?.substring(0, 8).toUpperCase()}</Text>
        <Ionicons name="skull-outline" size={14} color={COLORS.crimson} />
      </View>
      
      <Text style={styles.patientName}>{item.full_name.toUpperCase()}</Text>
      
      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>{item.age}Y</Text>
        <View style={styles.dot} />
        <Text style={styles.detailText}>{item.sex === 'M' ? 'XY' : 'XX'}</Text>
        <View style={styles.dot} />
        <Text style={styles.detailText}>{item.insurance}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.statusTag, { borderColor: index % 2 === 0 ? COLORS.poison : COLORS.purple }]}>
          <Text style={[styles.statusTagText, { color: index % 2 === 0 ? COLORS.poison : COLORS.purple }]}>
            {index % 2 === 0 ? 'INFECTED' : 'NEURAL LINK ACTIVE'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.crimson} />
      </View>
    </TouchableOpacity>
  );

  return (
    <TerminalBackground>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.headerTitle}>BIOMETRIC DOSSIERS</Text>
          <TouchableOpacity onPress={() => supabase.auth.signOut()}>
            <Ionicons name="power" size={24} color={COLORS.crimson} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.crimson} />
          <TextInput
            style={styles.searchInput}
            placeholder="SCAN BY IDENTITY..."
            placeholderTextColor={COLORS.dim}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
          <Text style={styles.loadingText}>SYNCHRONIZING VOID...</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.crimson} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="skull" size={80} color={COLORS.dim} />
              <Text style={styles.emptyText}>NO SOULS FOUND</Text>
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
            <Text style={styles.modalTitle}>NEW REVENANT</Text>
            <View style={styles.modalDivider} />
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>IDENTITY ALIAS</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={COLORS.dim}
                value={newPatient.full_name}
                onChangeText={(v) => setNewPatient({ ...newPatient, full_name: v })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>YEARS SINCE GENESIS (AGE)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.dim}
                keyboardType="numeric"
                value={String(newPatient.age || '')}
                onChangeText={(v) => setNewPatient({ ...newPatient, age: parseInt(v) || 0 })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>GENOTYPE</Text>
                <View style={styles.miniBtnRow}>
                  <TouchableOpacity style={[styles.miniBtn, newPatient.sex === 'M' && styles.activeMiniBtn]} onPress={() => setNewPatient({ ...newPatient, sex: 'M' })}>
                    <Text style={[styles.miniBtnText, newPatient.sex === 'M' && styles.activeMiniBtnText]}>XY</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.miniBtn, newPatient.sex === 'F' && styles.activeMiniBtn]} onPress={() => setNewPatient({ ...newPatient, sex: 'F' })}>
                    <Text style={[styles.miniBtnText, newPatient.sex === 'F' && styles.activeMiniBtnText]}>XX</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>INSURANCE</Text>
                <View style={styles.miniBtnRow}>
                  {['FONASA', 'ISAPRE'].map(i => (
                    <TouchableOpacity key={i} style={[styles.miniBtn, newPatient.insurance === i && styles.activeMiniBtn]} onPress={() => setNewPatient({ ...newPatient, insurance: i })}>
                      <Text style={[styles.miniBtnText, newPatient.insurance === i && styles.activeMiniBtnText]}>{i[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>ABORT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddPatient}>
                <Text style={styles.saveBtnText}>INITIALIZE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </TerminalBackground>
  );
}

const styles = StyleSheet.create({
  header: { padding: 25, paddingTop: Platform.OS === 'ios' ? 60 : 40, backgroundColor: 'rgba(0,0,0,0.7)', borderBottomWidth: 1, borderBottomColor: '#222' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: COLORS.bone, fontSize: 24, fontFamily: FONTS.horror, letterSpacing: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderWidth: 1, borderColor: COLORS.crimson, paddingHorizontal: 15, height: 50, gap: 10 },
  searchInput: { flex: 1, color: COLORS.white, fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  listContent: { padding: 20, paddingBottom: 100, gap: 20 },
  patientCard: { backgroundColor: '#0a0a0d', padding: 20, borderWidth: 1, borderColor: '#1a1a1f', borderLeftWidth: 4, borderLeftColor: COLORS.crimson, position: 'relative', overflow: 'hidden' },
  cardGlow: { position: 'absolute', top: -50, right: -50, width: 100, height: 100, backgroundColor: COLORS.crimson, opacity: 0.05, borderRadius: 50 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  patientID: { color: COLORS.dim, fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  patientName: { color: COLORS.white, fontSize: 26, fontFamily: FONTS.horror, letterSpacing: 1, marginBottom: 8 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  detailText: { color: COLORS.muted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.dim },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)', paddingTop: 15 },
  statusTag: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2 },
  statusTagText: { fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
  loadingText: { color: COLORS.crimson, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 20 },
  emptyText: { color: COLORS.dim, fontFamily: FONTS.horror, fontSize: 24, letterSpacing: 2 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 65, height: 65, backgroundColor: COLORS.crimson, justifyContent: 'center', alignItems: 'center', ...SHADOWS.crimson },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalView: { width: '100%', maxWidth: 400, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.crimson, padding: 30, gap: 20, ...SHADOWS.crimson },
  modalTitle: { fontSize: 32, fontFamily: FONTS.horror, color: COLORS.white, textAlign: 'center' },
  modalDivider: { height: 1, backgroundColor: COLORS.crimson, width: '30%', alignSelf: 'center', marginBottom: 10 },
  inputGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: 'bold', color: COLORS.muted, letterSpacing: 1 },
  input: { backgroundColor: '#000', borderWidth: 1, borderColor: '#222', padding: 15, color: COLORS.white, fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
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
