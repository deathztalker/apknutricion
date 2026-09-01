import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { height, width } = Dimensions.get('window');
const PARTICLE_COUNT = 25;
const ICONS = ['💀', '🎸', '🎃', '🦇', '🍏', '⚡']; // Punk/Halloween icons

export default function TerminalBackground({ children }: { children: React.ReactNode }) {
  const pulseAnim = useRef(new Animated.Value(0.1)).current;
  
  const particles = useRef(Array.from({ length: PARTICLE_COUNT }).map(() => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(Math.random() * height),
    opacity: new Animated.Value(Math.random() * 0.25),
    scale: new Animated.Value(0.5 + Math.random() * 1),
    icon: ICONS[Math.floor(Math.random() * ICONS.length)],
    speed: 15000 + Math.random() * 25000,
  }))).current;

  useEffect(() => {
    // Subtle gradient pulse (Haunted Glow)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 4000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.1, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    // Drifting espectral de iconos
    particles.forEach((p) => {
      const animate = () => {
        const toX = Math.random() * width;
        const toY = Math.random() * height;
        
        Animated.parallel([
          Animated.timing(p.x, { toValue: toX, duration: p.speed, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: toY, duration: p.speed, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(p.opacity, { toValue: 0.25, duration: p.speed / 2, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0, duration: p.speed / 2, useNativeDriver: true }),
          ])
        ]).start(() => animate());
      };
      animate();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Base Deep Space / Professional Dark - Punk Stage */}
      <LinearGradient
        colors={[COLORS.bg1, '#1A0B1A', COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Haunted Pulse (Magenta / Neon Green / Orange) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseAnim }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255, 0, 255, 0.08)', 'transparent', 'rgba(0, 255, 159, 0.08)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Horror Clinical Particles */}
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
        >
          <Text style={{ fontSize: 18, color: COLORS.primary }}>{p.icon}</Text>
        </Animated.View>
      ))}
      
      {/* CRT Scanlines for retro/sci-fi horror vibe */}
      <View style={styles.scanlinesContainer} pointerEvents="none">
        {Array.from({ length: Math.ceil(height / 8) }).map((_, i) => (
          <View key={i} style={styles.scanline} />
        ))}
      </View>

      <View style={{ flex: 1, zIndex: 1 }}>
        {children}
      </View>
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
    zIndex: 0,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scanlinesContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05, // very subtle
  },
  scanline: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 7,
  }
});
