import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { COLORS, FONTS } from '../constants/theme';
import TerminalBackground from '../components/TerminalBackground';
import { useAuthStore } from '../store/authStore';

export default function GoogleAuthCallback() {
  const { setSession } = useAuthStore();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // 1. Escuchamos cambios de auth para capturar el token que viene en el hash de la URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Callback Event:', event);
      
      if (session && !hasNavigated.current) {
        hasNavigated.current = true;
        setSession(session);
        // NAVEGACIÓN EXPLÍCITA: Forzamos la entrada al núcleo
        router.replace('/(app)/calculator');
      }
    });

    // 2. Verificación de seguridad por si la sesión ya estaba lista
    const timer = setTimeout(async () => {
      if (!hasNavigated.current) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          hasNavigated.current = true;
          setSession(session);
          router.replace('/(app)/calculator');
        } else {
          router.replace('/login');
        }
      }
    }, 5000);

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
