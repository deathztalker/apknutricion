import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { SectionHeader } from '../ui/LayoutComponents';
import { ClinicalRecord } from '../../types';

interface Props {
  session: any;
  patientId: string | undefined;
  globalHistory: ClinicalRecord[];
  guestRecords: ClinicalRecord[];
  searchHistory: string;
  setSearchHistory: (s: string) => void;
  fetchGlobalHistory: () => void;
  handleExportData: () => void;
  setForm: (f: any) => void;
}

export default function HistoryTab({ session, patientId, globalHistory, guestRecords, searchHistory, setSearchHistory, fetchGlobalHistory, handleExportData, setForm }: Props) {
  const records = session ? globalHistory : guestRecords;

  return (
    <View style={styles.section}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
        <SectionHeader title={session ? "PACIENTES GUARDADOS" : "HISTORIAL LOCAL (INVITADO)"} icon="server" color={COLORS.gold} />
        {session && (
          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity style={styles.iconBtn} onPress={fetchGlobalHistory}>
              <Ionicons name="refresh" size={20} color={COLORS.bone} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleExportData}>
              <Ionicons name="download" size={20} color={COLORS.sky} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {session && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gold} />
          <TextInput
            style={styles.searchInput}
            placeholder="BUSCAR PACIENTE O FECHA..."
            placeholderTextColor={COLORS.muted}
            value={searchHistory}
            onChangeText={setSearchHistory}
          />
        </View>
      )}

      {records.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="skull" size={60} color={COLORS.dim} />
          <Text style={styles.emptyText}>SIN TRANSMISIONES PREVIAS</Text>
        </View>
      ) : (
        records.map((rec: any) => (
          <TouchableOpacity 
            key={rec.id} 
            style={styles.historyCard}
            onPress={() => setForm(rec)}
          >
            <View style={styles.historyHead}>
              <View>
                <Text style={styles.historyName}>{rec.patients?.full_name || 'Paciente Invitado'}</Text>
                <Text style={styles.historyDate}>{new Date(rec.record_date).toLocaleDateString()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gold} />
            </View>
            <View style={styles.historyGrid}>
              <HStat label="PESO" val={`${rec.weight_kg || '--'} KG`} color={COLORS.bone} />
              <HStat label="IMC" val={rec.bmi || '--'} color={COLORS.sky} />
              <HStat label="% GRASA" val={`${rec.fat_percent || '--'}%`} color={COLORS.pink} />
              <HStat label="TDEE" val={`${rec.tdee_kcal || '--'}`} color={COLORS.orange} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

function HStat({ label, val, color }: { label: string, val: string, color: string }) {
  return (
    <View style={styles.hStat}>
      <Text style={styles.hLabel}>{label}</Text>
      <Text style={[styles.hVal, { color }]}>{val}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderWidth: 2, borderColor: COLORS.gold, paddingHorizontal: 15, height: 50, gap: 12, marginBottom: 20, borderRadius: 6 },
  searchInput: { flex: 1, color: COLORS.white, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  iconBtn: { padding: 12, backgroundColor: COLORS.bg1, borderWidth: 1.5, borderColor: COLORS.dim, borderRadius: 6 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', padding: 40, borderWidth: 2, borderColor: COLORS.dim, borderStyle: 'dashed', borderRadius: 8 },
  emptyText: { color: COLORS.muted, fontSize: 20, marginTop: 15, fontWeight: 'bold' },
  historyCard: { backgroundColor: COLORS.bg2, padding: 20, borderWidth: 1.5, borderColor: COLORS.dim, marginBottom: 15, borderLeftWidth: 6, borderLeftColor: COLORS.gold, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, borderRadius: 6 },
  historyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  historyName: { fontSize: 18, color: COLORS.white, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  historyDate: { fontSize: 12, color: COLORS.muted, fontWeight: 'bold' },
  historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  hStat: { flex: 1, minWidth: 60 },
  hLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '900', marginBottom: 4, letterSpacing: 0.5 },
  hVal: { fontSize: 16, fontWeight: '900' },
});
