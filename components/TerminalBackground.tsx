import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { height, width } = Dimensions.get('window');
const PARTICLE_COUNT = 10; // Reduced for elegance

export default function TerminalBackground({ children }: { children: React.ReactNode }) {
  const pulseAnim = useRef(new Animated.Value(0.15)).current; // Softer pulse
  
  const particles = useRef(Array.from({ length: PARTICLE_COUNT }).map(() => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(Math.random() * height),
    opacity: new Animated.Value(Math.random() * 0.2),
    scale: new Animated.Value(Math.random() * 1.5),
  }))).current;

  useEffect(() => {
    // Subtle pulsating background
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 6000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.15, duration: 6000, useNativeDriver: true }),
      ])
    ).start();

    // Slow drifting particles
    particles.forEach((p) => {
      const animateParticle = () => {
        const toX = Math.random() * width;
        const toY = Math.random() * height;
        const duration = 20000 + Math.random() * 20000;

        Animated.parallel([
          Animated.timing(p.x, { toValue: toX, duration, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: toY, duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(p.opacity, { toValue: 0.3, duration: duration / 2, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0, duration: duration / 2, useNativeDriver: true }),
          ])
        ]).start(() => animateParticle());
      };
      animateParticle();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Deep Abyssal Base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} />
      
      {/* Subtle Premium Glow */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseAnim }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255, 42, 85, 0.08)', 'transparent', 'transparent', 'rgba(0, 229, 255, 0.05)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Floating Particles (Glass/Ash) */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
              opacity: p.opacity,
            },
          ]}
        />
      ))}
      
      {/* High-Fidelity CRT Scanlines */}
      <View style={styles.scanlinesContainer} pointerEvents="none">
        {Array.from({ length: Math.ceil(height / 6) }).map((_, i) => (
          <View key={i} style={styles.scanline} />
        ))}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: COLORS.bone,
    borderRadius: 1.5,
    zIndex: 0,
    shadowColor: COLORS.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  scanlinesContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05, // Very subtle
  },
  scanline: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginBottom: 5,
  }
});
