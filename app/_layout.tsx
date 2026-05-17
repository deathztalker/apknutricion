import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/theme';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFonts, Creepster_400Regular } from '@expo-google-fonts/creepster';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import './global.css';
import { supabase, authService } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setSession, setProfile } = useAuthStore();
  const [loaded, error] = useFonts({
    Creepster_400Regular,
  });

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 1. Inicialización de Auth
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          // Sincronizar perfil con metadatos (avatar de Google, etc)
          try {
            const { data: profile } = await authService.syncProfile(session);
            if (profile) setProfile(profile);
          } catch (e) {
            console.error('Initial profile sync failed:', e);
          }
        }
      } catch (e) {
        console.error('Auth initialization failed:', e);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();

    // 2. Escuchar cambios globales (Login/Logout/OAuth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Root Auth Event:', event);
      setSession(session);
      if (session) {
        try {
          const { data: profile } = await authService.syncProfile(session);
          if (profile) setProfile(profile);
        } catch (e) {
          console.error('Auth state change profile sync failed:', e);
        }
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  // Mostramos un spinner global mientras el alma se sincroniza con el núcleo
  if (isInitializing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.crimson} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.bg1 },
          headerTintColor: COLORS.crimson,
          headerTitleStyle: { 
            fontWeight: 'bold',
            fontFamily: 'Creepster_400Regular',
          },
          contentStyle: { backgroundColor: COLORS.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="google-auth" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
