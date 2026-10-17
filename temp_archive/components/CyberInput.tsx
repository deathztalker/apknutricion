import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, Animated, StyleSheet, Easing } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import * as Haptics from 'expo-haptics';

interface CyberInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  color?: string;
  style?: any;
}

export default function CyberInput({
  label,
  value,
  onChangeText,
  placeholder = '',
  keyboardType = 'default',
  multiline = false,
  color = COLORS.neon,
  style,
}: CyberInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // color interpolation and height layout need false
    }).start();
  }, [isFocused, value]);

  const labelTop = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [18, -10],
  });

  const labelFontSize = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 11],
  });

  const labelColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.dim, color],
  });

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.bg3, color],
  });

  const shadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <Animated.View style={[styles.container, style, { borderColor, shadowColor: color, shadowOpacity, shadowRadius: 10 }]}>
      <Animated.Text style={[styles.label, { top: labelTop, fontSize: labelFontSize, color: labelColor }]}>
        {label}
      </Animated.Text>
      
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => {
          setIsFocused(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? placeholder : ''}
        placeholderTextColor={COLORS.dim}
        keyboardType={keyboardType}
        multiline={multiline}
        selectionColor={color}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.7)',
    borderRadius: 8,
    marginVertical: 12,
    position: 'relative',
    paddingHorizontal: 15,
    minHeight: 55,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 10,
    backgroundColor: COLORS.bg1,
    paddingHorizontal: 5,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  input: {
    color: COLORS.white,
    fontSize: 16,
    paddingVertical: 15,
    fontFamily: FONTS.space,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  }
});
