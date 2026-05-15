import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { height, width } = Dimensions.get('window');

export default function TerminalBackground({ children }: { children: React.ReactNode }) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Base Deep Void */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} />
      
      {/* Pulsating Crimson Vignette */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseAnim }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(220, 20, 60, 0.15)', 'transparent', 'transparent', 'rgba(220, 20, 60, 0.15)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Grunge / Grain Overlay (Simulated with absolute views if no local image) */}
      <View style={styles.noiseOverlay} pointerEvents="none">
        {/* We can add a very subtle grain effect here */}
      </View>
      
      {/* CRT Scanlines */}
      <View style={styles.scanlinesContainer} pointerEvents="none">
        {Array.from({ length: Math.ceil(height / 3) }).map((_, i) => (
          <View key={i} style={styles.scanline} />
        ))}
      </View>

      {/* Glass Reflection / Glare */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.03)', 'transparent', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scanlinesContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  scanline: {
    height: 1,
    width: '100%',
    backgroundColor: '#000',
    marginBottom: 2,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.05,
  }
});
