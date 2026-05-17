import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { COLORS, FONTS } from '../constants/theme';
import TerminalBackground from '../components/TerminalBackground';

export default function GoogleAuthCallback() {
  useEffect(() => {
    // Supabase maneja automáticamente el hash (#access_token=...) 
    // al inicializarse, por lo que solo debemos esperar a que la sesión esté lista
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        router.replace('/(app)/dashboard');
      } else if (error) {
        console.error('Auth Error:', error);
        router.replace('/login');
      } else {
        // Si no hay sesión inmediata, el listener en AppLayout redirigirá al login
        // o podemos forzar un pequeño delay
        setTimeout(() => router.replace('/(app)/dashboard'), 1500);
      }
    };

    checkSession();
  }, []);

  return (
    <TerminalBackground>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.neon} />
        <Text style={styles.text}>VINCULANDO ALMA CON EL NÚCLEO...</Text>
      </View>
    </TerminalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  text: { color: COLORS.neon, fontFamily: FONTS.horror, fontSize: 20, letterSpacing: 2 },
});
