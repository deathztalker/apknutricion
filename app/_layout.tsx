import { Stack, router, useSegments } from 'expo-router';
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
  const { setSession, setProfile, session } = useAuthStore();
  const segments = useSegments();
  const [loaded, error] = useFonts({
    Creepster_400Regular,
  });

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    console.log('ROOT: Iniciando inicialización de sistema...');
    
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          console.log('ROOT: Sesión persistente detectada:', initialSession.user.id);
          setSession(initialSession);
          
          // Sync profile en background
          authService.syncProfile(initialSession)
            .then(({ data }) => {
              if (data) {
                console.log('ROOT: Perfil sincronizado exitosamente.');
                setProfile(data);
              }
            })
            .catch(e => console.error('ROOT ERROR: Fallo en sync de perfil inicial:', e));
        } else {
          console.log('ROOT: No se detectó sesión inicial.');
        }
      } catch (e) {
        console.error('ROOT ERROR: Fallo crítico en initAuth:', e);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('ROOT AUTH EVENT:', event);
      setSession(currentSession);
      
      if (currentSession) {
        console.log('ROOT: Sincronizando perfil para evento:', event);
        authService.syncProfile(currentSession)
          .then(({ data }) => {
            if (data) {
              console.log('ROOT: Perfil actualizado tras evento auth.');
              setProfile(data);
            }
          })
          .catch(e => console.error('ROOT ERROR: Fallo en sync de perfil tras evento:', e));
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
