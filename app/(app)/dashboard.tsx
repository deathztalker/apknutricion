import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
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
      console.error('Error fetching subjects:', error);
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
        <Text style={styles.patientDetails}>{item.insurance} • {item.sex === 'M' ? 'MALE' : 'FEMALE'}</Text>
      </View>
      <Ionicons name="skull" size={24} color={COLORS.white} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.white} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="FIND SUBJECT..."
            placeholderTextColor={COLORS.dim}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="skull-outline" size={80} color={COLORS.dim} />
              <Text style={styles.emptyText}>NO SUBJECTS IN THE VOID</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {/* Add patient logic */}}
      >
        <Ionicons name="add" size={32} color={COLORS.bg} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    backgroundColor: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#222',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 0,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
    gap: 12,
  },
  patientCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 0,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 6,
    borderLeftColor: COLORS.white,
    borderWidth: 2,
    borderColor: '#222',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: FONTS.horror,
    letterSpacing: 1,
  },
  patientDetails: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '900',
    letterSpacing: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    gap: 20,
  },
  emptyText: {
    color: COLORS.dim,
    fontFamily: FONTS.horror,
    fontSize: 24,
    letterSpacing: 2,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
});
