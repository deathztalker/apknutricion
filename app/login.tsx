import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../constants/theme';
import { authService } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
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
        Alert.alert('Éxito', 'Cuenta creada. Por favor verifica tu correo si es necesario.');
        setIsLogin(true);
      }
    } catch (error: any) {
      Alert.alert('Error de Autenticación', error.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert('Google Auth', 'La integración de Google Auth requiere configuración en Supabase Cloud Dashboard.');
    // Aquí iría la lógica de AuthSession o GoogleSignin
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[COLORS.bg1, COLORS.bg3, COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{isLogin ? 'ACCESS' : 'REGISTRY'}</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Enter your credentials to override' : 'Create a new clinical identity'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Dr. John Doe"
                placeholderTextColor={COLORS.dim}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="terminal@system.com"
              placeholderTextColor={COLORS.dim}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>PASSWORD</Text>
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
              <ActivityIndicator color={COLORS.neon} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isLogin ? 'INITIALIZE SESSION' : 'COMPLETE REGISTRY'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleLogin}
          >
            <Ionicons name="logo-google" size={20} color={COLORS.white} style={{ marginRight: 10 }} />
            <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin ? "DON'T HAVE AN ACCOUNT? REGISTER" : "ALREADY REGISTERED? LOGIN"}
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
    backgroundColor: COLORS.bg,
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
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.neon,
    letterSpacing: 4,
    textShadowColor: COLORS.neon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.pink,
    letterSpacing: 1,
    marginTop: 8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.muted,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.bg4,
    borderRadius: 8,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: 'rgba(163, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.neon,
    ...SHADOWS.neon,
    marginTop: 10,
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: COLORS.neon,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  googleButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.bg4,
  },
  dividerText: {
    color: COLORS.dim,
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  switchButtonText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
});
