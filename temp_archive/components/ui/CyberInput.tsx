import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS } from '../../constants/theme';

interface CyberInputProps extends Omit<TextInputProps, 'onChange' | 'value'> {
  label: string;
  value: string | number | undefined;
  onChange: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export default function CyberInput({ label, value, onChange, placeholder, multiline, ...props }: CyberInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={String(value ?? '')}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        multiline={multiline}
        keyboardAppearance="dark"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: { 
    flex: 1, 
    marginBottom: 15,
    minWidth: 140, // Ensures stacking on small screens
  },
  inputLabel: { 
    fontSize: 10, 
    fontWeight: '900', 
    color: COLORS.bone, 
    marginBottom: 6, 
    letterSpacing: 1, 
    textTransform: 'uppercase' 
  },
  input: { 
    height: 50, 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    borderWidth: 1, 
    borderColor: COLORS.dim, 
    borderRadius: 6, 
    paddingHorizontal: 15, 
    color: COLORS.white, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  multiline: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 15,
  }
});
