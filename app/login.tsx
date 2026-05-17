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
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { COLORS, SHADOWS, FONTS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import TerminalBackground from '../components/TerminalBackground';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const skullAnim = useRef(new Animated.Value(0)).current;
  const flickerAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: Platform.OS !== 'web' }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(skullAnim, { toValue: 1, duration: 2000, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(skullAnim, { toValue: 0, duration: 2000, useNativeDriver: Platform.OS !== 'web' }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(flickerAnim, { toValue: 0.7, duration: 100, useNativeDriver: false }),
          Animated.timing(flickerAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
          Animated.delay(3000),
          Animated.timing(flickerAnim, { toValue: 0.4, duration: 50, useNativeDriver: false }),
          Animated.timing(flickerAnim, { toValue: 1, duration: 50, useNativeDriver: false }),
        ])
      )
    ]).start();
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

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      // Definimos la URL de retorno explícitamente para GitHub Pages
      // En Web: https://deathztalker.github.io/apknutricion/google-auth
      // En APK: nutricesfam://google-auth
      const redirectTo = Platform.OS === 'web' 
        ? 'https://deathztalker.github.io/apknutricion/google-auth'
        : Linking.createURL('google-auth');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) throw error;

      if (Platform.OS !== 'web' && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'cancel') {
          setGoogleLoading(false);
        }
      }

    } catch (error: any) {
      Alert.alert('GHOST ERROR', error.message);
      setGoogleLoading(false);
    }
  }

  async function handleAuth() {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      Alert.alert('ERROR DE SISTEMA', 'ADN DIGITAL Y CÓDIGO GENÉTICO REQUERIDOS');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: cleanEmail, password });
        if (error) throw error;
        Alert.alert('VÍNCULO INICIADO', 'Verifica tu identidad en el plano espectral (Revisa tu Email).');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
          // Manejo específico de errores de Supabase
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Código genético o ADN digital incorrecto.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Vínculo no verificado. Revisa tu bandeja de entrada.');
          }
          throw error;
        }
        // El RootLayout detectará el cambio de sesión y redirigirá automáticamente.
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

            {/* The Crimson Ghost / Misfits Centerpiece */}
            <View style={styles.header}>
              <Animated.View style={{ transform: [{ scale: skullScale }], opacity: skullOpacity }}>
                <Ionicons name="skull" size={100} color={COLORS.crimson} style={styles.skullShadow} />
              </Animated.View>
              <Animated.Text style={[styles.title, { textShadowRadius: glowRadius, opacity: flickerAnim }]}>
                NÚCLEO NUTRICIONAL
              </Animated.Text>
              <Text style={styles.subtitle}>AUTORIZACIÓN DE ACCESO CELULAR</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.form}>

              {/* Google Auth - Premium HD Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                disabled={googleLoading}
              >
                <LinearGradient
                  colors={['#4285F4', '#34a853']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                {googleLoading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#fff" />
                    <Text style={styles.googleButtonText}>VINCULACIÓN NEURAL GOOGLE</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>O PROTOCOLO BIOQUÍMICO</Text>
                <View style={styles.orLine} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ADN DIGITAL (EMAIL)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="ID de Espécimen"
                    placeholderTextColor={COLORS.muted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CÓDIGO GENÉTICO (PASSWORD)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
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
                  <Text style={styles.authButtonText}>{isSignUp ? 'SINTETIZAR SUJETO' : 'SINCronizar METABOLISMO'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={styles.switchButtonText}>
                  {isSignUp ? '¿ALMA EXISTENTE? RECONECTAR' : '¿NUEVO ESPECTRO? INICIALIZAR'}
                </Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(5, 5, 5, 0.96)',
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
  skullShadow: {
    textShadowColor: COLORS.orange,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  title: {
    fontSize: 58,
    fontFamily: FONTS.horror,
    color: COLORS.white,
    marginTop: 15,
    letterSpacing: 5,
    textShadowColor: '#000',
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.purple,
    letterSpacing: 6,
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
  googleButton: {
    height: 65,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: COLORS.purple,
    shadowColor: COLORS.purple,
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  googleButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginVertical: 15,
  },
  orLine: { flex: 1, height: 2, backgroundColor: COLORS.dim },
  orText: { color: COLORS.purple, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
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
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
