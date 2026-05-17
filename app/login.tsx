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
                    placeholderTextColor={COLORS.muted}
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
