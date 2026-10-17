import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import TerminalBackground from './TerminalBackground';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[KERNEL PANIC]', error, errorInfo);
  }

  private handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    this.setState({ hasError: false, errorMsg: '' });
    router.replace('/');
  };

  public render() {
    if (this.state.hasError) {
      return (
        <TerminalBackground>
          <View style={styles.container}>
            <View style={styles.alertBox}>
              <Ionicons name="warning" size={48} color={COLORS.crimson} />
              <Text style={styles.title}>SISTEMA COMPROMETIDO</Text>
              <Text style={styles.subtitle}>
                KERNEL PANIC - SE HA DETECTADO UNA ANOMALÍA GRAVE EN EL NÚCLEO.
              </Text>
              
              <View style={styles.codeBlock}>
                <Text style={styles.codeText} numberOfLines={4}>
                  ERR_TRACE: {this.state.errorMsg || 'UNKNOWN_FATAL_ERROR'}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.rebootBtn}
                onPress={this.handleReset}
                activeOpacity={0.7}
              >
                <Ionicons name="power" size={20} color={COLORS.bg} />
                <Text style={styles.rebootTxt}>REINICIAR SUBSISTEMA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TerminalBackground>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  alertBox: {
    backgroundColor: 'rgba(5, 0, 0, 0.85)',
    borderWidth: 2,
    borderColor: COLORS.crimson,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: COLORS.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontFamily: FONTS.horror,
    fontSize: 24,
    color: COLORS.crimson,
    marginTop: SPACING.md,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.space,
    fontSize: 12,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    opacity: 0.8,
    lineHeight: 18,
  },
  codeBlock: {
    backgroundColor: 'rgba(255, 0, 60, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.crimson,
    padding: SPACING.md,
    width: '100%',
    marginBottom: SPACING.xl,
  },
  codeText: {
    fontFamily: 'monospace',
    color: COLORS.pink,
    fontSize: 11,
  },
  rebootBtn: {
    backgroundColor: COLORS.crimson,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.sm,
    gap: 8,
  },
  rebootTxt: {
    fontFamily: FONTS.space,
    color: COLORS.bg,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  }
});
