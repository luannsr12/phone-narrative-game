import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  Easing,
  Vibration,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { clock } from '@/utils/format';
import { displayName } from '@/utils/people';
import { useGameStore } from '@/store/gameStore';
import type { GameState } from '@/types/game';
import type { Screen } from '@/navigation/types';

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const CARRIER = 'Maravox';
// Before the game starts the phone is blank except for the carrier's welcome
// SMS for the freshly-inserted chip. Tapping it opens line activation (the
// name screen). The story's first real message arrives only after activation.
const ACTIVATION_PREVIEW =
  'Bem-vindo(a)! Seu novo chip foi ativado nesta linha. Toque para concluir a ativação.';

interface LockNotification {
  key: string;
  title: string;
  body: string;
  threadId?: string;
}

/** Unread threads rendered as lock-screen notifications (top 3). */
function buildNotifications(state: GameState | null): LockNotification[] {
  if (!state?.started) {
    return [{ key: 'first', title: CARRIER, body: ACTIVATION_PREVIEW }];
  }
  return Object.entries(state.threads)
    .filter(([, t]) => t.unread > 0)
    .sort(([, a], [, b]) => b.lastActivity - a.lastActivity)
    .slice(0, 3)
    .map(([id, t]) => {
      const last = [...t.entries].reverse().find((e) => e.kind !== 'player');
      return {
        key: id,
        title: displayName(state, id),
        body: last?.text ?? (last?.attachment ? 'Anexo' : 'Nova mensagem'),
        threadId: id,
      };
    });
}

/**
 * The phone always boots locked. Swipe up to unlock (with spring physics),
 * or tap a notification to unlock straight into that conversation.
 */
export function LockScreen({ navigation }: Screen<'Lock'>) {
  const state = useGameStore((s) => s.state);
  const started = Boolean(state?.started);

  const [time, setTime] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setTime(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  // --- unlock gesture -------------------------------------------------------
  const screenH = Dimensions.get('window').height;
  const drag = useRef(new Animated.Value(0)).current;
  const unlocking = useRef(false);

  const unlock = (after?: () => void) => {
    if (unlocking.current) return;
    unlocking.current = true;
    Vibration.vibrate(12);
    Animated.timing(drag, {
      toValue: -screenH,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (after) after();
      else if (started) navigation.replace('Home');
      else navigation.replace('Name');
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.min(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy < -110 || g.vy < -0.9) unlock();
        else Animated.spring(drag, { toValue: 0, bounciness: 6, useNativeDriver: true }).start();
      },
    }),
  ).current;

  const openNotification = (n: LockNotification) => {
    unlock(() => {
      if (!started) {
        navigation.replace('Name');
      } else if (n.threadId) {
        navigation.reset({
          index: 1,
          routes: [{ name: 'Home' }, { name: 'Chat', params: { threadId: n.threadId } }],
        });
      } else {
        navigation.replace('Home');
      }
    });
  };

  // --- pulsing "swipe up" hint ---------------------------------------------
  const hint = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hint, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(hint, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = new Date(time);
  const dateLabel = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  const notifications = buildNotifications(state);
  const fade = drag.interpolate({ inputRange: [-340, 0], outputRange: [0.25, 1], extrapolate: 'clamp' });

  return (
    <View style={styles.root} {...pan.panHandlers}>
      <LinearGradient colors={['#0B1322', '#070B12', '#05070A']} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.glow} />
      </View>

      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: drag }] }]}>
        <View style={styles.clockWrap}>
          <Ionicons name="lock-closed" size={14} color="#5C6678" style={{ marginBottom: 14 }} />
          <Text style={styles.clock}>{clock(time)}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>

        <View style={styles.notifArea}>
          {notifications.map((n) => (
            <Pressable
              key={n.key}
              style={({ pressed }) => [styles.notif, pressed && styles.notifPressed]}
              onPress={() => openNotification(n)}
            >
              <View style={styles.notifHead}>
                <View style={styles.notifAppIcon}>
                  <Ionicons name="chatbubble-ellipses" size={9} color="#fff" />
                </View>
                <Text style={styles.notifApp}>Mensagens</Text>
                <Text style={styles.notifDot}> · </Text>
                <Text style={styles.notifTime}>agora</Text>
              </View>
              <Text style={styles.notifTitle} numberOfLines={1}>
                {n.title}
              </Text>
              <Text style={styles.notifBody} numberOfLines={2}>
                {n.body}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.bottom}>
          <View style={styles.shortcut}>
            <Ionicons name="flashlight" size={18} color="#C9D2DF" />
          </View>
          <View style={styles.hintWrap}>
            <Animated.View
              style={{
                opacity: hint.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                transform: [{ translateY: hint.interpolate({ inputRange: [0, 1], outputRange: [4, -4] }) }],
              }}
            >
              <Ionicons name="chevron-up" size={20} color="#94A0B3" />
            </Animated.View>
            <Text style={styles.hint}>deslize para cima para desbloquear</Text>
          </View>
          <View style={styles.shortcut}>
            <Ionicons name="camera" size={18} color="#C9D2DF" />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05070A' },
  glow: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    width: 380,
    height: 380,
    borderRadius: 999,
    backgroundColor: 'rgba(46,107,98,0.07)',
  },
  content: { flex: 1, justifyContent: 'space-between', paddingVertical: 18 },
  clockWrap: { alignItems: 'center', marginTop: 48 },
  clock: { color: theme.colors.text, fontSize: 82, fontWeight: '200', letterSpacing: 2 },
  date: { color: theme.colors.textDim, fontSize: 15, marginTop: 4 },

  notifArea: { paddingHorizontal: 14, gap: 8 },
  notif: {
    backgroundColor: 'rgba(28,34,48,0.92)',
    borderRadius: 20,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  notifPressed: { backgroundColor: 'rgba(37,44,59,0.96)' },
  notifHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  notifAppIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#2E7D6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  notifApp: { color: theme.colors.textDim, fontSize: 11.5, fontWeight: '600' },
  notifDot: { color: theme.colors.textFaint, fontSize: 11.5 },
  notifTime: { color: theme.colors.textFaint, fontSize: 11.5 },
  notifTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  notifBody: { color: theme.colors.textDim, fontSize: 14, marginTop: 3, lineHeight: 19 },

  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    marginBottom: 6,
  },
  shortcut: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintWrap: { alignItems: 'center', gap: 2 },
  hint: { color: theme.colors.textFaint, fontSize: 12 },
});
