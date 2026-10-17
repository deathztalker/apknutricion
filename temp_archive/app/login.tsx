import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, FONTS } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import TerminalBackground from '../components/TerminalBackground';
import { LinearGradient } from 'expo-linear-gradient';

export default function Login() {
  const { login, pin: currentPin, setPin: storeSetPin } = useAuthStore();
  const hasPin = !!currentPin;

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(!hasPin);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const skullAnim = useRef(new Animated.Value(0)).current;
  const flickerAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Si ya tiene PIN y por alguna razón isSignUp es true, forzar a false
    if (hasPin && isSignUp) {
      setIsSignUp(false);
    }
  }, [hasPin]);

  useEffect(() => {
    const skullLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(skullAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(skullAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    );
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flickerAnim, { toValue: 0.7, duration: 100, useNativeDriver: false }),
        Animated.timing(flickerAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
        Animated.delay(3000),
        Animated.timing(flickerAnim, { toValue: 0.4, duration: 50, useNativeDriver: false }),
        Animated.timing(flickerAnim, { toValue: 1, duration: 50, useNativeDriver: false }),
      ])
    );
    const fadeIn = Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: false });

    fadeIn.start();
    skullLoop.start();
    flickerLoop.start();

    return () => {
      fadeIn.stop();
      skullLoop.stop();
      flickerLoop.stop();
      fadeAnim.stopAnimation();
      skullAnim.stopAnimation();
      flickerAnim.stopAnimation();
    };
  }, []);

  const skullScale = skullAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const skullOpacity = skullAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const glowRadius = flickerAnim.interpolate({
    inputRange: [0.4, 1],
    outputRange: [5, 25],
  });

  async function handleAuth() {
    if (!pin) {
      Alert.alert('ERROR DE SISTEMA', 'PIN DE ACCESO REQUERIDO');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        storeSetPin(pin);
        login(pin);
        router.replace('/(app)/dashboard');
      } else {
        const success = login(pin);
        if (success) {
          router.replace('/(app)/dashboard');
        } else {
          Alert.alert('ACCESO DENEGADO', 'PIN INCORRECTO. INTENTO FALLIDO.');
        }
      }
    } catch (error: any) {
      Alert.alert('ACCESO DENEGADO', `ERROR DE NÚCLEO: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TerminalBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.loginBox, { opacity: fadeAnim }]}>

            {/* The Misfits / Punk Centerpiece */}
            <View style={styles.header}>
              <Animated.View style={{ transform: [{ scale: skullScale }], opacity: skullOpacity }}>
                <View style={styles.avatarContainer}>
                  <Image source={require('../assets/images/camila_avatar.jpg')} style={styles.avatar} />
                </View>
              </Animated.View>
              <Animated.Text style={[styles.title, { textShadowRadius: glowRadius, opacity: flickerAnim }]}>
                MEOW CLUB
              </Animated.Text>
              <Text style={styles.subtitle}>SÍNTESIS DE ADN DIGITAL // MODO OFFLINE</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.form}>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{isSignUp ? 'CREAR PIN MAESTRO' : 'PIN DE ACCESO'}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••"
                    placeholderTextColor={COLORS.muted}
                    value={pin}
                    onChangeText={setPin}
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={8}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.authButton}
                onPress={handleAuth}
                disabled={loading}
              >
                <LinearGradient
                  colors={[COLORS.crimson, '#800000']}
                  style={StyleSheet.absoluteFill}
                />
                {loading ? <ActivityIndicator color={COLORS.white} /> : (
                  <Text style={styles.authButtonText}>{isSignUp ? 'SINTETIZAR PIN' : 'SINCRONIZAR'}</Text>
                )}
              </TouchableOpacity>

              {!hasPin && !isSignUp && (
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setIsSignUp(true)}
                >
                  <Text style={styles.switchButtonText}>¿NUEVO ESPECTRO? CREAR PIN</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TerminalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  loginBox: {
    backgroundColor: 'rgba(5, 5, 5, 0.88)',
    borderWidth: 3,
    borderColor: COLORS.orange,
    padding: 40,
    borderRadius: 0,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  avatarContainer: {
    padding: 6,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.pink,
    overflow: 'hidden',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 48,
    fontFamily: FONTS.horror,
    color: COLORS.white,
    marginTop: 15,
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.purple,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '900',
    marginTop: 8,
  },
  line: {
    width: '50%',
    height: 3,
    backgroundColor: COLORS.orange,
    marginTop: 20,
  },
  form: { gap: 25 },
  inputGroup: { gap: 10 },
  label: { fontSize: 12, fontWeight: '900', color: COLORS.bone, letterSpacing: 2, textTransform: 'uppercase' },
  inputWrapper: {
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: COLORS.dim,
    paddingHorizontal: 18,
    height: 60,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    letterSpacing: 10,
  },
  authButton: {
    height: 75,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    backgroundColor: COLORS.orange,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 15,
  },
  authButtonText: {
    color: COLORS.white,
    fontSize: 28,
    fontFamily: FONTS.horror,
    letterSpacing: 3,
  },
  switchButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  switchButtonText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textDecorationLine: 'underline',
  },
});
