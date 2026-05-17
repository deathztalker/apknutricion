import { useEffect, useState } from 'react';
import { Stack, router, Redirect, useSegments } from 'expo-router';
import { supabase, authService } from '../../lib/supabase';
import { ActivityIndicator, View, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  const { session, setSession, setProfile, profile } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const segments = useSegments();

  // Detectamos si estamos en la calculadora (ruta pública permitida dentro del layout)
  const isCalculator = segments.includes('calculator');

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
  };

  const ProfileHeader = () => (
    <TouchableOpacity 
      onPress={() => {
        if (!session) {
          Alert.alert("ACCESO ANÓNIMO", "Inicia sesión para persistir datos en el núcleo.");
          return;
        }
        Alert.alert(
          "NÚCLEO DE IDENTIDAD",
          `Sujeto: ${profile?.full_name || 'Desconocido'}\nRol: ${profile?.role || 'Nutricionista'}\nEstatus: Activo`,
          [
            { text: "CERRAR SESIÓN", onPress: handleLogout, style: 'destructive' },
            { text: "VOLVER", style: 'cancel' }
          ]
        );
      }}
      style={{ marginRight: 15, flexDirection: 'row', alignItems: 'center', gap: 10 }}
    >
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: session ? COLORS.neon : COLORS.muted, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Ionicons name="person" size={20} color={session ? COLORS.neon : COLORS.muted} />
        )}
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setSession(currentSession);
        const { data: currentProfile } = await authService.getProfile(currentSession.user.id);
        if (currentProfile) setProfile(currentProfile);
      }
      setIsInitializing(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth Layout Event:', event);
      if (currentSession) {
        setSession(currentSession);
        const { data: currentProfile } = await authService.getProfile(currentSession.user.id);
        if (currentProfile) setProfile(currentProfile);
        setIsInitializing(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isInitializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.crimson} />
      </View>
    );
  }

  // Si no hay sesión y NO estamos en la calculadora, mandamos al login
  if (!session && !isCalculator) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bg1 },
        headerTintColor: COLORS.crimson,
        headerTitleStyle: { fontWeight: '900', letterSpacing: 2 },
        contentStyle: { backgroundColor: COLORS.bg },
        headerRight: () => <ProfileHeader />,
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'SYSTEM DASHBOARD' }} />
      <Stack.Screen name="patient/[id]" options={{ title: 'PATIENT DOSSIER' }} />
      <Stack.Screen name="patient/new" options={{ title: 'INICIALIZAR SUJETO', presentation: 'modal' }} />
      <Stack.Screen name="calculator" options={{ title: 'OVERRIDE BIOMÉTRICO' }} />
      <Stack.Screen name="patient/[id]/labs" options={{ title: 'BIOCHEMICAL TERMINAL' }} />
      <Stack.Screen name="meal-plan/new" options={{ title: 'PORTION BUILDER' }} />
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
});
