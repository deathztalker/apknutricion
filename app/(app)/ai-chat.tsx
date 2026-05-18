// app/(app)/ai-chat.tsx — Chat IA con contexto de paciente (v2)
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Clipboard, Alert,
} from 'react-native';
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
  streaming?: boolean;
}

interface PatientContext {
  name: string;
  bmi?: string;
  bmiStatus?: string;
  weight?: string;
  pathologies?: string[];
  raw: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres NutriBot, una nutricionista clínica virtual experta en Chile.
Base normativa: MINSAL Chile 2024, GES, Guías Alimentarias, KDIGO, ESC/ESH 2023.
Fórmulas disponibles: Mifflin-St Jeor, Faulkner, Cockcroft-Gault, Chumlea, Lorenz.
Responde en español, con claridad clínica y empatía. Usa evidencia actualizada.
Si hay datos del paciente en el contexto, úsalos para personalizar la respuesta.
Usa **negritas** para términos clave, listas con • para enumeraciones, y sé concisa pero completa.
Incluye recomendaciones prácticas y accionables.`;

const QUICK_PROMPTS = [
  { icon: '📊', label: '¿Cómo interpreto este IMC?' },
  { icon: '🥗', label: 'Plan alimentario personalizado' },
  { icon: '🩺', label: '¿Qué exámenes pedir en DM2?' },
  { icon: '💊', label: 'Explica la dieta DASH' },
  { icon: '💪', label: 'Proteínas para adulto mayor' },
  { icon: '🔬', label: 'Interpretar glucemia en ayunas' },
];

// ─── Markdown Renderer (lightweight) ─────────────────────────────────────────

function renderMarkdown(text: string): React.ReactElement[] {
  const lines = text.split('\n');
  const elements: React.ReactElement[] = [];

  lines.forEach((line, lineIdx) => {
    // Heading
    if (line.startsWith('### ')) {
      elements.push(
        <Text key={lineIdx} style={md.h3}>{line.replace('### ', '')}</Text>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <Text key={lineIdx} style={md.h2}>{line.replace('## ', '')}</Text>
      );
      return;
    }
    // Bullet
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.replace(/^[•\-\*]\s/, '');
      elements.push(
        <View key={lineIdx} style={md.bulletRow}>
          <Text style={md.bullet}>•</Text>
          <Text style={md.bulletText}>{inlineParse(content)}</Text>
        </View>
      );
      return;
    }
    // Empty line → spacer
    if (line.trim() === '') {
      elements.push(<View key={lineIdx} style={{ height: 6 }} />);
      return;
    }
    // Normal paragraph
    elements.push(
      <Text key={lineIdx} style={md.body}>{inlineParse(line)}</Text>
    );
  });

  return elements;
}

// Parse **bold** and *italic* inline
function inlineParse(text: string): React.ReactElement {
  const parts: React.ReactElement[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Text key={i++}>{text.slice(lastIndex, match.index)}</Text>);
    }
    if (match[2]) {
      parts.push(<Text key={i++} style={md.bold}>{match[2]}</Text>);
    } else if (match[3]) {
      parts.push(<Text key={i++} style={md.italic}>{match[3]}</Text>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(<Text key={i++}>{text.slice(lastIndex)}</Text>);
  }
  return <>{parts}</>;
}

const md = StyleSheet.create({
  h2: { fontSize: 15, fontWeight: '800', color: COLORS.neon, marginBottom: 2 },
  h3: { fontSize: 13.5, fontWeight: '700', color: COLORS.text, marginBottom: 1 },
  body: { fontSize: 14, lineHeight: 21, color: COLORS.text },
  bold: { fontWeight: '700', color: COLORS.text },
  italic: { fontStyle: 'italic', color: COLORS.muted },
  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  bullet: { color: COLORS.neon, fontSize: 14, lineHeight: 21 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 21, color: COLORS.text },
});

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, onCopy }: { msg: Message; onCopy: (text: string) => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const isUser = msg.role === 'user';

  return (
    <Animated.View
      style={[
        styles.msgRow,
        isUser && styles.msgRowUser,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.msgAvatar}>
          <Text style={{ fontSize: 15 }}>🐱</Text>
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot, msg.error && styles.bubbleError]}>
        {isUser ? (
          <Text style={[styles.bubbleTxt, { color: '#000' }]}>{msg.content}</Text>
        ) : msg.streaming ? (
          <>
            {renderMarkdown(msg.content)}
            <Text style={styles.cursor}>▋</Text>
          </>
        ) : (
          renderMarkdown(msg.content)
        )}

        <View style={styles.bubbleMeta}>
          <Text style={styles.bubbleTime}>
            {msg.timestamp.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {!isUser && !msg.streaming && (
            <TouchableOpacity onPress={() => onCopy(msg.content)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="copy-outline" size={12} color={COLORS.muted} />
            </TouchableOpacity>
          )}
          {msg.error && (
            <Ionicons name="warning-outline" size={12} color="#ff6b6b" />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();

    dots.forEach((d, i) => animate(d, i * 150));
  }, []);

  return (
    <View style={styles.msgRow}>
      <View style={styles.msgAvatar}><Text style={{ fontSize: 15 }}>🐱</Text></View>
      <View style={[styles.bubble, styles.bubbleBot, { paddingVertical: 14 }]}>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          {dots.map((d, i) => (
            <Animated.View
              key={i}
              style={{
                width: 7, height: 7, borderRadius: 3.5,
                backgroundColor: COLORS.neon,
                opacity: d,
                transform: [{ scale: d.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const { patientId, recordId } = useLocalSearchParams<{ patientId?: string; recordId?: string }>();
  const { profile } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);
  const isAtBottomRef = useRef(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [patientCtx, setPatientCtx] = useState<PatientContext>({ name: '', raw: '' });

  // ── Load context ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      let ctx: PatientContext = { name: '', raw: '' };

      if (patientId) {
        const { data: p } = await patientService.getById(patientId);
        if (p) {
          ctx.name = p.full_name;
          ctx.raw += `Paciente: ${p.full_name}, ${p.sex === 'F' ? 'Femenino' : 'Masculino'}, Previsión: ${p.insurance || 'FONASA'}. `;
        }
      }
      if (recordId) {
        const { data: r } = await recordService.getById(recordId);
        if (r) {
          ctx.bmi = r.bmi;
          ctx.bmiStatus = r.bmi_status;
          ctx.weight = r.weight_kg;
          ctx.pathologies = r.pathologies;
          ctx.raw += `Última ficha (${formatDate(r.record_date!)}): IMC ${r.bmi || '—'} (${r.bmi_status || '—'}), Peso ${r.weight_kg || '—'} kg, VCT ${r.tdee_kcal || '—'} kcal. `;
          if (r.pathologies?.length) ctx.raw += `Patologías: ${r.pathologies.join(', ')}. `;
          if (r.glucose_mg) ctx.raw += `Glucosa ${r.glucose_mg} mg/dL. `;
        }
      }
      setPatientCtx(ctx);

      const greeting = ctx.name
        ? `¡Hola! 🐱 Tengo el contexto clínico de **${ctx.name}**. ¿Qué consulta quieres analizar hoy?`
        : '¡Hola! 🐱 Soy **NutriBot**. Pregúntame sobre cálculos, interpretación de exámenes, planes alimentarios o cualquier duda clínica basada en MINSAL 2024.';

      setMessages([{ id: '0', role: 'assistant', content: greeting, timestamp: new Date() }]);
    })();
  }, [patientId, recordId]);

  // ── Scroll helpers ──────────────────────────────────────────────────────────
  const scrollToEnd = useCallback((animated = true) => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated }), 80);
  }, []);

  // ── Copy handler ────────────────────────────────────────────────────────────
  const handleCopy = useCallback((text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copiado', 'Respuesta copiada al portapapeles.', [{ text: 'OK' }]);
  }, []);

  // ── Send message ────────────────────────────────────────────────────────────
  const send = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollToEnd();

    let response = '';
    let isError = false;

    if (GEMINI_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const history = messages.slice(-10).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }));

        const chat = model.startChat({
          history: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT + (patientCtx.raw ? `\n\nContexto actual: ${patientCtx.raw}` : '') }] },
            { role: 'model', parts: [{ text: 'Entendido. Lista para ayudarte con consultas clínicas basadas en MINSAL Chile.' }] },
            ...history,
          ],
          generationConfig: { maxOutputTokens: 900, temperature: 0.65 },
        });

        // Streaming response
        const streamingId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: streamingId, role: 'assistant', content: '', timestamp: new Date(), streaming: true }]);
        setLoading(false);

        const result = await chat.sendMessageStream(content);
        let accumulated = '';

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          accumulated += chunkText;
          setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: accumulated } : m));
          if (isAtBottomRef.current) scrollToEnd();
        }

        response = accumulated;
        setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, streaming: false } : m));

        if (profile?.id) {
          await aiService.log({
            user_id: profile.id,
            patient_id: patientId,
            record_id: recordId,
            prompt: content,
            response,
            interaction_type: 'chat',
          });
        }
        return; // skip final setMessages below — already handled via streaming
      } catch (e) {
        console.warn('Gemini error:', e);
        response = generateOfflineAnswer(content);
        isError = false; // offline fallback is still a valid answer
      }
    } else {
      response = generateOfflineAnswer(content);
    }

    setLoading(false);
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      error: isError,
    }]);
    scrollToEnd();
  }, [input, loading, messages, patientCtx, profile?.id, patientId, recordId, scrollToEnd]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#080a10', '#0d1018']} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.neon} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <LinearGradient colors={['rgba(0,255,136,0.18)', 'rgba(0,255,136,0.06)']} style={styles.botIcon}>
              <Text style={{ fontSize: 18 }}>🐱</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>NutriBot IA</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[styles.statusDot, { backgroundColor: GEMINI_KEY ? COLORS.neon : COLORS.gold }]} />
                <Text style={styles.statusTxt}>
                  {GEMINI_KEY ? 'Gemini 1.5 Flash · Streaming' : 'Modo offline · Reglas MINSAL'}
                </Text>
              </View>
            </View>
          </View>

          {/* Patient context badge */}
          {patientCtx.name ? (
            <View style={styles.contextBadge}>
              <Text style={styles.contextTxt} numberOfLines={1}>
                👤 {patientCtx.name.split(' ')[0]}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Patient mini-card ────────────────────────────────────────────── */}
        {patientCtx.bmi && (
          <View style={styles.miniCard}>
            <View style={styles.miniCardItem}>
              <Text style={styles.miniCardLabel}>IMC</Text>
              <Text style={styles.miniCardValue}>{patientCtx.bmi}</Text>
            </View>
            <View style={styles.miniCardDivider} />
            <View style={styles.miniCardItem}>
              <Text style={styles.miniCardLabel}>Estado</Text>
              <Text style={styles.miniCardValue} numberOfLines={1}>{patientCtx.bmiStatus || '—'}</Text>
            </View>
            {patientCtx.weight && (
              <>
                <View style={styles.miniCardDivider} />
                <View style={styles.miniCardItem}>
                  <Text style={styles.miniCardLabel}>Peso</Text>
                  <Text style={styles.miniCardValue}>{patientCtx.weight} kg</Text>
                </View>
              </>
            )}
            {patientCtx.pathologies?.length ? (
              <>
                <View style={styles.miniCardDivider} />
                <View style={[styles.miniCardItem, { flex: 2 }]}>
                  <Text style={styles.miniCardLabel}>Patologías</Text>
                  <Text style={[styles.miniCardValue, { fontSize: 10.5 }]} numberOfLines={1}>
                    {patientCtx.pathologies.join(' · ')}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        )}

        {/* ── Quick prompts ────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 48, flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: 7, alignItems: 'center' }}
        >
          {QUICK_PROMPTS.map((q, i) => (
            <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => send(q.label)} activeOpacity={0.7}>
              <Text style={styles.quickIcon}>{q.icon}</Text>
              <Text style={styles.quickTxt} numberOfLines={1}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Messages ─────────────────────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xl }}
          showsVerticalScrollIndicator={false}
          onScroll={e => {
            const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
            isAtBottomRef.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 60;
          }}
          scrollEventThrottle={100}
        >
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onCopy={handleCopy} />
          ))}
          {loading && <TypingIndicator />}
        </ScrollView>

        {/* ── Input bar ────────────────────────────────────────────────────── */}
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + SPACING.sm }]}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Consulta clínica, cálculo, interpretación..."
              placeholderTextColor={COLORS.dim}
              multiline
              maxLength={600}
            />
            {input.length > 400 && (
              <Text style={styles.charCount}>{input.length}/600</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.35 }]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[COLORS.neon, '#00c47a']} style={styles.sendGrad}>
              <Ionicons name="send" size={17} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,255,136,0.1)', gap: SPACING.sm,
  },
  backBtn: { padding: 4, marginRight: -2 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  botIcon: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.neon + '33',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, letterSpacing: 0.2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 10.5, color: COLORS.muted },
  contextBadge: {
    backgroundColor: COLORS.purple + '18', borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.purple + '44',
    paddingHorizontal: 10, paddingVertical: 4,
  },
  contextTxt: { fontSize: 11, color: COLORS.purple, fontWeight: '700', maxWidth: 80 },

  // Mini card
  miniCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg, marginTop: SPACING.sm,
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(0,255,136,0.15)',
    paddingHorizontal: SPACING.md, paddingVertical: 8, gap: 0,
  },
  miniCardItem: { flex: 1, alignItems: 'center' },
  miniCardLabel: { fontSize: 9.5, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  miniCardValue: { fontSize: 12, fontWeight: '700', color: COLORS.neon, marginTop: 1 },
  miniCardDivider: { width: 1, height: 28, backgroundColor: 'rgba(0,255,136,0.15)' },

  // Quick prompts
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,255,136,0.07)', borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.2)',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  quickIcon: { fontSize: 12 },
  quickTxt: { color: COLORS.neon, fontSize: 11.5, fontWeight: '600', maxWidth: 160 },

  // Messages
  msgRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-end' },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,255,136,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubble: { maxWidth: '82%', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 2 },
  bubbleUser: { backgroundColor: COLORS.neon, borderBottomRightRadius: 4 },
  bubbleBot: {
    backgroundColor: 'rgba(16,20,30,0.97)',
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.15)',
    borderBottomLeftRadius: 4,
  },
  bubbleError: { borderColor: 'rgba(255,107,107,0.4)' },
  bubbleTxt: { fontSize: 14, lineHeight: 20, color: COLORS.text },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 4 },
  bubbleTime: { fontSize: 9.5, color: COLORS.muted },
  cursor: { color: COLORS.neon, fontSize: 14 },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1, borderTopColor: 'rgba(0,255,136,0.1)',
  },
  inputWrap: { flex: 1, position: 'relative' },
  textInput: {
    backgroundColor: 'rgba(16,20,30,0.9)',
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(157,77,255,0.3)',
    color: COLORS.text,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    fontSize: 14, maxHeight: 100,
  },
  charCount: { position: 'absolute', bottom: 6, right: 10, fontSize: 9.5, color: COLORS.muted },
  sendBtn: { flexShrink: 0 },
  sendGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});