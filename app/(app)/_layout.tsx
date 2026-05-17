import { useEffect, useState } from 'react';
import { Stack, router, Redirect } from 'expo-router';
import { supabase, authService } from '../../lib/supabase';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function AppLayout() {
  const { session, setSession, setProfile } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      const { data } = await authService.getProfile(userId);
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        const { data: profile } = await authService.getProfile(session.user.id);
        if (profile) setProfile(profile);
      }
      setIsInitializing(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Layout Event:', event);
      if (session) {
        setSession(session);
        const { data: profile } = await authService.getProfile(session.user.id);
        if (profile) setProfile(profile);
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

  // Si después de inicializar no hay sesión, mandamos al login
  if (!session) {
    return <Redirect href="/login" />;
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
