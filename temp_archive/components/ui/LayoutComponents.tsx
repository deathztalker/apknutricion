import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';

export function SectionHeader({ title, icon, color }: { title: string, icon: any, color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );
}

export function ResultBox({ label, value, sub, color }: { label: string, value: string, sub?: string, color: string }) {
  return (
    <View style={[styles.resBox, { borderBottomColor: color }]}>
      <Text style={styles.resLabel}>{label}</Text>
      <Text style={[styles.resValue, { color }]}>{value}</Text>
      {sub && <Text style={styles.resSub}>{sub}</Text>}
    </View>
  );
}

export function MacroBox({ label, grams, gkg, color }: { label: string, grams: number, gkg: number, color: string }) {
  return (
    <View style={[styles.macroBox, { borderLeftColor: color }]}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroGrams, { color }]}>{grams.toFixed(0)}G</Text>
      <Text style={styles.macroGkg}>{gkg.toFixed(1)} G/KG</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    borderLeftWidth: 5, 
    paddingLeft: 12, 
    backgroundColor: 'rgba(255,0,60,0.1)', 
    paddingVertical: 10,
    marginBottom: 10
  },
  sectionTitle: { 
    fontSize: 20, 
    fontFamily: FONTS.horror, 
    letterSpacing: 2, 
    textShadowColor: '#000', 
    textShadowRadius: 3 
  },
  resBox: { 
    width: '47%', 
    minWidth: 135, // Wrap safely on small screens
    backgroundColor: COLORS.bg2, 
    padding: 16, 
    borderBottomWidth: 4, 
    gap: 6, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 10, 
    elevation: 6, 
    borderRadius: 6 
  },
  resLabel: { fontSize: 10, fontWeight: '900', color: COLORS.muted, letterSpacing: 1 },
  resValue: { fontSize: 20, fontWeight: '900', fontFamily: FONTS.horror, textShadowColor: '#000', textShadowRadius: 3 },
  resSub: { fontSize: 10, color: COLORS.bone, fontWeight: '900', textTransform: 'uppercase' },
  
  macroBox: { 
    backgroundColor: COLORS.bg2, 
    padding: 16, 
    borderLeftWidth: 6, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    shadowColor: '#000', 
    shadowOpacity: 0.3, 
    shadowRadius: 6, 
    borderRadius: 6 
  },
  macroLabel: { fontSize: 12, fontWeight: '900', color: COLORS.muted, letterSpacing: 1 },
  macroGrams: { fontSize: 24, fontWeight: '900', fontFamily: FONTS.horror },
  macroGkg: { fontSize: 12, color: COLORS.bone, fontWeight: 'bold' },
});
