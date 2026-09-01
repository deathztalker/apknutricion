import { Stack } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {

  const ProfileHeader = () => (
    <TouchableOpacity 
      onPress={() => {
        Alert.alert(
          "SYNDROME OS v9.0",
          "Sistema de Análisis Nutricional Clínico.\nCreado por: Camila Olivares Arce",
          [{ text: "CERRAR", style: 'cancel' }]
        );
      }}
      style={{ marginRight: 15, flexDirection: 'row', alignItems: 'center', gap: 10 }}
    >
      <View style={styles.avatarContainer}>
        <Ionicons name="skull" size={20} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'TABLERO DE SISTEMA' }} />
      <Stack.Screen name="patient/[id]" options={{ title: 'EXPEDIENTE DEL SUJETO' }} />
      <Stack.Screen name="patient/new" options={{ title: 'INICIALIZAR SUJETO', presentation: 'modal' }} />
      <Stack.Screen name="calculator" options={{ title: 'SOBREESCRITURA BIOMÉTRICA' }} />
      <Stack.Screen name="patient/[id]/labs" options={{ title: 'TERMINAL BIOQUÍMICO' }} />
      <Stack.Screen name="meal-plan/new" options={{ title: 'CONSTRUCTOR DE PORCIONES' }} />
      <Stack.Screen name="ai-chat" options={{ title: 'NUTRIBOT IA', presentation: 'modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    backgroundColor: COLORS.bg3, 
    borderWidth: 1, 
    borderColor: COLORS.primary, 
    overflow: 'hidden', 
    justifyContent: 'center', 
    alignItems: 'center'
  }
});
