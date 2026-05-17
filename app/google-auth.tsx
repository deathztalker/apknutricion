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
    if (hasNavigated.current) return;
    console.log('Syncing Soul with Nucleus...');
    hasNavigated.current = true;
    
    // Sincronizar estado global
    setSession(session);
    try {
      const { data: profile } = await authService.getProfile(session.user.id);
      if (profile) setProfile(profile);
    } catch (e) {
      console.warn('Profile sync failed, but proceeding...');
    }

    // Navegar directamente al terminal
    router.replace('/(app)/calculator');
  };

  useEffect(() => {
    // 1. Verificación inmediata (Por si Supabase ya procesó el hash)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('Session detected immediately on mount.');
        syncSoul(session);
      }
    });

    // 2. Escuchar cambios de auth (Captura el evento SIGNED_IN tras procesar el hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Callback Event:', event);
      if ((event === 'SIGNED_IN' || session) && !hasNavigated.current) {
        syncSoul(session);
      }
    });

    // 3. Verificación de seguridad (Fallback por si hay lentitud extrema)
    const timer = setTimeout(async () => {
      if (!hasNavigated.current) {
        console.log('Auth Timeout: Final manual check...');
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          syncSoul(session);
        } else {
          console.log('No soul detected in the fragment. Returning to login.');
          router.replace('/login');
        }
      }
    }, 8000);

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
