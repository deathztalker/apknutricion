import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useGlobalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/theme';

export default function GoogleAuthCallback() {
    // Captura los parámetros que vienen en el Deep Link cuando la APK se reactiva
    const params = useGlobalSearchParams();

    useEffect(() => {
        async function handleSession() {
            // Supabase se encarga de extraer los tokens si detecta que la sesión cambió
            const { data: { session }, error } = await supabase.auth.getSession();

            if (session) {
                // Redirige al panel principal si la sesión se estableció con éxito
                router.replace('/(app)/dashboard');
            } else {
                // Si no hay sesión o hubo un error, regresa al login tras el intento
                router.replace('/login');
            }
        }

        handleSession();
    }, [params]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={COLORS.crimson} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
    },
});