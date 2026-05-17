// app/(app)/ai-chat.tsx — Chat IA con contexto de paciente
import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { recordService, patientService, aiService } from '@/lib/supabase';
import { generateOfflineAnswer } from '@/lib/ai';
import { useAuthStore } from '@/store/authStore';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';
import { formatDate } from '@/lib/calculations';

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SYSTEM_PROMPT = `Eres NutriBot, una nutricionista clínica virtual experta en Chile.
Base normativa: MINSAL Chile 2024, GES, Guías Alimentarias, KDIGO, ESC/ESH 2023.
Fórmulas disponibles: Mifflin-St Jeor, Faulkner, Cockcroft-Gault, Chumlea, Lorenz.
Responde en español, con claridad clínica y empatía. Usa evidencia actualizada.
Si hay datos del paciente en el contexto, úsalos para personalizar la respuesta.
Sé concisa pero completa. Incluye recomendaciones prácticas y accionables.`;

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const { patientId, recordId } = useLocalSearchParams<{ patientId?: string; recordId?: string }>();
  const { profile } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('');
  const [patientName, setPatientName] = useState('');

  // Load patient/record context
  useEffect(() => {
    (async () => {
      let ctx = '';
      if (patientId) {
        const { data: p } = await patientService.getById(patientId);
        if (p) {
          setPatientName(p.full_name);
          ctx += `Paciente: ${p.full_name}, ${p.sex === 'F' ? 'Femenino' : 'Masculino'}, Previsión: ${p.insurance || 'FONASA'}. `;
        }
      }
      if (recordId) {
        const { data: r } = await recordService.getById(recordId);
        if (r) {
          ctx += `Última ficha (${formatDate(r.record_date!)}): IMC ${r.bmi || '—'} (${r.bmi_status || '—'}), Peso ${r.weight_kg || '—'} kg, VCT ${r.tdee_kcal || '—'} kcal. `;
          if (r.pathologies?.length) ctx += `Patologías: ${r.pathologies.join(', ')}. `;
          if (r.glucose_mg) ctx += `Glucosa ${r.glucose_mg} mg/dL. `;
        }
      }
      setContext(ctx);

      const greeting = patientId
        ? `¡Hola! 🐱 Tengo el contexto de **${patientName || 'tu paciente'}**. ¿Qué consulta clínica quieres analizar?`
        : '¡Hola! 🐱 Soy NutriBot. Pregúntame sobre cálculos, interpretación de exámenes, planes alimentarios o cualquier duda clínica MINSAL.';

      setMessages([{ id: '0', role: 'assistant', content: greeting, timestamp: new Date() }]);
    })();
  }, [patientId, recordId, patientName]);

  const send = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    let response = '';

    if (GEMINI_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const history = messages.slice(-10).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }));
        const chat = model.startChat({
          history: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT + (context ? `\n\nContexto actual: ${context}` : '') }] },
            { role: 'model', parts: [{ text: 'Entendido. Lista para ayudarte con consultas clínicas basadas en MINSAL Chile.' }] },
            ...history,
          ],
          generationConfig: { maxOutputTokens: 900, temperature: 0.65 },
        });
        const result = await chat.sendMessage(content);
        response = result.response.text();
        if (profile?.id) {
          await aiService.log({ user_id: profile.id, patient_id: patientId, record_id: recordId, prompt: content, response, interaction_type: 'chat' });
        }
      } catch {
        response = generateOfflineAnswer(content);
      }
    } else {
      response = generateOfflineAnswer(content);
    }

    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() }]);
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, [input, loading, messages, context, profile?.id, patientId, recordId]);

  const QUICK = ['¿Cómo interpreto este IMC?', 'Recomienda un plan de alimentación', '¿Qué exámenes pedir en DM2?', 'Explica la dieta DASH', 'Proteínas para adulto mayor'];

  return (
    <LinearGradient colors={['#0b0d12', '#0f1219']} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={COLORS.neon} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.botIcon}><Text style={{ fontSize: 20 }}>🤖</Text></View>
            <View>
              <Text style={styles.headerTitle}>NutriBot IA</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[styles.statusDot, { backgroundColor: GEMINI_KEY ? COLORS.neon : COLORS.gold }]} />
                <Text style={styles.statusTxt}>{GEMINI_KEY ? 'Gemini 1.5 Flash · Activo' : 'Modo offline · Reglas MINSAL'}</Text>
              </View>
            </View>
          </View>
          {patientName ? (
            <View style={styles.contextBadge}>
              <Text style={styles.contextTxt} numberOfLines={1}>👤 {patientName.split(' ')[0]}</Text>
            </View>
          ) : null}
        </View>

        {/* Quick suggestions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 46 }}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: 7, alignItems: 'center' }}>
          {QUICK.map((q, i) => (
            <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => send(q)}>
              <Text style={styles.quickTxt} numberOfLines={1}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md }}
          showsVerticalScrollIndicator={false}>
          {messages.map(msg => (
            <View key={msg.id} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
              {msg.role === 'assistant' && (
                <View style={styles.msgAvatar}><Text style={{ fontSize: 15 }}>🐱</Text></View>
              )}
              <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={[styles.bubbleTxt, msg.role === 'user' && { color: '#000' }]}>{msg.content}</Text>
                <Text style={styles.bubbleTime}>
                  {msg.timestamp.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.msgRow}>
              <View style={styles.msgAvatar}><Text style={{ fontSize: 15 }}>🐱</Text></View>
              <View style={[styles.bubble, styles.bubbleBot]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={COLORS.neon} />
                  <Text style={{ color: COLORS.muted, fontSize: 13 }}>Analizando con MINSAL...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + SPACING.sm }]}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Consulta clínica, cálculo, interpretación..."
            placeholderTextColor={COLORS.dim}
            multiline
            maxLength={600}
          />
          <TouchableOpacity style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
            onPress={() => send()} disabled={!input.trim() || loading}>
            <LinearGradient colors={[COLORS.neon, COLORS.stg]} style={styles.sendGrad}>
              <Ionicons name="send" size={18} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,255,136,0.1)', gap: SPACING.sm },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  botIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,255,136,0.12)',
    borderWidth: 1, borderColor: COLORS.neon + '44', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 10.5, color: COLORS.muted },
  contextBadge: { backgroundColor: COLORS.purple + '18', borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.purple + '44', paddingHorizontal: 10, paddingVertical: 4 },
  contextTxt: { fontSize: 11, color: COLORS.purple, fontWeight: '700', maxWidth: 80 },
  quickBtn: { backgroundColor: 'rgba(0,255,136,0.08)', borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.2)', paddingHorizontal: 13, paddingVertical: 7 },
  quickTxt: { color: COLORS.neon, fontSize: 11.5, fontWeight: '600', maxWidth: 190 },
  msgRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-end' },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,255,136,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '82%', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 4 },
  bubbleUser: { backgroundColor: COLORS.neon, borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: 'rgba(20,24,32,0.95)', borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.18)', borderBottomLeftRadius: 4 },
  bubbleTxt: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 9.5, color: COLORS.muted, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm,
    padding: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(0,255,136,0.1)' },
  textInput: { flex: 1, backgroundColor: 'rgba(20,24,32,0.9)', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(157,77,255,0.3)', color: COLORS.text,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, fontSize: 14, maxHeight: 100 },
  sendBtn: { flexShrink: 0 },
  sendGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
