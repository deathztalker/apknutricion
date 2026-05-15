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
import { COLORS, SHADOWS, FONTS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import TerminalBackground from '../components/TerminalBackground';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const skullAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(skullAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(skullAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
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

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Client ID: 897785100201-hco12glrgkna84vtgel63jmq7eo1k4fh.apps.googleusercontent.com
          // Redirection to your app scheme
          redirectTo: 'apknutricion://google-auth', 
        },
      });
      if (error) throw error;
    } catch (error: any) {
      Alert.alert('GHOST ERROR', error.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('SYSTEM ERROR', 'IDENTITY DATA REQUIRED');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('LINK INITIATED', 'Verify your identity via encrypted transmission (Email).');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/(app)/dashboard');
      }
    } catch (error: any) {
      Alert.alert('ACCESS DENIED', error.message);
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
              <Text style={styles.title}>WE ARE 138</Text>
              <Text style={styles.subtitle}>DIAGNOSTIC AUTHORIZATION REQUIRED</Text>
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
                    <Text style={styles.googleButtonText}>GHOST LOGIN WITH GOOGLE</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR INTERNAL PROTOCOL</Text>
                <View style={styles.orLine} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>IDENTITY (EMAIL)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Subject ID"
                    placeholderTextColor={COLORS.dim}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>SECRET CODE</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.dim}
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
                  <Text style={styles.authButtonText}>{isSignUp ? 'REGISTER SUBJECT' : 'ESTABLISH LINK'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.switchButton} 
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={styles.switchButtonText}>
                  {isSignUp ? 'EXISTING IDENTITY? SIGN IN' : 'NEW REVENANT? INITIALIZE'}
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  loginBox: {
    backgroundColor: 'rgba(5, 5, 5, 0.9)',
    borderWidth: 2,
    borderColor: COLORS.crimson,
    padding: 30,
    borderRadius: 4,
    ...SHADOWS.crimson,
  },
  header: { alignItems: 'center', marginBottom: 30 },
  skullShadow: {
    textShadowColor: COLORS.crimson,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    fontSize: 48,
    fontFamily: FONTS.horror,
    color: COLORS.white,
    marginTop: 10,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 9,
    color: COLORS.bone,
    letterSpacing: 2,
    fontWeight: 'bold',
    opacity: 0.7,
    marginTop: 5,
  },
  line: {
    width: '40%',
    height: 1,
    backgroundColor: COLORS.crimson,
    marginTop: 15,
  },
  form: { gap: 20 },
  googleButton: {
    height: 55,
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...SHADOWS.pink,
  },
  googleButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  orLine: { flex: 1, height: 1, backgroundColor: COLORS.dim },
  orText: { color: COLORS.dim, fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  inputGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: 'bold', color: COLORS.muted, letterSpacing: 1 },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.dim,
    paddingHorizontal: 15,
    height: 50,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  authButton: {
    height: 60,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    overflow: 'hidden',
    ...SHADOWS.crimson,
  },
  authButtonText: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: FONTS.horror,
    letterSpacing: 2,
  },
  switchButton: {
    padding: 10,
    alignItems: 'center',
  },
  switchButtonText: {
    color: COLORS.dim,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
});
