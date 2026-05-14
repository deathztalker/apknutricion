import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Index() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(app)/dashboard');
      }
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.neon} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.bg1, COLORS.bg3, COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.title}>CLINICAL{'\n'}TERMINAL</Text>
        <Text style={styles.subtitle}>Nutritional Override System</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryButtonText}>INITIATE LOGIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push('/calculator')}
          >
            <Text style={styles.secondaryButtonText}>GUEST ACCESS</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>© 2026 Camila Olivares Arce... ALL RIGHTS RESERVED.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copyright: {
    color: COLORS.dim,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 40,
    textTransform: 'uppercase',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 56,
    fontFamily: 'Creepster_400Regular',
    color: COLORS.neon,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: COLORS.neon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.pink,
    letterSpacing: 2,
    marginBottom: 60,
    textTransform: 'uppercase',
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
    maxWidth: 400,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: 'rgba(163, 255, 0, 0.1)',
    borderColor: COLORS.neon,
    ...SHADOWS.neon,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.muted,
  },
  primaryButtonText: {
    color: COLORS.neon,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  secondaryButtonText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
