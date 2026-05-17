import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { COLORS, FONTS } from '../constants/theme';
import TerminalBackground from '../components/TerminalBackground';
import { useAuthStore } from '../store/authStore';

export default function GoogleAuthCallback() {
  const { setSession } = useAuthStore();
  const hasNavigated = useRef(false);

  const teleportToCore = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    console.log('TELEPORT: Iniciando secuencia de salto a la calculadora...');
    
    // Pequeño delay para permitir que el estado de Zustand se propague
    // y para limpiar el stack del router en web.
    setTimeout(() => {
      console.log('TELEPORT: Saltando ahora.');
      router.replace('/calculator');
    }, 100);
  };

  useEffect(() => {
    const processAuth = async () => {
      console.log('AUTH: Iniciando procesamiento de callback...');
      
      if (Platform.OS === 'web' && window.location.hash) {
        console.log('AUTH: Fragmento detectado. Extrayendo...');
        try {
          const hash = window.location.hash.substring(1);
          const parts = hash.split('&').reduce((acc: any, part) => {
            const [key, value] = part.split('=');
            acc[key] = value;
            return acc;
          }, {});

          const accessToken = parts.access_token;
          const refreshToken = parts.refresh_token;

          if (accessToken) {
            console.log('AUTH: Inyectando sesión manual...');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (data.session) {
              console.log('AUTH: Inyección exitosa.');
              setSession(data.session);
              
              // Limpiar el hash de la URL para evitar re-procesamiento
              if (window.history.pushState) {
                window.history.pushState('', '/', window.location.pathname);
              }
              
              return teleportToCore();
            }
            if (error) throw error;
          }
        } catch (e) {
          console.error('AUTH ERROR: Fallo en captura manual:', e);
        }
      }

      // Verificación de respaldo (sesión ya existente)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('AUTH: Sesión activa encontrada.');
        setSession(session);
        teleportToCore();
      }
    };

    processAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AUTH EVENT:', event);
      if (session) {
        setSession(session);
        teleportToCore();
      }
    });

    const timer = setTimeout(() => {
      if (!hasNavigated.current) {
        console.error('CRITICAL: Soul Link Timeout. Abortando...');
        router.replace('/login');
      }
    }, 20000);

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
