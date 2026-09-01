import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { SectionHeader } from '../ui/LayoutComponents';

export default function TablesTab() {
  const [libTab, setLibTab] = useState<'antro' | 'diet' | 'formulas'>('antro');

  return (
    <View style={styles.section}>
      <SectionHeader title="BIBLIOTECA CLÍNICA" icon="library" color={COLORS.bone} />
      
      <View style={styles.libTabs}>
        <TouchableOpacity style={[styles.libTab, libTab === 'antro' && styles.activeLibTab]} onPress={() => setLibTab('antro')}>
          <Text style={[styles.libTabText, libTab === 'antro' && { color: COLORS.orange }]}>ANTROPOMETRÍA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.libTab, libTab === 'diet' && styles.activeLibTab]} onPress={() => setLibTab('diet')}>
          <Text style={[styles.libTabText, libTab === 'diet' && { color: COLORS.orange }]}>DIETOTERAPIA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.libTab, libTab === 'formulas' && styles.activeLibTab]} onPress={() => setLibTab('formulas')}>
          <Text style={[styles.libTabText, libTab === 'formulas' && { color: COLORS.orange }]}>FÓRMULAS</Text>
        </TouchableOpacity>
      </View>

      {libTab === 'antro' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>IMC ADULTO (OMS)</Text>
            <TableRow label="Bajo Peso" value="< 18.5" color={COLORS.sky} />
            <TableRow label="Normal" value="18.5 - 24.9" color={COLORS.neon} />
            <TableRow label="Sobrepeso" value="25.0 - 29.9" color={COLORS.gold} />
            <TableRow label="Obesidad Grado I" value="30.0 - 34.9" color={COLORS.red} />
            <TableRow label="Obesidad Grado II" value="35.0 - 39.9" color={COLORS.red} />
            <TableRow label="Obesidad Mórbida" value="≥ 40.0" color={COLORS.purple} />
          </View>
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>IMC ADULTO MAYOR (MINSAL 2026)</Text>
            <TableRow label="Bajo Peso / Enflaquecido" value="< 23.0" color={COLORS.sky} />
            <TableRow label="Normal" value="23.0 - 27.9" color={COLORS.neon} />
            <TableRow label="Sobrepeso" value="28.0 - 31.9" color={COLORS.gold} />
            <TableRow label="Obesidad" value="≥ 32.0" color={COLORS.red} />
          </View>
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>RIESGO CARDIOVASCULAR (MINSAL 2026)</Text>
            <TableRow label="Mujeres < 80 cm" value="Normal" color={COLORS.neon} />
            <TableRow label="Mujeres 80 - 87 cm" value="Riesgo Aumentado" color={COLORS.gold} />
            <TableRow label="Mujeres ≥ 88 cm" value="Riesgo Alto" color={COLORS.red} />
            <View style={{height: 10}} />
            <TableRow label="Hombres < 94 cm" value="Normal" color={COLORS.neon} />
            <TableRow label="Hombres 94 - 101 cm" value="Riesgo Aumentado" color={COLORS.gold} />
            <TableRow label="Hombres ≥ 102 cm" value="Riesgo Alto" color={COLORS.red} />
          </View>
        </ScrollView>
      )}

      {libTab === 'diet' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>REQUERIMIENTOS DE PROTEÍNAS</Text>
            <TableRow label="Adulto Sano" value="0.8 - 1.0 g/kg" color={COLORS.neon} />
            <TableRow label="Adulto Mayor" value="1.0 - 1.2 g/kg" color={COLORS.sky} />
            <TableRow label="Deportista Fuerza" value="1.6 - 2.2 g/kg" color={COLORS.poison} />
            <TableRow label="ERC Sin Diálisis" value="0.6 - 0.8 g/kg" color={COLORS.gold} />
            <TableRow label="ERC Con Diálisis" value="1.2 - 1.4 g/kg" color={COLORS.red} />
            <TableRow label="Hipercatabólico (UCI/Quemado)" value="1.5 - 2.5 g/kg" color={COLORS.purple} />
          </View>
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>OTROS MACRONUTRIENTES Y AGUA</Text>
            <TableRow label="Lípidos (General)" value="20% - 35% VCT" color={COLORS.gold} />
            <TableRow label="Carbohidratos" value="45% - 60% VCT" color={COLORS.pink} />
            <TableRow label="Fibra (Mínimo)" value="25 - 30 g/día" color={COLORS.poison} />
            <View style={{height: 10}} />
            <TableRow label="Agua (Adulto Sano)" value="35 ml/kg" color={COLORS.sky} />
            <TableRow label="Agua (Adulto Mayor)" value="30 ml/kg" color={COLORS.sky} />
            <TableRow label="Agua (Insuficiencia Cardíaca)" value="≤ 1.5 - 2 L/día" color={COLORS.red} />
          </View>
        </ScrollView>
      )}

      {libTab === 'formulas' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>ECUACIONES MATEMÁTICAS DEL NÚCLEO</Text>
            <View style={{ gap: 20, marginTop: 10 }}>
              <View>
                <Text style={{ color: COLORS.purple, fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>TFG (COCKCROFT-GAULT)</Text>
                <Text style={{ color: COLORS.bone, fontSize: 11, lineHeight: 16 }}>[(140 - Edad) × Peso Kg] / [72 × Creatinina Sérica]</Text>
                <Text style={{ color: COLORS.dim, fontSize: 10, marginTop: 4 }}>* En mujeres biológicas el resultado final se multiplica por 0.85</Text>
              </View>
              <View>
                <Text style={{ color: COLORS.pink, fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>TASA METABÓLICA BASAL (MIFFLIN-ST JEOR)</Text>
                <Text style={{ color: COLORS.bone, fontSize: 11, lineHeight: 16 }}>(10 × Peso Kg) + (6.25 × Talla cm) - (5 × Edad) + Constante(S)</Text>
                <Text style={{ color: COLORS.dim, fontSize: 10, marginTop: 4 }}>* Hombres S = +5 | Mujeres S = -161</Text>
              </View>
              <View>
                <Text style={{ color: COLORS.sky, fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>TALLA ESTIMADA POR RODILLA (CHUMLEA)</Text>
                <Text style={{ color: COLORS.bone, fontSize: 11, lineHeight: 16 }}>Hombres: [64.19 - (0.04 × Edad)] + (2.02 × Altura Rodilla){'\n'}Mujeres: [84.88 - (0.24 × Edad)] + (1.83 × Altura Rodilla)</Text>
              </View>
              <View>
                <Text style={{ color: COLORS.poison, fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>SOMATOTIPO (HEATH-CARTER)</Text>
                <Text style={{ color: COLORS.bone, fontSize: 11, lineHeight: 16 }}>Endomorfia: Basada en Sumatoria de Pliegues (Tri+Sub+Sup) corregida por talla.{'\n'}Mesomorfia: Basada en diámetros óseos y perímetros musculares corregidos.{'\n'}Ectomorfia: Basada en el HWR (Height-Weight Ratio).</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function TableRow({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{label}</Text>
      <Text style={[styles.tableValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 20 },
  libTabs: { flexDirection: 'row', backgroundColor: '#000', borderWidth: 1.5, borderColor: COLORS.dim, marginBottom: 20, borderRadius: 6 },
  libTab: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeLibTab: { borderBottomColor: COLORS.orange, backgroundColor: 'rgba(255, 107, 0, 0.1)' },
  libTabText: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tableCard: { backgroundColor: COLORS.bg2, padding: 20, borderWidth: 1.5, borderColor: COLORS.dim, marginBottom: 15, borderRadius: 8 },
  tableTitle: { fontSize: 14, fontWeight: '900', color: COLORS.orange, marginBottom: 20, letterSpacing: 1.5, fontFamily: FONTS.horror },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.dim },
  tableLabel: { color: COLORS.bone, fontSize: 13, fontWeight: '900' },
  tableValue: { fontSize: 14, fontWeight: '900' },
});
