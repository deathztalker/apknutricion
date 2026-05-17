import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function AppLayout() {
  const { session, setSession } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        router.replace('/login');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.replace('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.crimson} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bg1 },
        headerTintColor: COLORS.crimson,
        headerTitleStyle: { fontWeight: '900', letterSpacing: 2 },
        contentStyle: { backgroundColor: COLORS.bg },
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
