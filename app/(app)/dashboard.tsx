import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SHADOWS } from '../../constants/theme';
import { patientService, supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '../../types';

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await patientService.getAll(user.id, search);
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity 
      style={styles.patientCard}
      onPress={() => router.push(`/(app)/patient/${item.id}`)}
    >
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.full_name.toUpperCase()}</Text>
        <Text style={styles.patientDetails}>{item.insurance} • {item.sex === 'M' ? 'Male' : 'Female'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.neon} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.dim} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="SEARCH SUBJECT..."
            placeholderTextColor={COLORS.dim}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.neon} />
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.neon} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="skull-outline" size={64} color={COLORS.bg4} />
              <Text style={styles.emptyText}>NO SUBJECTS FOUND IN SYSTEM</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {/* Aquí iría el modal para agregar paciente */}}
      >
        <Ionicons name="add" size={30} color={COLORS.bg} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.bg1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.bg4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  patientCard: {
    backgroundColor: COLORS.bg1,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.neon,
    borderWidth: 1,
    borderColor: COLORS.bg4,
    ...SHADOWS.card,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  patientDetails: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    color: COLORS.dim,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.neon,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.neon,
  },
});
