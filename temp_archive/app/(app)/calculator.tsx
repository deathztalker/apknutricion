import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, PanResponder, Platform, KeyboardAvoidingView } from 'react-native';

import { COLORS, FONTS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import NeuralBackground from '../../components/NeuralBackground';
import TerminalBackground from '../../components/TerminalBackground';
import { useCalculatorCore } from '../../hooks/useCalculatorCore';

// Import Tabs
import ScannerTab from '../../components/tabs/ScannerTab';
import AnamnesisTab from '../../components/tabs/AnamnesisTab';
import MacrosTab from '../../components/tabs/MacrosTab';
import CineantroTab from '../../components/tabs/CineantroTab';
import ClinicalTab from '../../components/tabs/ClinicalTab';
import AITab from '../../components/tabs/AITab';
import HistoryTab from '../../components/tabs/HistoryTab';
import TablesTab from '../../components/tabs/TablesTab';

const TABS = ['scanner', 'anamnesis', 'macros', 'sports', 'clinical', 'ai', 'history', 'tables'] as const;

const NODES = [
  { id: 'scanner', label: 'BIOMETRÍA', icon: 'finger-print', x: 20, y: 20, color: COLORS.sky },
  { id: 'anamnesis', label: 'ANAMNESIS', icon: 'medical', x: 80, y: 20, color: COLORS.gold },
  { id: 'macros', label: 'NUTRIENTES', icon: 'nutrition', x: 15, y: 50, color: COLORS.pink },
  { id: 'sports', label: 'CINEANTRO', icon: 'body', x: 85, y: 50, color: COLORS.poison },
  { id: 'clinical', label: 'CLÍNICA', icon: 'medkit', x: 25, y: 80, color: COLORS.purple },
  { id: 'history', label: 'REGISTROS', icon: 'server', x: 75, y: 80, color: COLORS.gold },
  { id: 'ai', label: 'IA NÚCLEO', icon: 'nuclear', x: 50, y: 90, color: COLORS.crimson },
  { id: 'centro', label: 'DASHBOARD', icon: 'planet', x: 50, y: 50, color: COLORS.neon }
];

const CONNECTIONS = [
  [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 6]
];

import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const CONTAINER_HEIGHT = height * 0.8; // Approximate height of the 80% container

const FlowingLine = ({ start, end }: { start: number, end: number }) => (
  <Line
    x1={(NODES[start].x / 100) * width}
    y1={(NODES[start].y / 100) * CONTAINER_HEIGHT}
    x2={(NODES[end].x / 100) * width}
    y2={(NODES[end].y / 100) * CONTAINER_HEIGHT}
    stroke={COLORS.neon}
    strokeWidth="1.5"
    strokeDasharray="4,6"
    opacity={0.6}
  />
);

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
};

const SynapticNode = ({ node, onPress }: { node: any, onPress: () => void }) => {
  const isHub = node.id === 'centro';
  const SIZE = isHub ? 90 : 70;
  const RADIUS = SIZE / 2;
  return (
    <View style={[{ position: 'absolute', left: (node.x / 100) * width, top: (node.y / 100) * CONTAINER_HEIGHT, width: SIZE, height: SIZE, marginLeft: -RADIUS, marginTop: -RADIUS }]}>
      <TouchableOpacity
        style={[styles.synapticNode, { width: SIZE, height: SIZE, borderRadius: RADIUS, borderColor: node.color, shadowColor: node.color }]}
        onPress={onPress}
      >
        <LinearGradient 
          colors={[`rgba(${hexToRgb(node.color)}, 0.5)`, 'rgba(0,0,0,0.9)']} 
          style={[StyleSheet.absoluteFillObject, { borderRadius: RADIUS }]} 
          locations={[0, 0.8]} 
        />
        <View style={{ transform: [{ scale: isHub ? 1.1 : 1 }] }}>
          <Ionicons name={node.icon as any} size={isHub ? 32 : 24} color={node.color} style={{ textShadowColor: node.color, textShadowRadius: 10 }} />
        </View>
        <Text style={[styles.synapticText, { color: node.color, textShadowColor: node.color, textShadowRadius: 10, fontSize: isHub ? 10 : 8 }]}>{node.label}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function Calculator() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const core = useCalculatorCore(patientId);
  const { activeTab, setActiveTab } = core;
  
  const [isHubView, setIsHubView] = React.useState(true);
  const insets = useSafeAreaInsets();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 50 && Math.abs(gestureState.dy) < 30,
      onPanResponderRelease: (evt, gestureState) => {
        const currentIndex = TABS.indexOf(activeTab);
        if (gestureState.dx > 50 && currentIndex > 0) setActiveTab(TABS[currentIndex - 1]);
        else if (gestureState.dx < -50 && currentIndex < TABS.length - 1) setActiveTab(TABS[currentIndex + 1]);
      },
    })
  ).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '8') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < TABS.length) setActiveTab(TABS[index]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isHubView) {
    return (
      <NeuralBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ position: 'absolute', top: Math.max(insets.top, 30) + 10, width: '100%', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.horror, color: COLORS.neon, fontSize: 24, letterSpacing: 2 }}>RED SINÁPTICA</Text>
            <Text style={{ color: COLORS.dim, fontSize: 10, letterSpacing: 3 }}>SELECCIONA UN NODO PARA INYECTAR DATOS</Text>
          </View>
          
          <View style={{ width: '100%', height: '80%', position: 'relative' }}>
            <Svg style={StyleSheet.absoluteFill}>
              {CONNECTIONS.map(([start, end], i) => (
                <FlowingLine key={i} start={start} end={end} />
              ))}
            </Svg>
            {NODES.map((node) => (
              <SynapticNode
                key={node.id}
                node={node}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  if (node.id === 'centro') router.push('/(app)/dashboard');
                  else if (node.id === 'ai') router.push('/(app)/ai-chat');
                  else { setActiveTab(node.id as any); setIsHubView(false); }
                }}
              />
            ))}
          </View>
        </View>
      </NeuralBackground>
    );
  }

  return (
    <TerminalBackground>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: Math.max(insets.top, 20) + 15, backgroundColor: 'rgba(5,5,10,0.8)', borderBottomWidth: 1, borderBottomColor: COLORS.orange, zIndex: 10 }}>
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setIsHubView(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="git-network" size={24} color={COLORS.orange} />
            <Text style={{ color: COLORS.orange, fontWeight: '900', letterSpacing: 1 }}>VOLVER AL NÚCLEO</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 12, letterSpacing: 2 }}>{NODES.find(n => n.id === activeTab)?.label}</Text>
          </View>
        </View>
        
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
              <TabItem id="centro" label="CENTRO" icon="apps" active={activeTab} onPress={() => router.push('/(app)/dashboard')} color={COLORS.orange} />
              <TabItem id="scanner" label="ESCANER" icon="scan" active={activeTab} onPress={setActiveTab} color={COLORS.crimson} />
              <TabItem id="anamnesis" label="ANAMNESIS" icon="list" active={activeTab} onPress={setActiveTab} color={COLORS.sky} />
              <TabItem id="macros" label="MACROS" icon="pie-chart" active={activeTab} onPress={setActiveTab} color={COLORS.pink} />
              <TabItem id="sports" label="DEPORTIVA" icon="fitness" active={activeTab} onPress={setActiveTab} color={COLORS.poison} />
              <TabItem id="clinical" label="CLÍNICA" icon="medkit" active={activeTab} onPress={setActiveTab} color={COLORS.purple} />
              <TabItem id="ai" label="NEURAL IA" icon="brain" active={activeTab} onPress={setActiveTab} color={COLORS.crimson} />
              <TabItem id="history" label="HISTORIAL" icon="server" active={activeTab} onPress={setActiveTab} color={COLORS.gold} />
              <TabItem id="tables" label="BIBLIOTECA" icon="grid" active={activeTab} onPress={setActiveTab} color={COLORS.bone} />
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View>
              {activeTab === 'scanner' && <ScannerTab patient={core.patient} setPatient={core.setPatient} form={core.form} setForm={core.setForm} />}
              {activeTab === 'anamnesis' && <AnamnesisTab form={core.form} setForm={core.setForm} />}
              {activeTab === 'macros' && <MacrosTab form={core.form} setForm={core.setForm} results={core.results} />}
              {activeTab === 'sports' && <CineantroTab form={core.form} setForm={core.setForm} results={core.results} />}
              {activeTab === 'clinical' && <ClinicalTab form={core.form} setForm={core.setForm} results={core.results} />}
              {activeTab === 'ai' && <AITab patientId={patientId} patient={core.patient} form={core.form} setForm={core.setForm} results={core.results} aiAnalysis={core.aiAnalysis} loading={core.loading} globalHistory={core.globalHistory} onAnalyze={core.handleAINeuralDissection} />}
              {activeTab === 'history' && <HistoryTab session={core.session} patientId={patientId} globalHistory={core.globalHistory} guestRecords={core.guestRecords} searchHistory={core.searchHistory} setSearchHistory={core.setSearchHistory} fetchGlobalHistory={core.fetchGlobalHistory} handleExportData={core.handleExportData} setForm={core.setForm} />}
              {activeTab === 'tables' && <TablesTab />}
            </View>
            
            {(activeTab === 'scanner' || activeTab === 'anamnesis' || activeTab === 'macros' || activeTab === 'sports' || activeTab === 'clinical') && (
              <TouchableOpacity style={styles.mainActionBtn} onPress={core.handleSave} disabled={core.saving}>
                <Ionicons name="cloud-upload" size={28} color={COLORS.white} />
                <Text style={styles.mainActionText}>{core.saving ? 'SINC... OBTENIENDO' : 'GUARDAR EXPEDIENTE'}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TerminalBackground>
  );
}

function TabItem({ id, label, icon, active, onPress, color }: any) {
  const isActive = active === id;
  return (
    <TouchableOpacity 
      style={[styles.tab, isActive && { borderBottomColor: color, backgroundColor: 'rgba(255,255,255,0.1)' }]} 
      onPress={() => onPress(id)}
    >
      <Ionicons name={icon as any} size={20} color={isActive ? color : COLORS.dim} />
      <Text style={[styles.tabText, isActive && { color, fontWeight: '900' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: { backgroundColor: 'rgba(5,5,10,0.9)', borderBottomWidth: 1, borderBottomColor: COLORS.crimson },
  tabScroll: { paddingHorizontal: 5 },
  tab: { paddingHorizontal: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { color: COLORS.muted, fontSize: 11, letterSpacing: 1, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 80 },
  mainActionBtn: { backgroundColor: COLORS.crimson, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 30, shadowColor: COLORS.crimson, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10, borderRadius: 8 },
  mainActionText: { color: COLORS.white, fontFamily: FONTS.horror, fontSize: 20, letterSpacing: 2 },
  synapticNode: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0,0,0,0.8)', borderWidth: 2, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.8, shadowRadius: 15, elevation: 10, transform: [{ translateX: -35 }, { translateY: -35 }] },
  synapticText: { fontSize: 7, fontWeight: '900', marginTop: 4, letterSpacing: 1, textAlign: 'center' },
});
