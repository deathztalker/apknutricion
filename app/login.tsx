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
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SHADOWS, FONTS } from '../constants/theme';
import { authService } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // Misfits flickering animation
  const flickerAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const runFlicker = () => {
      Animated.sequence([
        Animated.timing(flickerAnim, { toValue: 0.2, duration: 40, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 0.3, duration: 60, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(1500 + Math.random() * 3000),
      ]).start(() => runFlicker());
    };

    runFlicker();
  }, []);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      Alert.alert('SYSTEM ERROR', 'INCOMPLETE CREDENTIALS');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await authService.signIn(email, password);
        if (error) throw error;
        router.replace('/(app)/dashboard');
      } else {
        const { error } = await authService.signUp(email, password, fullName);
        if (error) throw error;
        Alert.alert('REGISTRY COMPLETE', 'Clinical identity created.');
        setIsLogin(true);
      }
    } catch (error: any) {
      Alert.alert('AUTH FAILURE', error.message || 'Access Denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.blackBackground} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Animated.View style={{ opacity: flickerAnim, transform: [{ translateX: shakeAnim }] }}>
            <Ionicons name="skull" size={100} color={COLORS.white} style={styles.misfitsSkull} />
          </Animated.View>
          
          <Animated.Text style={[styles.title, { opacity: flickerAnim }]}>
            {isLogin ? 'MISFITS\nSYSTEM' : 'NEW\nREVENANT'}
          </Animated.Text>
          
          <View style={styles.toxicBar} />
          <Text style={styles.subtitle}>
            {isLogin ? 'I want your brains... and your data' : 'Join the crimson ghost brigade'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>CLINICAL ALIAS</Text>
              <TextInput
                style={styles.input}
                placeholder="Subject Zero"
                placeholderTextColor={COLORS.dim}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>FREQUENCY (EMAIL)</Text>
            <TextInput
              style={styles.input}
              placeholder="hell@system.com"
              placeholderTextColor={COLORS.dim}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>ENCRYPTION (PASSWORD)</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.dim}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isLogin ? 'INITIALIZE OVERRIDE' : 'GENERATE IDENTITY'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>DIGITAL VOID</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.googleButton]}
            onPress={() => Alert.alert('GOOGLE AUTH', 'System link required.')}
          >
            <Ionicons name="logo-google" size={20} color={COLORS.white} style={{ marginRight: 10 }} />
            <Text style={styles.googleButtonText}>SIGN IN WITH BLOOD</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin ? "DON'T HAVE AN IDENTITY? MUTATE" : "ALREADY INFECTED? LOG IN"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  blackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  misfitsSkull: {
    marginBottom: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    fontSize: 56,
    fontFamily: FONTS.horror,
    color: COLORS.white,
    letterSpacing: -2,
    textAlign: 'center',
    lineHeight: 56,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  toxicBar: {
    width: 80,
    height: 4,
    backgroundColor: COLORS.neon,
    marginVertical: 15,
    borderRadius: 2,
    ...SHADOWS.neon,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.muted,
    fontStyle: 'italic',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#222',
    borderRadius: 0,
    padding: 16,
    color: COLORS.white,
    fontSize: 16,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
  },
  primaryButton: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
    marginTop: 10,
  },
  googleButton: {
    backgroundColor: 'transparent',
    borderColor: '#444',
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000',
    fontFamily: FONTS.horror,
    fontSize: 24,
    letterSpacing: 1,
  },
  googleButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  divider: {
    flex: 1,
    height: 2,
    backgroundColor: '#111',
  },
  dividerText: {
    color: '#333',
    paddingHorizontal: 16,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
  },
  switchButton: {
    marginTop: 15,
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.neon,
  },
  switchButtonText: {
    color: COLORS.neon,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
