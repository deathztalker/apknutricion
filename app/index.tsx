import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import TerminalBackground from '../components/TerminalBackground';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const skullAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(app)/dashboard');
      } else {
        setChecking(false);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(skullAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
              Animated.timing(skullAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
            ])
          )
        ]).start();
      }
    });
  }, []);

  const skullScale = skullAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  if (checking) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.crimson} size="large" />
      </View>
    );
  }

  return (
    <TerminalBackground>
      <View style={styles.content}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Animated.View style={{ transform: [{ scale: skullScale }] }}>
            <Ionicons name="skull" size={120} color={COLORS.crimson} style={styles.iconShadow} />
          </Animated.View>
          <Text style={styles.title}>MISFITS{'\n'}TERMINAL</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>NEURAL OVERRIDE PROTOCOL v6.6.6</Text>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push('/login')}
          >
            <LinearGradient
              colors={[COLORS.crimson, '#800000']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.primaryButtonText}>INITIATE AUTHORIZATION</Text>
            <Ionicons name="flash" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push('/calculator')}
          >
            <Text style={styles.secondaryButtonText}>GUEST NEURAL ACCESS</Text>
            <Ionicons name="pulse" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2026 CAMILA OLIVARES ARCE</Text>
          <Text style={styles.systemStatus}>ID: <Text style={{ color: COLORS.crimson }}>138</Text> | STATUS: <Text style={{ color: COLORS.poison }}>INFECTED</Text></Text>
        </View>
      </View>
    </TerminalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  header: { alignItems: 'center', marginBottom: 60 },
  iconShadow: {
    textShadowColor: COLORS.crimson,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  title: {
    fontSize: 60,
    fontFamily: FONTS.horror,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 4,
    lineHeight: 60,
    marginTop: 20,
    textShadowColor: COLORS.crimson,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: COLORS.crimson,
    marginVertical: 25,
    ...SHADOWS.crimson,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.bone,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    opacity: 0.8,
  },
  buttonContainer: { width: '100%', gap: 20, maxWidth: 340 },
  button: {
    height: 70,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 15,
    borderWidth: 1,
  },
  primaryButton: {
    borderColor: COLORS.crimson,
    ...SHADOWS.crimson,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#222',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: FONTS.horror,
    letterSpacing: 2,
  },
  secondaryButtonText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  footer: { position: 'absolute', bottom: 40, alignItems: 'center' },
  copyright: { color: COLORS.dim, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase' },
  systemStatus: { color: COLORS.dim, fontSize: 8, letterSpacing: 2, marginTop: 10 },
});
