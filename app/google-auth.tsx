import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { COLORS, FONTS } from '../constants/theme';
import TerminalBackground from '../components/TerminalBackground';
import { useAuthStore } from '../store/authStore';

export default function GoogleAuthCallback() {
  const { setSession, setProfile } = useAuthStore();
  const hasNavigated = useRef(false);

  const syncSoul = async (session: any) => {
    if (hasNavigated.current || !session) return;
    console.log('Soul Synchronization Initiated...');
    hasNavigated.current = true;
    
    setSession(session);
    try {
      const { data: profile } = await authService.getProfile(session.user.id);
      if (profile) setProfile(profile);
    } catch (e) {
      console.warn('Profile sync lag, proceeding with session...');
    }

    // Teletransporte al terminal clínico
    router.replace('/(app)/calculator');
  };

  useEffect(() => {
    const parseUrlAndSync = async () => {
      // 1. INTENTO DE EXTRACCIÓN MANUAL (HACK PARA GITHUB PAGES)
      // Supabase a veces falla en subdirectorios, así que extraemos el alma manualmente
      if (Platform.OS === 'web' && window.location.hash) {
        console.log('Soul Fragment Detected in URL. Extracting...');
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('Soul Fragment Captured. Establishing Link...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (data.session) {
            return syncSoul(data.session);
          }
        }
      }

      // 2. Verificación estándar por si ya se procesó
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Session already active in nucleus.');
        syncSoul(session);
      }
    };

    parseUrlAndSync();

    // 3. Escuchador de respaldo
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Core Auth Event:', event);
      if (session && !hasNavigated.current) {
        syncSoul(session);
      }
    });

    // 4. Temporizador de expiración por fallo crítico
    const timer = setTimeout(() => {
      if (!hasNavigated.current) {
        console.error('CRITICAL: Soul Link Timeout. Returning to entry point.');
        router.replace('/login');
      }
    }, 12000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return (
    <TerminalBackground>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.neon} />
        <Text style={styles.text}>VINCULANDO ALMA AL NÚCLEO...</Text>
        <Text style={styles.subtext}>EXTRAYENDO ESENCIA DEL GHOST LOGIN</Text>
      </View>
    </TerminalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
  text: { color: COLORS.neon, fontFamily: FONTS.horror, fontSize: 24, letterSpacing: 3, textAlign: 'center' },
  subtext: { color: COLORS.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
});
