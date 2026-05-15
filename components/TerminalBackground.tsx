import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { height, width } = Dimensions.get('window');

const PARTICLE_COUNT = 15;

export default function TerminalBackground({ children }: { children: React.ReactNode }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const particles = useRef(Array.from({ length: PARTICLE_COUNT }).map(() => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(Math.random() * height),
    opacity: new Animated.Value(Math.random() * 0.3),
    scale: new Animated.Value(Math.random() * 2),
  }))).current;

  useEffect(() => {
    // Pulsating Background
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 4000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    // Particle Animation
    particles.forEach((p) => {
      const animateParticle = () => {
        const toX = Math.random() * width;
        const toY = Math.random() * height;
        const duration = 10000 + Math.random() * 20000;

        Animated.parallel([
          Animated.timing(p.x, { toValue: toX, duration, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: toY, duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(p.opacity, { toValue: 0.5, duration: duration / 2, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0, duration: duration / 2, useNativeDriver: true }),
          ])
        ]).start(() => animateParticle());
      };
      animateParticle();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Deep Void Base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} />
      
      {/* Pulsating Neural Vignette */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseAnim }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(220, 20, 60, 0.2)', 'transparent', 'transparent', 'rgba(102, 0, 204, 0.1)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Floating Ash Particles */}
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
      
      {/* CRT Scanlines Grid */}
      <View style={styles.scanlinesContainer} pointerEvents="none">
        {Array.from({ length: Math.ceil(height / 4) }).map((_, i) => (
          <View key={i} style={styles.scanline} />
        ))}
      </View>

      {/* Grunge Static Overlay */}
      <View style={styles.staticOverlay} pointerEvents="none" />

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
    width: 4,
    height: 4,
    backgroundColor: COLORS.crimson,
    borderRadius: 2,
    zIndex: 0,
  },
  scanlinesContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  scanline: {
    height: 1,
    width: '100%',
    backgroundColor: '#000',
    marginBottom: 3,
  },
  staticOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.03,
    // Add border for retro monitor feel
    borderWidth: 20,
    borderColor: '#000',
  }
});
