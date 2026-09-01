import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';

import { COLORS, SHADOWS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TerminalBackground from '../components/TerminalBackground';
import CyberButton from '../components/CyberButton';
import { supabase } from '../lib/supabase';

export default function Index() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scannerAnim = useRef(new Animated.Value(0)).current;

  // Boot Sequence State
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [bootComplete, setBootComplete] = useState(false);

  const SEQUENCE = [
    '> INICIANDO KERNEL PUNK...',
    '> DESPERTANDO A LA BESTIA...',
    '> CARGANDO ACORDES METABÓLICOS...',
    '> VERIFICANDO FIRMA DE ENCRIPTACIÓN MISFITS...',
    '[ OK ] ACCESO FIEND CLUB AUTORIZADO'
  ];

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    let index = 0;
    const interval = setInterval(() => {
      if (index < SEQUENCE.length) {
        setBootLines(prev => [...prev, SEQUENCE[index]]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        index++;
      } else {
        clearInterval(interval);
        setBootComplete(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const glitchX = useRef(new Animated.Value(0)).current;
  const glitchOpacity = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      const xLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glitchX, { toValue: 4, duration: 50, useNativeDriver: false }),
          Animated.timing(glitchX, { toValue: -4, duration: 50, useNativeDriver: false }),
          Animated.timing(glitchX, { toValue: 0, duration: 50, useNativeDriver: false }),
          Animated.delay(2000)
        ])
      );

      const opLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glitchOpacity, { toValue: 0.4, duration: 50, useNativeDriver: false }),
          Animated.timing(glitchOpacity, { toValue: 1, duration: 50, useNativeDriver: false }),
          Animated.delay(2000)
        ])
      );

      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scannerAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
          Animated.timing(scannerAnim, { toValue: 0, duration: 1500, useNativeDriver: false })
        ])
      );

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web'
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web'
        })
      ]).start();

      xLoop.start();
      opLoop.start();
      scanLoop.start();

      return () => {
        xLoop.stop();
        opLoop.stop();
        scanLoop.stop();
      };
    }, [])
  );

  const laserTranslateY = scannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60]
  });


  return (
    <TerminalBackground>
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 40) + 20 }]}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.iconContainer}>
            <Image source={require('../assets/images/camila_avatar.jpg')} style={styles.avatar} />
            <Animated.View style={[styles.scanLaser, { transform: [{ translateY: laserTranslateY }] }]} />
          </View>
          <Animated.View style={{ transform: [{ translateX: glitchX }], opacity: glitchOpacity }}>
            <Text style={styles.title}>
              [ TERMINAL NUTRIBOT //_ ]{'\n'}
              <Text style={{ color: COLORS.primary }}>METABOLIC FIEND</Text>
            </Text>
          </Animated.View>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>SYNDROME OS // CORE v9</Text>
        </Animated.View>

        {/* Console Boot Output */}
        <View style={{ height: 120, width: '100%', marginBottom: 30, paddingHorizontal: 20 }}>
          {bootLines.map((line, i) => (
            <Text key={i} style={{ color: line.includes('[ OK ]') ? COLORS.neon : COLORS.dim, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, marginBottom: 4, letterSpacing: 1 }}>
              {line}
            </Text>
          ))}
        </View>

        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {bootComplete && (
            <>
              {session ? (
                <CyberButton
                  title="ENTRAR AL SISTEMA"
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    await new Promise(r => setTimeout(r, 150));
                    router.replace('/(app)/dashboard');
                  }}
                  color={COLORS.neon}
                  icon={<Ionicons name="enter" size={24} color={COLORS.bg} />}
                  style={{ width: '100%' }}
                />
              ) : (
                <CyberButton
                  title="INICIAR SESIÓN"
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    await new Promise(r => setTimeout(r, 150));
                    router.push('/login');
                  }}
                  color={COLORS.crimson}
                  icon={<Ionicons name="key" size={24} color={COLORS.bg} />}
                  style={{ width: '100%' }}
                />
              )}
            </>
          )}
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <Text style={styles.copyright}>© 2026 CREADO POR CAMILA OLIVARES ARCE</Text>
          <Text style={styles.systemStatus}>ESTATUS: <Text style={{ color: COLORS.neon, fontFamily: FONTS.horror, fontSize: 13 }}>{bootComplete ? 'CARNE FRESCA DETECTADA 💀 // v9.0' : 'INICIANDO...'}</Text></Text>
        </View>
      </View>
    </TerminalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING.xxl * 1.5 },
  iconContainer: {
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.pink,
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    overflow: 'hidden',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.md,
    resizeMode: 'cover',
  },
  iconShadow: {
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  scanLaser: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.neon,
    shadowColor: COLORS.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontFamily: FONTS.space,
    fontSize: 26,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginVertical: SPACING.lg,
    ...SHADOWS.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  buttonContainer: { width: '100%', maxWidth: 320, marginTop: SPACING.md },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 6,
  },
  copyright: {
    fontSize: 9,
    color: COLORS.dim,
    letterSpacing: 2,
    fontFamily: FONTS.space,
    textTransform: 'uppercase',
  },
  systemStatus: {
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 2,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
