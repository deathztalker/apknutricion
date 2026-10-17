import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { height, width } = Dimensions.get('window');
const PARTICLE_COUNT = 20;
const ICONS = ['💀', '🎸', '🎃', '🦇', '🍏', '⚡', '🩸', '🕷️', '☠️'];

export default function NeuralBackground({ children }: { children: React.ReactNode }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const pulse2Anim = useRef(new Animated.Value(1)).current;

  const particles = useRef(Array.from({ length: PARTICLE_COUNT }).map(() => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(Math.random() * height),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.4 + Math.random() * 0.8),
    icon: ICONS[Math.floor(Math.random() * ICONS.length)],
    speed: 18000 + Math.random() * 22000,
  }))).current;

  useEffect(() => {
    let isActive = true;

    // Primary glow pulse - orange tint (top)
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ])
    );
    loop1.start();
    // Secondary glow pulse - neon green (bottom), offset
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(2500),
        Animated.timing(pulse2Anim, { toValue: 0, duration: 5000, useNativeDriver: true }),
        Animated.timing(pulse2Anim, { toValue: 1, duration: 5000, useNativeDriver: true }),
      ])
    );
    loop2.start();

    // Drifting horror icons
    particles.forEach((p) => {
      const animate = () => {
        if (!isActive) return;
        const toX = Math.random() * width;
        const toY = Math.random() * height;
        Animated.parallel([
          Animated.timing(p.x, { toValue: toX, duration: p.speed, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: toY, duration: p.speed, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(p.opacity, { toValue: Math.random() * 0.6 + 0.4, duration: p.speed / 3, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0.1, duration: p.speed * 2 / 3, useNativeDriver: true }),
          ])
        ]).start(({ finished }) => {
          if (finished && isActive) animate();
        });
      };
      animate();
    });

    return () => {
      isActive = false;
      loop1.stop();
      loop2.stop();
      pulseAnim.stopAnimation();
      pulse2Anim.stopAnimation();
      particles.forEach(p => {
        p.x.stopAnimation();
        p.y.stopAnimation();
        p.opacity.stopAnimation();
      });
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Base deep dark gradient */}
      <LinearGradient
        colors={['rgba(26,5,16,1)', 'rgba(13,0,16,0.9)', 'rgba(26,5,16,1)']}
        style={StyleSheet.absoluteFill}
      />
      {/* Orange vignette pulse (top) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseAnim }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,107,0,0.25)', 'transparent', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Neon vignette pulse (bottom) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulse2Anim }]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(0,255,159,0.2)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Horror floating particles */}
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
          <Text style={{ fontSize: 24, textShadowColor: p.icon === '💀' ? COLORS.primary : COLORS.neon, textShadowRadius: 10 }}>{p.icon}</Text>
        </Animated.View>
      ))}

      {/* Subtle CRT scanlines overlay */}
      <View style={styles.scanlinesContainer} pointerEvents="none">
        {Array.from({ length: Math.ceil(height / 6) }).map((_, i) => (
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
  },
  scanlinesContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    zIndex: 0,
  },
  scanline: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 5,
  }
});
