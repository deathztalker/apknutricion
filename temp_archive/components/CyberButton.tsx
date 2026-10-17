import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Easing, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../constants/theme';
import * as Haptics from 'expo-haptics';

interface CyberButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  icon?: React.ReactNode;
  style?: any;
}

export default function CyberButton({
  title,
  onPress,
  color = COLORS.neon,
  icon,
  style,
}: CyberButtonProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();

    return () => {
      loop.stop();
      pulseAnim.stopAnimation();
    };
  }, []);

  const shadowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.75} style={[styles.container, style]}>
      <Animated.View style={[styles.glow, { shadowColor: color, shadowOpacity, borderColor: color }]}>
        <LinearGradient
          colors={[`${color}22`, `${color}08`, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[styles.title, { color }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 0,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderWidth: 2,
    borderRadius: 0,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  iconContainer: {
    marginRight: 4,
  },
  title: {
    fontFamily: FONTS.horror,
    fontSize: 22,
    letterSpacing: 3,
  },
});
