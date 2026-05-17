import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { height, width } = Dimensions.get('window');
const PARTICLE_COUNT = 25; // Más densidad para atmósfera Misfits
const ICONS = ['💀', '🍎', '💉', '🧪', '🩸', '🎃', '🍗'];

export default function TerminalBackground({ children }: { children: React.ReactNode }) {
  const pulseAnim = useRef(new Animated.Value(0.2)).current;
  
  const particles = useRef(Array.from({ length: PARTICLE_COUNT }).map(() => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(Math.random() * height),
    opacity: new Animated.Value(Math.random() * 0.4),
    scale: new Animated.Value(0.5 + Math.random() * 1),
    icon: ICONS[Math.floor(Math.random() * ICONS.length)],
    speed: 15000 + Math.random() * 25000,
  }))).current;

  useEffect(() => {
    // Pulsación rítmica del fondo (Haunted Glow)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 4000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 4000, useNativeDriver: true }),
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
            Animated.timing(p.opacity, { toValue: 0.4, duration: p.speed / 2, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0, duration: p.speed / 2, useNativeDriver: true }),
          ])
        ]).start(() => animate());
      };
      animate();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Base de Halloween (Púrpura Profundo a Verde Tóxico) */}
      <LinearGradient
        colors={['#0f051a', '#050a05', '#1a050f']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Resplandor Pulsante Verde/Púrpura */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseAnim }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(57, 255, 20, 0.1)', 'transparent', 'rgba(157, 0, 255, 0.1)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Partículas Temáticas (Calaveras y Nutrición) */}
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
          <Text style={{ fontSize: 16 }}>{p.icon}</Text>
        </Animated.View>
      ))}
      
      {/* Scanlines de Terminal de Horror (CRT) */}
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
    backgroundColor: '#000',
  },
  particle: {
    position: 'absolute',
    zIndex: 0,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  scanlinesContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  scanline: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 7,
  }
});
