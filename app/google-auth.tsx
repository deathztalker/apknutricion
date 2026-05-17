import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase, authService } from '../lib/supabase';
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
      const { data: profile } = await authService.syncProfile(session);
      if (profile) setProfile(profile);
    } catch (e) {
      console.warn('Profile sync failed, but proceeding...');
    }

    // Teletransporte al terminal clínico
    router.replace('/(app)/calculator');
  };

  useEffect(() => {
    const parseUrlAndSync = async () => {
      if (Platform.OS === 'web' && window.location.hash) {
        console.log('Soul Fragment Detected. Iniciando extracción manual...');
        try {
          // Extraemos el alma manualmente picando la cadena de texto
          const hash = window.location.hash.substring(1);
          const parts = hash.split('&').reduce((acc: any, part) => {
            const [key, value] = part.split('=');
            acc[key] = value;
            return acc;
          }, {});

          const accessToken = parts.access_token;
          const refreshToken = parts.refresh_token;

          if (accessToken) {
            console.log('Soul Fragment Captured. Inyectando en el Núcleo...');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (data.session) {
              console.log('Manual Injection Successful.');
              return syncSoul(data.session);
            }
            if (error) console.error('Injection Error:', error);
          }
        } catch (e) {
          console.error('Extraction Failure:', e);
        }
      }

      // Verificación de respaldo si el hash ya fue procesado
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Session active in nucleus.');
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
