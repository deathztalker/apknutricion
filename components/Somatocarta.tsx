import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Circle, Text as SvgText, Line } from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface Props {
  x: number;
  y: number;
  size?: number;
}

export default function Somatocarta({ x, y, size = 300 }: Props) {
  // Escalamiento de coordenadas Heath-Carter (-6 a 6 en X, -6 a 12 en Y)
  // Viewbox: 0,0 a 100,100
  // Centro X: 50
  // Base Y: 80
  
  const scaleX = (val: number) => 50 + (val * 7); // 1 unidad = 7% del ancho
  const scaleY = (val: number) => 75 - (val * 5); // 1 unidad = 5% del alto

  const pointX = scaleX(x);
  const pointY = scaleY(y);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        {/* Triángulo de referencia */}
        <Polygon
          points="50,15 10,85 90,85"
          fill="rgba(163, 255, 0, 0.05)"
          stroke={COLORS.bg4}
          strokeWidth="0.5"
        />
        
        {/* Ejes internos */}
        <Line x1="50" y1="85" x2="50" y2="15" stroke={COLORS.bg4} strokeWidth="0.2" strokeDasharray="1,1" />
        <Line x1="10" y1="85" x2="90" y2="85" stroke={COLORS.bg4} strokeWidth="0.2" strokeDasharray="1,1" />

        {/* Etiquetas de los vértices */}
        <SvgText x="50" y="10" fill={COLORS.neon} fontSize="4" fontWeight="bold" textAnchor="middle">MESOMORFIA</SvgText>
        <SvgText x="5" y="90" fill={COLORS.pink} fontSize="4" fontWeight="bold" textAnchor="middle">ENDOMORFIA</SvgText>
        <SvgText x="95" y="90" fill={COLORS.sky} fontSize="4" fontWeight="bold" textAnchor="middle">ECTOMORFIA</SvgText>

        {/* El punto del paciente */}
        <Circle
          cx={pointX}
          cy={pointY}
          r="2.5"
          fill={COLORS.neon}
          stroke={COLORS.bg}
          strokeWidth="0.5"
        />
        
        {/* Sombra del punto para efecto neón */}
        <Circle
          cx={pointX}
          cy={pointY}
          r="4"
          fill="transparent"
          stroke={COLORS.neon}
          strokeWidth="0.2"
          opacity="0.5"
        />
      </Svg>
      
      <View style={styles.legend}>
        <Text style={styles.legendText}>X: {x.toFixed(2)}  Y: {y.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: COLORS.bg1,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.bg4,
  },
  legend: {
    position: 'absolute',
    bottom: 5,
    right: 10,
  },
  legendText: {
    color: COLORS.dim,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});
